const statusEl = document.getElementById('status');
const top3El = document.getElementById('top3');

let currentYear = '2017';
let map;
let geoLayer;
let geoData;
let moveData;

const mapObj = L.map('map').setView([41.8781, -87.6298], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapObj);

function setYear(year) {
  currentYear = year;
  updateMap();
  updateTop3();
  updateStatus();
  highlightActiveButton();
}

function highlightActiveButton() {
  const buttons = document.querySelectorAll('#controls button');
  buttons.forEach(btn => {
    if (btn.dataset.year === currentYear) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function getNeighborhoodName(feature) {
  return (
    feature.properties?.pri_neigh ||
    feature.properties?.community ||
    feature.properties?.name ||
    feature.properties?.sec_neigh ||
    'Unknown Neighborhood'
  );
}

function getStudentsForYear(row, year) {
  if (!row || !row.years) return 0;

  if (year === 'all') {
    return Object.values(row.years).reduce((sum, val) => sum + val, 0);
  }

  return row.years[year] || 0;
}

function getTopYear(row) {
  if (!row || !row.years) return 'N/A';

  let bestYear = null;
  let bestValue = -1;

  for (const [year, value] of Object.entries(row.years)) {
    if (value > bestValue) {
      bestValue = value;
      bestYear = year;
    }
  }

  return bestYear;
}

function getColor(value) {
  return value > 220 ? '#4a1486' :   // deep purple
         value > 190 ? '#6a1b9a' :
         value > 170 ? '#7b1fa2' :
         value > 150 ? '#8e24aa' :
         value > 130 ? '#3949ab' :   // indigo
         value > 110 ? '#1e88e5' :   // blue
         value > 90  ? '#00acc1' :   // cyan
         value > 70  ? '#00897b' :   // teal
         value > 50  ? '#43a047' :   // green
         value > 35  ? '#fdd835' :   // yellow
         value > 20  ? '#fb8c00' :   // orange
         value > 0   ? '#e53935' :   // red
                      '#eceff1';     // no data
}
}

function buildMoveMap(data) {
  const result = {};
  data.forEach(row => {
    result[row.neighborhood] = row;
  });
  return result;
}

function updateMap() {
  if (!geoData || !moveData) return;

  const moveMap = buildMoveMap(moveData);

  if (geoLayer) {
    mapObj.removeLayer(geoLayer);
  }

  geoLayer = L.geoJSON(geoData, {
    style: feature => {
      const name = getNeighborhoodName(feature);
      const row = moveMap[name];
      const students = getStudentsForYear(row, currentYear);

      return {
        color: '#374151',
        weight: 1,
        fillColor: getColor(students),
        fillOpacity: students > 0 ? 0.75 : 0.18
      };
    },
    onEachFeature: (feature, layer) => {
      const name = getNeighborhoodName(feature);
      const row = moveMap[name];

      if (row) {
        const students = getStudentsForYear(row, currentYear);
        const peakYear = getTopYear(row);

        layer.bindPopup(`
          <strong>${name}</strong><br/>
          Students (${currentYear === 'all' ? 'all time' : currentYear}): ${students}<br/>
          Most popular year: ${peakYear}<br/>
          ZIP: ${row.zip || 'N/A'}<br/>
          Avg rent: $${row.avg_rent ?? 'N/A'}<br/>
          Rent trend: ${row.rent_trend || 'N/A'}<br/>
          Transit: ${row.transit || 'N/A'}<br/>
          <em>${row.summary || ''}</em>
        `);
      } else {
        layer.bindPopup(`
          <strong>${name}</strong><br/>
          No synthetic student movement assigned yet.
        `);
      }
    }
  }).addTo(mapObj);

  mapObj.fitBounds(geoLayer.getBounds());
}

function updateTop3() {
  if (!moveData) return;

  const ranked = [...moveData]
    .map(row => ({
      ...row,
      studentsNow: getStudentsForYear(row, currentYear),
      peakYear: getTopYear(row)
    }))
    .sort((a, b) => b.studentsNow - a.studentsNow)
    .slice(0, 3);

  top3El.innerHTML = ranked.map((item, idx) => `
    <article class="card">
      <div class="rank">Top ${idx + 1}</div>
      <h4>${item.neighborhood}</h4>
      <div class="meta"><strong>Students:</strong> ${item.studentsNow}</div>
      <div class="meta"><strong>ZIP:</strong> ${item.zip || 'N/A'}</div>
      <div class="meta"><strong>Average rent:</strong> $${item.avg_rent ?? 'N/A'}</div>
      <div class="meta"><strong>Rent trend:</strong> ${item.rent_trend || 'N/A'}</div>
      <div class="meta"><strong>Transit:</strong> ${item.transit || 'N/A'}</div>
      <div class="meta"><strong>Peak year:</strong> ${item.peakYear}</div>
      <div class="summary">${item.summary || ''}</div>
    </article>
  `).join('');
}

function updateStatus() {
  if (!geoData || !moveData) return;

  const label = currentYear === 'all' ? 'all years combined' : currentYear;
  statusEl.textContent = `Showing neighborhood popularity for ${label}.`;
}

Promise.all([
  fetch('./data/neighborhoods.geojson').then(response => {
    if (!response.ok) {
      throw new Error('Could not load neighborhoods.geojson');
    }
    return response.json();
  }),
  fetch('./data/student_moves.json').then(response => {
    if (!response.ok) {
      throw new Error('Could not load student_moves.json');
    }
    return response.json();
  })
])
  .then(([geojson, moves]) => {
    geoData = geojson;
    moveData = moves;

    updateMap();
    updateTop3();
    updateStatus();
    highlightActiveButton();
  })
  .catch(error => {
    console.error(error);
    statusEl.textContent = 'Error loading dashboard data: ' + error.message;
    top3El.innerHTML = '<div class="card">Could not load dashboard data.</div>';
  });

window.setYear = setYear;
