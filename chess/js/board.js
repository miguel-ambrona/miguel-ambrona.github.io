// NOTE: this code uses the chess.js library:
// https://github.com/jhlywa/chess.js

// It also requires (encrypted-)opening-puzzles.js

var board = null
var game = new Chess()

var state = {
    playerColor    : null,
    selectedPiece  : null,
    promotionPiece : null,
    humansMoving   : true,
    mistake        : false,
    lastMoveTime   : null,
    initialPly     : 1,
    mode           : 'opening',
    openingVariant : null,
    variantIdx     : 0,
    free_edit      : false,
    play_robot     : false,
    shot_active    : false,
    game_active    : false,
    tree_bound     : 10000,
    all_puzzles    : null,
    puzzles        : null,
    tags           : null,
    errors         : [],
    bombs_active   : false,
    errors_active  : false,
    random_active  : false,
    passwordHash   : null,
    game_lines     : null,
    hind_counter   : 0
};

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
    state.promotionPiece = piece[1].toLowerCase();
    $('#myboard').find('.square-55d63').removeClass('promotion-background').removeClass('promotion-mask');
    $('#prom0').remove();  $('#prom1').remove();  $('#prom2').remove();  $('#prom3').remove();
};

function popSelectPiece(target){
    state.selectedPiece = null;
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
        link = '<a href="#" onClick="clickOnPromotion(\'' + rows[i][1] + '\')" ';
        link += 'style="z-index:100">'  + img + '</a>';
        el.innerHTML = link;
        $('#myBoard').find('.square-' + thisSquare).addClass('promotion-background').removeClass('promotion-mask');
    }
};

function askForPromotion(source, target, piece){
   if (!state.promotionPiece) {
       setTimeout(function(){ askForPromotion(source, target, piece); }, 300);

   } else {
       onDrop(source, target, piece);
       onSnapEnd();
   }
};

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // do not pick up pieces if it is not the human's turn
  if (!state.humansMoving && !state.free_edit) return false

  //do not pick up pieces if 'shot mode' is activated
  if (state.shot_active) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
  removeHighlights();
  addHighlights(source);
}

function onClick (square, piece, position, orientation) {
   removeHighlights();
   if (state.selectedPiece){
       onDrop(state.selectedPiece.loc, square, state.selectedPiece.piece);
   }
   onSnapEnd();
}

function playSound(is_capture, move){
    var is_castle = move.san.split('O').length >= 3;
    if (is_capture){ capture_sound.play(); } else { move_sound.play(); }
    if (is_castle){ setTimeout(function(){ move_sound.play(); }, 180); }
}

function onDrop (source, target, piece) {
  removeHighlights();

  // if source = target, a piece is selected for clicking move
  if (source === target){
     if (state.selectedPiece){
        if (state.selectedPiece.loc === source){
           state.selectedPiece = null;
           return;
        }
     }
     state.selectedPiece = { loc : source, piece : piece };
     addHighlights(source);
     return;
  }

  var previous_fen = game.fen();
  var prom = 'q';
  var waiting = 10;
  var is_capture = false;
  if (state.promotionPiece)   { prom = state.promotionPiece }
  if (state.selectedPiece)    { waiting = 90; }
  if (game.get(target)) { is_capture = true; }

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: prom
  });

  // illegal move
  if (move === null) return 'snapback'

  // handle promotions
  if ((target.substring(1,2) === '8' && piece === 'wP') ||
      (target.substring(1,2) === '1' && piece === 'bP')) {
      if (!state.promotionPiece){
          game.load(previous_fen);
          setTimeout(function(){ popSelectPiece(target); }, waiting);
          askForPromotion(source, target, piece);
          return;
      }
  }
  state.promotionPiece = null;
  playSound(is_capture,move);
  state.selectedPiece = false;
  state.lastMoveTime = Date.now();

  state.humansMoving = !state.humansMoving;

  //updateStatus();
  removeEngineMove();

  if (state.free_edit){ return; }

  if ((state.mode === 'opening' || state.mode === 'puzzle') && !state.play_robot){
      if (!state.humansMoving){ openingInteraction(move); }
  } else {
      if (!state.humansMoving){ engineInteraction(previous_fen, move); }
  }
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
   board.position(game.fen());
}

function removeEvaluation() {
    $('#eval-btn').addClass('btn-hidden');
    $('#dpth-btn').addClass('btn-hidden');
};

function showEvaluation() {
    var eval = evaluations[game.fen()];
    if (eval){
        $('#eval-btn').removeClass('btn-hidden');
        $('#dpth-btn').removeClass('btn-hidden');
    }
};

function removeEngineMove() {
    $('#myBoard .white-1e1d7').removeClass('engine-white');
    $('#myBoard .black-3c85d').removeClass('engine-black');
}

function updateStatus () {
    removeEvaluation();
    removeEngineMove();
}

function buildBoard(is_draggable, fen){
  var config = {
    draggable: is_draggable,
    position: '8/8/8/8/8/8/8/8 w - - 0 1',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onMouseClickSquare: onClick,
    pieceTheme: piecesPath + '{piece}.png'
  };
  game.load(fen);
  board = Chessboard('myBoard', config);

  if (state.playerColor === 'b'){ board.flip(); }
  board.position(fen, false);
}

function extract_fen(str){
    var w = str.split(' ');
    return w.slice(0,6).join(' ');
}

function extract_openingVariant(str){
    var w = str.split(' ');
    return w.slice(6,w.length);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPerm(n){
    var all = Array.from({length: n}, (x,i) => i);
    var perm = [];
    while (all.length > 0){
        var i = getRandomInt(0, all.length-1);
        perm.push(all[i]);
        all.splice(i, 1);
    }
    return perm;
};

function mod(a,b){ return ((a%b)+b)%b };

var fen_id = 0;
var tag_id = 0;

function getPuzzles(){
    if (!state.passwordHash) {
        state.passwordHash = sessionStorage.getItem('passwordHash');
        if (!state.passwordHash){ $('#passwordModal').modal('toggle'); return false; }
    }

    var key32 = key_of_sha256(state.passwordHash);
    var key = key32.slice(0,16);
    var iv  = key32.slice(16,32);

    var decrypted_puzzles = decrypt_puzzles(key, iv, opening_puzzles);
    var decrypted_games   = decrypt_puzzles(key, iv, opening_games);

    var decrypted_info    = decrypt_info(key, iv, opening_info);

    var id = getQueryVariable("id");
    if (!id){ id = 0 };
    state.all_puzzles = decrypted_puzzles[id];
    state.game_lines  = decrypted_games[id];
    state.tags  = opening_puzzles[id].tags;
    state.bombs = opening_puzzles[id].bombs.map(function(b){return b-1});

    $('#info-text').html(decrypted_info[id].name + '&nbsp;&nbsp;(' + decrypted_info[id].variant.substr(0,3) + ')');
    return true;
}

function filterByTree(puzzles) {
    var output = [];
    for (var i = 0; i < puzzles.length; i++){
        var puzzle = state.all_puzzles[puzzles[i]];
        var fen = extract_fen(puzzle);
        var initialPly  = parseInt(fen.split(' ')[5], 10);

        if (initialPly <= state.tree_bound){
            output.push(puzzles[i]);
        }
    }
    return output;
};

getPuzzles();

function loadNewFen(){
    var puzzle;
    state.mistake = false;
    state.hint_counter = 0;

    if (state.mode === 'opening'){

        if (state.bombs_active)      { state.puzzles = state.bombs; }
        else if (state.errors_active){ state.puzzles = state.errors; }
        else                         { state.puzzles = Array.from({length: state.all_puzzles.length}, (x,i) => i);; }

        if (state.random_active){ fen_id = getRandomInt(0, state.puzzles.length-1); }

        fen_id = mod(fen_id, state.puzzles.length);
        tag_id = mod(tag_id, state.tags.length);
        puzzle = state.all_puzzles[state.puzzles[fen_id]];

        state.openingVariant = extract_openingVariant(puzzle);
        state.variantIdx = 0;
    }
    else {
        fen_id = mod(fen_id, tactic_games.length);
        puzzle_parts = tactic_games[fen_id].split('|');
        $('#info-text').html(puzzle_parts[0]);
        puzzle = puzzle_parts[1];
        state.openingVariant = extract_openingVariant(puzzle);
        state.variantIdx = 0;
    }

    if (state.game_active){
        var i = getRandomInt(0, state.game_lines.length-1);
        puzzle = state.game_lines[i];
        state.openingVariant = extract_openingVariant(puzzle);
        state.variantIdx = 0;
    }

    var fen = extract_fen(puzzle);
    state.playerColor = fen.split(' ')[1];
    state.initialPly  = parseInt(fen.split(' ')[5], 10);

    $('#pnum-btn').html(state.puzzles[fen_id]+1);
    state.humansMoving = true;
    game.load(fen);
    if (state.playerColor === 'w'){ board.orientation('white'); }
    else                          { board.orientation('black'); }
    board.position(fen);

    updateStatus();
}

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}
