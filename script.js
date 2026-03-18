const statusEl = document.getElementById('status');
const top3El = document.getElementById('top3');

const map = L.map('map').setView([41.8781, -87.6298], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

Promise.all([
  fetch('./data/neighborhoods.geojson').then(r => {
    if (!r.ok) throw new Error('Could not load neighborhoods.geojson');
    return r.json();
  }),
  fetch('./data/student_moves.json').then(r => {
    if (!r.ok) throw new Error('Could not load student_moves.json');
    return r.json();
  })
])
.then(([geojson, moves]) => {
  const scoreMap = {};
  moves.forEach(row => {
    scoreMap[row.neighborhood] = row;
  });

  const maxStudents = Math.max(...moves.map(d => d.students));
  const minStudents = Math.min(...moves.map(d => d.students));

  function getColor(value) {
    if (value >= 150) return '#1d4ed8';
    if (value >= 110) return '#60a5fa';
    if (value >= 1) return '#dbeafe';
    return '#f3f4f6';
  }

  const layer = L.geoJSON(geojson, {
    style: feature => {
      const name = feature.properties.pri_neigh;
      const row = scoreMap[name];
      const students = row ? row.students : 0;

      return {
        color: '#374151',
        weight: 1,
        fillColor: getColor(students),
        fillOpacity: row ? 0.7 : 0.22
      };
    },
    onEachFeature: (feature, layer) => {
      const name = feature.properties.pri_neigh;
      const row = scoreMap[name];

      if (row) {
        layer.bindPopup(`
          <strong>${name}</strong><br/>
          Students moving here: ${row.students}<br/>
          Avg rent: $${row.avg_rent}<br/>
          Rent trend: ${row.rent_trend}<br/>
          Transit: ${row.transit}
        `);
      } else {
        layer.bindPopup(`<strong>${name}</strong><br/>No synthetic student movement assigned yet.`);
      }
    }
  }).addTo(map);

  map.fitBounds(layer.getBounds());

  const top3 = [...moves].sort((a, b) => b.students - a.students).slice(0, 3);
  top3El.innerHTML = top3.map((item, idx) => `
    <article class="card">
      <div class="rank">Top ${idx + 1}</div>
      <h4>${item.neighborhood}</h4>
      <div class="meta"><strong>Students:</strong> ${item.students}</div>
      <div class="meta"><strong>ZIP:</strong> ${item.zip}</div>
      <div class="meta"><strong>Average rent:</strong> $${item.avg_rent}</div>
      <div class="meta"><strong>Transit:</strong> ${item.transit}</div>
      <div class="summary">${item.summary}</div>
    </article>
  `).join('');

  statusEl.textContent = `Loaded ${geojson.features.length} Chicago neighborhood shapes and ranked neighborhoods by student popularity.`;
})
.catch(error => {
  console.error(error);
  statusEl.textContent = 'Error: ' + error.message;
  top3El.innerHTML = '<div class="card">Data failed to load.</div>';
});
