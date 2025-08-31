const board = document.getElementById("board");
const rowSize = 9;
const colSize = 5;
const boardSize = Number(board.getAttribute("width")); // ensure number
const circleRadius = 5;
const color = ["red", "blue", "transparent"];
board.setAttribute("height", (boardSize * 3) / 2 + 4 * circleRadius);
board.setAttribute("width", boardSize + 4 * circleRadius);

// Use the <g id="layer"> created in index.html
const SVG_NS = "http://www.w3.org/2000/svg";
const PADDING = circleRadius + 1;
const layer = document.getElementById("layer");
layer.setAttribute("transform", `translate(${PADDING}, ${PADDING})`);



const spacing = boardSize / (colSize - 1);
const diagonalSpacing = Math.sqrt(2) * spacing


let currentTurn = 0;
let currentState = 0;
let selectedGuti = null;
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
                currentState = 1;
                selectedGuti = guti;
                guti.el.classList.add("selected");
        } else if (currentState === 1) {
                /* current player chooses his another guti for move*/
                if (selectedGuti.player == guti.player) {
                        // Move the selected Guti to the clicked position
                        selectedGuti.el.classList.remove("selected");
                        selectedGuti = guti;
                        selectedGuti.el.classList.add("selected");
                        return;
                }



        } else {
                // ...existing code...
        }
}

// Clear selection when clicking outside any guti
board.addEventListener("click", () => {
        if (!selectedGuti || currentState === 0) return;
        selectedGuti.el.classList.remove("selected");
        selectedGuti = null;
        currentState = 0;
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
let score = [0, 0];
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
                        gutis[1].push(new Guti(i, j, 1));
                }
        }
        for (let j = 0; j < colSize; j++) {
                gutis[4].push(new Guti(4, j, 2));
        }
}

initializeGuti();
