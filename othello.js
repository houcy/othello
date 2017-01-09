function assert(condition) {
    if (!condition) {
        console.error("Assertion failed");
    }
}

NUM_ROWS = 8;
NUM_COLS = 8;

MIN_MAX_DEPTH = 3;
MIN_MAX_THREE_WEIGHT = 10;

EMPTY = 0;

PLAYER_ONE = 1;
PLAYER_ONE_FILENAME = "player-1.png";

PLAYER_TWO = 2;
PLAYER_TWO_FILENAME = "player-2.png";

MAXIMIZING_PLAYER = PLAYER_ONE;
MINIMIZING_PLAYER = PLAYER_TWO;

FIRST_PLAYER = PLAYER_ONE;

var COMPUTER_PLAYER;
var HUMAN_PLAYER;

if (Math.random() < 0.5) {
    COMPUTER_PLAYER = PLAYER_ONE;
    HUMAN_PLAYER = PLAYER_TWO;
} else {
    COMPUTER_PLAYER = PLAYER_TWO;
    HUMAN_PLAYER = PLAYER_ONE;
}

/*******************************************************************************
 * Move is the interface between Othello and Viz
 ******************************************************************************/
class Move {
    // valid == true iff the move results in change in game state
    // (row, col) are the coordinates that player added their mark
    // player is either PLAYER_ONE or PLAYER_TWO, depending on who made the move
    // TODO: document captured
    // gameOver is either undefined (which signifies the game has not concluded)
    // or gameOver is a GameOver object, representing the conclusion of the game
    constructor(valid, row, col, player, captured, gameOver) {
        this.valid = valid;
        this.row = row;
        this.col = col;
        this.player = player;
        this.captured = captured;
        this.gameOver = gameOver;
    }
}

/*******************************************************************************
 * GameOver
 ******************************************************************************/
// GameOver objects store information about the end of the game.
class GameOver {

    // There are two fields in a GameOver object:
    //      1. this.victor
    //      2. this.victoryCells
    //
    // this.victor
    // ===========
    // this.victor is equal to one of the following:
    //      (A) undefined
    //      (B) PLAYER_ONE
    //      (C) PLAYER_TWO
    //
    // if this.victor == undefined, then that indicates the game ended in a draw
    // if this.victor == PLAYER_ONE, then that indicates PLAYER_ONE won the game
    // if this.victor == PLAYER_TWO, then that indicates PLAYER_TWO won the game
    //
    // this.count
    // =================
    // this.count[PLAYER_ONE] == the number of pieces that belong to PLAYER_ONE
    // this.count[PLAYER_TWO] == the number of pieces that belong to PLAYER_TWO
    constructor(victor, count) {
        this.victor = victor;
        this.count = count;

        // Make GameOver immutable
        Object.freeze(this);
        Object.freeze(this.count);
    }
}

/*******************************************************************************
 * Othello class
 ******************************************************************************/
class Othello {

    // player is either PLAYER_ONE or PLAYER_TWO, and indicates which player has
    // the next move
    constructor(player, numRows, numCols) {

        assert(numRows % 2 == 0);
        assert(numCols % 2 == 0);
        assert(player == PLAYER_ONE || player == PLAYER_TWO);

        this.numRows = numRows;
        this.numCols = numCols;

        this.matrix = new Array(this.numRows);
        for (var row = 0; row < this.numRows; row++) {
            this.matrix[row] = new Array(this.numCols);
            for (var col = 0; col < this.numCols; col++) {
                this.matrix[row][col] = EMPTY;
            }
        }

        // Set the opening moves
        var openingMoves = this.getOpeningMoves();
        for (var i = 0; i < openingMoves.length; i++) {
            var move = openingMoves[i];
            this.matrix[move.row][move.col] = move.player;
        }

        // this.player always equals the player (either PLAYER_ONE or
        // PLAYER_TWO) who has the next move.
        this.player = player;


        // If the game is over, then this.gameOver equals a GameOver object
        // that describes the properties of the conclusion of the game
        // If the game is not over, then this.gameOver is undefined.
        this.gameOver = undefined;
    }

    getOpeningMoves() {
        return [
            new Move(true, this.numRows / 2, this.numCols / 2, PLAYER_ONE, [], undefined),
            new Move(true, this.numRows / 2 - 1, this.numCols / 2 - 1, PLAYER_ONE, [], undefined),
            new Move(true, this.numRows / 2 - 1, this.numCols / 2, PLAYER_TWO, [], undefined),
            new Move(true, this.numRows / 2, this.numCols / 2 - 1, PLAYER_TWO, [], undefined),
        ]
    }

    deepCopy() {
        var newGame = new Othello(this.player, this.numRows, this.numCols);

        for (var row = 0; row < this.numRows; row++) {
            for (var col = 0; col < this.numCols; col++) {
                newGame.matrix[row][col] = this.matrix[row][col];
            }
        }

        // We do not need to make a deepCopy of this.gameOver
        // because this.gameOver is immutable
        newGame.gameOver = this.gameOver;

        return newGame;
    }

    isMoveInvalid(row, col) {
        return this.matrix[row][col] != EMPTY || this.gameOver != undefined;
    }

    getCell(row, col) {
        if (!(row >= 0 && row < this.numRows &&
               col >= 0 && col < this.numCols)) {
            return undefined;
        } else {
            return this.matrix[row][col];
        }
    }

    tryCaptureDrDc(row, col, dr, dc) {

        var otherPlayer;

        if (this.player == PLAYER_ONE) {
            otherPlayer = PLAYER_TWO;
        } else {
            otherPlayer = PLAYER_ONE;
        }

        var captured = [];

        row += dr;
        col += dc;

        while (this.getCell(row, col) == otherPlayer) {
            captured.push([row, col]);
            row += dr;
            col += dc;
        }

        if (this.getCell(row, col) == this.player)  {
            return captured;
        } else {
            return [];
        }
    }

    tryCapture(row, col) {
        var capturedUp = this.tryCaptureDrDc(row, col, -1, 0);
        var capturedDown = this.tryCaptureDrDc(row, col, 1, 0);
        var capturedLeft = this.tryCaptureDrDc(row, col, 0, -1);
        var capturedRight = this.tryCaptureDrDc(row, col, 0, 1);

        var capturedDiagonal1 = this.tryCaptureDrDc(row, col, 1, 1);
        var capturedDiagonal2 = this.tryCaptureDrDc(row, col, 1, -1);
        var capturedDiagonal3 = this.tryCaptureDrDc(row, col, -1, 1);
        var capturedDiagonal4 = this.tryCaptureDrDc(row, col, -1, -1);


        return capturedUp
            .concat(capturedDown)
            .concat(capturedLeft)
            .concat(capturedRight)
            .concat(capturedDiagonal1)
            .concat(capturedDiagonal2)
            .concat(capturedDiagonal3)
            .concat(capturedDiagonal4)
    }

    makeMove(row, col) {

        assert(row >= 0 && row < this.numRows);
        assert(col >= 0 && col < this.numCols);

        if (this.isMoveInvalid(row, col)) {
            return new Move(false, undefined, undefined, undefined, undefined, undefined);
        } 

        this.matrix[row][col] = this.player;

        // TODO
        //this.checkGameOver();

        var captured = this.tryCapture(row, col);

        if (captured.length == 0) {
            return new Move(false, undefined, undefined, undefined, undefined, undefined);
        }

        for (var i = 0; i < captured.length; i++) {
            var [r, c] = captured[i];
            this.matrix[r][c] = this.player;
        } 

        var move = new Move(true, row, col, this.player, captured, this.gameOver);

        if (this.player == PLAYER_ONE) {
            this.player = PLAYER_TWO;
        } else {
            this.player = PLAYER_ONE;
        }

        return move;
    }

    checkGameOver() {
        // TODO
    }
}


/*******************************************************************************
 * Node class
 ******************************************************************************/

class Node {

    constructor(game, move = undefined) {
        this.game = game;
        this.move = move;
    }

    getMove() {
        return this.move;
    }

    isLeaf() {
        return this.game.gameOver != undefined;
    }


    // TODO
    getNonLeafScore() {
        return 0;
    }

    getScore() {
        if (this.game.gameOver != undefined) {
            if (this.game.gameOver.victor == MAXIMIZING_PLAYER) {
                return Number.MAX_SAFE_INTEGER;
            } else if (this.game.gameOver.victor == MINIMIZING_PLAYER) {
                return Number.MIN_SAFE_INTEGER;
            } else {
                return 0;
            }
        } else {
            return this.getNonLeafScore();
        }
    }

    // Recall, in a game tree every node (except a leaf node)
    // is a parent. The children of a parent represent
    // all the possible moves a parent can make.
    getChildren() {

        var childrenNodes = [];

        for (var row = 0; row < this.game.numRows; row++) {
            for (var col = 0; col < this.game.numCols; col++) {

                var childGame = this.game.deepCopy();

                var move = childGame.makeMove(row, col);

                if (move.valid) {
                    var childNode = new Node(childGame, move);
                    childrenNodes.push(childNode);
                }
            }
        }

        assert(childrenNodes.length > 0);

        return childrenNodes;
    }
}

/*******************************************************************************
 * Viz class
 ******************************************************************************/
class Viz {
    
    /* Static functions *******************************************************/

    static getCellId(row, col) {
        return "cell-" + row + "-" + col;
    }

    /* Instance methods *******************************************************/
    constructor(boardId, numRows, numCols, cell_size) {
        this.boardId = boardId;
        this.numRows = numRows;
        this.numCols = numCols;
        this.cell_size = cell_size;
        this.drawCells();
    }
    
    drawCells() {
        for (var row = 0; row < this.numRows; row++) {

            var rowId = "row-" + row;
            var rowTag = "<div id='" + rowId + "' class='row'></div>"

            $(this.boardId).append(rowTag);

            for (var col = 0; col < this.numCols; col++) {

                var cellId = Viz.getCellId(row, col);
                var cellTag = "<div id='" + cellId + "' " + 
                              "class='cell' " + 
                              "onClick='cellClick(" + row + ", " + col +" )'>" +
                              "</div>";
                $("#" + rowId).append(cellTag);
                $("#" + cellId).css("width", this.cell_size);
                $("#" + cellId).css("height", this.cell_size);
            }
        }
    }

    getImgTag(player) {

        var filename = undefined;

        if (player == PLAYER_ONE) {
            filename = PLAYER_ONE_FILENAME;
        } else if (player == PLAYER_TWO) {
            filename = PLAYER_TWO_FILENAME
        } else {
            assert(false);
        }

        return "<img src='" + filename + "' width='" + this.cell_size + "'>";
    }


    drawMove(move) {
        if (!move.valid) {
            return;
        }

        var cellId = Viz.getCellId(move.row, move.col);
        var imgTag = this.getImgTag(move.player);

        $("#" + cellId).append(imgTag);


        for (var i = 0; i < move.captured.length; i++) {
            var [row, col] = move.captured[i];
            console.log(row, col);

            var cellId = Viz.getCellId(row, col);
            var imgTag = this.getImgTag(move.player);

            $("#" + cellId + " img").remove();
            $("#" + cellId).append(imgTag);

        }

        if (move.gameOver != undefined &&
            move.gameOver.victoryCells != undefined) {

            for (var i = 0; i < move.gameOver.victoryCells.length; i++) {
                var [row, col] = move.gameOver.victoryCells[i];

                var cellId = Viz.getCellId(row, col);

                $("#" + cellId).css("background-color", "gray");

                $("#" + cellId).css("outline",  "black solid 2px");

            }
        }
    }
}

/*******************************************************************************
 * MinMax function
 ******************************************************************************/

// Arguments:
//    node is the node for which we want to calculate its score
//    maximizingPlayer is true if node wants to maximize its score
//    maximizingPlayer is false if node wants to minimize its score
//
// minMax(node, player) returns the best possible score
// that the player can achieve from this node
//
// node must be an object with the following methods:
//    node.isLeaf()
//    node.getScore()
//    node.getChildren()
//    node.getMove()
function minMax(node, depth, maximizingPlayer) {
    if (node.isLeaf() || depth == 0) {
        return [node.getMove(), node.getScore()];
    }

    // If the node wants to maximize its score:
    if (maximizingPlayer) {
        var bestScore = Number.MIN_SAFE_INTEGER;
        var bestMove = undefined;

        // find the child with the highest score
        var children = node.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var [_, childScore] = minMax(child, depth - 1, false);
            bestScore = Math.max(childScore, bestScore);

            if (bestScore == childScore) {
                bestMove = child.getMove();
            }

        }
        return [bestMove, bestScore];
    }

    // If the node wants to minimize its score:
    else {
        var bestScore = Number.MAX_SAFE_INTEGER;
        var bestMove = undefined;

        // find the child with the lowest score
        var children = node.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var [_, childScore] = minMax(child, depth -1, true);
            bestScore = Math.min(childScore, bestScore);

            if (bestScore == childScore) {
                bestMove = child.getMove();
            }
        }
        return [bestMove, bestScore];
    }
}


/*******************************************************************************
 * AI code
 ******************************************************************************/

function makeAiMove(game) {

    assert(game.gameOver == undefined);

    var node = new Node(game);

    var maximizing = MAXIMIZING_PLAYER == COMPUTER_PLAYER;

    var [bestMove, _] = minMax(node, MIN_MAX_DEPTH, maximizing);

    return game.makeMove(bestMove.row, bestMove.col);
}

/*******************************************************************************
 * Controller
 ******************************************************************************/
         
var cell_size = 50;

var GAME = new Othello(FIRST_PLAYER, NUM_ROWS, NUM_COLS);

// Global variable to hold the Viz class
var VIZ = new Viz("#board", NUM_ROWS, NUM_COLS, cell_size);

var openingMoves = GAME.getOpeningMoves();
for (var i = 0; i < openingMoves.length; i++) {
    var move = openingMoves[i];
    VIZ.drawMove(move);
}


if (FIRST_PLAYER == COMPUTER_PLAYER) {
    move = makeAiMove(GAME);
    VIZ.drawMove(move);
}

function cellClick(row, col) {

    var move = GAME.makeMove(row, col);
    VIZ.drawMove(move);

    if (move.valid && GAME.gameOver == undefined) {

        // Delay doAiMove() so that the browser has time to draw the human
        // player's move
        function doAiMove() {
            move = makeAiMove(GAME);
            VIZ.drawMove(move);            
        }

        window.setTimeout(doAiMove, 100);
    }
}

