const board = document.getElementById("board");
const rowSize = 9;
const colSize = 5;

// NEW: pick the smaller between attribute width and viewport width
const attrWidth = Number(board.getAttribute("width")) || 500;
// Use attrWidth as internal units; CSS will scale the SVG
let boardSize = attrWidth;

const circleRadius = 8;
const color = ["red", "blue", "transparent"];

// Make SVG responsive
const vbWidth = boardSize + 4 * circleRadius;
const vbHeight = (boardSize * 3) / 2 + 4 * circleRadius;
board.setAttribute("viewBox", `0 0 ${vbWidth} ${vbHeight}`);
board.setAttribute("preserveAspectRatio", "xMidYMid meet");
board.removeAttribute("width");
board.removeAttribute("height");

// Use the <g id="layer"> created in index.html
const SVG_NS = "http://www.w3.org/2000/svg";
const PADDING = circleRadius + 1;
const layer = document.getElementById("layer");
layer.setAttribute("transform", `translate(${PADDING}, ${PADDING})`);
const spacing = boardSize / (colSize - 1);
const diagonalSpacing = Math.sqrt(2) * spacing

/* make a graph of the edges */
const EDGES = [ [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []]
               ];

/* stores the path of length 2 */
const PATHS = [ [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []],
                [[], [], [], [], []]
               ];

function buildEdges() {
        const directions = [
                {dr: 1, dc: 0}, {dr: -1, dc: 0},
                {dr: 0, dc: 1}, {dr: 0, dc: -1}
        ];
        const diagonalDirections = [
                {dr: 1, dc: 1}, {dr: 1, dc: -1},
                {dr: -1, dc: 1}, {dr: -1, dc: -1}
        ];
        for (let i = 0; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (badPoint(i, j)) continue;
                        for (const {dr, dc} of directions) {
                                const ni = i + dr;
                                const nj = j + dc;
                                console.log(ni, nj);
                                if (!badPoint(ni, nj)) {
                                        EDGES[i][j].push([ni, nj]);
                                        console.log("stored");
                                }
                        }
                        if ((i + j) % 2 === 0) {
                                for (const {dr, dc} of diagonalDirections) {
                                        const ni = i + dr;
                                        const nj = j + dc;
                                        if (!badPoint(ni, nj)) {
                                                EDGES[i][j].push([ni, nj]);
                                        }
                                }
                        }
                }
        }
        /* delete some edges */
        // Helper to find index of an edge by value
        function findEdgeIndex(arr, edge) {
                return arr.findIndex(e => e[0] === edge[0] && e[1] === edge[1]);
        }
        let idx;
        idx = findEdgeIndex(EDGES[1][1], [2, 0]);
        if (idx !== -1) EDGES[1][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[1][1], [2, 1]);
        if (idx !== -1) EDGES[1][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[1][1], [0, 2]);
        if (idx !== -1) EDGES[1][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[0][2], [1, 1]);
        if (idx !== -1) EDGES[0][2].splice(idx, 1);
        idx = findEdgeIndex(EDGES[0][2], [1, 3]);
        if (idx !== -1) EDGES[0][2].splice(idx, 1);

        idx = findEdgeIndex(EDGES[1][3], [0, 2]);
        if (idx !== -1) EDGES[1][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[1][3], [2, 3]);
        if (idx !== -1) EDGES[1][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[1][3], [2, 4]);
        if (idx !== -1) EDGES[1][3].splice(idx, 1);


        idx = findEdgeIndex(EDGES[2][0], [1, 1]);
        if (idx !== -1) EDGES[2][0].splice(idx, 1);

        idx = findEdgeIndex(EDGES[2][1], [1, 1]);
        if (idx !== -1) EDGES[2][1].splice(idx, 1);

        idx = findEdgeIndex(EDGES[2][3], [1, 3]);
        if (idx !== -1) EDGES[2][3].splice(idx, 1);

        idx = findEdgeIndex(EDGES[2][4], [1, 3]);
        if (idx !== -1) EDGES[2][4].splice(idx, 1);

        idx = findEdgeIndex(EDGES[6][0], [7, 1]);
        if (idx !== -1) EDGES[6][0].splice(idx, 1);

        idx = findEdgeIndex(EDGES[6][1], [7, 1]);
        if (idx !== -1) EDGES[6][1].splice(idx, 1);

        idx = findEdgeIndex(EDGES[6][3], [7, 3]);
        if (idx !== -1) EDGES[6][3].splice(idx, 1);

        idx = findEdgeIndex(EDGES[6][4], [7, 3]);
        if (idx !== -1) EDGES[6][4].splice(idx, 1);
        
        idx = findEdgeIndex(EDGES[7][1], [6, 0]);
        if (idx !== -1) EDGES[7][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[7][1], [6, 1]);
        if (idx !== -1) EDGES[7][1].splice(idx, 1);
        idx = findEdgeIndex(EDGES[7][1], [8, 2]);
        if (idx !== -1) EDGES[7][1].splice(idx, 1);

        idx = findEdgeIndex(EDGES[7][3], [6, 3]);
        if (idx !== -1) EDGES[7][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[7][3], [6, 4]);
        if (idx !== -1) EDGES[7][3].splice(idx, 1);
        idx = findEdgeIndex(EDGES[7][3], [8, 2]);
        if (idx !== -1) EDGES[7][3].splice(idx, 1);

        idx = findEdgeIndex(EDGES[8][2], [7, 1]);
        if (idx !== -1) EDGES[8][2].splice(idx, 1);
        idx = findEdgeIndex(EDGES[8][2], [7, 3]);
        if (idx !== -1) EDGES[8][2].splice(idx, 1);
}

function buildPaths() {
        for (let i = 0; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (badPoint(i, j)) continue;
                        for (const [ni, nj] of EDGES[i][j]) {
                                let nni = ni + (ni - i);
                                let nnj = nj + (nj - j);
                                if ( EDGES[ni][nj].some(arr => arr[0] === nni && arr[1] === nnj)) {
                                        PATHS[i][j].push([[ni, nj], [nni, nnj]]);
                                }
                        }
                }
        }
        /* special paths */
        PATHS[0][1].push([[1, 1], [2, 2]]);
        PATHS[0][3].push([[1, 3], [2, 2]]);
        PATHS[2][2].push([[1, 1], [0, 1]]);
        PATHS[2][2].push([[1, 3], [0, 3]]);

        PATHS[8][1].push([[7, 1], [6, 2]]);
        PATHS[6][2].push([[7, 1], [8, 1]]);
        PATHS[8][3].push([[7, 3], [6, 2]]);
        PATHS[6][2].push([[7, 3], [8, 3]]);
}

async function showPaths() {
        for (let i = 0; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (badPoint(i, j)) continue;
                        for (const [[, ], [nni, nnj]] of PATHS[i][j]) {
                                let {x: x1, y: y1} = getPixelPostion(spacing, i, j);
                                let {x: x2, y: y2} = getPixelPostion(spacing, nni, nnj);
                                const line = document.createElementNS(SVG_NS, "line");
                                console.log(x1, y1, x2, y2);
                                line.setAttribute("x1", y1);
                                line.setAttribute("y1", x1);
                                line.setAttribute("x2", y2);
                                line.setAttribute("y2", x2);
                                line.setAttribute("stroke", "#ffeb3b");
                                line.setAttribute("stroke-width", 5);
                                line.setAttribute("stroke-linecap", "round");
                                layer.appendChild(line);
                                // Pause execution for 2 seconds before removing the line
                                setTimeout(() => {
                                                line.remove();
                                }, 2000);

                                // Block further code execution for 2 seconds
                                await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                }
        }
}
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
                                setTimeout(() => {
                                        line.remove();
                                }, 1000);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                }
        }
}

let score = [0, 0];
let currentTurn = 0;
let currentState = 0;
let selectedGuti = null;

// Scoreboard refs
const p1ScoreEl = document.getElementById("player1-score");
const p2ScoreEl = document.getElementById("player2-score");
const turnEl = document.getElementById("turn-indicator");
const p1Card = document.querySelector('.player-card[data-player="0"]');
const p2Card = document.querySelector('.player-card[data-player="1"]');
const resetBtn = document.getElementById("reset-score");

// Guti class — now each intersection is a Guti
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
                this.el.setAttribute("stroke", "transparent");
                this.el.setAttribute("stroke-width", "24px");
                this.el.addEventListener("click", handleGutiClick.bind(this)); // <-- pass bound function
                layer.appendChild(this.el);
        }

        updateColor() {
                if (this.player === 0) this.el.setAttribute("fill", color[0]);
                else if (this.player === 1) this.el.setAttribute("fill", color[1]);
                else this.el.setAttribute("fill", color[2]);
        }
}
function handleGutiClick(e) {
        const guti = this; // 'this' is the Guti instance due to .bind(this)
        e?.stopPropagation?.();

        if (currentTurn !== guti.player && guti.player < 2) {
                return;
        }

        if (currentState === 0) {
                if (guti.player > 1) return;
                currentState = 1;
                selectedGuti = guti;
                guti.el.classList.add("selected");
        } else if (currentState === 1) {
                if (selectedGuti.player == guti.player) {
                        selectedGuti.el.classList.remove("selected");
                        selectedGuti = guti;
                        selectedGuti.el.classList.add("selected");
                        return;
                }
        }

        let capturedGuti = moveGuti(selectedGuti, guti);
        if (capturedGuti === 0) return;

        if (capturedGuti === 1) {
                currentState = 0;
                currentTurn = 1 - currentTurn;
                selectedGuti.el.classList.remove("selected");
                selectedGuti = null;
                updateScoreboard(); // turn changed
        } else {
                score[currentTurn]++;
                currentState = 2;
                selectedGuti = guti;
                selectedGuti.el.classList.add("selected");
                updateScoreboard(); // score changed

                if (canCapture(selectedGuti)) {
                        /* continue capturing */
                } else {
                        currentState = 0;
                        currentTurn = 1 - currentTurn;
                        selectedGuti.el.classList.remove("selected");
                        selectedGuti = null;
                        updateScoreboard(); // turn changed
                }
        }
}
function swapGuti(currentGuti, targetGuti) {
        currentGuti.el.classList.remove("selected");
        targetGuti.player = currentGuti.player;
        currentGuti.player = 2;
        currentGuti.updateColor();
        targetGuti.updateColor();

}
let specialGutis = [{ row: 0, col: 1}, 
                    { row: 0, col: 3},
                    { row: 2, col: 2},
                    { row: 6, col: 2},
                    { row: 8, col: 1},
                    { row: 8, col: 3}
                ];
function connectedByEdge(x1, y1, x2, y2) {
        let dr = Math.abs(x1 - x2);
        let dc = Math.abs(y1 - y2);
        if (dr > 1 || dc > 1) return false;
        if (badPoint(x1, y1) || badPoint(x2, y2)) return false;
        const canMoveDiagonally = (x1 + y1) % 2 === 0;

}
function canCapture(currentGuti) {
        const { row, col } = currentGuti;
        for (const [midG, endG] of PATHS[row][col]) {
                let middleGuti = gutis[midG[0]][midG[1]];
                let endGuti = gutis[endG[0]][endG[1]];
                if (middleGuti.player === (1 - currentGuti.player) &&
                        endGuti.player === 2) {
                        return true;
                }
        }
        return 0;
}
function moveGuti(currentGuti, targetGuti) {
        if (targetGuti.player !== 2) return 0;
        let [ni, nj] = [targetGuti.row, targetGuti.col];
        let [i, j] = [currentGuti.row, currentGuti.col];
        let isEdge = EDGES[i][j].some(arr => arr[0] === ni && arr[1] === nj);
        if (isEdge) {
                if (currentState === 2) {
                        return 0;
                }
                swapGuti(currentGuti, targetGuti);
                return 1;
        }
        let pathIndex = PATHS[i][j].findIndex(path => path[1][0] === ni && path[1][1] === nj);
        if (pathIndex == -1) return 0;

        /* it's a killing move */
        let [mi, mj] = PATHS[i][j][pathIndex][0];
        let middleGuti = gutis[mi][mj];
        if (middleGuti.player !== (1 - currentGuti.player)) {
                return 0;
        }
        middleGuti.player = 2;
        middleGuti.updateColor();
        swapGuti(currentGuti, targetGuti);
        return 2;
}

// Clear selection when clicking outside any guti
board.addEventListener("click", () => {
        if (!selectedGuti || currentState === 2) return;
        selectedGuti.el.classList.remove("selected");
        selectedGuti = null;
        currentState = 0;
});

function updateScoreboard() {
        // Update numbers
        if (score[0] >= 16) {
                alert("Red wins!");
                resetGame();
        } else if (score[1] >= 16) {
                alert("Blue wins!");
                resetGame();
        }
        p1ScoreEl.textContent = score[0];
        p2ScoreEl.textContent = score[1];

        // Turn indicator text + active highlight
        const isRedTurn = currentTurn === 0;
        turnEl.textContent = isRedTurn ? "Red’s turn" : "Blue’s turn";
        p1Card.classList.toggle("active", isRedTurn);
        p2Card.classList.toggle("active", !isRedTurn);
}

resetBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        score = [0, 0];
        updateScoreboard();
        resetGame();
});

function getSpacing(row) {
        if (row <= 1 || row >= 7) {
                return spacing / 2;
        }
        return spacing;
}

function badPoint(row, col) {
        // console.log(row, col);
        if ((row < 0) || (row >= rowSize) || (col < 0) || (col >= colSize)) {
                // console.log(row, col);
                return true;
        }
        if (row >= 2 && row <= 6) return false;
        if (col > 0 && col < colSize - 1) return false;
        return true;
}

/* find the relative position of the point (x, y) on the board */
function getPixelPostion(space, row, col) {
        let x = 0, y = 0;
        if (row == 0) {
                y = col * space;
        } else if (row === 1) {
                x = space / 2;
                y = 2 * space;
                y += (space / 2 * (col - 2));
        } else if (row === 7) {
                x = 5 * space;
                x += space / 2;
                y = 2 * space;
                y += (space / 2 * (col - 2));

        } else {
                if (row === 8) row--;
                x = (row - 1) * space;
                y = col * space;

        }
        return { x, y };
}

function drawGrid(space) {
        // Define connection indices for lines
        /* stores the line connections between points */
        /* [[x1, y1, x2, y2],  [pixelPoint, pixelPoint]] */
        const connections = [];
        // Horizontal and vertical connections
        /* draw the 5x5 square grid */
        let startPoint, endPoint;
        for (let i = 1; i <= 5; i++) {
                /* horizontal lines */
                startPoint = { x: i * space, y: 0 };
                endPoint = { x: i * space, y: 4 * space };
                connections.push([startPoint, endPoint]);
                /* vertical lines */
                startPoint = { x: space, y: (i - 1) * space };
                endPoint = { x: 5 * space, y: (i - 1) * space };
                connections.push([startPoint, endPoint]);
        }
        /* make the diagonal lines */
        // forward
        startPoint = { x: 3 * space, y: 0 };
        endPoint = { x: 0, y: 3 * space };
        connections.push([startPoint, endPoint]);
        startPoint = { x: 5 * space, y: 0 };
        endPoint = { x: space, y: 4 * space };
        connections.push([startPoint, endPoint]);
        startPoint = { x: 6 * space, y: space };
        endPoint = { x: 3 * space, y: 4 * space };
        connections.push([startPoint, endPoint]);


        // backward
        startPoint = { x: 3 * space, y: 0 };
        endPoint = { x: 6 * space, y: 3 * space };
        connections.push([startPoint, endPoint]);
        startPoint = { x: 1 * space, y: 0 };
        endPoint = { x: 5 * space, y: 4 * space };
        connections.push([startPoint, endPoint]);
        startPoint = { x: 0, y: space };
        endPoint = { x: 3 * space, y: 4 * space };
        connections.push([startPoint, endPoint]);

        /* make the tiny lines */
        startPoint = { x: 0, y: space }
        endPoint = { x: 0, y: 3 * space };
        connections.push([startPoint, endPoint]);

        startPoint = { x: space / 2, y: space + space / 2 }
        endPoint = { x: space / 2, y: 2 * space + space / 2 }
        connections.push([startPoint, endPoint]);

        startPoint = getPixelPostion(space, 0, 2);
        endPoint = getPixelPostion(space, 2, 2);
        connections.push([startPoint, endPoint]);

        startPoint = getPixelPostion(space, 7, 1);
        endPoint = getPixelPostion(space, 7, 3);
        connections.push([startPoint, endPoint]);

        startPoint = getPixelPostion(space, 8, 1);
        endPoint = getPixelPostion(space, 8, 3);
        connections.push([startPoint, endPoint]);

        startPoint = getPixelPostion(space, 6, 2);
        endPoint = getPixelPostion(space, 8, 2);
        connections.push([startPoint, endPoint]);

        // Draw lines
        for (const [i, j] of connections) {
                const line = document.createElementNS(SVG_NS, "line");
                line.setAttribute("x1", i.y);
                line.setAttribute("y1", i.x);
                line.setAttribute("x2", j.y);
                line.setAttribute("y2", j.x);
                line.setAttribute("stroke", "#3d91a0ff");
                line.setAttribute("stroke-width", 2);
                layer.appendChild(line); // was: board.appendChild(line)
        }


}
drawGrid(spacing);
let gutis = [[], [], [], [], [], [], [], [], []];

/* place the gutis on board */
function initializeGuti() {
        for (let i = 0; i < 4; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (i < 2 && (j == 0 || j == 4)) {
                                gutis[i].push(null);
                                continue;
                        }
                        gutis[i].push(new Guti(i, j, 0));
                }
        }
        for (let i = 5; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (i > 6 && (j == 0 || j == 4)) {
                                gutis[i].push(null);
                                continue;
                        }
                        gutis[i].push(new Guti(i, j, 1));
                }
        }
        for (let j = 0; j < colSize; j++) {
                gutis[4].push(new Guti(4, j, 2));
        }
}


function resetGame() {
        currentTurn = 0;
        currentState = 0;
        for (let i = 0; i < 4; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (i < 2 && (j == 0 || j == 4)) {
                                continue;
                        }
                        gutis[i][j].player = 0;
                        gutis[i][j].updateColor();

                }
        }
        for (let i = 5; i < rowSize; i++) {
                for (let j = 0; j < colSize; j++) {
                        if (i > 6 && (j == 0 || j == 4)) {
                                continue;
                        }
                        gutis[i][j].player = 1;
                        gutis[i][j].updateColor();
                }
        }
        for (let j = 0; j < colSize; j++) {
                gutis[4][j].player = 2;
                gutis[4][j].updateColor();
        }
}

initializeGuti();

// Initialize scoreboard UI at start
updateScoreboard();
buildEdges();
buildPaths();
// showPaths();
// showEdges();