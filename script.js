const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// Determine square canvas size based on the window dimension
const squareSize = Math.min(window.innerWidth, window.innerHeight);


canvas.width = squareSize;
canvas.height = squareSize;


canvas.style.display = "block"; 
canvas.style.margin = "auto";  
canvas.style.position = "absolute";
canvas.style.top = "50%";
canvas.style.left = "50%";
canvas.style.transform = "translate(-50%, -50%)"; 

// Draw canvas
function initCanvas() {
    ctx.fillStyle = "#303030"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height); 
}
initCanvas();

const start = [canvas.width / 2, (5 / 6) * canvas.height]; 
const end = [canvas.width / 2, (1 / 6) * canvas.height];  

function generatePath(start, end) {
    const path = [start]; 
    let [currentX, currentY] = start;

    let lastDirection = "down"; // Track the last movement direction
    let horizontalMoveCount = 0; 
    let maxHorizontalMoves = Math.floor(Math.random() * 2) + 1; // Allow 1 ~ 2 consecutive horizontal moves

    while (currentY > end[1]) {
        let stepDirection;

        // Ensure horizontal offset doesn't exceed 400 (left side)
        if (currentX <= 400) {
            if (lastDirection === "left") {
                stepDirection = "down"; // Force vertical movement
            } else if (lastDirection === "down") {
                stepDirection = Math.random() < 0.3 ? "down" : "right"; // Prefer vertical (30%) or right (70%)
            }
        }
        // Ensure horizontal offset doesn't exceed 400 (right side)
        else if (currentX >= canvas.width - 400) {
            if (lastDirection === "right") {
                stepDirection = "down"; // Force vertical movement
            } else if (lastDirection === "down") {
                stepDirection = Math.random() < 0.3 ? "down" : "left"; // Prefer vertical (30%) or left (70%)
            }
        }
        // Regular path generation logic
        else {
            if (lastDirection === "left" || lastDirection === "right") {
                // Handle consecutive horizontal moves
                horizontalMoveCount++;
                if (horizontalMoveCount >= maxHorizontalMoves) {
                    stepDirection = "down"; // Force vertical movement after max horizontal moves
                    horizontalMoveCount = 0; // Reset the count
                    maxHorizontalMoves = Math.floor(Math.random() * 2) + 1; // Regenerate max moves
                } else {
                    stepDirection = lastDirection; // Continue in the same horizontal direction
                }
            } else {
                horizontalMoveCount = 0; // Reset horizontal move count

                
                const horizontalBias = Math.random() < 0.3 ? (Math.random() < 0.5 ? "left" : "right") : "down";
                stepDirection = horizontalBias;
            }
        }

        const stepSize = 100; // Define the step size for each movement

        
        if (stepDirection === "down") {
            currentY -= stepSize;
        } else if (stepDirection === "left") {
            currentX -= stepSize;
        } else if (stepDirection === "right") {
            currentX += stepSize;
        }

        // Ensure horizontal offset correction before adding the new point
        if (currentX < 400) {
            currentX = Math.max(400, currentX); 
        } else if (currentX > canvas.width - 400) {
            currentX = Math.min(canvas.width - 400, currentX); 
        }

        path.push([currentX, currentY]); 
        lastDirection = stepDirection; 
    }

    
    if (currentX !== end[0]) {
        path.push([end[0], currentY]);
        currentX = end[0];
    }

    
    if (currentY !== end[1]) {
        path.push([currentX, end[1]]);
    }

    return path; 
}





function drawCenterLine(path) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
        const [x, y] = path[i];
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

function drawRectangularPath(centerLine) {
    centerLine.forEach(([centerX, centerY], index) => {
        //
        const [startX, startY] = centerLine[index];
        const [endX, endY] = centerLine[index + 1] || [startX, startY]; 

        const isLastSegment = index === centerLine.length - 2; 
        const isHorizontal = startY === endY; 

        
        const width = Math.random() * 50 + 100; // 100 ~ 150
        const height = Math.random() * 50 + 100; // 100 ~ 150

        
        const offsetX = Math.random() * (width / 6) * (Math.random() < 0.5 ? -1 : 1); 
        const offsetY = Math.random() * (height / 6) * (Math.random() < 0.5 ? -1 : 1); 

        if (isLastSegment) {
            
            const rectWidth = Math.abs(endX - startX) + 200; 
            const rectHeight = Math.abs(endY - startY) + 200; 

            const rectX = Math.min(startX, endX) - 100; 
            const rectY = Math.min(startY, endY) - 100; 

            ctx.fillStyle = "#808080";
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

            
            return;
        }

        if (isHorizontal) {
            
            const rectX = centerX + offsetX - width / 2; 
            const rectY = centerY + offsetY - height / 2; 

            ctx.fillStyle = "#808080";
            ctx.fillRect(rectX, rectY, width, height);
        } else {
            
            const rectX = centerX + offsetX - width / 2; 
            const rectY = centerY + offsetY - height / 2; 

            ctx.fillStyle = "#808080";
            ctx.fillRect(rectX, rectY, width, height);
        }
    });
}








function drawSpawnPoints() {
    const spawnSize = 30;

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, (5 / 6) * canvas.height, spawnSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, (1 / 6) * canvas.height, spawnSize, 0, Math.PI * 2);
    ctx.fill();
}

const path = generatePath(start, end);
drawRectangularPath(path);
drawCenterLine(path);
drawSpawnPoints();
