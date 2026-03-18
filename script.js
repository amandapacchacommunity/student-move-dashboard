const statusEl = document.getElementById('status');

const map = L.map('map').setView([41.8781, -87.6298], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

fetch('./data/neighborhoods.geojson')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while loading data/neighborhoods.geojson`);
    }
    return response.json();
  })
  .then(data => {
    if (!data.features || !data.features.length) {
      throw new Error('GeoJSON loaded, but it contains no features.');
    }

    const layer = L.geoJSON(data, {
      style: () => ({
        color: '#1f2937',
        weight: 1,
        fillColor: '#69b3a2',
        fillOpacity: 0.35
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const name =
          props.pri_neigh ||
          props.sec_neigh ||
          props.community ||
          props.name ||
          'Neighborhood';
        layer.bindPopup(`<strong>${name}</strong>`);
      }
    }).addTo(map);

    map.fitBounds(layer.getBounds());
    statusEl.textContent = `Loaded ${data.features.length} neighborhood shapes.`;
  })
  .catch(error => {
    console.error(error);
    statusEl.textContent = 'Neighborhoods failed to load: ' + error.message;
    alert('Neighborhoods failed to load. Check that data/neighborhoods.geojson exists in the data folder and that GitHub Pages has finished rebuilding.');
  });
