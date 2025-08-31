const board = document.getElementById("board");
const rowSize = 9;
const colSize = 5;
const boardSize = board.getAttribute("width");
board.setAttribute("height", (boardSize * 3) / 2);
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
                return {x, y};
        }
        if (row === 1) {
                x = space / 2;
                y = 2*space;
                y += (space/2 * (col-2));
                return {x, y};
        }
        if (row === 7) {
                x = 5 * space;
                x += space / 2;
                y = 2*space;
                y += (space/2 * (col-2));
                return {x, y};

        }
        if (row === 8) row--;
        x = (row - 1) * space;
        y = col * space;
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
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", i.y);
                line.setAttribute("y1", i.x);
                line.setAttribute("x2", j.y);
                line.setAttribute("y2", j.x);
                line.setAttribute("stroke", "#3d91a0ff");
                line.setAttribute("stroke-width", 2);
                board.appendChild(line);
        }


}
drawGrid(spacing);