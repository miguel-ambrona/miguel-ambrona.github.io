// This code requires board.js and vice versa
// The same with gui.js (for function evaluationIsFinished(eval))

var engine = new Worker('lib/stockfish.js');

var analyzing       = false;
var last_fen        = null;
var last_evaluation = null;
var incorrect_in_a_row = 0;

var evaluations = {};

engine.onmessage = function(event) {
    var words = event.data.split(' ');

    if (words[0] == 'bestmove'){
        last_evaluation.push('turn');
        last_evaluation.push(last_fen.split(' ')[1]);
        evaluations[last_fen] = last_evaluation;
        analyzing = false;
        evaluationIsFinished(last_evaluation);

    } else if (words[0] == 'info' && words.indexOf('depth') !== -1){
        if (words.indexOf('pv') === -1){ last_evaluation = words.concat(['pv', null]); }
        else { last_evaluation = words; }
    }
};

function evalPosition(fen, depth) {
    last_fen = fen;
    engine.postMessage('position fen ' + fen);
    if (depth){ engine.postMessage('go depth ' + depth); }
    else      { engine.postMessage('go movetime 1000'); }
};

function getEval(fen, depth){
    var eval = evaluations[fen];

    if (eval){
        if  (!depth){ return eval; }
        var eval_depth = eval[1+eval.indexOf('depth')];
        if (parseInt(eval_depth, 10) >= parseInt(depth, 10)){ return eval; };
    }
    if (analyzing){ setTimeout(function(){ getEval(fen) }, 100) }
    else { analyzing = true; evalPosition(fen, depth); getEval(fen); }
}

function material(fen){
    var white = -2110; // The trick with split will count one piece extra of each type
    var black = -2110;
    fen = fen.split(' ')[0];
    white += 100*fen.split('P').length + 300*fen.split('N').length + 310*fen.split('B').length;
    white += 500*fen.split('R').length + 900*fen.split('Q').length;
    black += 100*fen.split('p').length + 300*fen.split('n').length + 310*fen.split('b').length;
    black += 500*fen.split('r').length + 900*fen.split('q').length;
    return { white: white, black: black }
};

function filterRanks(fen, ranks){
    var all_ranks = fen.split(' ')[0].split('/')
    var output = ''
    for (var i = 0; i < ranks.length; i++){
        output += all_ranks[ranks[i]];
    }
    return output
};

function playerIsWinning (eval, turn){
    var idx = eval.indexOf('cp');
    var mate = false; if (idx === -1){ idx = eval.indexOf('mate'); mate1 = true; }
    var v = eval[idx+1];

    if (turn === 'machine'){ v = -v; }
    return ((mate && v > 0) || (!mate && v > 200))
}

function tooEasy(eval,turn){
    if (game.game_over()){ return true; }
    if (parseInt(game.fen().split(' ')[5], 10) - state.initialPly < 5){ return false; }
    var fen = game.fen();
    var mat = material(fen);

    if (state.playerColor === 'w') {
        if (mat.black === 0) { return mat.white >= 300 }
        if (filterRanks(fen, [6]).split('p').length <= 1){ // Black has not a pawn in the 7-th rank
            if (mat.white - mat.black >= 400){ return playerIsWinning(eval,turn) }
        }
    }
    if (state.playerColor === 'b'){
        if (mat.white === 0) { return mat.black >= 300 }
        if (filterRanks(fen, [1]).split('P').length <= 1){ // White has not a pawon in the 7-th rank
            if (mat.black - mat.white >= 400){ return playerIsWinning(eval,turn) }
        }
    }
    return false
}


function highlightBoard(option, ms) {
    $('#myBoard .white-1e1d7').addClass(option + '-white');
    $('#myBoard .black-3c85d').addClass(option + '-black');

    if (ms){
        setTimeout(function(){
            $('#myBoard .white-1e1d7').removeClass(option + '-white');
            $('#myBoard .black-3c85d').removeClass(option + '-black');
        }, ms);
    }
};

function highlightMistake()  { highlightBoard('bad-move'); };
function highlightMainLine() { highlightBoard('good-move'); };

function similar_evaluations(eval1, eval2) {
    // eval1 is the evaluation of a position at ply n
    // eval2 is the evaluation of a position at ply n+1 (after one move)

    var idx1 = eval1.indexOf('cp');
    var idx2 = eval2.indexOf('cp');
    var mate1 = false;
    var mate2 = false;
    if (idx1 === -1){ idx1 = eval1.indexOf('mate'); mate1 = true; }
    if (idx2 === -1){ idx2 = eval2.indexOf('mate'); mate2 = true; }

    var v1 =  eval1[idx1+1];
    var v2 = -eval2[idx2+1]; // Change the sign to make them comparable

    if (mate1 && v1 > 0){  // We are winning
        if (!mate2){ return v2 >= 1000; }
        if (v2 - v1 >= 0){ return v1 >= 5 }  // There is still mate, but longer
        return (v2 > 0);
    }
    else if (mate1) { v1 - v2 <= 2 } // We are getting mated, nothing matters...

    else if (v1 > 200) {   // Not mate, but we are much better
        if (mate2)    { return false }  // Terrible move, from winning to getting mated
        if (v2 > 200) { return v1 - v2 <= 50 }
        else          { return false }
    }
    else if (v1 > -200) {  // We may still hold a draw
        if (mate2)     { return false }
        if (v2 > -200) { return v1 - v2 <= 30; }
        else           { return false }
    }
    else { return (!mate2 && v1 - v2 <= 30) } // We are lossing
}

function executeEngineMove(move){
    if (!move){ return; }
    if (move.length > 4){ state.promotionPiece = move.substr(4,1); }
    var waiting = 700;
    var now = Date.now();

    if (now - state.lastMoveTime > waiting){ waiting = 0; }
    setTimeout(function(){
        onDrop(move.substr(0,2), move.substr(2,2), '');
        board.position(game.fen());
        evalPosition(game.fen());
        if (game.game_over()){ setTimeout(function(){ loadNewFen(); }, 1000); }
    }, waiting);
};

function discardHumansMove(eval_previous,eval,fen) {
    var waiting = 600;
    var now = Date.now();

    if (now - state.lastMoveTime > waiting){ waiting = 0; }
    setTimeout(function(){
        if (incorrect_in_a_row >= 3){
            game.undo();
            board.position(game.fen());
            setTimeout(function(){ highlightMainLine(); showMainLine(eval_previous,1,2,fen) }, 500);
        } else {
            highlightMistake();
            showMainLine(eval,1,2,fen);
        }
        state.humansMoving = true;
        updateStatus();
    }, waiting);
};

function showMainLine(eval, i, bound, fen, ms) {
    if (!ms) { ms = 0; }
    var idx = eval.indexOf('pv');
    if (eval.indexOf('mate') !== -1){ bound = 100; } // Show the full mate

    if (idx !== -1 && i < bound && eval[idx+i]){
        var is_capture = false;
        if (game.get(eval[idx+i].substr(2,2))) { is_capture = true; }
        var move = game.move({
            from : eval[idx+i].substr(0,2),
            to   : eval[idx+i].substr(2,2),
            promotion : eval[idx+i].substr(4,1)
        });

        if (is_capture){ bound += 1; }
        if (move === null) { return }
        setTimeout(function(){
            playSound(is_capture,move);
            board.position(game.fen());
            showMainLine(eval,i+1,bound,fen, 800)
        }, ms);
    } else {
        setTimeout(function(){
            for (var j = 1; j < i; j++){ game.undo(); }
            game.load(fen);
            board.position(game.fen());
            $('#myBoard .white-1e1d7').removeClass('bad-move-white');
            $('#myBoard .black-3c85d').removeClass('bad-move-black');
            $('#myBoard .white-1e1d7').removeClass('good-move-white');
            $('#myBoard .black-3c85d').removeClass('good-move-black');
        }, 800);
    }
}

function engineInteraction(previous_fen, last_move) {
//    if (game.game_over()) { return }
    var eval_previous = getEval(previous_fen);

    // Check if the move made is the one suggested
    if (eval_previous) {
        var idx = eval_previous.indexOf('pv');
        var suggestion = eval_previous[idx+1];
        var last_move_uci = last_move.from + last_move.to;
        if (last_move.promotion){ last_move_uci += last_move.promotion; }
        if (last_move_uci === suggestion){
            incorrect_in_a_row = 0;
            if (tooEasy(eval_previous,'human')){
                setTimeout(function(){ loadNewFen(); }, 1000);
                return;
            } else {
                if (eval_previous[idx+2] !== 'turn'){
                    executeEngineMove(eval_previous[idx+2]);
                    return;
                }
            }
        }
    }

    // Otherwise, evaluate the new move to see if it is good
    var eval_this = getEval(game.fen());
    if (!eval_previous || ! eval_this){
        setTimeout(function(){ engineInteraction(previous_fen, last_move) }, 100);

    } else {
        if (similar_evaluations(eval_previous, eval_this) || state.play_robot){
            incorrect_in_a_row = 0;
            if (tooEasy(eval_this,'engine')){
                setTimeout(function(){ loadNewFen(); }, 1000);
            } else {
                idx = eval_this.indexOf('pv');
                engine_move = eval_this[idx+1];
                executeEngineMove(engine_move);
            }

        } else {
            incorrect_in_a_row++;
            discardHumansMove(eval_previous, eval_this, previous_fen);
        }
    }
};


buildBoard(true, '8/8/8/8/8/8/8/8 w - - 0 1');
loadNewFen();
