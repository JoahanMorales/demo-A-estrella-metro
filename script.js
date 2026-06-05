const stations = [
  { id: "l1", x: 92, y: 124, type: "regular" },
  { id: "l2", x: 150, y: 132, type: "regular" },
  { id: "tTop", x: 215, y: 206, type: "transfer" },
  { id: "start", x: 215, y: 312, type: "start" },
  { id: "tBottom", x: 215, y: 392, type: "transfer" },
  { id: "l6", x: 250, y: 456, type: "regular" },
  { id: "l7", x: 330, y: 500, type: "regular" },
  { id: "g1", x: 78, y: 206, type: "regular" },
  { id: "g2", x: 278, y: 252, type: "regular" },
  { id: "g3", x: 312, y: 334, type: "regular" },
  { id: "g4", x: 386, y: 334, type: "regular" },
  { id: "g5", x: 478, y: 310, type: "regular" },
  { id: "g6", x: 542, y: 246, type: "regular" },
  { id: "tRight", x: 790, y: 246, type: "transfer" },
  { id: "dark0", x: 112, y: 392, type: "regular" },
  { id: "dark1", x: 300, y: 392, type: "regular" },
  { id: "dark2", x: 430, y: 392, type: "regular" },
  { id: "dark3", x: 560, y: 392, type: "regular" },
  { id: "dark4", x: 700, y: 392, type: "regular" },
  { id: "dark5", x: 790, y: 322, type: "regular" },
  { id: "goal", x: 790, y: 126, type: "goal" },
  { id: "topDark1", x: 690, y: 82, type: "regular" },
  { id: "topDark2", x: 622, y: 82, type: "regular" },
];

const astarNodes = ["start", "tBottom", "dark1", "dark2", "dark3", "dark4", "dark5", "tRight", "goal"];
const dijkstraNodes = [
  "start",
  "tBottom",
  "dark0",
  "tTop",
  "dark1",
  "g2",
  "g3",
  "dark2",
  "g4",
  "dark3",
  "g5",
  "dark4",
  "g6",
  "tRight",
  "dark5",
  "topDark1",
  "topDark2",
  "goal",
];

const routePath = "M215 312 V392 H700 Q790 392 790 322 V126";
const dijkstraSweepPath = "M215 392 H112 M215 206 H76 M215 206 Q278 206 278 268 V291 Q278 334 321 334 H456 Q506 334 506 284 Q506 246 544 246 H790 M622 82 H746 Q790 82 790 126";

const modes = {
  compare: {
    label: "Comparacion final",
    title: "A* llega con 8 nodos. Dijkstra revisa 18.",
    dijkstra: 18,
    astar: 8,
  },
  astar: {
    label: "Recorrido de A*",
    title: "Ruta guiada por f = g + h",
    dijkstra: "-",
    astar: 8,
  },
  dijkstra: {
    label: "Recorrido de Dijkstra",
    title: "Explora parejo hasta encontrar el destino",
    dijkstra: 18,
    astar: "-",
  },
};

const stationLayer = document.querySelector("#stationLayer");
const exploreLayer = document.querySelector("#exploreLayer");
const routeLayer = document.querySelector("#routeLayer");
const valueLayer = document.querySelector("#valueLayer");
const modeLabel = document.querySelector("#modeLabel");
const modeTitle = document.querySelector("#modeTitle");
const dijkstraCount = document.querySelector("#dijkstraCount");
const astarCount = document.querySelector("#astarCount");
const playDemo = document.querySelector("#playDemo");
const modeButtons = document.querySelectorAll(".mode-button");

let activeMode = "compare";
let timer = 0;

function svgEl(name, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function clear(layer) {
  while (layer.firstChild) layer.removeChild(layer.firstChild);
}

function stationById(id) {
  return stations.find((station) => station.id === id);
}

function drawStations() {
  clear(stationLayer);
  stations.forEach((station) => {
    const circle = svgEl("circle", {
      cx: station.x,
      cy: station.y,
      r: station.type === "regular" ? 7 : station.type === "transfer" ? 14 : 16,
      class:
        station.type === "transfer"
          ? "transfer"
          : station.type === "start"
            ? "start-node"
            : station.type === "goal"
              ? "goal-node"
              : "station",
    });
    stationLayer.appendChild(circle);
  });
}

function drawNode(id, className, radius = 12) {
  const station = stationById(id);
  if (!station) return;
  exploreLayer.appendChild(
    svgEl("circle", {
      cx: station.x,
      cy: station.y,
      r: radius,
      class: className,
    }),
  );
}

function drawPath(className, d) {
  routeLayer.appendChild(svgEl("path", { class: className, d }));
}

function drawValues() {
  clear(valueLayer);
  const box = svgEl("g", { class: "map-values" });
  box.innerHTML = `
    <rect x="36" y="28" width="238" height="86" rx="8"></rect>
    <text x="58" y="60">A: g=1 h=4 f=5</text>
    <text x="58" y="91">B: g=2 h=3 f=5</text>
  `;
  valueLayer.appendChild(box);
}

function setMode(mode) {
  window.clearInterval(timer);
  activeMode = mode;
  const data = modes[mode];

  modeLabel.textContent = data.label;
  modeTitle.textContent = data.title;
  dijkstraCount.textContent = data.dijkstra;
  astarCount.textContent = data.astar;

  modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  clear(exploreLayer);
  clear(routeLayer);
  clear(valueLayer);

  if (mode === "astar") {
    astarNodes.forEach((id) => drawNode(id, "node-astar", 12));
    drawPath("route-astar", routePath);
    drawValues();
  }

  if (mode === "dijkstra") {
    dijkstraNodes.forEach((id) => drawNode(id, "node-dijkstra", 12));
    drawPath("route-dijkstra-sweep", dijkstraSweepPath);
    drawPath("route-dijkstra", routePath);
  }

  if (mode === "compare") {
    dijkstraNodes.forEach((id) => drawNode(id, "node-dijkstra faint", 11));
    astarNodes.forEach((id) => drawNode(id, "node-astar", 12));
    drawPath("route-dijkstra offset", routePath);
    drawPath("route-astar", routePath);
    drawValues();
  }
}

function animate() {
  setMode("compare");
  clear(exploreLayer);
  clear(routeLayer);
  dijkstraCount.textContent = "0";
  astarCount.textContent = "0";

  let index = 0;
  timer = window.setInterval(() => {
    if (index < dijkstraNodes.length) {
      drawNode(dijkstraNodes[index], "node-dijkstra", 12);
      dijkstraCount.textContent = String(index + 1);
    }

    if (index < astarNodes.length) {
      drawNode(astarNodes[index], "node-astar", 12);
      astarCount.textContent = String(index + 1);
    }

    index += 1;

    if (index > dijkstraNodes.length) {
      window.clearInterval(timer);
      drawPath("route-dijkstra offset", routePath);
      drawPath("route-astar", routePath);
    }
  }, 280);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

playDemo.addEventListener("click", animate);

drawStations();
setMode(activeMode);
