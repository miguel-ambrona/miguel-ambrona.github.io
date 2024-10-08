// NOTE: this code uses the chess.js library:
// https://github.com/jhlywa/chess.js

var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')

var selectedPiece = null
var promotionPiece = null;
var variantIdx = 0;
var solution   = null;
var lastLoaded = 0;

const piecesPath = 'img/chesspieces/Default/';
const move_sound    = new Audio("audio/Move.mp3");
const capture_sound = new Audio("audio/Capture.mp3");
const bell_sound    = new Audio("audio/Bell.mp3");

function candidateSquare(square) {
    var squareEl = $('#myBoard .square-' + square);
    if (squareEl.hasClass('black-3c85d') === true) { highlight = 'highlight-black'; }
    else                                           { highlight = 'highlight-white'; }
    squareEl.addClass(highlight);
};

function addHighlights(source) {
  var moves = game.moves({
      square: source,
      verbose: true
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
      candidateSquare(moves[i].to);
  }
  $('#myBoard .square-' + source).addClass('highlight-candidate');
};

function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight-white');
    $('#myBoard .square-55d63').removeClass('highlight-black');
    $('#myBoard .square-55d63').removeClass('highlight-candidate');
};

function clickOnPromotion(piece){
    buildBoard(true, game.fen());
    promotionPiece = piece[1].toLowerCase();
    $('#myboard').find('.square-55d63').removeClass('promotion-background').removeClass('promotion-mask');
    $('#prom0').remove();  $('#prom1').remove();  $('#prom2').remove();  $('#prom3').remove();
}

function popSelectPiece(target){
    selectedPiece = null;
    buildBoard(false, game.fen());
    var piecesStyle = $('#myBoard').find('.piece-417db')[0].style;
    var col = target[0];
    var rows;
    if (target[1] === '8'){ rows = [[8,'wQ'],[7,'wR'],[6,'wB'],[5,'wN']]; }
    else { rows = [[1,'bQ'],[2,'bR'],[3,'bB'],[4,'bN']]; }
    $('#myBoard').find('.square-55d63').addClass('promotion-mask');
    for (i = 0; i < rows.length; i++){
        var thisSquare = col + rows[i][0];
        el = document.getElementsByClassName('square-' + thisSquare)[0];
        img = '<img id="prom' + i + '" src="' + piecesPath + rows[i][1] + '.png" ';
        img += 'style="width: ' + piecesStyle.width + '">';
        link = '<a href="#myBoard" onClick="clickOnPromotion(\'' + rows[i][1] + '\')" ';
        link += 'style="z-index:100">'  + img + '</a>';
        el.innerHTML = link;
        $('#myBoard').find('.square-' + thisSquare).addClass('promotion-background').removeClass('promotion-mask');
    }
}

function askForPromotion(source, target, piece){
   if (!promotionPiece) {
       setTimeout(function(){ askForPromotion(source, target, piece); }, 300);

   } else {
       onDrop(source, target, piece);
       onSnapEnd();
   }
};

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
  addHighlights(source);
}

function onClick (square, piece, position, orientation) {
   removeHighlights();
   if (selectedPiece){
       onDrop(selectedPiece.loc, square, selectedPiece.piece);
   }
   onSnapEnd();
}

function onDrop (source, target, piece) {
  removeHighlights();

  // if source = target, a piece is selected for clicking move
  if (source === target){
     if (selectedPiece){
        if (selectedPiece.loc === source){
           selectedPiece = null;
           return;
        }
     }
     selectedPiece = { loc : source, piece : piece };
     addHighlights(source);
  }

    var fen = game.fen();
    var prom = 'q';
    var waiting = 10;
    var is_capture = false;
    if (promotionPiece)   { prom = promotionPiece }
    if (selectedPiece)    { waiting = 90; }
    if (game.get(target)) { is_capture = true; }

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: prom
  })

  // illegal move
  if (move === null) return 'snapback'

  // handle promotions
  if ((target.substring(1,2) === '8' && piece === 'wP') ||
      (target.substring(1,2) === '1' && piece === 'bP')) {
      if (!promotionPiece){
          game.load(fen);
          setTimeout(function(){ popSelectPiece(target); }, waiting);
          askForPromotion(source, target, piece);
          return;
      } else {
          promotionPiece = null;
      }
  }

  if (is_capture){ capture_sound.play(); } else { move_sound.play(); }
  puzzleInteraction(move);
}

function highlightSquare(square, hcolor, ms) {
    var squareEl = $('#myBoard .square-' + square);
    if (squareEl.hasClass('black-3c85d') === true) { highlight = hcolor + '-black'; }
    else                                           { highlight = hcolor + '-white'; }
    squareEl.addClass(highlight);

    setTimeout(function(){
        $('#myBoard .white-1e1d7').removeClass(hcolor + '-white');
        $('#myBoard .black-3c85d').removeClass(hcolor + '-black');
    }, ms);
};

function automatic_move(move) {
    var is_capture = false;
    if (game.get(move.to)) { is_capture = true; }

    game.move(move);
    board.position(game.fen());
    if (is_capture){ capture_sound.play(); } else { move_sound.play(); }
}

function undo_until_move() {
    game.undo();
    board.position(game.fen());

    variantIdx++;
    var move = solution[variantIdx];

    setTimeout(function(){
        if (move === 'undo'){ undo_until_move(); return; }
        if (move === '-'){ variantIdx++; return; }

        automatic_move({ from: move.substr(0,2), to: move.substr(2,2), promotion: move.substr(4,1) });
        board.position(game.fen());
        variantIdx++;
        if (variantIdx >= solution.length){
            finishPuzzle();
        }
        if (solution[variantIdx] === 'undo'){
            setTimeout(function(){ undo_until_move(); }, 1000);
        }
    }, 800);
};

function puzzleInteraction(move) {
    var m = move.from + move.to;
    if (move.promotion){
        m += move.promotion;
    }

    var suggested = solution[variantIdx];

    if (suggested && m === suggested){
        highlightSquare(move.from, 'suggestion', 700);
        highlightSquare(move.to, 'suggestion', 700);
        if (solution[variantIdx+1] === 'solved'){ finishPuzzle(); return; }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setTimeout(async function(){
        if (m === suggested){
            if (variantIdx >= solution.length){ finishPuzzle(); return; }
            variantIdx++;
            var ans = solution[variantIdx];

            if (!ans){ finishPuzzle(); return; }

            if (ans === 'undo'){ undo_until_move(); return; }

            if (ans === 'custom') {
                variantIdx++;
                let fen = solution[variantIdx].replaceAll('_', ' ');
                variantIdx++;
                board.position(fen);
                while (solution[variantIdx] == 'custom') {
                    await sleep(700);
                    variantIdx++;
                    let fen = solution[variantIdx].replaceAll('_', ' ');
                    variantIdx++;
                    board.position(fen);
                }
                if (solution[variantIdx] == 'set') {
                    variantIdx++;
                    let fen = solution[variantIdx].replaceAll('_', ' ');
                    variantIdx++;
                    console.log(fen);
                    game.load(fen);
                }
                return;
            }

            automatic_move({ from: ans.substr(0,2), to: ans.substr(2,2), promotion: ans.substr(4,1) });
            board.position(game.fen());
            variantIdx++;
            if (variantIdx >= solution.length){
                setTimeout(function(){ finishPuzzle(); }, 700);
            }
            if (solution[variantIdx] === 'undo'){  undo_until_move(); return; }

        } else {
            game.undo();
            board.position(game.fen());
        }
    }, 700);
}

function finishPuzzle() {
    bell_sound.play();
    setTimeout(function(){ loadPuzzle(lastLoaded+1); }, 1500);
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
   board.position(game.fen());
}

function loadPuzzle(i) {
    let puzzles = fav_puzzles;
    if (is_mine) {
        puzzles = my_puzzles;
    }
    if (i >= puzzles.length) { i = 0 };
    $('#pz' + lastLoaded).removeClass('btn-success').addClass('btn-secondary');
    $('#pz' + i).removeClass('btn-secondary').addClass('btn-success');

    variantIdx = 0;
    lastLoaded = i;
    solution   = puzzles[i].solution.split(' ');
    document.getElementById('puzzlegoal').innerHTML = puzzles[i].goal;

    var fen = puzzles[i].fen;
    game.load(fen);
    if (game.turn() === 'b'){ board.orientation('black'); }
    else { board.orientation('white'); }
    buildBoard(puzzles[i].draggable, fen);
}

function buildBoard(is_draggable, fen){
    var config = {
        draggable: is_draggable,
        position: '8/8/8/8/8/8/8/8 w - - 0 1',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        appearSpeed: 'fast',
        onMouseClickSquare: onClick,
        pieceTheme: piecesPath + '{piece}.png'
    };
    game.load(fen);
    board = Chessboard('myBoard', config);
    if (game.turn() === 'b'){ board.orientation('black'); }
    else { board.orientation('white'); }
    board.position(fen, false);
}

var fav_puzzles = [
    // Paul Heüacker, <i>Neue Freie Presse</i> (1920)
    { fen: '1B6/8/7P/4p3/3b3k/8/8/2K5 w - - 0 1',
      solution: 'b8a7 d4a1 c1b1 a1c3 b1c2 c3a1 a7d4 e5d4 c2d3 undo undo a1d4 c2d3 h4g5 h6h7 d4a1 d3e4 undo undo g5g6 h7h8q e5e4 d3d4 solved',
      goal : 'White to move',
      draggable: true,
    },

    // A. & K. Sarychev Brothers (1928)
    { fen: '8/1pPK3b/8/8/8/5k2/8/8 w - - 0 1',
      solution: 'd7c8 b7b5 c8d7 b5b4 d7d6 h7f5 d6e5 f5c8 e5d4 b4b3 d4c3 c8e6 c7c8q e6c8 c3b3 solved',
      goal : 'White to move',
      draggable: true,
    },

    // J. Gunts, <i>Das Illustrierte Blatt</i> (1922)
    { fen: '1NBk4/p2p4/8/3K4/8/8/8/8 w - - 0 1',
      solution: 'c8b7 a7a5 b8a6 undo undo d8c7 b7a6 c7b8 d5d6 b8a8 d6c7 d7d5 a6b7 solved',
      goal : 'White to move',
      draggable: true,
    },

    // Leonid Kubbel, <i>Shakhmatny Listok</i> (1922)
    { fen: '8/N7/K6B/3k4/3p4/p7/2PP4/8 w - - 0 1',
      solution: 'a7c6 a3a2 c6b4 undo undo d5c6 h6g7 c6c5 g7f8 undo undo c6d5 d2d3 a3a2 c2c4 d4c3 g7c3 undo undo d5c5 a6b7 a2a1q g7f8 undo undo c5b4 g7d4 solved',
      goal : 'White to move',
      draggable: true,
    },

    { fen: '2N5/p7/q1p2p2/kp6/3P4/PP2K3/5P2/2B5 w - - 0 1',
      solution: 'c1d2 b5b4 d2b4 a5b5 c8d6 b5b6 b4a5 a6a5 d6c4 undo undo b6a5 d6c4 a5b5 e3f4 a6c8 c4d6 undo undo c6c5 d4d5 f6f5 f4g5 f5f4 f2f3 solved',
      goal : 'White to move',
      draggable: true,
    },

    { fen: '1kb5/1pNp4/1B1Pp3/P1p1p3/2p1P3/2PP4/3P1PKP/Q3R3 w - - 0 1',
      solution: 'e1h1 c4d3 a1g1 c5c4 f2f4 e5f4 b6a7 solved',
      goal : 'White to mate in 4',
      draggable: true,
    }
];

var my_puzzles = [
    { fen: 'r1b1k2r/1pppppp1/7B/p7/1N6/1PP5/NPP1PPPP/2KR1B1R w - - 0 1',
      solution: '',
      goal : 'Black retains full castling rights. Whose turn is it?',
      draggable: false,
    },

    { fen: 'Nr1bk1Br/1p2pp1p/1p1p1p2/pP6/6n1/8/1PPPP1P1/RqB1K2R w KQk f6 0 1',
      solution: '',
      goal : 'Can White capture en passant?',
      draggable: false,
    },

    { fen: '1rb1k1Nr/pppppp1p/7p/8/8/PP6/1P1PPPPP/nRB1K2R w KQ - 0 1',
      solution: '',
      goal : 'White to move. Both castings are enabled. What piece was captured by the pawn on h6?',
      draggable: false,
    },

    { fen: '8/4k3/2Q5/8/3K4/7p/7P/8 w - - 0 1',
      // solution : 'd4e5 custom 8/4k3/2Q5/8/3K4/7p/7P/8 custom 3k1k2/5k2/2Q5/8/3K4/7p/7P/8 custom 3k1k2/5k2/2Q5/4K3/8/7p/7P/8 custom 5kk1/4kkk1/2Q5/4K3/8/7p/7P/8 set 5k2/8/2Q5/4K3/8/7p/7P/8_w_-_-_0_1 c6d6 custom 4k1kk/5kkk/3Q4/4K3/8/7p/7P/8 set 6k1/8/3Q4/4K3/8/7p/7P/8_w_-_-_0_1 e5f5 f d6c7 f f5f6 f c7c8 f c8d7 f d7g7 f g7g5 solved',
      solution : '',
      goal: 'Black to move. White premoves to mate in a linear sequence of 9 moves',
      draggable: false,
    },

    { fen: '6kB/p3p1P1/2p3P1/p7/8/4P3/PKP5/8 w - - 0 1',
      solution : '',
      goal: 'White ran out of time. Result?',
      draggable: false,
    },

    { fen: '1N6/p5KP/P2p4/2pPk1p1/2P1p1P1/b3P1P1/2P5/8 w - - 0 1',
      solution: 'h7h8b solved',
      goal : 'You have touched the pawn on h7 and must move it. You can only make one move before you run out of time. What is the best move?',
      draggable: true,
    },

    { fen: '8/8/8/8/1p6/p6B/k1K4N/8 w - - 0 1',
      solution: 'h3e6 b4b3 e6b3 a2a1 b3a2 a1a2 h2f3 a2a1 f3d4 a1a2 d4e2 a2a1 e2c1 a3a2 c1b3 solved',
      goal : 'White to move',
      draggable: true,
    },

    { fen: '8/8/8/1P3r2/BpPk4/1p1b4/P5PP/R3K3 b Q c3 0 2',
      solution: 'd4e3 a1d1 f5f1 undo undo e1c1 undo undo - b4c3 solved',
      goal : 'It is Black to move. Can they checkmate in 2 moves?',
      draggable: true,
    },

];

buildBoard(true, '8/8/8/8/8/8/8/8 w - - 0 1');
let is_mine = false;
