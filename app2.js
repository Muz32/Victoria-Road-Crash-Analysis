async function loadDataGroupedByYear(field) {
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.wasm` });
        const db = new SQL.Database(new Uint8Array(buffer));

        let query;
        if (field === 'GENDER') {
            query = `
                SELECT 
                    strftime('%Y', A.ACCIDENT_DATE) AS Year, 
                    P.SEX AS Field, 
                    COUNT(*) AS Count
                FROM 
                    ACCIDENT A
                    JOIN PERSON P ON A.ACCIDENT_NO = P.ACCIDENT_NO
                WHERE 
                    P.SEX != ''
                GROUP BY 
                    Year, Field
                ORDER BY
                    Year, Count DESC;
            `;
        } else if (field === 'Injuries and Deaths') {
            query = `
                SELECT 
                    strftime('%Y', A.ACCIDENT_DATE) AS Year, 
                    'killed' AS Field, 
                    SUM(A.NO_PERSONS_KILLED) AS Count
                FROM 
                    ACCIDENT A
                GROUP BY 
                    Year
                UNION
                SELECT 
                    strftime('%Y', A.ACCIDENT_DATE) AS Year, 
                    'serious injury' AS Field, 
                    SUM(A.NO_PERSONS_INJ_2) AS Count
                FROM 
                    ACCIDENT A
                GROUP BY 
                    Year
                UNION
                SELECT 
                    strftime('%Y', A.ACCIDENT_DATE) AS Year, 
                    'other injury' AS Field, 
                    SUM(A.NO_PERSONS_INJ_3) AS Count
                FROM 
                    ACCIDENT A
                GROUP BY 
                    Year
                UNION
                SELECT 
                    strftime('%Y', A.ACCIDENT_DATE) AS Year, 
                    'no injuries' AS Field, 
                    SUM(A.NO_PERSONS_NOT_INJ) AS Count
                FROM 
                    ACCIDENT A
                GROUP BY 
                    Year
                ORDER BY
                    Year;
            `;
        } else if (field === 'Local Government Area') {
            query = `
                SELECT 
                    strftime('%Y', A.ACCIDENT_DATE) AS Year, 
                    N.LGA_NAME AS Field, 
                    COUNT(*) AS Count
                FROM 
                    NODE N
                    JOIN ACCIDENT A ON N.ACCIDENT_NO = A.ACCIDENT_NO
                WHERE 
                    N.LGA_NAME IN ('MELBOURNE', 'CASEY', 'GEELONG', 'DANDENONG', 'HUME', 'WYNDHAM', 'WHITTLESEA', 'MONASH', 'MORELAND', 'BRIMBANK', 'YARRA RANGES', 'DAREBIN')
                GROUP BY 
                    Year, Field
                ORDER BY
                    Year, Count DESC;
            `;
        }

        const stmt = db.prepare(query);
        let result = [];
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }

        stmt.free();
        db.close();

        return result;
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

function transformData(data, field) {
    const transformedData = {};

    data.forEach(item => {
        const year = item.Year;
        let value = item.Field || field;
        const count = item.Count;

        // Custom label mapping for Gender field
        if (field === 'GENDER') {
            const genderLabels = {'M': 'Male', 'F': 'Female', 'U': 'Unknown'};
            value = genderLabels[value] || value;
        }

        if (!transformedData[year]) {
            transformedData[year] = {};
        }

        if (!transformedData[year][value]) {
            transformedData[year][value] = 0;
        }

        transformedData[year][value] += count;
    });

    return transformedData;
}


function plotComparisonData(data, field, chartType) {
    try {
        const transformedData = transformData(data, field);

        const years = Object.keys(transformedData);
        const uniqueLabels = [...new Set(years.flatMap(year => Object.keys(transformedData[year])))];
        const traces = uniqueLabels.map(label => {
            const yValues = years.map(year => transformedData[year][label] || 0);
            return {
                x: years,
                y: yValues,
                name: label,
                type: chartType === 'line' ? 'scatter' : 'bar',
                stackgroup: chartType === 'stackedBar' ? 'one' : undefined
            };
        });

        const chartTitle = document.getElementById('comparisonFieldSelect').value; // Get the selected comparison field name from HTML
        const yAxisLabel = chartTitle === 'Injuries and Deaths' ? 'Number of people' : 'Count'; // Adjust Y-axis label based on the selected field

        const layout = {
            title: `${chartTitle}`,
            barmode: chartType === 'stackedBar' ? 'stack' : undefined,
            xaxis: { title: 'Year' },
            yaxis: { title: yAxisLabel, range: [0, 'auto'] }, // Set the Y-axis label dynamically and ensure it starts from 0
            autosize: true,
        };

        Plotly.newPlot('comparisonPlot', traces, layout);
    } catch (error) {
        console.error('Error plotting comparison data:', error);
    }
}

document.getElementById('comparisonPlotButton').addEventListener('click', async () => {
    const field = document.getElementById('comparisonFieldSelect').value;
    const chartType = document.querySelector('input[name="comparisonChartType"]:checked').value;
    const data = await loadDataGroupedByYear(field);

    if (data && data.length > 0) {
        plotComparisonData(data, field, chartType);
    } else {
        console.warn('No data available for the selected criteria.');
        document.getElementById('comparisonPlot').innerHTML = '<p>No data available for the selected criteria.</p>';
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const defaultField = 'Injuries and Deaths'; // Default to "Injuries and Deaths"
    const chartType = 'line'; // Default to line chart

    try {
        const data = await loadDataGroupedByYear(defaultField);

        if (data && data.length > 0) {
            plotComparisonData(data, defaultField, chartType);
        } else {
            console.warn('No data available for the selected criteria.');
            document.getElementById('comparisonPlot').innerHTML = '<p>No data available for the selected criteria.</p>';
        }
    } catch (error) {
        console.error('Error loading or plotting data:', error);
    }
});

async function verifyGenderDataForYear2023() {
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.wasm` });
        const db = new SQL.Database(new Uint8Array(buffer));

        const query = `
            SELECT 
                COUNT(*) AS Count
            FROM 
                PERSON P
                JOIN ACCIDENT A ON P.ACCIDENT_NO = A.ACCIDENT_NO
            WHERE 
                P.SEX = 'F' AND strftime('%Y', A.ACCIDENT_DATE) = '2023'
        `;

        const stmt = db.prepare(query);
        let result = [];
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }

        stmt.free();
        db.close();

        return result;
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

// Call the function to load and log the gender data for verification
verifyGenderDataForYear2023().then(data => {
    console.log('Verification data for Gender F in 2023:', data);
});
