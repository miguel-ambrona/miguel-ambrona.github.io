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

  if (state.mode === 'opening' && !state.play_robot){
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
        fen_id = mod(fen_id, fens.length);
        puzzle = fens[fen_id];
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

fens = [
    'rnbqk2r/p1pnbppp/1p2p3/3pP3/3P4/2PB4/PP1N1PPP/R1BQK1NR w KQkq - 1 7',
    'r1bq1rk1/pp1pppbp/5np1/n7/3NP3/1BN1B3/PPP2PPP/R2QK2R w KQ - 9 9',
    'r1bqk2r/ppp1npb1/2npp1pp/8/3PP3/2N1BN2/PPPQ1PPP/2KR1B1R w kq - 0 8',
    'r3k2r/pp1nbppp/2pqpn2/5b2/2BP4/2N2N1P/PPP1QPP1/R1B2RK1 w kq - 3 10',
    'r1b1k1nr/1p1p1ppp/p1n3q1/4p3/4P3/8/PPP2PPP/RNBQKB1R w KQkq - 3 9',
    'r1bqkb1r/3p1ppp/p1n2n2/1p2p3/4P3/1N1B4/PPP2PPP/RNBQ1RK1 w kq - 0 8',
    'r1bqkb1r/1p1npppp/p2p1n2/6B1/3NP3/2N5/PPP2PPP/R2QKB1R w KQkq - 2 7',
    'r1bqkb1r/1p1npp2/p2p1npp/8/3NPP1B/2N5/PPP3PP/R2QKB1R w KQkq - 0 9',
    'r1bqk2r/1p1nppb1/p2p1npp/8/3NPP1B/2N2Q2/PPP3PP/R3KB1R w KQkq - 2 10',
    'r1bqkbnr/pp3ppp/2np4/1N2p3/4P3/8/PPP2PPP/RNBQKB1R w KQkq - 0 6',
    'rnb1kb1r/ppp2ppp/4pq2/8/2B5/2Q5/PPPP1PPP/R1B1K1NR w KQkq - 1 7',
    'r1b1k2r/1pppqpp1/pbn2n1p/4p3/4P3/1BPP1N2/PP1N1PPP/R1BQ1RK1 w kq - 0 9',
    'rn1qk2r/pp2bppp/2p1p3/3pP3/3P4/2PQ1N2/P1P2PPP/R1B2RK1 w kq - 2 10',
    'r1bqkb1r/1p1nppp1/p2p1n1p/6B1/3NPP2/2N5/PPP3PP/R2QKB1R w KQkq - 0 8',
    'rnbqk1nr/pp1pppbp/6p1/2p5/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4',
    'r1bq1rk1/pppp1pp1/2n2n1p/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 0 7',
    'rnbqk2r/1p2npp1/p1p1p2p/3pP3/1b1P4/2NB1N2/PPP2PPP/R1BQ1RK1 w kq - 0 8',
    'r1b1k1nr/1p1p1ppp/p1n5/4p3/4q3/2P5/PP3PPP/RNBQKB1R w KQkq - 0 10',
    'r1bq1rk1/ppp2pp1/2n2n1p/2bpp3/4P3/1BPP1N2/PP1N1PPP/R1BQ1RK1 w - - 0 9',
    'r2qk2r/p2nbppp/bpn1p3/2ppP3/3P4/2P5/PPBNNPPP/R1BQ1RK1 w kq - 2 10',
    'r1bqk2r/ppp2pp1/2np1n1p/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w kq - 0 7',
    'r2q1rk1/ppp2pp1/2npbn1p/2b1p3/4P3/1BPP1N1P/PP3PP1/RNBQ1RK1 w - - 1 9',
    'rnbqkb1r/pp2pppp/2p5/3nP3/8/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 6',
    'r1b1kb1r/ppp2ppp/2n1pq2/8/2BP4/2Q5/PPP2PPP/R1B1K1NR w KQkq - 1 8',
    'r1bqkb1r/pp1n1ppp/3ppn2/6B1/3NP3/2N5/PPP2PPP/R2QKB1R w KQkq - 0 7',
    'rnbqkbnr/pp1ppppp/8/2p5/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2',
    'r1b1k1nr/ppp3pp/2nb1p2/1B6/4qp2/1PN1PN2/PBPP2PP/R2QK2R b KQkq - 2 9',
    'r1bq1rk1/1p1nbppp/p2ppn2/6B1/3NP2P/2N2P2/PPPQ2P1/2KR1B1R b - - 0 10',
    'r1b1kb1r/pp1p1ppp/4pn2/n1P5/8/5P2/PPP1PBPP/RN2KBNR b KQkq - 1 7',
    'r1bqk1nr/ppp2ppp/2nb4/1B1pp3/5P2/1P2P3/PBPP2PP/RN1QK1NR b KQkq - 0 5',
    'r1bqkbnr/1p1p1ppp/p3p3/3P4/3QP3/2N5/PPP2PPP/R3KBNR b KQkq - 1 7',
    'rnbqkb1r/pppppppp/5n2/8/3P4/4P3/PPP2PPP/RNBQKBNR b KQkq - 0 2',
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    'r2q1rk1/pbpnbppp/1p2p3/3p4/2PPnB2/2NBPN2/PP3PPP/2RQ1RK1 b - - 5 10',
    'r1bqk2r/pp3ppp/1nnbp3/8/3N4/1BP5/PP3PPP/RNBQ1RK1 b kq - 0 10',
    'rn1qk2r/1p2bppp/p2pbn2/4p3/4PP2/1NNBB3/PPP3PP/R2QK2R b KQkq - 0 9',
    'r1bq1rk1/1p2ppbp/2np1np1/p7/4P3/PPN5/1BPQNPPP/2KR1B1R b - - 0 10',
    'rn1q1rk1/p3bppp/1p3n2/2pp2B1/3P2b1/2NBPN1P/PP3PP1/R2Q1RK1 b - - 0 10',
    'rn1q1rk1/pbp1bppp/1p1ppn2/8/2PPP3/2NN1P2/PP4PP/R1BQKB1R b KQ - 0 8',
    'rn1q1rk1/pp3ppp/2pbbn2/8/4PP2/7P/PPPNN1B1/R1BQK2R b KQ - 0 10',
    'r2qkbnr/pp1b1ppp/2np4/1Bp1p3/4PP2/1P3N2/PBPP2PP/RN1QK2R b KQkq - 1 6',
    'rn1qkb1r/pbp2ppp/1p1ppn2/4P3/2PP1P2/2N5/PP4PP/R1BQKBNR b KQkq - 0 6',
    'r1bqkbnr/pp1ppppp/2n5/2p5/2P5/2N2N2/PP1PPPPP/R1BQKB1R b KQkq - 3 3',
    'r1bq1rk1/pp1n1pp1/3bpn1p/2pp4/3P3B/2PBPN2/PP1NQPPP/R3K2R b KQ - 2 9',
    'rnbq1rk1/pp2ppbp/3p1np1/2pP4/2P1P1P1/2N5/PP2BP1P/R1BQK1NR b KQ - 0 7',
    'r1bq1rk1/1p2ppbp/p1nP1np1/8/3N4/2N3P1/PP2PPBP/R1BQ1RK1 b - - 0 10',
    'rn1q1rk1/pbpnbppp/1p1pp3/4P3/2PP1P1P/2NB1N2/PP4P1/R1BQK2R b KQ - 0 9',
    'r1bqkb1r/pp2pppp/2np1n2/8/3PP3/5N2/PP2BPPP/RNBQK2R b KQkq - 0 6',
    'r1bqkb1r/p3pppp/2p2n2/2pp4/5P2/4P3/PPPPB1PP/RNBQK2R b KQkq - 2 6',
    'rnbqnrk1/ppp1ppbp/6p1/4P3/2BP3P/2N2N2/PP3PP1/R1BQK2R b KQ - 0 9',
    'rnbqkb1r/pp1p1ppp/4pn2/2P5/8/4BP2/PPP1P1PP/RN1QKBNR b KQkq - 0 4',
    'r1bq1rk1/pp2bppp/2nppn2/8/3PP3/2N2N2/PP2BPPP/R1BQR1K1 b - - 5 9',
    'rnbq1rk1/pp2ppbp/3p1np1/8/3QP3/1PN5/PBP1NPPP/2KR1B1R b - - 5 8',
    'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1',
    'rnbqk2r/p4ppp/1p1bpn2/2pp4/3P4/2P1PNB1/PP1N1PPP/R2QKB1R b KQkq - 1 7',
    'rn3rk1/pb3ppp/1p1qpn2/2ppN3/P2P4/2P1P3/1P1N1PPP/R2QKB1R b KQ - 1 10',
    'rnbq1rk1/1p2bppp/p2ppn2/6B1/3NP3/2N2P2/PPPQ2PP/2KR1B1R b - - 0 9',
    'rnbq1rk1/p1p1bppp/1p3n2/3p2B1/3P4/2NBPN2/PP3PPP/R2QK2R b KQ - 1 8',
    'rnb1kbnr/ppp1pppp/8/3q4/8/2N5/PP1PPPPP/R1BQKBNR b KQkq - 1 3',
    'r1bqk2r/pp3pp1/2nbp2p/3n4/3P4/2NB1N2/PP3PPP/R1BQ1RK1 b kq - 1 10',
    'rnbqk2r/pp3ppp/3bpn2/2pp4/3P4/2P1PNB1/PP3PPP/RN1QKB1R b KQkq - 0 6',
    'rnbqk2r/pp1pppbp/6p1/8/3N4/B1P5/P1P1QPPP/R3KB1R b KQkq - 3 8',
    'rn1q1rk1/pb3ppp/1p1bp3/2pp4/3Pn3/2P1PNB1/PP1N1PPP/1BRQK2R b K - 5 10',
    'rnb1kb1r/pp1p1ppp/4pn2/q1P5/8/4BP2/PPPQP1PP/RN2KBNR b KQkq - 2 5',
    'r1bqkb1r/ppp2ppp/5n2/3Pn3/8/2N1P3/PP3PPP/R1BQKBNR b KQkq - 2 6',
    'rnbq1rk1/1p2bppp/p2p1n2/4pP2/4P3/1BN5/PPP1N1PP/R1BQK2R b KQ - 1 10',
    'r2q1rk1/pp1bnpbp/2npp1p1/1Bp3B1/4P3/P1NP1N1P/1PP2PP1/R1Q2RK1 b - - 2 10',
    'r1bq1rk1/pp3ppp/2n1pn2/2bp4/4P3/2PB1N2/PP1N1PPP/R1BQ1RK1 b - - 0 9',
    'r2qk2r/pp1bbppp/2np1n2/1Bp5/2P1Pp2/1P1P1N2/PB4PP/RN1Q1RK1 b kq - 0 9',
    'r1b2rk1/ppq2ppp/2nbp3/2ppN3/3PnB2/2PBPN2/PPQ2PPP/R3K2R b KQ - 10 10',
    'rnb1kb1r/p1p1pppp/1p3n2/1B1qN3/8/1Q2P3/PP1P1PPP/RNB1K2R b KQkq - 1 7',
    'rnbqk2r/pppnBppp/4p3/3pP3/3P4/3B4/PPP2PPP/RN1QK1NR b KQkq - 0 6',
    'r1bqkbnr/p3pppp/2p5/2pp4/5P2/4P3/PPPP2PP/RNBQKB1R b KQkq - 0 5',
    'rn1qkb1r/pbpn1ppp/1p1pp3/4P3/2PP1P2/2N2N2/PP4PP/R1BQKB1R b KQkq - 2 7',
    'rnbq1rk1/p3bppp/1p3n2/2pp2B1/3P4/2NBPN2/PP3PPP/R2Q1RK1 b - - 1 9',
    'r1bq3r/pp1nkppp/2n1p3/3pP3/2pP1P2/2P2N2/PPB3PP/RN1QK2R b KQ - 1 10',
    'r1bq3r/pp1nkppp/2n1p3/2ppP3/3P1P2/2PB1N2/PP4PP/RN1QK2R b KQ - 2 9',
    'r1bqkb1r/ppp2ppp/5n2/3Pn3/8/2N1P3/PP3PPP/R1BQKBNR b KQkq - 2 6',
    '8/p7/1pr1p1p1/3k1p1p/1P1Pp3/P2bK1P1/1B5P/2R5 b - - 1 35',
    '3q3k/pbp3p1/1p2P2p/2b2p2/2B2B2/2P2P2/P3Q1PP/7K b - - 0 25',
    '1rbr2k1/2qn1ppp/pp1pp2P/8/P3P1P1/1BN2PQ1/1PP5/R4RK1 b - - 0 19',
    '8/1N1k4/4p3/p2pP1p1/p2P2P1/1P1K4/8/2b5 w - - 0 61',
    '1kr1r3/ppqb2b1/2np2p1/3Bp1B1/4Pp1P/PN3P2/1PPQ3R/1K1R4 w - - 2 24',
    '4r3/5kp1/p1pq1pp1/3pp2r/3P2Q1/2P1R2P/PP3PP1/4R1K1 w - - 0 22',
    'r3k1r1/pp3p2/2p1p2p/4Nq2/1P1P1n2/2P2Q1P/P4PP1/R4RK1 w q - 2 25',
    '1kb5/1pNp4/1B1Pp3/P1p1p3/2p1P3/2PP4/3P1PKP/Q3R3 w - - 0 1',
    'r4b1k/ppqn2p1/2p1Q2B/7p/3p2nN/8/PPP2PP1/R4RK1 w - - 7 21',
    '8/8/8/8/8/6P1/6k1/4KR1R w K - 0 1',
    '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
    'R2K4/8/3k4/2R5/7r/8/8/8 w - - 0 1',
    '8/8/7P/1K6/8/2k5/p7/8 w - - 0 1',
    '1B6/8/7P/4p3/3b3k/8/8/2K5 w - - 0 1',
    'r1bqr3/ppp1B1kp/1b4p1/n2B4/3PQ1P1/2P5/P4P2/RN4K1 w - - 0 1',
    'r1bk3r/pppq1ppp/5n2/4N1N1/2Bp4/Bn6/P4PPP/4R1K1 w - - 0 1',
    '6kr/pp2r2p/n1p1PB1Q/2q5/2B4P/2N3p1/PPP3P1/7K w - - 0 1',
    'r3k3/pbpqb1r1/1p2Q1p1/3pP1B1/3P4/3B4/PPP4P/5RK1 w - - 0 1'
];
