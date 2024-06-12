async function loadVehicleData(year) {
    const dbPath = '../Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}` });
        const db = new SQL.Database(new Uint8Array(buffer));

        const query = queryForVehicleWithAccidents();

        const stmt = db.prepare(query);
        stmt.bind([year]);

        let result = [];
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }
        stmt.free();
        return result;
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

async function loadLGAData(year) {
    const dbPath = '../Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}` });
        const db = new SQL.Database(new Uint8Array(buffer));

        const query = queryForLGAWithAccidents();

        const stmt = db.prepare(query);
        stmt.bind([year]);

        let result = [];
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }
        stmt.free();
        return result;
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

function queryForLGAWithAccidents() {
       let query= `
            SELECT 
                subquery.LGA_NAME, 
                COUNT(*) AS Accident_Count
            FROM 
                (
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
                        strftime('%Y', A.ACCIDENT_DATE) = ?
                ) subquery
            GROUP BY 
                subquery.LGA_NAME
            ORDER BY 
                Accident_Count ASC
            LIMIT 10; `;
       return query;
}

function queryForVehicleWithAccidents() {
       let query = `
            SELECT
                subquery.VEHICLE_TYPE_DESC,
                COUNT(*) AS Accident_Count
            FROM
                (
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
                        strftime('%Y', A.ACCIDENT_DATE) = ?
                ) subquery
            GROUP BY
                subquery.VEHICLE_TYPE_DESC
            ORDER BY
                Accident_Count DESC
            LIMIT 10;
                    `;

       return query;
}

function plotVehicleData(data) {
    try {
        let layout = {
            title:  'Top 10 Vehicle Types Involves With Accidents',
            autosize: true,
            margin: {
                b: 200,
            },
            height: 500,
        };

        let trace = {
            x: data.map(item => item.VEHICLE_TYPE_DESC),
            y: data.map(item => item.Accident_Count),
            type: 'bar',

        };
        layout.xaxis = { title: 'Vehicle Types' };
        layout.yaxis = { title: 'Accident Count' };
        Plotly.newPlot('vehicle_plot', [trace], layout);
    } catch (error) {
        console.error('Error plotting data:', error);
    }
}
function plotLGAData(data) {
    try {
        let layout = {
            title:  'Top 10 LGAs Have Most Accident Incidents',
            autosize: true,
            margin: {
                b: 50,
                l: 200,
            },
            height: 500,
        };

        let trace = {
            x: data.map(item => item.Accident_Count),
            y: data.map(item => item.LGA_NAME),
            type: 'bar',
            orientation: 'h'

        };
        layout.xaxis = { title: 'Accident Counts' };
        //layout.yaxis = { title: 'LGAs' };
        Plotly.newPlot('lga_plot', [trace], layout);
    } catch (error) {
        console.error('Error plotting data:', error);
    }
}

// Function to autoload function after content is loaded
document.addEventListener('DOMContentLoaded', async () => {
    let year = document.getElementById('yearSelect').value;

    let vehicle_data = await loadVehicleData(year);
    if (vehicle_data && vehicle_data.length > 0) {
        plotVehicleData(vehicle_data);
    } else {
        console.warn('No data available for the selected criteria.');
        document.getElementById('vehicle_plot').innerHTML = '<p>No data available for the selected criteria.</p>';
    }

    let lga_data = await loadLGAData(year);
    if (lga_data && lga_data.length > 0) {
        plotLGAData(lga_data);
    } else {
        console.warn('No data available for the selected criteria.');
        document.getElementById('lga_plot').innerHTML = '<p>No data available for the selected criteria.</p>';
    }

});