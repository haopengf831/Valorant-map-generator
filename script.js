const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

const squareSize = Math.min(window.innerWidth, window.innerHeight);
canvas.width = squareSize;
canvas.height = squareSize;

canvas.style.display = "block";
canvas.style.margin = "auto";
canvas.style.position = "absolute";
canvas.style.top = "50%";
canvas.style.left = "50%";
canvas.style.transform = "translate(-50%, -50%)";

function initCanvas() {
    ctx.fillStyle = "#303030";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
initCanvas();

// based on 2 points to determine main direction
function determineMainDirection(start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    if (Math.abs(dy) > Math.abs(dx)) {
        
        return dy < 0 ? "up" : "down";
    } else {
        
        return dx > 0 ? "right" : "left";
    }
}


function generatePath(start, end, options = {}) {
    const {
        stepSize = canvas.width * 0.07,
        maxHorizontalMoves = 2,
        horizontalBoundaryMin = 0,
        horizontalBoundaryMax = canvas.width,
        verticalBias = 0.5,
        horizontalBias = 0.5,
        allowRandomSideSteps = true
    } = options;

    const path = [start.slice()];
    let [currentX, currentY] = start;

    let lastDirection = null;
    let horizontalMoveCount = 0;

    const mainDir = determineMainDirection(start, end);

    function isCloseToEnd() {
        const distance = Math.sqrt((end[0] - currentX)**2 + (end[1] - currentY)**2);
        return distance < stepSize;
    }

    function isDirectionAllowed(direction) {
        if (mainDir === "up" && direction === "down") return false;
        if (mainDir === "down" && direction === "up") return false;
        if (mainDir === "right" && direction === "left") return false;
        if (mainDir === "left" && direction === "right") return false;

        if (lastDirection) {
            if (lastDirection === "up" && direction === "down") return false;
            if (lastDirection === "down" && direction === "up") return false;
            if (lastDirection === "left" && direction === "right") return false;
            if (lastDirection === "right" && direction === "left") return false;
        }

        return true;
    }

    function decideNextStep() {
        const dxNow = end[0] - currentX;
        const dyNow = end[1] - currentY;

        let possibleDirections = [];
        if (dyNow < 0 && isDirectionAllowed("up")) possibleDirections.push("up");
        if (dyNow > 0 && isDirectionAllowed("down")) possibleDirections.push("down");
        if (dxNow > 0 && isDirectionAllowed("right")) possibleDirections.push("right");
        if (dxNow < 0 && isDirectionAllowed("left")) possibleDirections.push("left");

        // increase horizontal moves posibility
        if (isDirectionAllowed("left") && Math.random() < 0.2) possibleDirections.push("left");
        if (isDirectionAllowed("right") && Math.random() < 0.2) possibleDirections.push("right");

        // random side steps
        if (allowRandomSideSteps && possibleDirections.length < 2) {
            const perpendicularDirs = (mainDir === "up" || mainDir === "down") ? ["left","right"] : ["up","down"];
            const allowedPerpendicular = perpendicularDirs.filter(isDirectionAllowed);
            if (allowedPerpendicular.length > 0 && Math.random() < 0.5) {
                possibleDirections.push(allowedPerpendicular[Math.floor(Math.random()*allowedPerpendicular.length)]);
            }
        }

        let verticalChance = verticalBias;
        let horizontalChance = horizontalBias;
        if (mainDir === "up" || mainDir === "down") {
            if (Math.abs(dyNow) > Math.abs(dxNow)) {
                verticalChance += 0.3;
            }
        } else {
            if (Math.abs(dxNow) > Math.abs(dyNow)) {
                horizontalChance += 0.3;
            }
        }

        const sum = verticalChance + horizontalChance;
        verticalChance /= sum;
        horizontalChance /= sum;

        let directionCandidates;
        const r = Math.random();
        if (r < verticalChance) {
            let verticalDirs = possibleDirections.filter(d => d === "up" || d === "down");
            if (verticalDirs.length === 0) verticalDirs = possibleDirections;
            directionCandidates = verticalDirs;
        } else {
            let horizontalDirs = possibleDirections.filter(d => d === "left" || d === "right");
            if (horizontalDirs.length === 0) horizontalDirs = possibleDirections;
            directionCandidates = horizontalDirs;
        }

        if (directionCandidates.length === 0) {
            directionCandidates = possibleDirections;
        }

        let chosenDirection = directionCandidates[Math.floor(Math.random()*directionCandidates.length)];

        //max horizontal moves
        if (chosenDirection === "left" || chosenDirection === "right") {
            if (lastDirection === "left" || lastDirection === "right") {
                horizontalMoveCount++;
                if (horizontalMoveCount > maxHorizontalMoves) {
                    let verticalOnly = directionCandidates.filter(d => d === "up" || d === "down");
                    if (verticalOnly.length > 0) {
                        chosenDirection = verticalOnly[Math.floor(Math.random()*verticalOnly.length)];
                        horizontalMoveCount = 0;
                    }
                }
            } else {
                horizontalMoveCount = 1;
            }
        } else {
            horizontalMoveCount = 0;
        }

        return chosenDirection;
    }

    let stepCount = 0;
    while (!isCloseToEnd()) {
        stepCount++;
        if (stepCount > 1000) break;
        const direction = decideNextStep();
        if (!direction) break;

        if (direction === "up") currentY -= stepSize;
        else if (direction === "down") currentY += stepSize;
        else if (direction === "left") currentX -= stepSize;
        else if (direction === "right") currentX += stepSize;

        if (currentX < horizontalBoundaryMin) currentX = horizontalBoundaryMin;
        if (currentX > horizontalBoundaryMax) currentX = horizontalBoundaryMax;

        path.push([currentX, currentY]);
        lastDirection = direction;
    }

    path.push([end[0], end[1]]);
    return path;
}

function drawPath(path) {
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


const centerX = canvas.width / 2;
const regionWidth = canvas.width / 10;
const startX = centerX - regionWidth/2 + Math.random()*regionWidth;
const endX = centerX - regionWidth/2 + Math.random()*regionWidth;

const start = [startX, (5 / 6) * canvas.height]; 
const end = [endX, (1 / 6) * canvas.height];     

// midline boundary
const minX = Math.min(start[0], end[0]);
const maxX = Math.max(start[0], end[0]);
const midX = (minX + maxX) / 2;
const xDistance = Math.abs(end[0] - start[0]);
const baseMargin = canvas.width * 0.208; 
const dynamicMargin = xDistance * 0.5;
const horizontalBoundaryMin = midX - (baseMargin + dynamicMargin);
const horizontalBoundaryMax = midX + (baseMargin + dynamicMargin);

// mid path
const middlePath = generatePath(start, end, {
    stepSize: canvas.width * 0.07,
    maxHorizontalMoves: 2,
    horizontalBoundaryMin,
    horizontalBoundaryMax,
    verticalBias: 0.3,
    horizontalBias: 0.7,
    allowRandomSideSteps: true
});
drawPath(middlePath);


const leftUpperPoint = [canvas.width * (1/6), canvas.height * 0.25];
const leftLowerPoint = [canvas.width * (1/6), canvas.height * 0.75];

// Left C path: upper spawn point -> upper left point -> lower left point -> lower spawn point
// 1. Upper spawn point -> upper left point
const leftUpperPath = generatePath(end, leftUpperPoint, {
    stepSize: canvas.width * 0.03,
    maxHorizontalMoves: 2,
    horizontalBoundaryMin: Math.min(end[0], leftUpperPoint[0]) - canvas.width * 0.14,
    horizontalBoundaryMax: Math.max(end[0], leftUpperPoint[0]) + canvas.width * 0.14,
    verticalBias: 0.3,
    horizontalBias: 0.7,
    allowRandomSideSteps: true
});
drawPath(leftUpperPath);

// 2. Upper left point -> Lower left point
const leftMidPath = generatePath(leftUpperPoint, leftLowerPoint, {
    stepSize: canvas.width * 0.03,
    maxHorizontalMoves: 2,
    horizontalBoundaryMin: Math.min(leftUpperPoint[0], leftLowerPoint[0]) - canvas.width * 0.14,
    horizontalBoundaryMax: Math.max(leftUpperPoint[0], leftLowerPoint[0]) + canvas.width * 0.14,
    verticalBias: 0.7,
    horizontalBias: 0.3,
    allowRandomSideSteps: true
});
drawPath(leftMidPath);

// 3. Lower left point -> lower spawn point
const leftDownPath = generatePath(leftLowerPoint, start, {
    stepSize: canvas.width * 0.03,
    maxHorizontalMoves: 2,
    horizontalBoundaryMin: Math.min(leftLowerPoint[0], start[0]) - canvas.width * 0.14,
    horizontalBoundaryMax: Math.max(leftLowerPoint[0], start[0]) + canvas.width * 0.14,
    verticalBias: 0.3,
    horizontalBias: 0.7,
    allowRandomSideSteps: true
});
drawPath(leftDownPath);


const rightLowerPoint = [canvas.width * (5/6), canvas.height * 0.75];
const rightUpperPoint = [canvas.width * (5/6), canvas.height * 0.25];

// Right C
// 1. bot spawn > right bot
const rightDownPath = generatePath(start, rightLowerPoint, {
    stepSize: canvas.width * 0.03,
    maxHorizontalMoves: 2,
    horizontalBoundaryMin: Math.min(start[0], rightLowerPoint[0]) - canvas.width * 0.14,
    horizontalBoundaryMax: Math.max(start[0], rightLowerPoint[0]) + canvas.width * 0.14,
    verticalBias: 0.3,
    horizontalBias: 0.7,
    allowRandomSideSteps: true
});
drawPath(rightDownPath);

// 2. right bot > right top
const rightMidPath = generatePath(rightLowerPoint, rightUpperPoint, {
    stepSize: canvas.width * 0.03,
    maxHorizontalMoves: 2,
    horizontalBoundaryMin: Math.min(rightLowerPoint[0], rightUpperPoint[0]) - canvas.width * 0.14,
    horizontalBoundaryMax: Math.max(rightLowerPoint[0], rightUpperPoint[0]) + canvas.width * 0.14,
    verticalBias: 0.7,
    horizontalBias: 0.3,
    allowRandomSideSteps: true
});
drawPath(rightMidPath);

// 3. right top point -> upper spwan
const rightUpPath = generatePath(rightUpperPoint, end, {
    stepSize: canvas.width * 0.03,
    maxHorizontalMoves: 2,
    horizontalBoundaryMin: Math.min(rightUpperPoint[0], end[0]) - canvas.width * 0.14,
    horizontalBoundaryMax: Math.max(rightUpperPoint[0], end[0]) + canvas.width * 0.14,
    verticalBias: 0.3,
    horizontalBias: 0.7,
    allowRandomSideSteps: true
});
drawPath(rightUpPath);



function generateRectanglesFromPath(path, stepSize) {
    const rects = [];
    for (let i = 0; i < path.length - 1; i++) {
        const [x1, y1] = path[i];
        const [x2, y2] = path[i+1];

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx*dx + dy*dy);
        if (length === 0) continue;

        // current segment direction
        const isVertical = Math.abs(dy) > Math.abs(dx);
        const dir = isVertical ? (dy < 0 ? "up":"down") : (dx > 0 ? "right":"left");

        // rect random height and width
        const minSize = stepSize;
        const maxSize = stepSize * 1.5;
        const width = minSize + Math.random()*(maxSize - minSize);
        const height = minSize + Math.random()*(maxSize - minSize);

        
        const cx = (x1+x2)/2;
        const cy = (y1+y2)/2;

        let rectX = cx - width/2;
        let rectY = cy - height/2;

        
        if (isVertical) {
            // horizontal shift
            const horizontalOffset = (width/6)*(Math.random()<0.5? -1 : 1)*Math.random();
            rectX += horizontalOffset;
            
        } else {
            // vertical shift
            const verticalOffset = (height/6)*(Math.random()<0.5? -1 : 1)*Math.random();
            rectY += verticalOffset;
            
        }

        rects.push({x: rectX, y: rectY, width, height});
    }
    return rects;
}


function adjustRectangles(rects) {
    
    rects.sort((a,b)=> a.x - b.x);

    for (let i=0; i<rects.length-1; i++) {
        const r1 = rects[i];
        const r2 = rects[i+1];

       
        const r1Right = r1.x + r1.width;
        const r2Left = r2.x;

        if (Math.abs(r2Left - r1Right) < 20) {
            
            const mid = (r2Left + r1Right)/2;
            
            const deltaR1 = mid - r1Right;
            r1.width += deltaR1;
            const deltaR2 = r2Left - mid;
            r2.x = r2.x - deltaR2;
        }

        
    }
}

//draw rect
function drawRectangles(rects) {
    ctx.fillStyle = "#505050";
    for (const r of rects) {
        ctx.fillRect(r.x, r.y, r.width, r.height);
    }
}


const middleRects = generateRectanglesFromPath(middlePath, canvas.width*0.07);
// adjust midpath
adjustRectangles(middleRects);
// midpath rect
drawRectangles(middleRects);

// left c and right C
const leftUpperRects = generateRectanglesFromPath(leftUpperPath, canvas.width*0.03);
adjustRectangles(leftUpperRects);
drawRectangles(leftUpperRects);

const leftMidRects = generateRectanglesFromPath(leftMidPath, canvas.width*0.03);
adjustRectangles(leftMidRects);
drawRectangles(leftMidRects);

const leftDownRects = generateRectanglesFromPath(leftDownPath, canvas.width*0.03);
adjustRectangles(leftDownRects);
drawRectangles(leftDownRects);

const rightDownRects = generateRectanglesFromPath(rightDownPath, canvas.width*0.03);
adjustRectangles(rightDownRects);
drawRectangles(rightDownRects);

const rightMidRects = generateRectanglesFromPath(rightMidPath, canvas.width*0.03);
adjustRectangles(rightMidRects);
drawRectangles(rightMidRects);

const rightUpRects = generateRectanglesFromPath(rightUpPath, canvas.width*0.03);
adjustRectangles(rightUpRects);
drawRectangles(rightUpRects);
