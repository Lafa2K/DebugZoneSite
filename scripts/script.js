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

var SateliteStyle = L.tileLayer('mapStyles/styleSatelite/{z}/{x}/{y}.jpg', {minZoom: 0, maxZoom: 8}),
    AtlasStyle = L.tileLayer('mapStyles/styleAtlas/{z}/{x}/{y}.jpg', {minZoom: 0, maxZoom: 5}),
    GridStyle = L.tileLayer('mapStyles/styleGrid/{z}/{x}/{y}.png', {minZoom: 0, maxZoom: 5});

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
        // "Satelite": SateliteStyle,
        "Atlas": AtlasStyle,
        // "Grid": GridStyle
    },
    Icons
).addTo(mymap);

var X = 0;
var Y = 0;
L.marker([X, Y], {icon: customIcon(1)}).addTo(Icons["Example"]).bindPopup("I am here.");

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

function loadGroup(group) {
    if (markerStatus[group] == null) {
        for (var i = 0; i < markers[group].length; i++) {
            markers[group][i].addTo(mymap);
        }
        markerStatus[group] = true;
    } else {
        for (var i = 0; i < markers[group].length; i++) {
            mymap.removeLayer(markers[group][i]);
        }
        markerStatus[group] = null;
    }
}

function addClickListener(id, func) {
    const element = document.getElementById(id);
    if (!element) return;
    element.addEventListener('click', function(event) {
        event.preventDefault();
        func();
    });
}

function addGroupClickListeners() {
    addClickListener('group1', function() { loadGroup('group1'); });
    addClickListener('group2', function() { loadGroup('group2'); });
    addClickListener('group3', function() { loadGroup('group3'); });
}

function customIcon(icon) {
    return L.icon({
        iconUrl: `blips/${icon}.png`,
        iconSize: [20, 20],
        iconAnchor: [20, 20],
        popupAnchor: [-10, -27]
    });
}

var line_horizontal = L.polyline([[0, 10], [0, -10]], { color: 'red', weight: 1 }).addTo(mymap);
var line_vertical = L.polyline([[10, 0], [-10, 0]], { color: 'red', weight: 1 }).addTo(mymap);



const drawnLayers = {}; // Objeto para armazenar as zonas desenhadas por botão

function drawZoneOnMap(zoneData, buttonId) {
    const latLngs = [
        [zoneData.bbmin[1], zoneData.bbmin[0]],
        [zoneData.bbmin[1], zoneData.bbmax[0]],
        [zoneData.bbmax[1], zoneData.bbmax[0]],
        [zoneData.bbmax[1], zoneData.bbmin[0]]
    ];
    const color = `rgb(${zoneData.R}, ${zoneData.G}, ${zoneData.B})`;

    // Cria o polígono
    const polygon = L.polygon(latLngs, { color: color, fillColor: color, fillOpacity: 0.5 });

    // Calcula o centro do retângulo
    const centerLat = (zoneData.bbmin[1] + zoneData.bbmax[1]) / 2;
    const centerLng = (zoneData.bbmin[0] + zoneData.bbmax[0]) / 2;

    // Adiciona o marcador no centro com texto adicional
    const marker = L.marker([centerLat, centerLng], {
        icon: L.divIcon({
            className: 'zone-label',
            html: `<div>${buttonId}<br>${zoneData.name}</div>`,
            iconSize: [120, 60],
            iconAnchor: [60, 30]
        })
    });

    // Agrupa o polígono e o marcador em uma LayerGroup
    const group = L.layerGroup([polygon, marker]);

    return group;
}

function handleCategoryClick(categoryId) {
    const selectedZones = zones[categoryId];
    if (!selectedZones) return;

    // Seleciona os elementos visuais relacionados
    const statusElement = document.querySelector(`#${categoryId}`).previousElementSibling;
    const numberElement = document.querySelector(`#${categoryId}`).nextElementSibling;

    // Alterna entre exibir e ocultar as zonas
    if (drawnLayers[categoryId]) {
        mymap.removeLayer(drawnLayers[categoryId]);
        delete drawnLayers[categoryId];
        // Atualiza o indicador visual para vermelho
        if (statusElement) statusElement.style.backgroundColor = "#FF0000";
    } else {
        // Cria e adiciona as zonas ao mapa
        const layerGroup = L.layerGroup();
        selectedZones.forEach(zone => {
            const zoneLayer = drawZoneOnMap(zone, categoryId);
            layerGroup.addLayer(zoneLayer);
        });

        layerGroup.addTo(mymap);
        drawnLayers[categoryId] = layerGroup;
        // Atualiza o indicador visual para verde
        if (statusElement) statusElement.style.backgroundColor = "#00FF00";

        // Atualiza o número de subzonas exibido
        if (numberElement) numberElement.textContent = `Subzone: ${selectedZones.length}`;
    }
}

// CSS para os rótulos
const css = `
.zone-label {
    font-size: 12px;
    font-weight: bold;
    color: #000;
    text-align: center;
    pointer-events: none;
    padding: 5px;
    border-radius: 3px;
}
`;

// Adiciona o CSS dinamicamente ao documento
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

// Adiciona eventos de clique a cada botão da lista
function addCategoryClickListener() {
    const categoryItems = document.querySelectorAll('.category-item-text');

    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            const categoryId = item.id; 
            handleCategoryClick(categoryId); 
        });
    });
}

addCategoryClickListener();
