var isMoving = false;
var hasMovedACell = false;
var promises = [];
var score = 0;
var highScore = 0;
var movementConfig = {
    'up': {
        'boardIterator' : [1,4,1,0,4,1],
        'cellPushing' : [-1,0]
    },
    'down': {
        'boardIterator' : [2,-1,-1,0,4,1],
        'cellPushing' : [1,0]
    },
    'left': {
        'boardIterator' : [0,4,1,1,4,1],
        'cellPushing' : [0,-1]
    },
    'right': {
        'boardIterator' : [0,4,1,2,-1,-1],
        'cellPushing' : [0,1]
    }
};


var cellSize = 126;
var boardSituation = [
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0]];

var dirtyCells = [
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0]];


function showBoardSituation(){
    var string = '';
    for(var i = 0; i<=3; i++){
        for(var j=0; j<=3; j++){
            string += boardSituation[i][j]+' ';
        }
        string +='<br>';
    }

    $('.boardSituation').html(string);


    var string = '';
    for(var i = 0; i<=3; i++){
        for(var j=0; j<=3; j++){
            string += dirtyCells[i][j]+' ';
        }
        string +='<br>';
    }

    $('.dirtySituation').html(string);

}

$(document).keydown(function(e) {
    if(isMoving){
        return;
    }
    switch(e.which) {
        case 37: // left
            checkAllCellsForMove('left');
            break;

        case 38: // up
            checkAllCellsForMove('up');
            break;

        case 39: // right
            checkAllCellsForMove('right');
            break;

        case 40: // down
            checkAllCellsForMove('down');
            break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});


function checkAllCellsForMove(direction){
    //console.error(direction)
    isMoving = true;
    var startX = movementConfig[direction].boardIterator[0];
    var endX = movementConfig[direction].boardIterator[1];
    var modX = movementConfig[direction].boardIterator[2];
    var startY = movementConfig[direction].boardIterator[3];
    var endY = movementConfig[direction].boardIterator[4];
    var modY = movementConfig[direction].boardIterator[5];


    for(var i = startX; i != endX; i+=modX){
        for(var j=startY; j != endY; j+=modY){
            if(boardSituation[i][j] != 0){
                pushCellInDirection(i, j, direction);
            }
        }
    }
    clearDirtyCells();
    showBoardSituation();
    $.when.apply( $, promises ).always( function(){
        if(hasMovedACell){
            addNewRandomCell();
            hasMovedACell = false;
        }
        isMoving = false;
    });

    $('#score').text(score);
    if(parseInt(score) > highScore){
        localStorage['highScore'] = score;
        $('#highScore').text('HighScore: '+score);
    }
}

function pushCellInDirection(cellX, cellY, direction){
    var modX = movementConfig[direction].cellPushing[0];
    var modY = movementConfig[direction].cellPushing[1];


    if((modX > 0 && cellX == 3) || (modX < 0 && cellX == 0) || (modY > 0 && cellY == 3) || (modY < 0 && cellY == 0)){
        console.log('Se ha intentado empujar una celda en el borde');
        return null;
    }

    var initialX = parseInt(cellX);
    var initialY = parseInt(cellY);

    if(boardSituation[initialX][initialY] == 0){
        console.log('Se ha intentado mover una celda inexistente');
        return;
    }

    var currentX = initialX;
    var currentY = initialY;

    var cellValue = boardSituation[initialX][initialY];

    while(currentX >= 0 && currentX <= 3 && currentY >= 0 && currentY <= 3){
        if((currentX+modX) < 0 || (currentX+modX) > 3 || (currentY+modY) < 0 || (currentY+modY) > 3){
            break;
        }
        if(boardSituation[(currentX+modX)][(currentY+modY)] != 0){
            if(boardSituation[(currentX+modX)][(currentY+modY)] == cellValue && dirtyCells[(currentX+modX)][(currentY+modY)] == 0){
                markCellAsDirty((currentX+modX), (currentY+modY));
                refreshBoardSituation(initialX, initialY, (currentX+modX), (currentY+modY), cellValue+cellValue);
                score += (cellValue*2);
                return;
            }
            else{
                refreshBoardSituation(initialX, initialY, currentX, currentY, cellValue);
                return;
            }
        }
        currentX += modX;
        currentY += modY;
    }

    if(direction == 'up'){
        refreshBoardSituation(initialX, initialY, 0, initialY, cellValue);
    }
    else if(direction == 'down'){
        refreshBoardSituation(initialX, initialY, 3, initialY, cellValue);
    }
    else if(direction == 'left'){
        refreshBoardSituation(initialX, initialY, initialX, 0, cellValue);
    }
    else{
        refreshBoardSituation(initialX, initialY, initialX, 3, cellValue);
    }
}

function refreshBoardSituation(oldCx, oldCy, newCx, newCy, newValue){
    if((oldCx == newCx) && (oldCy == newCy)){
        return;
    }
    hasMovedACell = true;
    boardSituation[newCx][newCy] = newValue;
    boardSituation[oldCx][oldCy] = 0;
    moveCell(oldCx, oldCy, newCx, newCy, newValue);
}

function markCellAsDirty(cellX, cellY){
    dirtyCells[cellX][cellY] = 1;
}

function clearDirtyCells(){
    dirtyCells = [
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0]];
}

function moveCell(ax, ay, bx, by, destScore){
    var vertical = (bx-ax)*cellSize;
    var horizontal = (by-ay)*cellSize;

    var cellPromise = $.Deferred();

    promises.push(cellPromise);
    $('.gameCell[data-row="'+ax+'"][data-col="'+ay+'"] .innerCell').animate({top: vertical, left:horizontal}, 50, 'linear', function(){
        $(this).remove();
        var dest = $('[data-row="'+bx+'"][data-col="'+by+'"]');

        var newElem = $.parseHTML('<div class="innerCell" data-val="'+destScore+'">'+destScore+'</div>');
        dest.append(newElem);

        cellPromise.resolve();
    });
}


function addNewRandomCell(){
    var availablePositions = [];

    for(var i = 0; i<=3; i++){
        for(var j=0; j<=3; j++){
            if(boardSituation[i][j] == 0){
                if(i != 0 && j != 0){
                    availablePositions.push(i+'-'+j);
                }
            }
        }
    }

    if(availablePositions.length == 0 && boardSituation[0][0] != 0){
        console.error('FUUUUUCK');
        createNewCell(0, 0);
        return;
    }

    var randomPos = Math.floor(Math.random() * availablePositions.length);

    var randomAvailable = availablePositions[randomPos];

    randomAvailable = randomAvailable.split('-');
    createNewCell(randomAvailable[0], randomAvailable[1]);
}

function createNewCell(cx, cy){
    boardSituation[cx][cy] = 2;
    var newCell = $.parseHTML('<div class="innerCell" data-val="2">2</div>');
    $('.gameCell[data-row="'+cx+'"][data-col="'+cy+'"]').append(newCell);
}

function initializeBoard(){
    addNewRandomCell();
    addNewRandomCell();
}

initializeBoard();

if(localStorage['highScore']){
    highScore = localStorage['highScore'];
    $('#highScore').text('HighScore: '+highScore);
}
