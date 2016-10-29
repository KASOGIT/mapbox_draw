var dm = new DM.Map('map', {
  accessToken: 'pk.eyJ1IjoiZHJvbmVtYXAiLCJhIjoiY2luMDlidXVoMDBtZ3c4bTJvdzIzZzlsNiJ9.qIT_9G9X54DOoItfXneMUA',
  tile: 'mapbox.streets',
  latlng: [46.73, 3.43],
  zoom: 7
});

var map = dm.getMap();

if (!navigator.geolocation)
{
  alert('Geolocation not working on this browser');
}
else
{
  document.addEventListener('DOMContentLoaded', function(e) {
    e.preventDefault();
    e.stopPropagation();
    map.locate();
  }, false);
}

map.on('locationfound', function(e) {
  map.fitBounds(e.bounds);
  var posLayer = L.mapbox.featureLayer().addTo(map);
  posLayer.setGeoJSON({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [e.latlng.lng, e.latlng.lat]
    },
    properties: {
      'title': 'here i am!',
      'marker-color': '#ff8888',
      'marker-symbol': 'star'
    }
  });
});

map.on('locationerror', function() {
  console.log('Position could not be found');
});

function set_map(err, data)
{
  var map = dm.getMap();
  if (data.lbounds) {
    map.fitBounds(data.lbounds);
  } else if (data.latlng) {
    map.setView([data.latlng[0], data.latlng[1]], 17);
  }
}

function geocodeThis() {
  var text = document.getElementById('search-bar-input').value;
  geocoder.query(text, get_query);
}

function take_screen_map()
{
  dm.snapshot(function(image) {
      console.log('success snapshot');
  }
}
