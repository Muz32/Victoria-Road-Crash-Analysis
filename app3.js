async function loadDataAndPlotSunburst() {
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.wasm` });
        const db = new SQL.Database(new Uint8Array(buffer));

        let query = `
            SELECT 
                strftime('%Y', A.ACCIDENT_DATE) AS Year,
                P.SEX,
                P.INJ_LEVEL_DESC,
                COUNT(*) AS Count
            FROM 
                PERSON P
                JOIN ACCIDENT A ON P.ACCIDENT_NO = A.ACCIDENT_NO
            WHERE 
                strftime('%Y', A.ACCIDENT_DATE) IN ('2019', '2020', '2021', '2022', '2023')
            GROUP BY 
                Year, P.SEX, P.INJ_LEVEL_DESC
            ORDER BY
                Year, P.SEX, P.INJ_LEVEL_DESC;
        `;

        const stmt = db.prepare(query);

        let result = [];
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }

        stmt.free();

        console.log('Processed result:', result); // Log processed result for debugging

        // Process data for sunburst chart
        const labels = [];
        const parents = [];
        const values = [];

        const yearCounts = {};
        const sexCounts = {};

        // First pass: calculate totals for years and sex categories
        result.forEach(row => {
            const yearLabel = row.Year;
            const sexLabel = `${row.Year} - ${row.SEX}`;

            // Aggregate counts for each level
            if (!yearCounts[yearLabel]) {
                yearCounts[yearLabel] = 0;
            }
            yearCounts[yearLabel] += row.Count;

            if (!sexCounts[sexLabel]) {
                sexCounts[sexLabel] = 0;
            }
            sexCounts[sexLabel] += row.Count;
        });

        // Second pass: build sunburst chart data
        result.forEach(row => {
            const yearLabel = row.Year;
            const sexLabel = `${row.Year} - ${row.SEX}`;
            const injLevelLabel = `${row.Year} - ${row.SEX} - ${row.INJ_LEVEL_DESC}`;

            // Add year level if not already added
            if (!labels.includes(yearLabel)) {
                labels.push(yearLabel);
                parents.push('');
                values.push(yearCounts[yearLabel]);
            }

            // Add sex level if not already added
            if (!labels.includes(sexLabel)) {
                labels.push(sexLabel);
                parents.push(yearLabel);
                values.push(sexCounts[sexLabel]);
            }

            // Add injury level
            labels.push(injLevelLabel);
            parents.push(sexLabel);
            values.push(row.Count);
        });

        const data = [{
            type: "sunburst",
            labels: labels,
            parents: parents,
            values: values,
            outsidetextfont: { size: 20, color: "#377eb8" },
            leaf: { opacity: 0.4 },
            marker: { line: { width: 2 } }
        }];

        const layout = {
            title: 'Accident Summary',
            margin: { l: 0, r: 0, b: 0, t: 50 }, // Increase the top margin to 50
            sunburstcolorway: ["#636efa", "#ef553b", "#00cc96", "#ab63fa", "#19d3f3", "#e763fa", "#fecb52", "#ffa15a", "#ff6692", "#b6e880"],
            annotations: [
                {
                    x: 1,
                    y: 0.5,
                    xref: 'paper',
                    yref: 'paper',
                    text: 'M=Male, F=Female, U=Unknown',
                    showarrow: false,
                    font: {
                        size: 14,
                        color: 'black'
                    },
                    align: 'left'
                }
            ]
        };

        Plotly.newPlot('sunburstChart', data, layout);

    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

loadDataAndPlotSunburst();
