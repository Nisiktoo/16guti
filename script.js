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


function canCapture(currentGuti) {
        const { row, col } = currentGuti;
        const canMoveDiagonally = (row + col) % 2 === 0;
        const directions = [
                { dr: 2, dc: 0 }, { dr: -2, dc: 0 },
                { dr: 0, dc: 2 }, { dr: 0, dc: -2 },
        ];
        const diagonalDirections = [
                { dr: 2, dc: 2 }, { dr: -2, dc: -2 },
                { dr: 2, dc: -2 }, { dr: -2, dc: 2 }
        ];

        for (const { dr, dc } of directions) {
                const targetRow = row + dr;
                const targetCol = col + dc;
                if (badPoint(targetRow, targetCol)) continue;

                const middleGuti = gutis[row + dr / 2][col + dc / 2];
                const targetGuti = gutis[targetRow][targetCol];
                if (typeof middleGuti === 'undefined' || middleGuti === null) continue;
                if (typeof targetGuti === 'undefined' || targetGuti === null) continue;
                if (middleGuti.player === (1 - currentGuti.player) &&
                        targetGuti.player === 2) {
                        return true;
                }
        }
        if (canMoveDiagonally) {
                for (const { dr, dc } of diagonalDirections) {
                        const targetRow = row + dr;
                        const targetCol = col + dc;
                        if (badPoint(targetRow, targetCol)) continue;
                        const middleGuti = gutis[row + dr / 2][col + dc / 2];
                        const targetGuti = gutis[targetRow][targetCol];
                        if (typeof middleGuti === 'undefined' || middleGuti === null) continue;
                        if (typeof targetGuti === 'undefined' || targetGuti === null) continue;
                        if (middleGuti.player === (1 - currentGuti.player) &&
                                targetGuti.player === 2) {
                                return true;
                        }
                }
        }
        return false;
}


function moveGuti(currentGuti, targetGuti) {
        let middleGuti = null;
        const canMoveDiagonally = (currentGuti.row + currentGuti.col) % 2 === 0;
        let dr = Math.abs(currentGuti.row - targetGuti.row);
        let dc = Math.abs(currentGuti.col - targetGuti.col);
        let distance = dr + dc;
        if (distance !== 1 && distance !== 2 && distance !== 4 || currentState === 0) return 0;
        if (distance == 1) {
                if (currentState == 2) return 0;
                swapGuti(currentGuti, targetGuti);
                return 1;
        }


        /* killing move */
        if (dr == 2 || dc == 2) {
                if (!canMoveDiagonally && (dr + dc) === 4) return 0;
                let x = currentGuti.row + (targetGuti.row - currentGuti.row) / 2;
                let y = currentGuti.col + (targetGuti.col - currentGuti.col) / 2;
                middleGuti = gutis[x][y];
                if (typeof middleGuti === 'undefined' || middleGuti === null) return 0;
                if (middleGuti.player !== (1 - currentGuti.player)) return 0;
                swapGuti(currentGuti, targetGuti);
                middleGuti.player = 2;
                middleGuti.updateColor();
                return 2;
        }

        /* non-killing move */
        if (currentState === 1) {
                if (distance == 2 && !canMoveDiagonally) return 0;
                swapGuti(currentGuti, targetGuti);
                return 1;
        }
        return 0;

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

