# How to select a circle

Available data:

[x, y] of mouseclick -- M

[x, y, r] of Circles -- C1, C2...

## Algorithm A

-   calculate distance M-C1, M-C2..: D1, D2...
-   check D1<r => select C1
    -   and so on

## Algorithm B

-   compare all distances D1, D2...
-   check if Dmin<r

## Check boxes

⭐️ WINNER

(I landed here after discovering the flaw with algo C)

_Use a simple heuristic to narrow down the n umber of circles to perform the distance calculation on: is the point within the bounding box of the circle?_

-   filter circles[]: dX <=r && dY <= r => candidates[]
    -- use reduce => array of {index, deltaX, deltaY, distance}
-   collect candidates that have been intersected and pick the one with the smallest distance
    -   determine distance of each candidate
        -- candidates.forEach(({deltaX, deltaY, distance})=>distance = Math.hypot...)
-   pick smallest distance
    ...

new idea of implementation

circle.reduce
if dX <=r && dY <= r
const distance = Math.hypot(dX, dY)
if distance < bestCandidateSoFar.distance
bestCandidateSoFar.index = index
bestCandidateSoFar.distance = distance
bestCandidateSoFar = {index = -1, distance = 999999}
=> index of circle || -1

## Algorithm C

(ex-WINNER)

This turned out to have a flaw producing false positives: the algo disqualifies circles that are "further away" even tho they might have a greater radius. I think there is no sifting without considering both deltas and the circles radius.

### 0.1

-   sort Circles[]
-   pick circle(s) with x closest to Mx -> Cx
-   pick circle(s) with y closest to My -> Cy
-   check if DCx<r and DCy<r
    -   find Dmin
    -   if both are within, pick smallest D
-   select Cmin
    -   how to change the CSS class of the winning circle?
    -   step 1: output the winning circle in console

Hypothesis: this will work if either Cx or Cy are the actual circle where I clicked

### 0.2

function getAllIndexes(arr, val) {
var indexes = [], i;
for(i = 0; i < arr.length; i++)
if (arr[i] === val)
indexes.push(i);
return indexes;
}

deltasOfX = circles.map([x] => Math.abs(x-r))
smallestX = Math.min(...deltasOfX)
// check if there are more of this smallest X
allX = getAllIndexes(deltasOfX, smallestX)
// what index do these have?

circleWinnersX = allX.map( indexOfCircle => circle[indexOfCircle] )
const isClickInside = circleWinnersX.map({coordinated: [x, y], radius} => {
const distance = Math.hypot(x-clickX, y-clickY)
return (distance<radius ? true : false)
})

if(isClickInside.indexOf(true) > -1) {console.log(isClickInside)}

// Improvements
allDeltasOfCoordinates = circles.map([x,y] => [Math.abs(x-r), Math.abs(y-r)])
indexOfwinnerX = Math.min(...allDeltasOfCoordinates)

## 0.3

LESSON: this approach allows for false negatives: youre inside a circle, yet there is another with a smaller x and yet another with a smaller y.

### ALGORITHM D

_Make a preselection from circles _

-   make array candidates from all circles that have deltaX and deltaY <=r => candidates: [{circle:..circle, indexOfCircle}]
-   make array distances from array candidates => distances
-   find inex of smallest distance => smallestDistIndex
-   circleToSelect: candidates[smallestDistIndex]

### APPENDIX

_Save time on any algo that goes through all Circle[] by dividing the canvas into quadrants_

-   store each circle in one of X quadrants / cells upon creation
-   onClick: determine quadrant of click
-   only check circles in that quadrant
