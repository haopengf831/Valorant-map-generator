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
        direction = "horizontal",
        stepSize = canvas.width * 0.07,
        maxSideMoves = 2,
        sideBoundaryMin = 0,
        sideBoundaryMax = (direction==="horizontal"? canvas.height : canvas.width),
        mainBias = 0.5,
        sideBias = 0.5,
        allowRandomSideSteps = true
    } = options;

    const path = [start.slice()];
    let [currentX, currentY] = start;

    let lastDirection = null;
    let sideMoveCount = 0;

    // 定义主/侧方向的方向集合
    const mainDirs = (direction === "horizontal") ? ["left","right"] : ["up","down"];
    const sideDirs = (direction === "horizontal") ? ["up","down"] : ["left","right"];

    function isCloseToEnd() {
        const distance = Math.sqrt((end[0]-currentX)**2 + (end[1]-currentY)**2);
        return distance < stepSize;
    }

    function isDirectionAllowed(dir) {
        // 不允许与主方向相反的方向（可选逻辑）
        // 不允许立即反向
        if (lastDirection) {
            if ((lastDirection==="up" && dir==="down") ||
                (lastDirection==="down" && dir==="up") ||
                (lastDirection==="left" && dir==="right") ||
                (lastDirection==="right" && dir==="left")) {
                return false;
            }
        }
        return true;
    }

    function decideNextStep() {
        const dx = end[0]-currentX;
        const dy = end[1]-currentY;

        let possibleDirections = [];
        if (dy < 0 && isDirectionAllowed("up")) possibleDirections.push("up");
        if (dy > 0 && isDirectionAllowed("down")) possibleDirections.push("down");
        if (dx > 0 && isDirectionAllowed("right")) possibleDirections.push("right");
        if (dx < 0 && isDirectionAllowed("left")) possibleDirections.push("left");

        if (allowRandomSideSteps && possibleDirections.length < 2) {
            const perpDirs = sideDirs.filter(isDirectionAllowed);
            if (perpDirs.length > 0 && Math.random()<0.5) {
                possibleDirections.push(perpDirs[Math.floor(Math.random()*perpDirs.length)]);
            }
        }

        let currentMainBias = mainBias;
        let currentSideBias = sideBias;
        if (direction==="horizontal" && Math.abs(dx)>Math.abs(dy)) {
            currentMainBias += 0.3;
        } else if (direction==="vertical" && Math.abs(dy)>Math.abs(dx)) {
            currentMainBias += 0.3;
        }

        const sum = currentMainBias+currentSideBias;
        currentMainBias/=sum;
        currentSideBias/=sum;

        let dirCandidates;
        const r = Math.random();
        if (r<currentMainBias) {
            let mainCandidates = possibleDirections.filter(d=>mainDirs.includes(d));
            if (mainCandidates.length===0) mainCandidates=possibleDirections;
            dirCandidates = mainCandidates;
        } else {
            let sideCandidates = possibleDirections.filter(d=>sideDirs.includes(d));
            if (sideCandidates.length===0) sideCandidates=possibleDirections;
            dirCandidates = sideCandidates;
        }

        if (dirCandidates.length===0) dirCandidates=possibleDirections;
        let chosenDirection = dirCandidates[Math.floor(Math.random()*dirCandidates.length)];

        // 限制侧方向连续移动次数
        if (sideDirs.includes(chosenDirection)) {
            if (lastDirection && sideDirs.includes(lastDirection)) {
                sideMoveCount++;
                if (sideMoveCount > maxSideMoves) {
                    let mainOnly = dirCandidates.filter(d=>mainDirs.includes(d));
                    if (mainOnly.length>0) {
                        chosenDirection = mainOnly[Math.floor(Math.random()*mainOnly.length)];
                        sideMoveCount=0;
                    }
                }
            } else {
                sideMoveCount=1;
            }
        } else {
            sideMoveCount=0;
        }

        return chosenDirection;
    }

    let stepCount=0;
    while(!isCloseToEnd()) {
        stepCount++;
        if (stepCount>1000) break;
        const directionChosen = decideNextStep();
        if (!directionChosen) break;

        if (directionChosen==="up") currentY-=stepSize;
        if (directionChosen==="down") currentY+=stepSize;
        if (directionChosen==="left") currentX-=stepSize;
        if (directionChosen==="right") currentX+=stepSize;

        // 应用sideBoundary限制
        // 主方向是horizontal => sideBoundary约束y
        // 主方向是vertical => sideBoundary约束x
        if (direction==="horizontal") {
            if (currentY<sideBoundaryMin) currentY=sideBoundaryMin;
            if (currentY>sideBoundaryMax) currentY=sideBoundaryMax;
        } else {
            if (currentX<sideBoundaryMin) currentX=sideBoundaryMin;
            if (currentX>sideBoundaryMax) currentX=sideBoundaryMax;
        }

        path.push([currentX,currentY]);
        lastDirection=directionChosen;
    }

    path.push([end[0], end[1]]);
    return path;
}

function drawPath(path) {
    ctx.strokeStyle="black";
    ctx.lineWidth=2;
    ctx.beginPath();
    for (let i=0; i<path.length; i++) {
        const [x,y]=path[i];
        if (i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
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
    direction: "vertical",
        stepSize: canvas.width * 0.07,
        maxSideMoves: 2,
        sideBoundaryMin: horizontalBoundaryMin,
        sideBoundaryMax: horizontalBoundaryMax,
        mainBias: 0.3,
        sideBias: 0.7,
        allowRandomSideSteps: true
});
drawPath(middlePath);


const leftUpperPoint = [canvas.width * (1/6), canvas.height * 0.25];
const leftLowerPoint = [canvas.width * (1/6), canvas.height * 0.75];

// Left C path: upper spawn point -> upper left point -> lower left point -> lower spawn point
// 1. Upper spawn point -> upper left point
const leftUpperPath = generatePath(end, leftUpperPoint, {
    direction: "horizontal",
    stepSize: canvas.width * 0.03,
    maxSideMoves: 2,
    sideBoundaryMin: Math.min(end[1], leftUpperPoint[1]) - canvas.height * 0.14,
    sideBoundaryMax: Math.max(end[1], leftUpperPoint[1]) + canvas.height * 0.14,
    mainBias: 0.7,
    sideBias: 0.3,
    allowRandomSideSteps: true
});
drawPath(leftUpperPath);

// 2. Upper left point -> Lower left point
const leftMidPath = generatePath(leftUpperPoint, leftLowerPoint, {
    direction: "vertical",
    stepSize: canvas.width * 0.03,
    maxSideMoves: 2,
    sideBoundaryMin: Math.min(leftUpperPoint[0], leftLowerPoint[0]) - canvas.width * 0.14,
    sideBoundaryMax: Math.max(leftUpperPoint[0], leftLowerPoint[0]) + canvas.width * 0.14,
    mainBias: 0.6,
    sideBias: 0.4,
    allowRandomSideSteps: true
});
drawPath(leftMidPath);


// 3. Lower left point -> lower spawn point
const leftDownPath = generatePath(leftLowerPoint, start, {
    direction: "horizontal",
    stepSize: canvas.width * 0.03,
    maxSideMoves: 2,
    sideBoundaryMin: Math.min(leftLowerPoint[1], start[1]) - canvas.height * 0.14,
    sideBoundaryMax: Math.max(leftLowerPoint[1], start[1]) + canvas.height * 0.14,
    mainBias: 0.7,
    sideBias: 0.3,
    allowRandomSideSteps: true
});
drawPath(leftDownPath);



const rightLowerPoint = [canvas.width * (5/6), canvas.height * 0.75];
const rightUpperPoint = [canvas.width * (5/6), canvas.height * 0.25];

// Right C
// 1. bottom spawn > lower right
const rightDownPath = generatePath(start, rightLowerPoint, {
    direction: "horizontal",
    stepSize: canvas.width * 0.03,
    maxSideMoves: 2,
    sideBoundaryMin: Math.min(start[1], rightLowerPoint[1]) - canvas.height * 0.14,
    sideBoundaryMax: Math.max(start[1], rightLowerPoint[1]) + canvas.height * 0.14,
    mainBias: 0.7,
    sideBias: 0.3,
    allowRandomSideSteps: true
});
drawPath(rightDownPath);


// 2. Lower right  > upper right
const rightMidPath = generatePath(rightLowerPoint, rightUpperPoint, {
    direction: "vertical",
    stepSize: canvas.width * 0.03,
    maxSideMoves: 2,
    sideBoundaryMin: Math.min(rightLowerPoint[0], rightUpperPoint[0]) - canvas.width * 0.14,
    sideBoundaryMax: Math.max(rightLowerPoint[0], rightUpperPoint[0]) + canvas.width * 0.14,
    mainBias: 0.6,
    sideBias: 0.4,
    allowRandomSideSteps: true
});
drawPath(rightMidPath);


// 3. Upper right -> upper spwan
const rightUpPath = generatePath(rightUpperPoint, end, {
    direction: "horizontal",
    stepSize: canvas.width * 0.03,
    maxSideMoves: 2,
    sideBoundaryMin: Math.min(rightUpperPoint[1], end[1]) - canvas.height * 0.14,
    sideBoundaryMax: Math.max(rightUpperPoint[1], end[1]) + canvas.height * 0.14,
    mainBias: 0.7,
    sideBias: 0.3,
    allowRandomSideSteps: true
});
drawPath(rightUpPath);




// function generateRectanglesFromPath(path, stepSize) {
//     const rects = [];
//     for (let i = 0; i < path.length - 1; i++) {
//         const [x1, y1] = path[i];
//         const [x2, y2] = path[i+1];

//         const dx = x2 - x1;
//         const dy = y2 - y1;
//         const length = Math.sqrt(dx*dx + dy*dy);
//         if (length === 0) continue;

//         // current segment direction
//         const isVertical = Math.abs(dy) > Math.abs(dx);
//         const dir = isVertical ? (dy < 0 ? "up":"down") : (dx > 0 ? "right":"left");

//         // rect random height and width
//         const minSize = stepSize;
//         const maxSize = stepSize * 1.5;
//         const width = minSize + Math.random()*(maxSize - minSize);
//         const height = minSize + Math.random()*(maxSize - minSize);

        
//         const cx = (x1+x2)/2;
//         const cy = (y1+y2)/2;

//         let rectX = cx - width/2;
//         let rectY = cy - height/2;

        
//         if (isVertical) {
//             // horizontal shift
//             const horizontalOffset = (width/6)*(Math.random()<0.5? -1 : 1)*Math.random();
//             rectX += horizontalOffset;
            
//         } else {
//             // vertical shift
//             const verticalOffset = (height/6)*(Math.random()<0.5? -1 : 1)*Math.random();
//             rectY += verticalOffset;
            
//         }

//         rects.push({x: rectX, y: rectY, width, height});
//     }
//     return rects;
// }


// function adjustRectangles(rects) {
    
//     rects.sort((a,b)=> a.x - b.x);

//     for (let i=0; i<rects.length-1; i++) {
//         const r1 = rects[i];
//         const r2 = rects[i+1];

       
//         const r1Right = r1.x + r1.width;
//         const r2Left = r2.x;

//         if (Math.abs(r2Left - r1Right) < 20) {
            
//             const mid = (r2Left + r1Right)/2;
            
//             const deltaR1 = mid - r1Right;
//             r1.width += deltaR1;
//             const deltaR2 = r2Left - mid;
//             r2.x = r2.x - deltaR2;
//         }

        
//     }
// }

// //draw rect
// function drawRectangles(rects) {
//     ctx.fillStyle = "#505050";
//     for (const r of rects) {
//         ctx.fillRect(r.x, r.y, r.width, r.height);
//     }
// }


// const middleRects = generateRectanglesFromPath(middlePath, canvas.width*0.07);
// // adjust midpath
// adjustRectangles(middleRects);
// // midpath rect
// drawRectangles(middleRects);

// // left c and right C
// const leftUpperRects = generateRectanglesFromPath(leftUpperPath, canvas.width*0.03);
// adjustRectangles(leftUpperRects);
// drawRectangles(leftUpperRects);

// const leftMidRects = generateRectanglesFromPath(leftMidPath, canvas.width*0.03);
// adjustRectangles(leftMidRects);
// drawRectangles(leftMidRects);

// const leftDownRects = generateRectanglesFromPath(leftDownPath, canvas.width*0.03);
// adjustRectangles(leftDownRects);
// drawRectangles(leftDownRects);

// const rightDownRects = generateRectanglesFromPath(rightDownPath, canvas.width*0.03);
// adjustRectangles(rightDownRects);
// drawRectangles(rightDownRects);

// const rightMidRects = generateRectanglesFromPath(rightMidPath, canvas.width*0.03);
// adjustRectangles(rightMidRects);
// drawRectangles(rightMidRects);

// const rightUpRects = generateRectanglesFromPath(rightUpPath, canvas.width*0.03);
// adjustRectangles(rightUpRects);
// drawRectangles(rightUpRects);
