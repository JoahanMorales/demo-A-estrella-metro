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

const dijkstraNodes = [
  "tBottom",
  "dark0",
  "tTop",
  "start",
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

const astarNodes = ["tBottom", "start", "dark1", "dark2", "dark3", "dark4", "dark5", "goal"];

const steps = [
  {
    kicker: "1. Problema",
    tab: "Problema",
    title: "Inicio y destino",
    score: "Punto de partida",
    explainTitle: "El problema",
    explain:
      "Queremos llegar desde la estacion azul hasta la roja. La ruta final esta dos estaciones arriba del transbordo gris derecho.",
    mode: "problem",
  },
  {
    kicker: "2. Primera decision",
    tab: "Decision",
    title: "Dos caminos posibles",
    score: "A o B",
    explainTitle: "Primera decision",
    explain:
      "Desde el inicio se puede subir por verde claro o bajar al transbordo inferior para tomar la linea verde oscura.",
    mode: "decision",
  },
  {
    kicker: "3. Evaluacion A*",
    tab: "f = g + h",
    title: "La prioridad sale de f",
    score: "Ambas f = 5",
    explainTitle: "Formula",
    explain:
      "g mide lo que ya costo llegar. h estima cuantas estaciones faltan. A* elige los nodos con menor f.",
    mode: "formula",
  },
  {
    kicker: "4. Exploracion inicial",
    tab: "Explora",
    title: "A* abre la frontera",
    score: "Empate inicial",
    explainTitle: "Frontera",
    explain:
      "Como las dos primeras opciones empatan, A* explora un paso en ambas rutas antes de priorizar la que se acerca al destino.",
    mode: "initial",
  },
  {
    kicker: "5. Comparacion",
    tab: "Comparar",
    title: "Dijkstra explora mas",
    score: "18 contra 8",
    explainTitle: "Comparacion",
    explain:
      "Dijkstra no usa destino como guia, por eso expande muchos nodos con el mismo costo. A* descarta caminos menos prometedores.",
    mode: "compare",
  },
  {
    kicker: "6. Resultado final",
    tab: "Resultado",
    title: "Misma ruta, menos nodos",
    score: "A*: 8 nodos",
    explainTitle: "Resultado",
    explain:
      "A* encuentra una ruta optima explorando 8 nodos, mientras Dijkstra necesita 18 en este ejemplo.",
    mode: "result",
  },
];

const stationLayer = document.querySelector("#stationLayer");
const candidateLayer = document.querySelector("#candidateLayer");
const routeLayer = document.querySelector("#routeLayer");
const labelLayer = document.querySelector("#labelLayer");
const stepTabs = document.querySelector("#stepTabs");
const prevStep = document.querySelector("#prevStep");
const nextStep = document.querySelector("#nextStep");
const playDemo = document.querySelector("#playDemo");
const resetDemo = document.querySelector("#resetDemo");
const stepKicker = document.querySelector("#stepKicker");
const stepTitle = document.querySelector("#stepTitle");
const scoreLabel = document.querySelector("#scoreLabel");
const explainTitle = document.querySelector("#explainTitle");
const explainText = document.querySelector("#explainText");
const dijkstraCount = document.querySelector("#dijkstraCount");
const astarCount = document.querySelector("#astarCount");

let currentStep = 0;
let animationTimer = 0;

function svgEl(name, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function clearLayer(layer) {
  while (layer.firstChild) layer.removeChild(layer.firstChild);
}

function drawStations() {
  clearLayer(stationLayer);
  stations.forEach((station) => {
    const radius = station.type === "transfer" ? 13 : station.type === "regular" ? 7 : 15;
    const circle = svgEl("circle", {
      cx: station.x,
      cy: station.y,
      r: radius,
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

function stationById(id) {
  return stations.find((station) => station.id === id);
}

function drawNode(id, className, radius = 13) {
  const station = stationById(id);
  if (!station) return;
  candidateLayer.appendChild(
    svgEl("circle", {
      cx: station.x,
      cy: station.y,
      r: radius,
      class: className,
    }),
  );
}

function drawRoute() {
  routeLayer.appendChild(
    svgEl("path", {
      class: "route-path",
      d: "M215 312 V392 H700 Q790 392 790 322 V126",
    }),
  );
}

function drawDecisionLabels() {
  labelLayer.appendChild(svgEl("path", { class: "hint-path", d: "M190 352 V225" }));
  labelLayer.appendChild(svgEl("path", { class: "hint-path", d: "M238 352 V392 H285" }));

  const labelA = svgEl("g");
  labelA.innerHTML = '<circle class="callout" cx="160" cy="312" r="22"></circle><text class="map-label" x="151" y="322">A</text>';
  const labelB = svgEl("g");
  labelB.innerHTML = '<circle class="callout" cx="190" cy="452" r="22"></circle><text class="map-label" x="181" y="462">B</text>';
  labelLayer.append(labelA, labelB);
}

function renderStep(index) {
  window.clearInterval(animationTimer);
  currentStep = Math.max(0, Math.min(steps.length - 1, index));
  const step = steps[currentStep];

  clearLayer(candidateLayer);
  clearLayer(routeLayer);
  clearLayer(labelLayer);

  stepKicker.textContent = step.kicker;
  stepTitle.textContent = step.title;
  scoreLabel.textContent = step.score;
  explainTitle.textContent = step.explainTitle;
  explainText.textContent = step.explain;
  dijkstraCount.textContent = step.mode === "problem" ? "-" : "18";
  astarCount.textContent = step.mode === "problem" ? "-" : "8";

  document.querySelectorAll(".step-tab").forEach((tab, tabIndex) => {
    tab.classList.toggle("active", tabIndex === currentStep);
  });

  if (step.mode === "decision" || step.mode === "formula") {
    drawDecisionLabels();
  }

  if (step.mode === "initial") {
    ["start", "tBottom", "dark1", "dark5"].forEach((id) => drawNode(id, "frontier-node"));
  }

  if (step.mode === "compare") {
    dijkstraNodes.forEach((id) => drawNode(id, "dijkstra-node", 12));
    astarNodes.forEach((id) => drawNode(id, "frontier-node", 9));
  }

  if (step.mode === "result") {
    astarNodes.forEach((id) => drawNode(id, "frontier-node", 12));
    drawRoute();
  }
}

function animateSearch() {
  renderStep(4);
  clearLayer(candidateLayer);
  clearLayer(routeLayer);

  let index = 0;
  animationTimer = window.setInterval(() => {
    if (index < dijkstraNodes.length) {
      drawNode(dijkstraNodes[index], "dijkstra-node", 12);
    }

    if (index < astarNodes.length) {
      drawNode(astarNodes[index], "frontier-node", 9);
      astarCount.textContent = String(index + 1);
    }

    dijkstraCount.textContent = String(Math.min(index + 1, dijkstraNodes.length));
    index += 1;

    if (index > dijkstraNodes.length) {
      window.clearInterval(animationTimer);
      renderStep(5);
    }
  }, 340);
}

function initTabs() {
  steps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "step-tab";
    button.textContent = `${index + 1}. ${step.tab}`;
    button.addEventListener("click", () => renderStep(index));
    stepTabs.appendChild(button);
  });
}

prevStep.addEventListener("click", () => renderStep(currentStep - 1));
nextStep.addEventListener("click", () => renderStep(currentStep + 1));
playDemo.addEventListener("click", animateSearch);
resetDemo.addEventListener("click", () => renderStep(0));

drawStations();
initTabs();
renderStep(0);
