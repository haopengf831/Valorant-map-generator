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
    console.log("Last Path Segment:");
    console.log("Start:", path[path.length - 2]); // second last point
    console.log("End:", path[path.length - 1]);   // last point

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
// calculate middle line max left and max right
function drawRectangularPath(centerLine) {
    centerLine.forEach(([centerX, centerY], index) => {
        const [startX, startY] = centerLine[index];
        const [endX, endY] = centerLine[index + 1] || [startX, startY]; // start point

        const isSecondToLastSegment = index === centerLine.length - 3; // second last segment
        const isLastSegment = index === centerLine.length - 2; 
        const isHorizontal = startY === endY; //horizontal or vertical

        if (isSecondToLastSegment) {
            
            const rectWidth = isHorizontal
                ? Math.abs(endX - startX) + 50 
                : 100; 

            const rectHeight = isHorizontal
                ? 100 
                : Math.abs(endY - startY) + 50; 

            const rectX = Math.min(startX, endX) - (isHorizontal ? 25 : 50); 
            const rectY = Math.min(startY, endY) - (isHorizontal ? 50 : 25); 

            console.log("Second-to-Last Segment Info:");
            console.log("Start Point:", startX, startY);
            console.log("End Point:", endX, endY);
            console.log("Rect X, Y:", rectX, rectY);
            console.log("Rect Width, Height:", rectWidth, rectHeight);

            ctx.fillStyle = "#808080";
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            return; 
        }

        // if (isLastSegment) {
        //     
        //     const rectWidth = isHorizontal
        //         ? Math.abs(endX - startX) + 10 
        //         : 100; 

        //     const rectHeight = isHorizontal
        //         ? 100 
        //         : Math.abs(endY - startY) + 10; 

        //     const rectX = Math.min(startX, endX); // 
        //     const rectY = Math.min(startY, endY); // 

        //     console.log("Corrected Last Segment Info:");
        //     console.log("Start Point:", startX, startY);
        //     console.log("End Point:", endX, endY);
        //     console.log("Rect X, Y:", rectX, rectY);
        //     console.log("Rect Width, Height:", rectWidth, rectHeight);

        //     ctx.fillStyle = "#808080";
        //     ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        //     return; 
        // }

        
        const width = Math.random() * 50 + 100; // random width
        const height = Math.random() * 50 + 100; // random height

        let offsetX = 0, offsetY = 0;

        if (isHorizontal) {
            
            offsetY = Math.random() * (height / 6) * (Math.random() < 0.5 ? -1 : 1); 
            offsetX = 0;
        } else {
            
            offsetX = Math.random() * (width / 6) * (Math.random() < 0.5 ? -1 : 1);
            offsetY = 0; 
        }

        const rectX = centerX + offsetX - width / 2; 
        const rectY = centerY + offsetY - height / 2; 

        ctx.fillStyle = "#808080";
        ctx.fillRect(rectX, rectY, width, height);
    });
}

function calculateMiddleLaneBounds(centerLine) {
    let minX = Infinity;
    let maxX = -Infinity;

    centerLine.forEach(([centerX]) => {
        minX = Math.min(minX, centerX);
        maxX = Math.max(maxX, centerX);
    });

    return {
        left: minX, 
        right: maxX, 
    };
}


function generateLeftCPath(start, end, middleLaneBounds, canvasHeight) {
    const path = [start];
    let [currentX, currentY] = start;

    // calculate left
    const matrixMaxWidth = 150; // matrix max width
    const maxOffset = matrixMaxWidth / 6; 
    const padding = 200; 
    const middleLeftEffective = middleLaneBounds.left + maxOffset + padding;
    console.log("Middle Left: ", middleLaneBounds.left);

    
    let firstTotalHorizontal = Math.max(Math.random() * 400 + 300, middleLeftEffective - currentX); // 确保总距离 > middleLeftEffective
    console.log("Middle Left Effective:", middleLeftEffective, "First Total Horizontal:", firstTotalHorizontal);

    
    const firstHorizontalSegment = Math.min(Math.random() * 200 + 100, firstTotalHorizontal / 2); // 第一段随机 100-300
    currentX -= firstHorizontalSegment;
    path.push([currentX, currentY]);

    
    currentY += Math.random() * 100 + 50;
    path.push([currentX, currentY]);

    
    const secondHorizontalSegment = firstTotalHorizontal - firstHorizontalSegment;
    currentX -= secondHorizontalSegment;
    path.push([currentX, currentY]);

    
    const verticalLength = 800;
    currentY += verticalLength;
    path.push([currentX, currentY]);

    
    const rightHorizontalFirst = Math.random() * 200 + 100; 
    currentX += rightHorizontalFirst;
    path.push([currentX, currentY]);

    currentY += 50; 
    path.push([currentX, currentY]);

    const rightHorizontalSecond = Math.max(end[0] - currentX, 0); 
    currentX += rightHorizontalSecond;
    path.push([currentX, currentY]);

    
    currentY = end[1];
    path.push([currentX, currentY]);

    return path;
}

function generateRightCPath(start, end, middleLaneBounds, canvasHeight) {
    const path = [start];
    let [currentX, currentY] = start;

    // calculate right 
    const matrixMaxWidth = 150; 
    const maxOffset = matrixMaxWidth / 6; 
    const padding = 200; 
    const middleRightEffective = middleLaneBounds.right - maxOffset - padding;
    console.log("Middle Right: ", middleLaneBounds.right);

    // first total move
    let firstTotalHorizontal = Math.max(Math.random() * 400 + 300, currentX - middleRightEffective); //  middleRightEffective
    console.log("Middle Right Effective:", middleRightEffective, "First Total Horizontal:", firstTotalHorizontal);

    
    const firstHorizontalSegment = Math.min(Math.random() * 200 + 100, firstTotalHorizontal / 2); 
    currentX += firstHorizontalSegment;
    path.push([currentX, currentY]);

    currentY += Math.random() * 100 + 50;
    path.push([currentX, currentY]);

    
    const secondHorizontalSegment = firstTotalHorizontal - firstHorizontalSegment;
    currentX += secondHorizontalSegment;
    path.push([currentX, currentY]);

    
    const verticalLength = 800;
    currentY += verticalLength;
    path.push([currentX, currentY]);

    
    const leftHorizontalFirst = Math.random() * 200 + 100;
    currentX -= leftHorizontalFirst; 
    path.push([currentX, currentY]);

    currentY += 50; 
    path.push([currentX, currentY]);

    const leftHorizontalSecond = Math.max(currentX - end[0], 0); 
    currentX -= leftHorizontalSecond;
    path.push([currentX, currentY]);

    
    currentY = end[1];
    path.push([currentX, currentY]);

    return path;
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

function drawEdgeRectangles(path) {
    path.forEach(([startX, startY], index) => {
        const [endX, endY] = path[index + 1] || [startX, startY];
        
        
        if (startX === endX && Math.abs(startY - endY) > 700) {
            
            const rectWidth = 50;
            const rectHeight = Math.abs(endY - startY);
            const rectX = startX - rectWidth / 2;
            const rectY = Math.min(startY, endY);
            ctx.fillStyle = "#808080"; // color
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

            // bomb area
            const centerX = startX;
            const centerY = (startY + endY) / 2 - 75; 
            ctx.fillStyle = "#808080"; // color
            ctx.fillRect(centerX - 75, centerY, 200, 200);
        } else if (startX !== endX || startY !== endY) {
            
            const rectWidth = startX === endX ? 50 : Math.abs(endX - startX);
            const rectHeight = startX === endX ? Math.abs(endY - startY) : 50;
            const rectX = Math.min(startX, endX) - (startX === endX ? 25 : 0);
            const rectY = Math.min(startY, endY) - (startX === endX ? 0 : 25);
            ctx.fillStyle = "#808080"; 
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        }
    });
}




const path = generatePath(start, end);
drawRectangularPath(path);
// drawCenterLine(path);
// drawSpawnPoints();
const middleLaneBounds = calculateMiddleLaneBounds(path);
const leftStart = [canvas.width / 2, (1 / 6) * canvas.height]; // uppper spawn point
const leftEnd = [canvas.width / 2, (5 / 6) * canvas.height]; // bottom spawn point

const leftPath = generateLeftCPath(leftStart, leftEnd, middleLaneBounds, canvas.height);

// draw left path
drawCenterLine(leftPath);

const rightStart = [canvas.width / 2, (1 / 6) * canvas.height]; // uppper spawn point
const rightEnd = [canvas.width / 2, (5 / 6) * canvas.height]; // bottom spawn point

const rightPath = generateRightCPath(rightStart, rightEnd, middleLaneBounds, canvas.height);

// draw right path
drawCenterLine(rightPath);

// draw left rect
drawEdgeRectangles(leftPath);

// draw right rect
drawEdgeRectangles(rightPath);


