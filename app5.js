let map; // Declare map variable in a higher scope
let markers; // Declare markers variable in a higher scope
let heatLayer; // Declare heatLayer for the heatmap
let heatMapData = []; // Global variable to store heat map data

// Function to fetch and plot marker map data
async function fetchAndPlotData(year) {
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.wasm` });
        const db = new SQL.Database(new Uint8Array(buffer));

        const query = `
            SELECT 
                N.LATITUDE,
                N.LONGITUDE,
                A.ACCIDENT_DATE,
                A.ACCIDENT_TIME,
                A.ACCIDENT_TYPE_DESC
            FROM 
                ACCIDENT A
                JOIN NODE N ON A.ACCIDENT_NO = N.ACCIDENT_NO
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

        if (result.length > 0) {
            plotMap(result);
        } else {
            console.warn('No data available for the selected criteria.');
            document.getElementById('map').innerHTML = '<p>No data available for the selected criteria.</p>';
        }
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

// Function to fetch and plot heat map data
async function fetchAndPlotHeatMapData(year) {
    const dbPath = 'Data/RoadCrashesVic.sqlite';

    try {
        const response = await fetch(dbPath);
        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({ locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.wasm` });
        const db = new SQL.Database(new Uint8Array(buffer));

        const query = `
            SELECT 
                N.LATITUDE,
                N.LONGITUDE,
                A.ACCIDENT_DATE,
                A.ACCIDENT_TIME,
                A.ACCIDENT_TYPE_DESC
            FROM 
                ACCIDENT A
                JOIN NODE N ON A.ACCIDENT_NO = N.ACCIDENT_NO
            WHERE 
                strftime('%Y', A.ACCIDENT_DATE) = ?;
        `;

        const stmt = db.prepare(query);
        stmt.bind([year]);

        heatMapData = [];
        while (stmt.step()) {
            heatMapData.push(stmt.getAsObject());
        }

        stmt.free();

        if (heatMapData.length > 0) {
            plotHeatMap(heatMapData);
        } else {
            console.warn('No data available for the selected criteria.');
            document.getElementById('map').innerHTML = '<p>No data available for the selected criteria.</p>';
        }
    } catch (error) {
        console.error('Error loading or querying database:', error);
    }
}

function plotMap(data) {
    // Initialize the map if it doesn't exist
    if (!map) {
        map = L.map('map').setView([-37.8136, 144.9631], 10); // Center map on Melbourne
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }

    // Remove existing heat map layer
    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
    }

    // Remove existing legend
    if (map.legendControl) {
        map.removeControl(map.legendControl);
        map.legendControl = null;
    }

    // Clear existing markers
    if (markers) {
        markers.clearLayers();
    } else {
        markers = L.markerClusterGroup();
        map.addLayer(markers);
    }

    // Add new markers
    data.forEach(accident => {
        if (accident.LATITUDE && accident.LONGITUDE) {
            const marker = L.marker([accident.LATITUDE, accident.LONGITUDE]);
            marker.bindPopup(`
                <b>Date:</b> ${accident.ACCIDENT_DATE}<br>
                <b>Time:</b> ${accident.ACCIDENT_TIME}<br>
                <b>Type:</b> ${accident.ACCIDENT_TYPE_DESC}
            `);
            markers.addLayer(marker);
        }
    });
}

function getNearbyAccidents(lat, lng, data, radius = 0.01) {
    return data.filter(accident => {
        const distance = Math.sqrt(
            Math.pow(accident.LATITUDE - lat, 2) + Math.pow(accident.LONGITUDE - lng, 2)
        );
        return distance < radius;
    });
}

function plotHeatMap(data) {
    // Initialize the map if it doesn't exist
    if (!map) {
        map = L.map('map').setView([-37.8136, 144.9631], 10); // Center map on Melbourne
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add click event listener to the map
        map.on('click', function (e) {
            const nearbyAccidents = getNearbyAccidents(e.latlng.lat, e.latlng.lng, heatMapData);

            if (nearbyAccidents.length > 0) {
                let popupContent = '<b>Nearby Accidents:</b><br>';
                nearbyAccidents.forEach(accident => {
                    popupContent += `
                        <b>Date:</b> ${accident.ACCIDENT_DATE}<br>
                        <b>Time:</b> ${accident.ACCIDENT_TIME}<br>
                        <b>Type:</b> ${accident.ACCIDENT_TYPE_DESC}<br><br>
                    `;
                });

                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(popupContent)
                    .openOn(map);
            } else {
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent('No accidents found nearby.')
                    .openOn(map);
            }
        });
    }

    // Clear existing markers
    if (markers) {
        markers.clearLayers();
    }

    // Remove existing heat map layer
    if (heatLayer) {
        map.removeLayer(heatLayer);
    }

    // Prepare data for the heatmap
    const heatData = data.map(accident => [accident.LATITUDE, accident.LONGITUDE, 1]); // The last value is the intensity

    // Create heat layer
    heatLayer = L.heatLayer(heatData, { radius: 25 }).addTo(map);
}

// Function to get color based on density 
function getColor(d) {
    return d > 5 ? '#800026' :
           d > 4 ? '#BD0026' :
           d > 3 ? '#E31A1C' :
           d > 2 ? '#FC4E2A' :
           d > 1 ? '#FD8D3C' :
                   '#FEB24C';
}

// Event listener for the button
document.getElementById('plotButtonMap').addEventListener('click', () => {
    const year = document.getElementById('yearSelectMap').value;
    const mapType = document.getElementById('mapTypeSelect').value;
    if (mapType === 'marker') {
        fetchAndPlotData(year);
    } else if (mapType === 'heatmap') {
        fetchAndPlotHeatMapData(year);
    }
});

// Initial setup on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Set default year for plot button dropdown
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.value = '2023';

    // Set default year for plot button map dropdown
    const yearSelectMap = document.getElementById('yearSelectMap');
    yearSelectMap.value = '2023';

    // Load marker map data for the year 2023 on page load
    fetchAndPlotData('2023');
});
