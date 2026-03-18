var map = L.map('map').setView([41.8781, -87.6298], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

fetch('data/neighborhoods.geojson')
  .then(response => {
    if (!response.ok) {
      throw new Error('Could not load neighborhoods.geojson');
    }
    return response.json();
  })
  .then(data => {
    const layer = L.geoJSON(data, {
      style: function(feature) {
        return {
          color: "#333",
          weight: 1,
          fillColor: "#69b3a2",
          fillOpacity: 0.4
        };
      }
    }).addTo(map);

    map.fitBounds(layer.getBounds());
  })
  .catch(error => {
    console.error('GeoJSON load error:', error);
    alert('Could not load neighborhood boundaries. Check that data/neighborhoods.geojson exists.');
  });
