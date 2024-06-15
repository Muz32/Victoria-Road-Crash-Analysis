async function loadDataAndPlot(year, field) {
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.wasm` });
        const db = new SQL.Database(new Uint8Array(buffer));

        let query;
        switch (field) {
            case 'ACCIDENT_TIME':
                query = `
                    SELECT 
                        strftime('%H:00', A.ACCIDENT_TIME) AS ACCIDENT_TIME, 
                        COUNT(DISTINCT A.ACCIDENT_NO) AS Count
                    FROM 
                        ACCIDENT A
                    WHERE 
                        strftime('%Y', A.ACCIDENT_DATE) = ?
                    GROUP BY 
                        strftime('%H:00', A.ACCIDENT_TIME)
                    ORDER BY
                        Count DESC;
                `;
                break;
            case 'LGA_NAME':
                query = `
                    SELECT 
                        N.LGA_NAME, 
                        COUNT(*) AS Count
                    FROM 
                        NODE N
                        JOIN ACCIDENT A ON N.ACCIDENT_NO = A.ACCIDENT_NO
                    WHERE 
                        strftime('%Y', A.ACCIDENT_DATE) = ?
                    GROUP BY 
                        N.LGA_NAME
                    ORDER BY
                        Count DESC;
                `;
                break;
            case 'ATMOSPH_COND_DESC':
            case 'SURFACE_COND_DESC':
            case 'VEHICLE_TYPE_DESC':
            case 'VEHICLE_BODY_STYLE':
                query = `
                    SELECT 
                        ${field}, 
                        COUNT(DISTINCT A.ACCIDENT_NO) AS Count
                    FROM 
                        ACCIDENT A
                        JOIN ATMOSPHERIC_COND AC ON A.ACCIDENT_NO = AC.ACCIDENT_NO
                        JOIN NODE N ON A.ACCIDENT_NO = N.ACCIDENT_NO
                        JOIN PERSON P ON A.ACCIDENT_NO = P.ACCIDENT_NO
                        JOIN ROAD_SURFACE_COND R ON A.ACCIDENT_NO = R.ACCIDENT_NO
                        JOIN VEHICLE V ON A.ACCIDENT_NO = V.ACCIDENT_NO
                    WHERE 
                        strftime('%Y', A.ACCIDENT_DATE) = ?
                    GROUP BY 
                        ${field}
                    ORDER BY
                        Count DESC;
                `;
                break;
            default:
                query = `
                    SELECT 
                        ${field}, 
                        COUNT(*) AS Count
                    FROM 
                        PERSON P
                        JOIN ACCIDENT A ON P.ACCIDENT_NO = A.ACCIDENT_NO
                    WHERE 
                        strftime('%Y', A.ACCIDENT_DATE) = ?
                    GROUP BY 
                        ${field}
                    ORDER BY
                        Count DESC;
                `;
                break;
        }

        const stmt = db.prepare(query);
        stmt.bind([year]);

        let result = [];
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }

        stmt.free();

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
            'serious injury': result.NO_PERSONS_INJ_2,
            'an other injury': result.NO_PERSONS_INJ_3,
            'killed': result.NO_PERSONS_KILLED,
            'no injuries': result.NO_PERSONS_NOT_INJ,
        };

        return renamedResult;
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

function plotData(data, field, chartType) {
    try {
        const titleMap = {
            'ACCIDENT_TYPE_DESC': 'Accident Type',
            'DAY_WEEK_DESC': 'Day of Week',
            'ATMOSPH_COND_DESC': 'Atmospheric Condition',
            'LGA_NAME': 'Local Government Area',
            'SEX': 'Gender',
            'AGE_GROUP': 'Age Group',
            'ROAD_USER_TYPE_DESC': 'Road User Type',
            'SURFACE_COND_DESC': 'Road Surface Condition',
            'VEHICLE_TYPE_DESC': 'Vehicle Type',
            'VEHICLE_BODY_STYLE': 'Vehicle Body Style',
            'ACCIDENT_TIME': 'Accident Time (Grouped by Hour)'
        };

        let trace;
        let layout = {
            title: titleMap[field] || field,  // Set chart title dynamically
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
            layout.xaxis = { title: 'Category' };
            layout.yaxis = { title: 'Count' };
        
        } else if (chartType === 'pie') {
            trace = {
                labels: data.map(item => item[field]),
                values: data.map(item => item.Count),
                type: 'pie',
                textinfo: 'percent',  // Display label and percent
                insidetextorientation: 'horizontal',  // Ensure text stays inside
                textposition: 'inside',  // Force labels to stay inside
            };
            layout.legend = { x: 1, y: 0.5 };  
            layout.height = 800;  
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
            layout.yaxis = { title: 'Number of people' };
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

 
});

