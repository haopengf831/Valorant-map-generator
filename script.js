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

    let stepCount=0;

    const path = [start.slice()];
    let [currentX, currentY] = start;

    let lastDirection = null;
    let sideMoveCount = 0;

    const mainDirs = (direction === "horizontal") ? ["left","right"] : ["up","down"];
    const sideDirs = (direction === "horizontal") ? ["up","down"] : ["left","right"];

    function isCloseToEnd() {
        const distance = Math.sqrt((end[0]-currentX)**2 + (end[1]-currentY)**2);
        return distance < stepSize;
    }

    function isDirectionAllowed(dir) {
        // Direction opposite to main direction is not allowed (optional logic)
        // Immediate reversal is not allowed
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

    function forceFirstMainDirection() {
        if (direction==="horizontal") {
            // Decide direction depends on dx
            const dx = end[0] - currentX;
            if (dx < 0) return "left";
            else return "right"; 
        } else {
            // direction==="vertical"
            const dy = end[1] - currentY;
            if (dy < 0) return "up";
            else return "down";
        }
    }

    function decideNextStep() {
        // If this is first step（stepIndex===0），force its direction
        if (stepCount === 0) {
            const forcedMainDir = forceFirstMainDirection();
            lastDirection = forcedMainDir;  // To prevent immediate reverse direction, update lastDirection
            return forcedMainDir;
        }

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

        // Limit the number of consecutive sideways moves
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

    
    while(!isCloseToEnd()) {
        stepCount++;
        if (stepCount>1000) break;
        const directionChosen = decideNextStep();
        if (!directionChosen) break;

        if (directionChosen==="up") currentY-=stepSize;
        if (directionChosen==="down") currentY+=stepSize;
        if (directionChosen==="left") currentX-=stepSize;
        if (directionChosen==="right") currentX+=stepSize;

        // Apply sideBoundary constraint
        // main direction is horizontal => sideBoundary constraint y
        // main direction is vertical => sideBoundary constraint x
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
        mainBias: 0.4,
        sideBias: 0.6,
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
// 1. Lower spawn > lower right
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




function getLineSegmentsFromPath(path) {
    // Decompose the path into multiple straight line segments
    const segments = [];
    if (path.length < 2) return segments;

    let segmentStart = path[0];
    let lastDir = null; // "horizontal","vertical","diagonal"
    
    function getDirection(p1,p2) {
        const dx = p2[0]-p1[0];
        const dy = p2[1]-p1[1];
        if (dx===0 && dy!==0) return "vertical";
        if (dy===0 && dx!==0) return "horizontal";
        return "diagonal"; 
    }

    for (let i=1; i<path.length; i++) {
        const p1 = path[i-1];
        const p2 = path[i];
        const dir = getDirection(p1,p2);

        if (lastDir===null) {
            lastDir = dir;
        } else {
            // If the direction changes, the previous segment ends
            if (dir!==lastDir) {
                // segmentStart to path[i-1] is the previous segment
                segments.push({start: segmentStart, end: path[i-1], direction: lastDir});
                segmentStart = path[i-1]; 
                lastDir = dir;
            }
        }
    }
    segments.push({start: segmentStart, end: path[path.length-1], direction: lastDir});

    return segments;
}


function generateRectanglesFromSegments(segments) {
    const rects = [];
    for (const seg of segments) {
        const [x1,y1] = seg.start;
        const [x2,y2] = seg.end;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx*dx + dy*dy);
        if (length===0) continue;

        const smallSegRange = canvas.width * 0.06;

        let isRoom = false;
        if (seg.direction==="diagonal") {
            isRoom = false;
        } else {
            if(length <= smallSegRange){
                isRoom = false;
            }
            else{
                isRoom = Math.random()<0.5; 
            }
            
        }

        let width, height;
        let corridorMin = canvas.width*0.03;
        let corridorMax = canvas.width*0.06;
        let roomMin = canvas.width*0.1;
        let roomMax = canvas.width*0.15;
        
        const lengthScale = 1 + Math.random()*0.2; 
        
        if (seg.direction==="horizontal") {
            let mainSize = length * lengthScale;
            
            if (isRoom) {
                const hMin = roomMin;
                const hMax = roomMax;
                const rectHeight = hMin + Math.random()*(hMax - hMin);
                width = mainSize; 
                height = rectHeight;
            } else {
                const hMin = corridorMin;
                const hMax = corridorMax;
                const rectHeight = hMin + Math.random()*(hMax - hMin);
                width = mainSize; 
                height = rectHeight;
            }
            
        } else if (seg.direction==="vertical") {
            let mainSize = length * lengthScale;
            
            if (isRoom) {
                const wMin = roomMin;
                const wMax = roomMax;
                const rectWidth = wMin + Math.random()*(wMax - wMin);
                height = mainSize; 
                width = rectWidth;
            } else {
                const wMin = corridorMin;
                const wMax = corridorMax;
                const rectWidth = wMin + Math.random()*(wMax - wMin);
                height = mainSize; 
                width = rectWidth;
            }
            
        } else {
            let mainSize = length * lengthScale;
            const wMin = corridorMin;
            const wMax = corridorMax;
            const rectHeight = wMin + Math.random()*(wMax - wMin);
            width = mainSize;
            height = rectHeight;
        }

        const cx = (x1+x2)/2;
        const cy = (y1+y2)/2;

        let rectX = cx - width/2;
        let rectY = cy - height/2;

        if (seg.direction==="vertical") {
            const horizontalOffset = (width/6)*(Math.random()<0.5? -1:1)*Math.random();
            rectX += horizontalOffset;
        } else if (seg.direction==="horizontal") {
            const verticalOffset = (height/6)*(Math.random()<0.5? -1:1)*Math.random();
            rectY += verticalOffset;
        } else {
        }

        rects.push({x: rectX, y: rectY, width, height});
    }
    return rects;
}


function expandTop(rA, targetTop, maxExpand=50) {
    const curTop = rA.y; 
    if (targetTop < curTop) {
      const expandAmount = curTop - targetTop;
      if (expandAmount < maxExpand) {
        rA.height += expandAmount;
        rA.y = targetTop;
        return true; 
      }
    }
    return false;
  }
  

  function expandBottom(rA, targetBottom, maxExpand=50) {
    const curBottom = rA.y + rA.height;
    if (targetBottom > curBottom) {
      const expandAmount = targetBottom - curBottom;
      if (expandAmount < maxExpand) {
        rA.height += expandAmount;
        return true;
      }
    }
    return false;
  }
  
  function expandLeft(rA, targetLeft, maxExpand=50) {
    const curLeft = rA.x;
    if (targetLeft < curLeft) {
      const expandAmount = curLeft - targetLeft;
      if (expandAmount < maxExpand) {
        rA.width += expandAmount;
        // x move left
        rA.x = targetLeft;
        return true;
      }
    }
    return false;
  }
  
 
  function expandRight(rA, targetRight, maxExpand=50) {
    const curRight = rA.x + rA.width;
    if (targetRight > curRight) {
      const expandAmount = targetRight - curRight;
      if (expandAmount < maxExpand) {
        rA.width += expandAmount;
        return true;
      }
    }
    return false;
  }
  
  function isHorizontallyOverlapping(rA, rB) {
    const Aleft = rA.x, Aright = rA.x + rA.width;
    const Bleft = rB.x, Bright = rB.x + rB.width;
    return !(Bright < Aleft || Bleft > Aright);
  }
  
  function isVerticallyOverlapping(rA, rB) {
    const Atop = rA.y, Abottom = rA.y + rA.height;
    const Btop = rB.y, Bbottom = rB.y + rB.height;
    return !(Bbottom < Atop || Btop > Abottom);
  }
  
  
  
  function unifySameEdges(rA, rB, threshold=10, maxExpand=50) {
    let changed = false;
  
    const Atop = rA.y,
          Abottom = rA.y + rA.height,
          Aleft = rA.x,
          Aright = rA.x + rA.width;
    
    const Btop = rB.y,
          Bbottom = rB.y + rB.height,
          Bleft = rB.x,
          Bright = rB.x + rB.width;
  
    // 1. top-top
    if (isHorizontallyOverlapping(rA, rB)) {
      const distTop = Math.abs(Atop - Btop);
      if (distTop < threshold) {
        if (Atop < Btop) {
          if(expandTop(rB, Atop, maxExpand)) changed=true;
        } else {
          if(expandTop(rA, Btop, maxExpand)) changed=true;
        }
      }
    }
  
    // 2. bottom-bottom
    if (isHorizontallyOverlapping(rA, rB)) {
      const distBottom = Math.abs(Abottom - Bbottom);
      if (distBottom < threshold) {
        if (Abottom < Bbottom) {
          if(expandBottom(rA, Bbottom, maxExpand)) changed=true;
        } else {
          if(expandBottom(rB, Abottom, maxExpand)) changed=true;
        }
      }
    }
  
    // 3. left-left
    if (isVerticallyOverlapping(rA, rB)) {
      const distLeft = Math.abs(Aleft - Bleft);
      if (distLeft < threshold) {
        if (Aleft < Bleft) {
          if(expandLeft(rB, Aleft, maxExpand)) changed=true;
        } else {
          if(expandLeft(rA, Bleft, maxExpand)) changed=true;
        }
      }
    }
  
    // 4. right-right
    if (isVerticallyOverlapping(rA, rB)) {
      const distRight = Math.abs(Aright - Bright);
      if (distRight < threshold) {
        if (Aright < Bright) {
          if(expandRight(rA, Bright, maxExpand)) changed=true;
        } else {
          if(expandRight(rB, Aright, maxExpand)) changed=true;
        }
      }
    }
  
    return changed;
  }
  
  
  /**
   * @param {Array} allRects Reacts Array
   * @param {number} threshold Adjust Range
   * @param {number} maxExpand Max Adjust distance
   * @param {number} maxIterations 
   */
  function adjustRectangles(allRects, threshold=10, maxExpand=30, maxIterations=3) {
    for (let iter=0; iter<maxIterations; iter++) {
      let changed = false;
      for (let i=0; i<allRects.length; i++) {
        const rA = allRects[i];
        for (let j=i+1; j<allRects.length; j++) {
          const rB = allRects[j];
          const didChange = unifySameEdges(rA, rB, threshold, maxExpand);
          if (didChange) changed = true;
        }
      }
      // If there is no change in this round, can exit early
      if (!changed) break;
    }
    return allRects;
  }
  

let useColorRect = false;



function drawRectangles(rects) {
    // ctx.clearRect(0,0,canvas.width, canvas.height);
    
    if (!useColorRect) {
      ctx.fillStyle = "#505050";
      for (const r of rects) {
          ctx.fillRect(r.x, r.y, r.width, r.height);
      }
    } else {
      let lastColor = null;
      for (const r of rects) {
          let color = getRandomColor();
          while (color === lastColor) {
              color = getRandomColor();
          }
          lastColor = color;
          ctx.fillStyle = color;
          ctx.fillRect(r.x, r.y, r.width, r.height);
      }
    }
  }
function getRandomColor() {
    const h = Math.floor(Math.random()*360);
    const s = Math.floor(Math.random()*40)+60;
    const l = Math.floor(Math.random()*30)+50;
    
    return `hsla(${h},${s}%,${l}%,0.5)`;
}

const allRects = [];

const middleSegments = getLineSegmentsFromPath(middlePath);
const middleRects = generateRectanglesFromSegments(middleSegments);
allRects.push(...middleRects);
// drawRectangles(middleRects);

// Left C
const leftUpperSegments = getLineSegmentsFromPath(leftUpperPath);
const leftUpperRects = generateRectanglesFromSegments(leftUpperSegments);
allRects.push(...leftUpperRects);
// drawRectangles(leftUpperRects);


const leftMidSegments = getLineSegmentsFromPath(leftMidPath);
const leftMidRects = generateRectanglesFromSegments(leftMidSegments);
allRects.push(...leftMidRects);
// drawRectangles(leftMidRects);


const leftDownSegments = getLineSegmentsFromPath(leftDownPath);
const leftDownRects = generateRectanglesFromSegments(leftDownSegments);
allRects.push(...leftDownRects);
// drawRectangles(leftDownRects);


// Right C
const rightDownSegments = getLineSegmentsFromPath(rightDownPath);
const rightDownRects = generateRectanglesFromSegments(rightDownSegments);
allRects.push(...rightDownRects);
// drawRectangles(rightDownRects);


const rightMidSegments = getLineSegmentsFromPath(rightMidPath);
const rightMidRects = generateRectanglesFromSegments(rightMidSegments);
allRects.push(...rightMidRects);
// drawRectangles(rightMidRects);


const rightUpSegments = getLineSegmentsFromPath(rightUpPath);
const rightUpRects = generateRectanglesFromSegments(rightUpSegments);
allRects.push(...rightUpRects);
// drawRectangles(rightUpRects);

adjustRectangles(allRects, 25, 30, 3);

document.addEventListener("keydown", (e) => {
    if (e.key === "1") {
      useColorRect = !useColorRect;  
  
    //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      drawRectangles(allRects);
    //   drawPath(middlePath);
    //   drawPath(leftUpperPath);
    //   drawPath(leftMidPath);
    //   drawPath(leftDownPath);
    //   drawPath(rightDownPath);
    //   drawPath(rightMidPath);
    //   drawPath(rightUpPath);
    }
  });

drawRectangles(allRects);
//draw path above rectangles
// drawPath(middlePath);
// drawPath(leftUpperPath);
// drawPath(leftMidPath);
// drawPath(leftDownPath);
// drawPath(rightDownPath);
// drawPath(rightMidPath);
// drawPath(rightUpPath);

function drawBombSite(label, path) {
    if (path.length < 2) return;
    
    const midIndex = Math.floor(path.length / 2);
    const [cx, cy] = path[midIndex];
  
    const minSize = canvas.width * 0.15;
    const maxSize = canvas.width * 0.2;
    const size = minSize + Math.random() * (maxSize - minSize);
  
    const x = cx - size/2;
    const y = cy - size/2;
  
    ctx.fillStyle = "#c2b280";  
    ctx.fillRect(x, y, size, size);
  
    ctx.fillStyle = "black";
    ctx.font = "bold 24px Arial";
    const textWidth = ctx.measureText(label).width;
    const textX = x + (size - textWidth)/2;
    const textY = y + size/2 + 8; 
    ctx.fillText(label, textX, textY);
  }

// drawBombSite("A", leftMidPath);
// drawBombSite("B", rightMidPath);



