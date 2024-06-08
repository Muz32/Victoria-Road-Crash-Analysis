// Function to load SQLite database and execute query
async function loadDataAndPlot() {
    // Path to SQLite database file
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        // Load the SQLite database file
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();

        // Initialize SQL.js
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}` });

        // Load the database
        const db = new SQL.Database(new Uint8Array(buffer));

        // SQL query to retrieve data for 2023
        const query = `
            SELECT ACCIDENT_TYPE_DESC, COUNT(*) AS count
            FROM ACCIDENT
            WHERE ACCIDENT_DATE BETWEEN '2023-01-01' AND '2023-12-31'
            GROUP BY ACCIDENT_TYPE_DESC
        `;

        // Execute the query and process the results
        const resultSet = db.exec(query);

        if (resultSet.length > 0) {
            const data = resultSet[0].values.map(row => ({
                ACCIDENT_TYPE_DESC: row[0],
                count: row[1]
            }));

            // Prepare data for plotting pie chart
            const labels = data.map(item => item.ACCIDENT_TYPE_DESC);
            const values = data.map(item => item.count);

            // Plotting the pie chart using Plotly
            const pieData = [{
                labels: labels,
                values: values,
                type: 'pie'
            }];

            const layout = {
                title: 'Accident Types in 2023',
                
            };

            Plotly.newPlot('plot', pieData, layout);
        } else {
            console.error('No data found for the year 2023');
        }

    } catch (error) {
        console.error('Error loading database or executing query:', error);
    }
}

// Call the function to load data and plot the pie chart
loadDataAndPlot();
