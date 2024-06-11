async function loadDataAndPlot(year, field) {
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}` });
        const db = new SQL.Database(new Uint8Array(buffer));

        const query = `
            SELECT 
                A.ACCIDENT_DATE,
                A.ACCIDENT_TYPE_DESC,
                A.DAY_WEEK_DESC,
                A.ACCIDENT_TIME,
                A.NO_PERSONS,
                A.NO_PERSONS_INJ_2,
                A.NO_PERSONS_INJ_3,
                A.NO_PERSONS_KILLED,
                A.NO_PERSONS_NOT_INJ,
                AC.ATMOSPH_COND_DESC,
                N.LGA_NAME,
                P.SEX,
                P.AGE_GROUP,
                P.INJ_LEVEL_DESC,  
                P.ROAD_USER_TYPE_DESC,
                R.SURFACE_COND_DESC,
                V.VEHICLE_TYPE_DESC,
                V.VEHICLE_BODY_STYLE
            FROM 
                ACCIDENT A
                JOIN ATMOSPHERIC_COND AC ON A.ACCIDENT_NO = AC.ACCIDENT_NO
                JOIN NODE N ON A.ACCIDENT_NO = N.ACCIDENT_NO
                JOIN PERSON P ON A.ACCIDENT_NO = P.ACCIDENT_NO
                JOIN ROAD_SURFACE_COND R ON A.ACCIDENT_NO = R.ACCIDENT_NO
                JOIN VEHICLE V ON A.ACCIDENT_NO = V.ACCIDENT_NO
            WHERE 
                strftime('%Y', A.ACCIDENT_DATE) = ?;
        `;

        const stmt = db.prepare(query);
        stmt.bind([year]);

        let result = [];
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }

        stmt.free();

        // Calculate counts for bar chart and sort in ascending order
        const counts = {};
        result.forEach(row => {
            let value = row[field];
            if (field === 'ACCIDENT_TIME' && value) {
                value = value.split(':')[0] + ':00';  // Extract the hour and add ':00'
            }
            if (value) {
                counts[value] = (counts[value] || 0) + 1;
            }
        });

        console.log('Raw counts:', counts); // Log raw counts for debugging

        result = Object.keys(counts).sort((a, b) => counts[a] - counts[b]).map(key => ({ [field]: key, Count: counts[key] }));

        console.log('Processed result:', result); // Log processed result for debugging

        return result;
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

async function loadAndSumData(year) {
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}` });
        const db = new SQL.Database(new Uint8Array(buffer));

        const query = `
            SELECT 
                SUM(NO_PERSONS) AS NO_PERSONS,
                SUM(NO_PERSONS_INJ_2) AS NO_PERSONS_INJ_2,
                SUM(NO_PERSONS_INJ_3) AS NO_PERSONS_INJ_3,
                SUM(NO_PERSONS_KILLED) AS NO_PERSONS_KILLED,
                SUM(NO_PERSONS_NOT_INJ) AS NO_PERSONS_NOT_INJ
            FROM 
                ACCIDENT
            WHERE 
                strftime('%Y', ACCIDENT_DATE) = ?;
        `;

        const stmt = db.prepare(query);
        stmt.bind([year]);

        let result = {};
        if (stmt.step()) {
            result = stmt.getAsObject();
        }

        stmt.free();

        // Renaming the keys for better readability in the plot
        const renamedResult = {
            'No. of people involved': result.NO_PERSONS,
            'No. of people with a serious injury': result.NO_PERSONS_INJ_2,
            'No. of people with an other injury': result.NO_PERSONS_INJ_3,
            'N0. of people killed': result.NO_PERSONS_KILLED,
            'No. of people with no injuries': result.NO_PERSONS_NOT_INJ,
        };

        return renamedResult;
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

function plotData(data, field, chartType) {
    try {
        let trace;
        let layout = {
            title: field === 'ACCIDENT_TIME' ? 'Accident Time (Grouped by Hour)' : field,  // To Set chart title dynamically
            autosize: true,  
            margin: {
                b: 200, 
            },
            height: 500, 
        };

        if (chartType === 'bar') {
            trace = {
                x: data.map(item => item[field]),
                y: data.map(item => item.Count),
                type: 'bar',
                         
            };
            layout.xaxis = { title: field === 'ACCIDENT_TIME' ? 'Accident Time (Hour)' : field };
            layout.yaxis = { title: 'Count' };
        
        } else if (chartType === 'pie') {
            trace = {
                labels: data.map(item => item[field]),
                values: data.map(item => item.Count),
                type: 'pie',
            };
            layout.legend = { x: 1, y: 0.5 };  
            layout.height = 600;  
            layout.width = 800;  
        }

        Plotly.newPlot('plot', [trace], layout);
    } catch (error) {
        console.error('Error plotting data:', error);
    }
}

function plotSummedData(data, chartType) {
    try {
        const labels = Object.keys(data);
        const values = Object.values(data);

        // Create an array of objects with labels and corresponding values
        const dataObjects = labels.map((label, index) => ({ label, value: values[index] }));

        // Sort the array of objects in descending order based on values
        const sortedData = dataObjects.sort((a, b) => b.value - a.value);

        let trace;
        let layout = {
            title: 'Summary of Accident Data',
            autosize: true,
        };

        if (chartType === 'bar') {
            trace = {
                x: sortedData.map(item => item.label),
                y: sortedData.map(item => item.value),
                type: 'bar',
            };
            layout.xaxis = { title: 'Category' };
            layout.yaxis = { title: 'Count' };
        } else if (chartType === 'pie') {
            trace = {
                labels: sortedData.map(item => item.label),
                values: sortedData.map(item => item.value),
                type: 'pie',
            };
            layout.legend = { x: 1, y: 0.5 };
            layout.height = 600;
            layout.width = 800;
        }

        Plotly.newPlot('plot', [trace], layout);
    } catch (error) {
        console.error('Error plotting data:', error);
    }
}


document.getElementById('plotButton').addEventListener('click', async () => {
    const year = document.getElementById('yearSelect').value;
    const field = document.getElementById('fieldSelect').value;
    const chartType = document.querySelector('input[name="chartType"]:checked').value;
    
    if (['NO_PERSONS', 'NO_PERSONS_INJ_2', 'NO_PERSONS_INJ_3', 'NO_PERSONS_KILLED', 'NO_PERSONS_NOT_INJ'].includes(field)) {
        const data = await loadAndSumData(year);
        console.log('Summed data to plot:', data); // Log summed data to plot for debugging

        if (data && Object.keys(data).length > 0) {
            plotSummedData(data, chartType);
        } else {
            console.warn('No data available for the selected criteria.');
            document.getElementById('plot').innerHTML = '<p>No data available for the selected criteria.</p>';
        }
    } else {
        const data = await loadDataAndPlot(year, field);
        console.log('Data to plot:', data); // Log data to plot for debugging

        if (data && data.length > 0) {
            plotData(data, field, chartType);
        } else {
            console.warn('No data available for the selected criteria.');
            document.getElementById('plot').innerHTML = '<p>No data available for the selected criteria.</p>';
        }
    }
});

// Function to auto-load and plot data for 2023 and 'Injuries and Fatalities'
document.addEventListener('DOMContentLoaded', async () => {
    // Set the default year to 2023 in the dropdown menu
    document.getElementById('yearSelect').value = '2023';

    // Load and plot data for the default year (2023) on page load
    try {
        const data = await loadAndSumData('2023'); // Load data for 2023
        console.log('Summed data to plot:', data); // Log summed data to plot for debugging

        if (data && Object.keys(data).length > 0) {
            plotSummedData(data, 'bar'); // Plot as bar chart by default
        } else {
            console.warn('No data available for the selected criteria.');
            document.getElementById('plot').innerHTML = '<p>No data available for the selected criteria.</p>';
        }
    } catch (error) {
        console.error('Error loading or plotting data:', error);
    }

    // Call autoLoadAndPlotData function when the DOM content is loaded
    await autoLoadAndPlotData(); // Automatically load and plot data on page load
});
