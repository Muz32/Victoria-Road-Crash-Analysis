const dbPath = 'Data/RoadCrashesVic.sqlite';

// Function to initialize the SQLite database
async function initDatabase() {
  try {
    const response = await fetch(dbPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch database file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    // Ensure the SQL.js library is loaded
    const SQL = await initSqlJs({
      locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}`
    });

    const db = new SQL.Database(new Uint8Array(buffer));
    return db;
  } catch (error) {
    console.error('Failed to initialize the database:', error);
  }
}

// Main function to execute the workflow
(async () => {
  try {
    // Initialize the database
    const db = await initDatabase();
    if (!db) {
      throw new Error('Database initialization failed');
    }
    console.log('Database initialized');

    // Query to calculate fatal accident probability for each manufacturer
    const fatalProbabilityQuery = `
      SELECT 
          VEHICLE_MAKE,
          SUM(CASE WHEN a.SEVERITY = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS FatalProbability
      FROM 
          vehicle v
      JOIN 
          accident a ON v.ACCIDENT_NO = a.ACCIDENT_NO
      GROUP BY 
          VEHICLE_MAKE
      HAVING 
          COUNT(*) > 1000  -- Filter to include only manufacturers with more than 1000 crashes
      ORDER BY 
          FatalProbability ASC;
    `;

    // Execute the query to get fatal accident probabilities
    const fatalProbabilityRes = db.exec(fatalProbabilityQuery);
    if (!fatalProbabilityRes || fatalProbabilityRes.length === 0) {
      throw new Error('Fatal probability query returned no results');
    }

    // Extract results from the query
    const fatalProbabilityRows = fatalProbabilityRes[0].values;

    // Extract data for plotting: vehicle makes and their fatal probabilities
    const vehicleMakes = fatalProbabilityRows.map(row => row[0]);
    const probabilities = fatalProbabilityRows.map(row => row[1]);

    // Define unique colors for each vehicle make for better visualization
    const colors = vehicleMakes.map((make, index) => `hsl(${(index * 360 / vehicleMakes.length)}, 70%, 50%)`);

    // Prepare data for Plotly
    const data = [{
      x: vehicleMakes,
      y: probabilities,
      type: 'bar',
      marker: {
        color: colors
      }
    }];

    // Define layout for the Plotly chart
    const layout = {
      title: 'Fatal Accident Probability by Vehicle Make (>1000 crashes)',
      xaxis: { title: 'Vehicle Make' },
      yaxis: { title: 'Probability of Fatal Accident' },
      margin: { t: 50, l: 50, r: 50, b: 100 },
    };

    // Render the plot in the div with id 'chart'
    Plotly.newPlot('chart', data, layout);

  } catch (error) {
    console.error('Error occurred:', error);
  }
})();
