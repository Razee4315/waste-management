// Global map variables
let dashboardMap, nearestMap, dustbinMap, dumpingMap;
let dustbinPickerMap, dumpingPickerMap;
let dustbinMarkers = {};
let nearestMarker = null;
let dustbinPickerInitialized = false;
let dumpingPickerInitialized = false;

// On document load, initialize maps and common components
document.addEventListener("DOMContentLoaded", function() {
  initDashboard();
  initClock();
  loadDustbinsIntoSelect();
  loadSystemStats();
  initDustbinMap();
  initDumpingMap();
});

// Function to show/hide pages
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.style.display = (page.id === pageId) ? "block" : "none";
  });
  if (pageId === "dashboard") {
    loadDashboardDustbins();
    dashboardMap.invalidateSize();
  } else if (pageId === "nearest") {
    setTimeout(() => {
      initializeNearestMap();
      nearestMap.invalidateSize();
    }, 100);
    loadDustbinsIntoSelect();
  } else if (pageId === "dustbinPoints") {
    loadDustbinsOnDustbinMap();
    dustbinMap.invalidateSize();
  } else if (pageId === "dumpingPoints") {
    loadDumpingOnDumpingMap();
    dumpingMap.invalidateSize();
  } else if (pageId === "analytics") {
    loadAnalytics();
  }
}

// ------------------------------
// Dashboard Functions
// ------------------------------
function initDashboard() {
  // Center map on Skardu, Pakistan
  dashboardMap = L.map('map').setView([35.3000, 75.6333], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(dashboardMap);
  loadDashboardDustbins();
}

function loadDashboardDustbins() {
  eel.get_dustbins()(function(data) {
    // Clear existing markers
    for (let key in dustbinMarkers) {
      dashboardMap.removeLayer(dustbinMarkers[key]);
    }
    dustbinMarkers = {};
    // Add markers
    for (let id in data) {
      let d = data[id];
      let markerColor = (d.status === "Full") ? "#d9534f" :
                        (d.status === "Partially Full") ? "#f0ad4e" : "#5cb85c";
      let marker = L.circleMarker([d.lat, d.lng], {
        radius: 8,
        color: markerColor,
        fillOpacity: 0.9,
        weight: 2
      }).addTo(dashboardMap);
      marker.bindPopup(
        `<strong>${d.name}</strong><br>${d.description}<br>Status: ${d.status}<br>Last Updated: ${d.last_updated}<br>
         <button class="btn btn-sm btn-outline-primary mt-1" onclick="showUpdateForm('${id}')">Update</button>
         <button class="btn btn-sm btn-outline-danger mt-1" onclick="deleteDustbinPrompt('${id}')">Delete</button>`
      );
      dustbinMarkers[id] = marker;
    }
  });
}

function showUpdateForm(dustbinId) {
  showPage("info");
  document.getElementById("dustbinId").value = dustbinId;
}

function deleteDustbinPrompt(dustbinId) {
  if (confirm(`Are you sure you want to delete dustbin ${dustbinId}?`)) {
    eel.delete_dustbin(dustbinId)(function(response) {
      alert(response.message);
      loadDashboardDustbins();
      loadDustbinsOnDustbinMap();
      loadDustbinsIntoSelect();
      loadSystemStats();
    });
  }
}

function initClock() {
  function updateClock() {
    document.getElementById("clock").innerText = new Date().toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ------------------------------
// Dustbin Points & Dumping Areas Maps
// ------------------------------
function initDustbinMap() {
  dustbinMap = L.map('dustbinMap').setView([35.3000, 75.6333], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(dustbinMap);
}

function loadDustbinsOnDustbinMap() {
  eel.get_dustbins()(function(data) {
    dustbinMap.eachLayer(layer => {
      if (layer instanceof L.CircleMarker) {
        dustbinMap.removeLayer(layer);
      }
    });
    for (let id in data) {
      let d = data[id];
      let markerColor = (d.status === "Full") ? "#d9534f" :
                        (d.status === "Partially Full") ? "#f0ad4e" : "#5cb85c";
      L.circleMarker([d.lat, d.lng], {
        radius: 7,
        color: markerColor,
        fillOpacity: 0.8,
        weight: 2
      }).addTo(dustbinMap).bindPopup(
        `<strong>${d.name}</strong><br>Status: ${d.status}<br>
         <button class="btn btn-sm btn-outline-primary mt-1" onclick="showUpdateForm('${id}')">Update</button>
         <button class="btn btn-sm btn-outline-danger mt-1" onclick="deleteDustbinPrompt('${id}')">Delete</button>`
      );
    }
  });
}

function initDumpingMap() {
  dumpingMap = L.map('dumpingMap').setView([35.3000, 75.6333], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(dumpingMap);
}

function loadDumpingOnDumpingMap() {
  eel.get_dumping_points()(function(data) {
    dumpingMap.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        dumpingMap.removeLayer(layer);
      }
    });
    for (let id in data) {
      let dp = data[id];
      let marker = L.marker([dp.lat, dp.lng], {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        })
      }).addTo(dumpingMap).bindPopup(
        `<strong>${dp.name}</strong><br>
         <button class="btn btn-sm btn-outline-danger mt-1" onclick="deleteDumpingPrompt('${id}')">Delete</button>`
      );
    }
  });
}

function deleteDumpingPrompt(dpId) {
  if (confirm(`Are you sure you want to delete dumping point ${dpId}?`)) {
    eel.delete_dumping_point(dpId)(function(response) {
      alert(response.message);
      loadDumpingOnDumpingMap();
      loadSystemStats();
    });
  }
}

// ------------------------------
// Modal Location Pickers
// ------------------------------
// Dustbin Picker Modal
const dustbinModal = document.getElementById('dustbinModal');
dustbinModal.addEventListener('shown.bs.modal', function () {
  if (!dustbinPickerInitialized) {
    dustbinPickerMap = L.map('dustbinPickerMap').setView([35.3000, 75.6333], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(dustbinPickerMap);
    dustbinPickerMap.on('click', function(e) {
      document.getElementById("newDustbinLat").value = e.latlng.lat.toFixed(5);
      document.getElementById("newDustbinLng").value = e.latlng.lng.toFixed(5);
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`)
        .openOn(dustbinPickerMap);
    });
    dustbinPickerInitialized = true;
  } else {
    dustbinPickerMap.invalidateSize();
  }
});

// Dumping Picker Modal
const dumpingModal = document.getElementById('dumpingModal');
dumpingModal.addEventListener('shown.bs.modal', function () {
  if (!dumpingPickerInitialized) {
    dumpingPickerMap = L.map('dumpingPickerMap').setView([35.3000, 75.6333], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(dumpingPickerMap);
    dumpingPickerMap.on('click', function(e) {
      document.getElementById("newDumpingLat").value = e.latlng.lat.toFixed(5);
      document.getElementById("newDumpingLng").value = e.latlng.lng.toFixed(5);
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(5)}`)
        .openOn(dumpingPickerMap);
    });
    dumpingPickerInitialized = true;
  } else {
    dumpingPickerMap.invalidateSize();
  }
});

// ------------------------------
// Add New Dustbin & Dumping Point Functions
// ------------------------------
function addNewDustbin() {
  let name = document.getElementById("newDustbinName").value;
  let description = document.getElementById("newDustbinDescription").value;
  let status = document.getElementById("newDustbinStatus").value;
  let lat = document.getElementById("newDustbinLat").value;
  let lng = document.getElementById("newDustbinLng").value;
  
  if (!lat || !lng) {
    document.getElementById("dustbinMessage").innerText = "Please pick a location on the map.";
    return;
  }
  
  eel.add_dustbin(lat, lng, name, description, status)(function(response) {
    document.getElementById("dustbinMessage").innerText = response.message;
    loadDashboardDustbins();
    loadDustbinsOnDustbinMap();
    loadDustbinsIntoSelect();
    loadSystemStats();
    document.getElementById("dustbinForm").reset();
  });
}

function addNewDumping() {
  let name = document.getElementById("newDumpingName").value;
  let lat = document.getElementById("newDumpingLat").value;
  let lng = document.getElementById("newDumpingLng").value;
  
  if (!lat || !lng) {
    document.getElementById("dumpingMessage").innerText = "Please pick a location on the map.";
    return;
  }
  
  eel.add_dumping_point(lat, lng, name)(function(response) {
    document.getElementById("dumpingMessage").innerText = response.message;
    loadDumpingOnDumpingMap();
    loadSystemStats();
    document.getElementById("dumpingForm").reset();
  });
}

// ------------------------------
// Nearest Dumping Functions
// ------------------------------
function loadDustbinsIntoSelect() {
  eel.get_dustbins()(function(data) {
    const select = document.getElementById("dustbinSelect");
    select.innerHTML = "";
    for (let id in data) {
      let option = document.createElement("option");
      option.value = id;
      option.innerText = `${data[id].name} (${data[id].status})`;
      select.appendChild(option);
    }
  });
}

function initializeNearestMap() {
  if (!nearestMap) {
    nearestMap = L.map('nearestMap').setView([35.3000, 75.6333], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(nearestMap);
  }
}

function calculateNearest() {
  const select = document.getElementById("dustbinSelect");
  const selectedId = select.value;
  eel.get_dustbins()(function(data) {
    let d = data[selectedId];
    if (d) {
      nearestMap.setView([d.lat, d.lng], 14);
      if (nearestMarker) nearestMap.removeLayer(nearestMarker);
      nearestMarker = L.marker([d.lat, d.lng]).addTo(nearestMap).bindPopup("Selected Dustbin").openPopup();
      eel.find_nearest_dumping(d.lat, d.lng)(function(nearest) {
        if (nearest) {
          let dumpMarker = L.marker([nearest.lat, nearest.lng]).addTo(nearestMap)
                            .bindPopup(`<strong>${nearest.name}</strong><br>Distance: ${nearest.distance}`);
          document.getElementById("nearestDetails").innerText = `Nearest Dumping: ${nearest.name} at a distance of ${nearest.distance}`;
        }
      });
    }
  });
}

// ------------------------------
// Analytics Functions
// ------------------------------
function loadAnalytics() {
  eel.get_heatmap_data()(function(counts) {
    let canvas = document.getElementById("chartCanvas");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let statuses = Object.keys(counts);
    let maxCount = Math.max(...statuses.map(s => counts[s]));
    statuses.forEach((status, index) => {
      let barHeight = (counts[status] / maxCount) * 300;
      let fillColor = (status === "Full") ? "#d9534f" : (status === "Partially Full") ? "#f0ad4e" : "#5cb85c";
      ctx.fillStyle = fillColor;
      ctx.fillRect(50 + index * 150, 350 - barHeight, 100, barHeight);
      ctx.fillStyle = "#333";
      ctx.font = "16px sans-serif";
      ctx.fillText(status, 50 + index * 150, 370);
      ctx.fillText(counts[status], 50 + index * 150, 350 - barHeight - 10);
    });
  });
}

// ------------------------------
// Info & Update Functions
// ------------------------------
function updateStatus() {
  let dustbinId = document.getElementById("dustbinId").value;
  let newStatus = document.getElementById("newStatus").value;
  eel.update_dustbin_status(dustbinId, newStatus)(function(response) {
    document.getElementById("updateMessage").innerText = response.message;
    loadDashboardDustbins();
    loadDustbinsIntoSelect();
    loadSystemStats();
  });
}

function loadSystemStats() {
  eel.get_dustbins()(function(data) {
    document.getElementById("totalDustbins").innerText = Object.keys(data).length;
    document.getElementById("totalDustbinsInfo").innerText = Object.keys(data).length;
  });
  eel.get_dumping_points()(function(data) {
    document.getElementById("totalDumpingPoints").innerText = Object.keys(data).length;
    document.getElementById("totalDumpingPointsInfo").innerText = Object.keys(data).length;
  });
}
