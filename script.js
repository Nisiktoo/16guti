const svg = document.getElementById("board");
const rowSize = 9;
const colSize = 5;
const boardSize = 500; // This matches the viewBox
const spacing = boardSize / (colSize - 1);

const points = [];

function getSpacing(row) {
        if (row <= 1 || row >= 7) {
                return spacing / 2;
        }
        return spacing;
}

function bad_point(row, col) {
        // console.log(row, col);
        if ((row < 0) || (row >= rowSize) || (col < 0) || (col >= colSize)) {
                // console.log(row, col);
                return true;
        }
        if (row >=2 && row <= 6) return false;
        if (col > 0 && col < colSize - 1) return false;
        return true;
}

// find the relative position of the point (x, y) on the board
function getPixelPostion(row, col) {
        x = 0, y = 0;
        if (row === 1) {
                x = spacing;
                y = 2*spacing;
                x += (spacing/2 * (row-2));
                y += (spacing/2 * (col-2));
                return {x, y};

        } else if (row === 0) {
                x = 0;
                y = col * spacing;
                return {x, y};
        }
        if (row === 7) {
                x = 5 * spacing;
                y = 2*spacing;
                x += (spacing/2 * (row-6));
                y += (spacing/2 * (col-2));
                return {x, y};

        }
        if (row === 8) row--;
        x = (row - 1) * spacing;
        y = col * spacing;
        return {x, y};
}

// generate grid points
for (let row = 0; row < rowSize; row++) {
        for (let col = 0; col < colSize; col++) {
                if (bad_point(row, col)) continue;
                points.push(getPixelPostion(row, col));
        }
}
// console.log(points);
// Define connection indices for lines
const connections = [];
// Horizontal and vertical connections

for (let row = 0; row < 2; row++) {
        for (let col = 1; col < colSize - 1; col++) {
                if (bad_point(row, col)) continue;
                const index = getPixelPostion(row, col);
                if (!bad_point(row, col+1)) { // horizontal
                        connections.push([index, getPixelPostion(row, col+1)]);
                }
                if (row === 1 && (col !== 2)) continue;
                if (!bad_point(row+1, col)) { // vertical
                        connections.push([index, getPixelPostion(row+1, col)]);
                }
        }
}

connections.push([getPixelPostion(1, 1), getPixelPostion(2, 2)]);
connections.push([getPixelPostion(1, 3), getPixelPostion(2, 2)]);
for (let row = 2; row < rowSize; row++) {
        for (let col = 0; col < colSize; col++) {
                if (bad_point(row, col)) continue;
                const index = getPixelPostion(row, col);
                if (!bad_point(row, col+1)) { // horizontal
                        connections.push([index, getPixelPostion(row, col+1)]);
                }
                if (row === 6 && (col !== 2)) continue;
                if (!bad_point(row+1, col)) { // vertical
                        connections.push([index, getPixelPostion(row+1, col)]);
                }
                if (row > 6) continue;
                if ((row + col) % 2 === 0) {
                        if (!bad_point(row+1, col+1)) {
                                console.log(row, col);
                                connections.push([index, getPixelPostion(row+1, col+1)]);
                        }

                        // Diagonal (down-left)
                        if (!bad_point(row+1, col-1)) {
                                console.log(row, col);
                                connections.push([index, getPixelPostion(row+1, col-1)]);
                        }
                }
        }
}

// Draw lines
for (const [i, j] of connections) {

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", i.y);
        line.setAttribute("y1", i.x);
        line.setAttribute("x2", j.y);
        line.setAttribute("y2", j.x);
        line.setAttribute("stroke", "#000");
        line.setAttribute("stroke-width", 2);
        svg.appendChild(line);
}