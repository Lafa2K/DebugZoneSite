import { zones } from './data.js';

const center_x = 117.75;
const center_y = 172.75;
const scale_x = 0.02072;
const scale_y = 0.0205;

var CUSTOM_CRS = L.extend({}, L.CRS.Simple, {
    projection: L.Projection.LonLat,
    scale: function(zoom) {
        return Math.pow(2, zoom);
    },
    zoom: function(sc) {
        return Math.log(sc) / 0.6931471805599453;
    },
    distance: function(pos1, pos2) {
        var x_difference = pos2.lng - pos1.lng;
        var y_difference = pos2.lat - pos1.lat;
        return Math.sqrt(x_difference * x_difference + y_difference * y_difference);
    },
    transformation: new L.Transformation(scale_x, center_x, -scale_y, center_y),
    infinite: true
});


var AtlasStyle = L.tileLayer('https://lafa2k.github.io/DebugZoneSite//mapStyles/styleAtlas/{z}/{x}/{y}.jpg', {
    minZoom: 0,
    maxZoom: 8
});

var ExampleGroup = L.layerGroup();
var Icons = { "Example": ExampleGroup };

var mymap = L.map('map', {
    crs: CUSTOM_CRS,
    minZoom: 1,
    maxZoom: 5,
    zoom: 0,
    maxNativeZoom: 5,
    preferCanvas: true,
    layers: [AtlasStyle],
    center: [0, 0],
    zoom: 5
});

var layersControl = L.control.layers(
    { 
        "Atlas": AtlasStyle,
    },
    Icons
).addTo(mymap);

var markerStatus = {
    group1: null,
    group2: null,
    group3: null
};
var markers = {
    group1: [
        L.marker([51.5, -0.09]),
        L.marker([151.5, -0.08]),
        L.marker([351.5, -0.07])
    ],
    group2: [
        L.marker([51.5, 101.09]),
        L.marker([151.5, 101.08]),
        L.marker([351.5, 101.07])
    ],
    group3: [
        L.marker([0, 0])
    ]
};

const zoneLabels = [];
const drawnLayers = {};

function drawZoneOnMap(zoneData, buttonId) {
    const latLngs = [
        [zoneData.bbmin[1], zoneData.bbmin[0]],
        [zoneData.bbmin[1], zoneData.bbmax[0]],
        [zoneData.bbmax[1], zoneData.bbmax[0]],
        [zoneData.bbmax[1], zoneData.bbmin[0]]
    ];
    const color = `rgb(${zoneData.R}, ${zoneData.G}, ${zoneData.B})`;

    const polygon = L.polygon(latLngs, { color: color, fillColor: color, fillOpacity: 0.5 });

    const centerLat = (zoneData.bbmin[1] + zoneData.bbmax[1]) / 2;
    const centerLng = (zoneData.bbmin[0] + zoneData.bbmax[0]) / 2;

    const marker = L.marker([centerLat, centerLng], {
        icon: L.divIcon({
            className: 'zone-label',
            html: `<div>${buttonId}<br>${zoneData.name}</div>`,
            iconSize: [120, 60],
            iconAnchor: [60, 30]
        })
    });

    zoneLabels.push(marker);
    const group = L.layerGroup([polygon, marker]);

    return group;
}

function removeLabels() {
    zoneLabels.forEach(label => {
        mymap.removeLayer(label);
    });
    zoneLabels.length = 0;
}
function removeAllZones() {
    for (const category in drawnLayers) {
        if (drawnLayers.hasOwnProperty(category)) {
            mymap.removeLayer(drawnLayers[category]);
            delete drawnLayers[category];
        }
    }
}

function drawAllZones() {
    removeAllZones();
    for (const categoryId in zones) {
        if (zones.hasOwnProperty(categoryId)) {
            const selectedZones = zones[categoryId];
            const layerGroup = L.layerGroup();
            selectedZones.forEach(zone => {
                const zoneLayer = drawZoneOnMap(zone, categoryId);
                layerGroup.addLayer(zoneLayer);
            });
            layerGroup.addTo(mymap);
            drawnLayers[categoryId] = layerGroup;
        }
    }
}


function addCategoryClickListener() {
    const categoryItems = document.querySelectorAll('.category-item-text');

    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            const categoryId = item.id; 
            handleCategoryClick(categoryId);
        });
    });
}

function handleCategoryClick(categoryId) {
    const selectedZones = zones[categoryId];
    if (!selectedZones) return;

    const statusElement = document.querySelector(`#${categoryId}`).previousElementSibling;
    const numberElement = document.querySelector(`#${categoryId}`).nextElementSibling;

    if (drawnLayers[categoryId]) {
        mymap.removeLayer(drawnLayers[categoryId]);
        delete drawnLayers[categoryId];
        if (statusElement) statusElement.style.backgroundColor = "#FF0000";
    } else {
        const layerGroup = L.layerGroup();
        selectedZones.forEach(zone => {
            const zoneLayer = drawZoneOnMap(zone, categoryId);
            layerGroup.addLayer(zoneLayer);
        });

        layerGroup.addTo(mymap);
        drawnLayers[categoryId] = layerGroup;
        if (statusElement) statusElement.style.backgroundColor = "#00FF00";
        if (numberElement) numberElement.textContent = `Subzone: ${selectedZones.length}`;
    }
}

function addControlButtons() {
    document.getElementById('drawAllZonesButton').addEventListener('click', function() {
        drawAllZones();
    });
    document.getElementById('removeAllZonesButton').addEventListener('click', function() {
        removeAllZones();
    });

    document.getElementById('removeAllLabelsButton').addEventListener('click', function() {
        removeLabels(); // Chama a função para remover todos os rótulos
    });
}

// Chamadas iniciais
addCategoryClickListener();
addControlButtons();
