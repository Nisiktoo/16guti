const board = document.getElementById("board");
const rowSize = 9;
const colSize = 5;
const boardSize = Number(board.getAttribute("width")); // ensure number
const circleRadius = 5;
board.setAttribute("height", (boardSize * 3) / 2 + 4 * circleRadius);
board.setAttribute("width", boardSize + 4 * circleRadius);

// Use the <g id="layer"> created in index.html
const SVG_NS = "http://www.w3.org/2000/svg";
const PADDING = circleRadius + 1;
const layer = document.getElementById("layer");
layer.setAttribute("transform", `translate(${PADDING}, ${PADDING})`);

const spacing = boardSize / (colSize - 1);
const diagonalSpacing = Math.sqrt(2) * spacing
const points = [];
class Guti {
        constructor(player, position) {
                this.player = player;
                this.position = position;
        }
}
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
                y = 2*space;
                y += (space/2 * (col-2));
        } else if (row === 7) {
                x = 5 * space;
                x += space / 2;
                y = 2*space;
                y += (space/2 * (col-2));

        } else {
                if (row === 8) row--;
                x = (row - 1) * space;
                y = col * space;

        }
        return {x, y};
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
                startPoint = {x: i * space, y: 0};
                endPoint = {x: i * space, y: 4 * space};
                connections.push([startPoint, endPoint]);
                /* vertical lines */
                startPoint = {x: space, y: (i-1) * space};
                endPoint = {x: 5 * space, y: (i-1) * space};
                connections.push([startPoint, endPoint]);
        }
        /* make the diagonal lines */
        // forward
        startPoint = {x: 3 * space, y: 0};    
        endPoint = {x: 0, y: 3 * space};
        connections.push([startPoint, endPoint]);
        startPoint = {x: 5 * space, y: 0};    
        endPoint = {x: space, y: 4 * space};
        connections.push([startPoint, endPoint]);
        startPoint = {x: 6 * space, y: space};
        endPoint = {x: 3 * space, y: 4 * space};
        connections.push([startPoint, endPoint]);


        // backward
        startPoint = {x: 3 * space, y: 0};
        endPoint = {x: 6*space, y: 3 * space};
        connections.push([startPoint, endPoint]);
        startPoint = {x: 1 * space, y: 0};
        endPoint = {x: 5 * space, y: 4 * space};
        connections.push([startPoint, endPoint]);
        startPoint = {x: 0, y: space};
        endPoint = {x: 3 * space, y: 4 * space};
        connections.push([startPoint, endPoint]);

        /* make the tiny lines */
        startPoint = {x: 0, y : space}
        endPoint = {x: 0, y: 3 * space};
        connections.push([startPoint, endPoint]);

        startPoint = {x: space/2, y : space + space / 2}
        endPoint = {x: space/2, y : 2 * space + space / 2}
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
let gutis = [[], []]; // player 0 and player 1 gutis
function initializeGuti() {
        for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 5; j++) {
                        if (i < 2 && (j == 0 || j == 4)) continue;
                        gutis[0].push(new Guti(0, {x: i, y: j}));
                }
        }
        for (let i = 5; i < rowSize; i++) {
                for (let j = 0; j < 5; j++) {
                        if (i > 6 && (j == 0 || j == 4)) continue;
                        gutis[1].push(new Guti(1, {x: i, y: j}));
                }
        }
}
initializeGuti();
function placeTheGutis() {
  for (let p = 0; p < 2; p++) {
    for (const guti of gutis[p]) {
      const circle = document.createElementNS(SVG_NS, "circle");
      const playerColor = p === 0 ? "blue" : "red";
      const { x, y } = getPixelPostion(spacing, guti.position.x, guti.position.y);
      circle.setAttribute("cx", y);
      circle.setAttribute("cy", x);
      circle.setAttribute("r", circleRadius);
      circle.setAttribute("fill", playerColor);
      layer.appendChild(circle); // was: board.appendChild(circle)
    }
  }
}

placeTheGutis();
