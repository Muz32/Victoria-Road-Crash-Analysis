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
                AC.ATMOSPH_COND_DESC,
                N.LGA_NAME,
                P.SEX,
                P.AGE_GROUP,
                P.INJ_LEVEL_DESC,  -- Correct column name
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
            if (row[field]) {
                counts[row[field]] = (counts[row[field]] || 0) + 1;
            }
        });
        result = Object.keys(counts).sort((a, b) => counts[a] - counts[b]).map(key => ({ [field]: key, Count: counts[key] }));

        return result;
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

function plotData(data, field, chartType) {
    let trace;
    let layout = {
        title: field,  // To Set chart title dynamically
        autosize: true,  // To Adjust chart size based on data
    };

    if (chartType === 'bar') {
        trace = {
            x: data.map(item => item[field]),
            y: data.map(item => item.Count),
            type: 'bar',
        };
        layout.xaxis = { title: field };
        layout.yaxis = { title: 'Count' };
    } else if (chartType === 'pie') {
        trace = {
            labels: data.map(item => item[field]),
            values: data.map(item => item.Count),
            type: 'pie',
        };
        layout.legend = { x: 1, y: 0.5 };  // To Position legend to the right of the pie chart
        layout.height = 600;  // Set the height of the chart
        layout.width = 800;  // Set the width of the chart
    }

    Plotly.newPlot('plot', [trace], layout);
}

document.getElementById('plotButton').addEventListener('click', async () => {
    const year = document.getElementById('yearSelect').value;
    const field = document.getElementById('fieldSelect').value;
    const chartType = document.querySelector('input[name="chartType"]:checked').value;
    const data = await loadDataAndPlot(year, field);
    if (data) plotData(data, field, chartType);  // To Check if data is not undefined
});
