const dbPath = 'Data/RoadCrashesVic.sqlite';

async function initDatabase() {
  try {
    const response = await fetch(dbPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch database file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const SQL = await initSqlJs({
      locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}`
    });

    const db = new SQL.Database(new Uint8Array(buffer));
    return db;
  } catch (error) {
    console.error('Failed to initialize the database:', error);
  }
}

async function fetchData(db) {
  const topMakesQuery = `
    SELECT VEHICLE_MAKE, COUNT(*) AS NumCrashes
    FROM vehicle
    GROUP BY VEHICLE_MAKE
    ORDER BY NumCrashes DESC
    LIMIT 4;
  `;

  const topMakesRows = db.exec(topMakesQuery)[0].values;
  const topMakes = topMakesRows.map(row => row[0]);

  const totalCrashesQuery = `
    SELECT 
      strftime('%Y', a.ACCIDENT_DATE) AS Year, 
      v.VEHICLE_MAKE,
      COUNT(*) AS TotalCrashes
    FROM 
      accident a
    JOIN 
      vehicle v ON a.ACCIDENT_NO = v.ACCIDENT_NO
    WHERE 
      v.VEHICLE_MAKE IN (${topMakes.map(make => `'${make}'`).join(', ')})
    GROUP BY 
      Year, 
      v.VEHICLE_MAKE
    ORDER BY 
      Year;
  `;

  const fatalCrashesQuery = `
    SELECT 
      strftime('%Y', a.ACCIDENT_DATE) AS Year, 
      v.VEHICLE_MAKE,
      COUNT(*) AS FatalCrashes
    FROM 
      accident a
    JOIN 
      vehicle v ON a.ACCIDENT_NO = v.ACCIDENT_NO
    WHERE 
      a.SEVERITY = 1
      AND v.VEHICLE_MAKE IN (${topMakes.map(make => `'${make}'`).join(', ')})
    GROUP BY 
      Year, 
      v.VEHICLE_MAKE
    ORDER BY 
      Year;
  `;

  const totalCrashesRows = db.exec(totalCrashesQuery)[0].values;
  const fatalCrashesRows = db.exec(fatalCrashesQuery)[0].values;

  return { topMakes, totalCrashesRows, fatalCrashesRows };
}

function prepareData(topMakes, totalCrashesRows, fatalCrashesRows) {
  const years = [...new Set(totalCrashesRows.map(row => row[0]))];
  const data = topMakes.map(make => {
    const values = years.map(year => {
      const totalRow = totalCrashesRows.find(r => r[0] === year && r[1] === make);
      const fatalRow = fatalCrashesRows.find(r => r[0] === year && r[1] === make);
      const totalCrashes = totalRow ? totalRow[2] : 0;
      const fatalCrashes = fatalRow ? fatalRow[2] : 0;
      return totalCrashes > 0 ? (fatalCrashes / totalCrashes) : 0; // Probability
    });
    return {
      x: years,
      y: values,
      type: 'bar',
      name: make,
    };
  });
  return data;
}

function plotFatalAccidentProbability(data) {
  const layout = {
    title: 'Probability of Fatal Accidents by Vehicle Make per Year',
    xaxis: { title: 'Year' },
    yaxis: { title: 'Probability of Fatal Accident' },
  };
  Plotly.newPlot('fatalAccidentProbabilityChart', data, layout);
}

async function plotCrashesBySeverity() {
  try {
    const db = await initDatabase();
    if (!db) {
      throw new Error('Database initialization failed');
    }

    const query = `
      SELECT 
        strftime('%Y', a.ACCIDENT_DATE) AS Year, 
        a.SEVERITY,
        COUNT(*) AS NumCrashes
      FROM 
        accident a
      WHERE 
        a.SEVERITY IS NOT NULL
      GROUP BY 
        Year, 
        a.SEVERITY
      ORDER BY 
        Year;
    `;

    const res = db.exec(query);
    if (!res || res.length === 0) {
      throw new Error('Query returned no results');
    }

    const rows = res[0].values;
    const years = Array.from(new Set(rows.map(row => row[0])));
    const severityLevels = Array.from(new Set(rows.map(row => row[1])));
    
    const data = severityLevels.map(severity => {
      const values = years.map(year => {
        const row = rows.find(r => r[0] === year && r[1] === severity);
        return row ? row[2] : 0;
      });

      return {
        x: years,
        y: values,
        name: getSeverityLabel(severity),
        type: 'bar',
        marker: {
          color: getColorForSeverity(severity),
        }
      };
    });

    const layout = {
      title: 'Number of Crashes per Year by Severity',
      xaxis: { title: 'Year' },
      yaxis: { title: 'Number of Crashes' },
      barmode: 'group',
      legend: {
        orientation: 'h',
        y: -0.3,
        x: 0.5,
        bgcolor: 'rgba(255, 255, 255, 0.5)',
        bordercolor: '#000',
        borderwidth: 1,
      }
    };

    Plotly.newPlot('crashesBySeverityChart', data, layout);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

function getColorForSeverity(severity) {
  switch (severity) {
    case 1:
      return 'green';
    case 2:
      return 'yellow';
    case 3:
      return 'red';
    default:
      return 'gray';
  }
}

function getSeverityLabel(severity) {
  switch (severity) {
    case 1:
      return 'Fatal Accidents';
    case 2:
      return 'Serious Injury Accidents';
    case 3:
      return 'Other Injury Accidents';
    default:
      return 'Non-Injury Accidents';
  }
}

async function main() {
  try {
    const db = await initDatabase();
    const { topMakes, totalCrashesRows, fatalCrashesRows } = await fetchData(db);
    const fatalAccidentData = prepareData(topMakes, totalCrashesRows, fatalCrashesRows);
    plotFatalAccidentProbability(fatalAccidentData);
    await plotCrashesBySeverity();
  } catch (error) {
    console.error('Failed to initialize the database:', error);
  }
}

main();
