const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth; 
canvas.height = window.innerHeight; 

//draw canvas
function initCanvas() {
    ctx.fillStyle = "#ffffff"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
initCanvas();


const start = [canvas.width / 2, (5 / 6) * canvas.height]; 
const end = [canvas.width / 2, (1 / 6) * canvas.height];  

function generatePath(start, end) {
    const path = [start];
    let [currentX, currentY] = start;

    let lastDirection = "down"; //mark last step direction
    let horizontalMoveCount = 0;
    let maxHorizontalMoves = Math.floor(Math.random() * 3) + 1;

    while (currentY > end[1]) {
        let stepDirection;

        if (lastDirection === "left" || lastDirection === "right") {
            horizontalMoveCount++;
            if (horizontalMoveCount >= maxHorizontalMoves) { //if horizontal move count>= 3, next step will be vertical
                stepDirection = "down";
                horizontalMoveCount = 0; //reset count
                maxHorizontalMoves = Math.floor(Math.random() * 3) + 1; //horizaontal moves rage 1~3
            } else {
                stepDirection = lastDirection;
            }
        } else {
            horizontalMoveCount = 0;
            //when close to the top, Prioritize moving to the spawn point
            if (Math.abs(currentX - end[0]) > 50 && currentY < end[1] + 150) {
                stepDirection = currentX > end[0] ? "left" : "right";
            } else {
                const horizontalBias = Math.random() < 0.3 ? (Math.random() < 0.5 ? "left" : "right") : "down";
                stepDirection = horizontalBias;
            }
        }

        const stepSize = 50;

        if (stepDirection === "down") {
            currentY -= stepSize;
        } else if (stepDirection === "left") {
            currentX -= stepSize;
        } else if (stepDirection === "right") {
            currentX += stepSize;
        }

        currentX = Math.max(50, Math.min(canvas.width - 50, currentX));
        path.push([currentX, currentY]);
        lastDirection = stepDirection;
    }

    //generate last path to the top spawn point
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
    const lastSegmentIndex = centerLine.length - 2; 
    const [lastX, lastY] = centerLine[lastSegmentIndex];
    const [endX, endY] = centerLine[lastSegmentIndex + 1]; 

    centerLine.forEach(([centerX, centerY], index) => {
        
        if (Math.abs(centerX - canvas.width / 2) < 50 && (centerY < (1 / 6) * canvas.height + 50 || centerY > (5 / 6) * canvas.height - 50)) {
            return; 
        }

        
        if (index === lastSegmentIndex) {
            const width = Math.abs(endX - lastX) + 100; 
            const height = Math.max(100, Math.abs(endY - lastY) + 50); 
            const rectX = Math.min(lastX, endX) - 50; 
            const rectY = Math.min(lastY, endY) - height / 2; 

            ctx.fillStyle = "#808080";
            ctx.fillRect(rectX, rectY, width, height);
            return; 
        }

       
        const width = Math.random() * 50 + 50; // width 50 ~ 100
        const height = Math.random() * 50 + 50; // height 50 ~ 100

        const rectX = centerX - width / 2;
        const rectY = centerY - height / 2;

        ctx.fillStyle = "#808080";
        ctx.fillRect(rectX, rectY, width, height);
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
