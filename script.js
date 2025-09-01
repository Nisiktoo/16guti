/* =========================
   1) Config & DOM references
   ========================= */
const board = document.getElementById("board");
const rowSize = 9;
const colSize = 5;

// Internal units from width attribute; CSS scales via viewBox
const attrWidth = Number(board.getAttribute("width")) || 500;
let boardSize = attrWidth;

const circleRadius = 8;
const color = ["red", "blue", "transparent"];

// Responsive SVG via viewBox
const vbWidth = boardSize + 5 * circleRadius;
const vbHeight = (boardSize * 3) / 2 + 5 * circleRadius;
board.setAttribute("viewBox", `0 0 ${vbWidth} ${vbHeight}`);
board.setAttribute("preserveAspectRatio", "xMidYMid meet");
board.removeAttribute("width");
board.removeAttribute("height");

// Drawing layer (created in index.html)
const SVG_NS = "http://www.w3.org/2000/svg";
const PADDING = circleRadius;
const layer = document.getElementById("layer");
layer.setAttribute("transform", `translate(${2.5 * PADDING}, ${2.2 * PADDING})`);

// Spacing (grid unit)
const spacing = boardSize / (colSize - 1);
const diagonalSpacing = Math.sqrt(2) * spacing;

/* =========================
   2) Game state
   ========================= */
let score = [0, 0];          // [player0, player1]
let currentTurn = Math.round(Math.random()) % 2;         // 0: Red, 1: Blue
let currentState = 0;        // 0: idle, 1: selected, 2: capture chain
let selectedGuti = null;     // currently selected Guti
let totalMoves = 0;

// Score UI refs
const p0ScoreEl = document.getElementById("player0-score");
const p1ScoreEl = document.getElementById("player1-score");

// Board model (grid of Guti instances; null where no point exists)
let gutis = [[], [], [], [], [], [], [], [], []];

/* =========================
   3) Graph structures
   ========================= */
// EDGES: adjacency for step moves
const EDGES = [
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []]
];

// PATHS: jump paths (length 2 via a middle node)
const PATHS = [
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []]
];

/* =========================
   4) Utilities
   ========================= */
function badPoint(row, col) {
        if (row < 0 || row >= rowSize || col < 0 || col >= colSize) return true;
        if (row >= 2 && row <= 6) return false;
        if (col > 0 && col < colSize - 1) return false;
        return true;
}

/* find the pixel position for (row, col) based on custom board layout */
function getPixelPostion(space, row, col) {
        let x = 0, y = 0;
        if (row === 0) {
                y = col * space;
        } else if (row === 1) {
                x = space / 2;
                y = 2 * space + (space / 2 * (col - 2));
        } else if (row === 7) {
                x = 5 * space + space / 2;
                y = 2 * space + (space / 2 * (col - 2));
        } else {
                if (row === 8) row--;
                x = (row - 1) * space;
                y = col * space;
        }
        return { x, y };
}

/* =========================
   5) Graph building (EDGES, PATHS)
   ========================= */
function buildEdges() {
        const directions = [
                { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
                { dr: 0, dc: 1 }, { dr: 0, dc: -1 }
        ];
        const diagonalDirections = [
                { dr: 1, dc: 1 }, { dr: 1, dc: -1 },
                { dr: -1, dc: 1 }, { dr: -1, dc: -1 }
        ];

        for (let i = 0; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (badPoint(i, j)) continue;

                        for (const { dr, dc } of directions) {
                                const ni = i + dr, nj = j + dc;
                                if (!badPoint(ni, nj)) EDGES[i][j].push([ni, nj]);
                        }

                        if ((i + j) % 2 === 0) {
                                for (const { dr, dc } of diagonalDirections) {
                                        const ni = i + dr, nj = j + dc;
                                        if (!badPoint(ni, nj)) EDGES[i][j].push([ni, nj]);
                                }
                        }
                }
        }

        // Prune specific edges
        const findEdgeIndex = (arr, edge) => arr.findIndex(e => e[0] === edge[0] && e[1] === edge[1]);
        let idx;

        idx = findEdgeIndex(EDGES[1][1], [2, 0]); if (idx !== -1) EDGES[1][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[1][1], [2, 1]); if (idx !== -1) EDGES[1][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[1][1], [0, 2]); if (idx !== -1) EDGES[1][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[0][2], [1, 1]); if (idx !== -1) EDGES[0][2].splice(idx, 1);
        idx = findEdgeIndex(EDGES[0][2], [1, 3]); if (idx !== -1) EDGES[0][2].splice(idx, 1);

        idx = findEdgeIndex(EDGES[1][3], [0, 2]); if (idx !== -1) EDGES[1][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[1][3], [2, 3]); if (idx !== -1) EDGES[1][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[1][3], [2, 4]); if (idx !== -1) EDGES[1][3].splice(idx, 1);

        idx = findEdgeIndex(EDGES[2][0], [1, 1]); if (idx !== -1) EDGES[2][0].splice(idx, 1);
        idx = findEdgeIndex(EDGES[2][1], [1, 1]); if (idx !== -1) EDGES[2][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[2][3], [1, 3]); if (idx !== -1) EDGES[2][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[2][4], [1, 3]); if (idx !== -1) EDGES[2][4].splice(idx, 1);

        idx = findEdgeIndex(EDGES[6][0], [7, 1]); if (idx !== -1) EDGES[6][0].splice(idx, 1);
        idx = findEdgeIndex(EDGES[6][1], [7, 1]); if (idx !== -1) EDGES[6][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[6][3], [7, 3]); if (idx !== -1) EDGES[6][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[6][4], [7, 3]); if (idx !== -1) EDGES[6][4].splice(idx, 1);

        idx = findEdgeIndex(EDGES[7][1], [6, 0]); if (idx !== -1) EDGES[7][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[7][1], [6, 1]); if (idx !== -1) EDGES[7][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[7][1], [8, 2]); if (idx !== -1) EDGES[7][1].splice(idx, 1);

        idx = findEdgeIndex(EDGES[7][3], [6, 3]); if (idx !== -1) EDGES[7][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[7][3], [6, 4]); if (idx !== -1) EDGES[7][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[7][3], [8, 2]); if (idx !== -1) EDGES[7][3].splice(idx, 1);

        idx = findEdgeIndex(EDGES[8][2], [7, 1]); if (idx !== -1) EDGES[8][2].splice(idx, 1);
        idx = findEdgeIndex(EDGES[8][2], [7, 3]); if (idx !== -1) EDGES[8][2].splice(idx, 1);
}

function buildPaths() {
        for (let i = 0; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (badPoint(i, j)) continue;
                        for (const [ni, nj] of EDGES[i][j]) {
                                const nni = ni + (ni - i);
                                const nnj = nj + (nj - j);
                                if (EDGES[ni][nj].some(arr => arr[0] === nni && arr[1] === nnj)) {
                                        PATHS[i][j].push([[ni, nj], [nni, nnj]]);
                                }
                        }
                }
        }
        // Special paths
        PATHS[0][1].push([[1, 1], [2, 2]]);
        PATHS[0][3].push([[1, 3], [2, 2]]);
        PATHS[2][2].push([[1, 1], [0, 1]]);
        PATHS[2][2].push([[1, 3], [0, 3]]);
        PATHS[8][1].push([[7, 1], [6, 2]]);
        PATHS[6][2].push([[7, 1], [8, 1]]);
        PATHS[8][3].push([[7, 3], [6, 2]]);
        PATHS[6][2].push([[7, 3], [8, 3]]);
}

/* =========================
   6) Rendering helpers
   ========================= */
function drawGrid(space) {
        const connections = [];
        let startPoint, endPoint;

        // Square grid (5x5)
        for (let i = 1; i <= 5; i++) {
                // horizontal lines
                startPoint = { x: i * space, y: 0 };
                endPoint = { x: i * space, y: 4 * space };
                connections.push([startPoint, endPoint]);
                // vertical lines
                startPoint = { x: space, y: (i - 1) * space };
                endPoint = { x: 5 * space, y: (i - 1) * space };
                connections.push([startPoint, endPoint]);
        }

        // Diagonals (forward)
        connections.push([{ x: 3 * space, y: 0 }, { x: 0, y: 3 * space }]);
        connections.push([{ x: 5 * space, y: 0 }, { x: space, y: 4 * space }]);
        connections.push([{ x: 6 * space, y: space }, { x: 3 * space, y: 4 * space }]);

        // Diagonals (backward)
        connections.push([{ x: 3 * space, y: 0 }, { x: 6 * space, y: 3 * space }]);
        connections.push([{ x: 1 * space, y: 0 }, { x: 5 * space, y: 4 * space }]);
        connections.push([{ x: 0, y: space }, { x: 3 * space, y: 4 * space }]);

        // Tiny lines / specials
        connections.push([{ x: 0, y: space }, { x: 0, y: 3 * space }]);
        connections.push([{ x: space / 2, y: space + space / 2 }, { x: space / 2, y: 2 * space + space / 2 }]);
        connections.push([getPixelPostion(space, 0, 2), getPixelPostion(space, 2, 2)]);
        connections.push([getPixelPostion(space, 7, 1), getPixelPostion(space, 7, 3)]);
        connections.push([getPixelPostion(space, 8, 1), getPixelPostion(space, 8, 3)]);
        connections.push([getPixelPostion(space, 6, 2), getPixelPostion(space, 8, 2)]);

        // Render
        for (const [i, j] of connections) {
                const line = document.createElementNS(SVG_NS, "line");
                line.setAttribute("x1", i.y);
                line.setAttribute("y1", i.x);
                line.setAttribute("x2", j.y);
                line.setAttribute("y2", j.x);
                line.setAttribute("stroke", "#3d91a0ff");
                line.setAttribute("stroke-width", 2);
                layer.appendChild(line);
        }
}

// Debug helpers (optional)
async function showEdges() {
        for (let i = 0; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (badPoint(i, j)) continue;
                        for (const [ni, nj] of EDGES[i][j]) {
                                let { x: x1, y: y1 } = getPixelPostion(spacing, i, j);
                                let { x: x2, y: y2 } = getPixelPostion(spacing, ni, nj);
                                const line = document.createElementNS(SVG_NS, "line");
                                line.setAttribute("x1", y1);
                                line.setAttribute("y1", x1);
                                line.setAttribute("x2", y2);
                                line.setAttribute("y2", x2);
                                line.setAttribute("stroke", "#4caf50");
                                line.setAttribute("stroke-width", 3);
                                line.setAttribute("stroke-linecap", "round");
                                layer.appendChild(line);
                                setTimeout(() => line.remove(), 1000);
                                await new Promise(r => setTimeout(r, 1000));
                        }
                }
        }
}

async function showPaths() {
        for (let i = 0; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (badPoint(i, j)) continue;
                        for (const [[,], [nni, nnj]] of PATHS[i][j]) {
                                let { x: x1, y: y1 } = getPixelPostion(spacing, i, j);
                                let { x: x2, y: y2 } = getPixelPostion(spacing, nni, nnj);
                                const line = document.createElementNS(SVG_NS, "line");
                                line.setAttribute("x1", y1);
                                line.setAttribute("y1", x1);
                                line.setAttribute("x2", y2);
                                line.setAttribute("y2", x2);
                                line.setAttribute("stroke", "#ffeb3b");
                                line.setAttribute("stroke-width", 5);
                                line.setAttribute("stroke-linecap", "round");
                                layer.appendChild(line);
                                setTimeout(() => line.remove(), 2000);
                                await new Promise(r => setTimeout(r, 2000));
                        }
                }
        }
}

/* =========================
   7) Piece class
   ========================= */
class Guti {
        constructor(row, col, player = 2) {
                this.row = row;
                this.col = col;
                this.player = player; // 0, 1, or 2

                this.el = document.createElementNS(SVG_NS, "circle");
                this.el.setAttribute("r", circleRadius);
                this.el.style.cursor = "pointer";
                this.updateColor();

                const { x, y } = getPixelPostion(spacing, row, col);
                this.el.setAttribute("cx", y);
                this.el.setAttribute("cy", x);

                // Large invisible stroke as hit area to ease tapping
                this.el.setAttribute("stroke", "transparent");
                this.el.setAttribute("stroke-width", "24px");

                this.el.addEventListener("click", handleGutiClick.bind(this));
                layer.appendChild(this.el);
        }

        updateColor() {
                if (this.player === 0) this.el.setAttribute("fill", color[0]);
                else if (this.player === 1) this.el.setAttribute("fill", color[1]);
                else this.el.setAttribute("fill", color[2]);
        }
}

/* =========================
   8) Game mechanics
   ========================= */
function swapGuti(currentGuti, targetGuti) {
        currentGuti.el.classList.remove("selected");
        targetGuti.player = currentGuti.player;
        currentGuti.player = 2;
        currentGuti.updateColor();
        targetGuti.updateColor();
}

function canCapture(currentGuti) {
        const { row, col } = currentGuti;
        for (const [midG, endG] of PATHS[row][col]) {
                const middleGuti = gutis[midG[0]][midG[1]];
                const endGuti = gutis[endG[0]][endG[1]];
                if (middleGuti.player === (1 - currentGuti.player) && endGuti.player === 2) {
                        return true;
                }
        }
        return false;
}

function moveGuti(currentGuti, targetGuti) {
        if (targetGuti.player !== 2) return 0;

        const [ni, nj] = [targetGuti.row, targetGuti.col];
        const [i, j] = [currentGuti.row, currentGuti.col];

        const isEdge = EDGES[i][j].some(arr => arr[0] === ni && arr[1] === nj);
        if (isEdge) {
                if (currentState === 2) return 0; // cannot step during capture chain
                swapGuti(currentGuti, targetGuti);
                return 1; // simple move
        }

        const pathIndex = PATHS[i][j].findIndex(path => path[1][0] === ni && path[1][1] === nj);
        if (pathIndex === -1) return 0;

        // capture move
        const [mi, mj] = PATHS[i][j][pathIndex][0];
        const middleGuti = gutis[mi][mj];
        if (middleGuti.player !== (1 - currentGuti.player)) return 0;

        middleGuti.player = 2;
        middleGuti.updateColor();
        swapGuti(currentGuti, targetGuti);
        return 2; // capture
}

/* =========================
   9) Events
   ========================= */
function handleGutiClick(e) {
        const guti = this;
        e?.stopPropagation?.();

        if (currentTurn !== guti.player && guti.player < 2) return;

        if (currentState === 0) {
                if (guti.player > 1) return;
                currentState = 1;
                selectedGuti = guti;
                guti.el.classList.add("selected");
        } else if (currentState === 1) {
                if (selectedGuti.player === guti.player) {
                        selectedGuti.el.classList.remove("selected");
                        selectedGuti = guti;
                        selectedGuti.el.classList.add("selected");
                        return;
                }
        }

        const capturedGuti = moveGuti(selectedGuti, guti);
        if (capturedGuti === 0) return;

        if (capturedGuti === 1) {
                currentState = 0;
                currentTurn = 1 - currentTurn;
                selectedGuti.el.classList.remove("selected");
                selectedGuti = null;
                totalMoves++;
                updateScoreboard(); // turn changed
        } else {
                score[currentTurn]++;
                currentState = 2;
                selectedGuti = guti;
                selectedGuti.el.classList.add("selected");
                totalMoves++;
                updateScoreboard(); // score changed

                if (!canCapture(selectedGuti)) {
                        currentState = 0;
                        currentTurn = 1 - currentTurn;
                        selectedGuti.el.classList.remove("selected");
                        selectedGuti = null;
                        updateScoreboard(); // turn changed
                }
        }
}

// Clear selection when clicking outside any guti (unless in capture chain)
board.addEventListener("click", () => {
        if (!selectedGuti || currentState === 2) return;
        selectedGuti.el.classList.remove("selected");
        selectedGuti = null;
        currentState = 0;
});

/* =========================
   10) Score UI
   ========================= */
function updateScoreboard() {
        if (p0ScoreEl) p0ScoreEl.textContent = `Score: ${score[0]}`;
        if (p1ScoreEl) p1ScoreEl.textContent = `Score: ${score[1]}`;

        if (score[0] >= 16 || score[1] >= 16) {
                alert(score[0] >= 16 ? "Red wins!" : "Blue wins!");
                resetGame();
                if (p0ScoreEl) p0ScoreEl.textContent = `Score: ${score[0]}`;
                if (p1ScoreEl) p1ScoreEl.textContent = `Score: ${score[1]}`;
        }
}

/* =========================
   11) Setup / initialization
   ========================= */
function initializeGuti() {
        // Player 0 side (rows 0-3)
        for (let i = 0; i < 4; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (i < 2 && (j === 0 || j === 4)) { gutis[i].push(null); continue; }
                        gutis[i].push(new Guti(i, j, 0));
                }
        }
        // Player 1 side (rows 5-8)
        for (let i = 5; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (i > 6 && (j === 0 || j === 4)) { gutis[i].push(null); continue; }
                        gutis[i].push(new Guti(i, j, 1));
                }
        }
        // Middle row (row 4) empty
        for (let j = 0; j < colSize; j++) {
                gutis[4].push(new Guti(4, j, 2));
        }
}

function resetGame() {
        currentTurn = Math.round(Math.random()) % 2;
        currentState = 0;
        totalMoves = 0;

        for (let i = 0; i < 4; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (i < 2 && (j === 0 || j === 4)) continue;
                        gutis[i][j].player = 0;
                        gutis[i][j].updateColor();
                }
        }
        for (let i = 5; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (i > 6 && (j === 0 || j === 4)) continue;
                        gutis[i][j].player = 1;
                        gutis[i][j].updateColor();
                }
        }
        for (let j = 0; j < colSize; j++) {
                gutis[4][j].player = 2;
                gutis[4][j].updateColor();
        }
}

// Build and render
buildEdges();
buildPaths();
drawGrid(spacing);
initializeGuti();
updateScoreboard();

// Optional diagnostics:
// showEdges();
// showPaths();