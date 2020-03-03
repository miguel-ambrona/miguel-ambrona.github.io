// Functions to control the Graphical User Interface of the tool

$('#pnum-btn').click(function(){ numberButton() });
$('#hint-btn').click(function(){ giveAHint(game.fen()) });
$('#prev-btn').click(function(){ previousButton(); });
$('#rset-btn').click(function(){ resetButton(); });
$('#next-btn').click(function(){ nextButton(); });
$('#eyes-btn').click(function(){ startStopEye(); });
$('#gear-btn').click(function(){ startStopEngine(); });
$('#dpth-btn').click(function(){ deeperSearch(); });
$('#eval-btn').click(function(){ showHideBestMove(); });
$('#rbot-btn').click(function(){ onOffRobot(); });
$('#edit-btn').click(function(){ onOffEdit(); });
$('#shot-btn').click(function(){ onOffShot(); });
$('#bell-btn').click(function(){ onOffBell(); });
$('#tags-btn').click(function(){ nextTag(); });
$('#rand-btn').click(function(){ randMode(); });
$('#bomb-btn').click(function(){ bombMode(); });
$('#errs-btn').click(function(){ errorsMode(); });
$('#tree-btn').click(function(){ nextTree(); });
$('#pass-btn').click(function(){ newPassword(); });
$('#game-btn').click(function(){ loadGameMode(); });

$('#book-btn').click(function(){ loadOpeningMode(); });
$('#puzz-btn').click(function(){ loadPuzzleMode(); });
$('#endb-btn').click(function(){ loadEndgameMode(); });
$('#help-btn').click(function(){ help(); });


var thinking   = false;
var last_depth = null;
var last_bestmove = null;
var TREE_LIMIT = 30;
var SHOT_GAP = 5;
var shots = [];
var shot_id = 0;
var undone_moves = [];

function help() {
    window.location.href = 'help.html';
}

function loadOpeningMode() {
    window.location.href = 'openings.html';
}

function loadPuzzleMode() {
    $('#book-btn').removeClass('btn-primary').addClass('btn-secondary');
    $('#puzz-btn').removeClass('btn-secondary').addClass('btn-primary');
    $('#endb-btn').removeClass('btn-primary').addClass('btn-secondary');
    state.mode = 'puzzle';
    loadNewFen();
}

function loadEndgameMode() {
    return;
}

function loadGameMode() {
    state.game_active = !state.game_active;
    if (state.game_active){ $('#game-btn').addClass('btn-danger').removeClass('btn-dark'); }
    else                  { $('#game-btn').removeClass('btn-danger').addClass('btn-dark'); }
    loadNewFen();
};

function numberButton() {
    var original_text = $('#pnum-btn').html();
    var total = state.puzzles.length;
    var color = 'btn-dark';

    if (state.shot_active){
        total = shots.fens.length;
        color = 'btn-info';
    } else if (state.bombs_active || state.errors_active){
        $('#pnum-btn').addClass('btn-danger').removeClass('btn-dark');
    } else if (state.tree_bound <= TREE_LIMIT){
        $('#pnum-btn').addClass('btn-success').removeClass('btn-dark');
        $('#tree-btn').addClass('btn-success').removeClass('btn-dark');
    }
    $('#pnum-btn').html(total);
    setTimeout(function(){
        $('#pnum-btn').html(original_text);
        $('#pnum-btn').addClass(color).removeClass('btn-success').removeClass('btn-danger');
        $('#tree-btn').addClass('btn-dark').removeClass('btn-success');
    }, 700);
};


function giveAHint(fen) {
    $('#hint-btn').removeClass('btn-dark').addClass('btn-on');
    setTimeout(function(){ $('#hint-btn').addClass('btn-dark').removeClass('btn-on') }, 700);
    if (state.mode === 'opening' && !state.play_robot){
        //showNextMove(state.openingVariant[state.variantIdx]);
        var move = state.openingVariant[state.variantIdx];
        var from = move.substr(0,2);
        var to   = move.substr(2,2);
        if (state.hint_counter === 0){ highlightSquare(from, 'yellow', 700); }
        else                         { highlightSquare(to, 'yellow', 700); }
        state.hint_counter = 1-state.hint_counter;
    } else {
        var eval = getEval(fen);
        if (!eval){ setTimeout(function(){ giveAHint(fen) }, 100); }
        else { highlightMainLine(); showMainLine(eval,1,4,fen); }
    }
};

function extract_move(this_game, move_str) {
    var piece = this_game.get(move_str.substr(0,2));
    if (piece){
        return move_str.substr(0,2) + '|' + move_str.substr(2,2) + '|' + piece.type + '|' + piece.color;
    }
};

function showShot() {
    shot_id = mod(shot_id, shots.fens.length);
    $('#pnum-btn').html(shot_id+1);
    board.position(shots.fens[shot_id]);
    highlightSquare(shots.move.from, 'suggestion');
    highlightSquare(shots.move.to, 'suggestion');
};

function shotOn() {
    state.shot_active = true;
    $('#shot-btn').addClass('btn-info').removeClass('btn-dark');
    $('#hint-btn').prop('disabled', true);
    $('#edit-btn').prop('disabled', true);
    $('#rbot-btn').prop('disabled', true);
    $('#rset-btn').prop('disabled', true);
    $('#tree-btn').prop('disabled', true);
    $('#tags-btn').prop('disabled', true);
    $('#bomb-btn').prop('disabled', true);
    $('#rand-btn').prop('disabled', true);
    $('#errs-btn').prop('disabled', true);
    $('#pnum-btn').addClass('btn-info').removeClass('btn-dark');
    shots = computeShotHints();
    shot_id = 0;
    showShot();
};

function shotOff() {
    state.free_edit = false;
    $('#shot-btn').addClass('btn-dark').removeClass('btn-info');
    $('#hint-btn').prop('disabled', false);
    $('#edit-btn').prop('disabled', false);
    $('#rbot-btn').prop('disabled', false);
    $('#rset-btn').prop('disabled', false);
    $('#tree-btn').prop('disabled', false);
    $('#tags-btn').prop('disabled', false);
    $('#bomb-btn').prop('disabled', false);
    $('#rand-btn').prop('disabled', false);
    $('#errs-btn').prop('disabled', false);
    $('#myBoard .square-55d63').removeClass('suggestion-white');
    $('#myBoard .square-55d63').removeClass('suggestion-black');
    board.position(game.fen());
    $('#pnum-btn').html(state.puzzles[fen_id]+1);
    $('#pnum-btn').addClass('btn-dark').removeClass('btn-info');
};

function onOffShot() {
    state.shot_active = !state.shot_active;
    if (state.shot_active){ shotOn() } else { shotOff() }
};

function computeShotHints() {
    var move = state.openingVariant[state.variantIdx];
    var next_move = extract_move(game, move);
    var ply = parseInt(game.fen().split(' ')[5], 10);

    var similar_fens = [];
    var game2 = new Chess()

    for (var i = 0; i < state.all_puzzles.length; i++){
        var fen = extract_fen(state.all_puzzles[i]);
        var variant = extract_openingVariant(state.all_puzzles[i]);
        var ply2 = parseInt(fen.split(' ')[5], 10);
        if (ply2 > ply + SHOT_GAP){ continue; }

        game2.load(fen);
        for (var j = 0; j < variant.length; j++){
            if (variant[j] === 'undo'){
                game2.undo();
            } else {
                var move2 = extract_move(game2, variant[j]);
                var this_move = { from: variant[j].substr(0,2),
                                  to:   variant[j].substr(2,2),
                                  promotion: variant[j].substr(4,1)};

                var ply2 = parseInt(game2.fen().split(' ')[5], 10);
                if (move2 === next_move && Math.abs(ply2 - ply) <= SHOT_GAP){
                    var fen2 = game2.fen();
                    if (similar_fens.indexOf(fen2) === -1){ similar_fens.push(fen2); }
                }
                game2.move(this_move);
            }
        }
    }
    var the_move = { from: move.substr(0,2), to: move.substr(2,2), promotion: move.substr(4,1)};
    return { fens: similar_fens, move: the_move }
};

function previousButton() {
    if (state.free_edit){
        var move = game.undo();
        undone_moves.push(move);
        board.position(game.fen());
    } else if (state.shot_active){
        shot_id -= 1;
        showShot();
    } else {
        fen_id -= 1;
        loadNewFen();
    }
};

function resetButton() {
    if (state.free_edit){
        game.reset();
        board.position(game.fen());
        undone_moves = [];
    } else {
        loadNewFen();
    }
};

function nextButton() {
    if (state.free_edit){
        var move = undone_moves.pop();
        if (move){ game.move(move); }
        board.position(game.fen());
    } else if (state.shot_active){
        shot_id += 1;
        showShot();
    } else {
        fen_id += 1;
        loadNewFen();
    }
};

function removeEngineHighlights() {
    $('#myBoard .white-1e1d7').removeClass('engine-white');
    $('#myBoard .black-3c85d').removeClass('engine-black');
};

function startStopEye() {
    var eye = $('.fa-eye');
    if (eye[0]){
        eye.addClass('fa-eye-slash').removeClass('fa-eye')
        removeEvaluation();
    } else {
        eye = $('#eye');
        eye.addClass('fa-eye').removeClass('fa-eye-slash');
        showEvaluation();
    }
};

function startStopEngine() {
    removeEngineHighlights();
    if (analyzing) {
        analyzing = false;
        $('.fa-gear').removeClass('fa-spin');
    } else {
        var eye = $('.fa-eye');
        if (!eye[0]){ $('#eye').addClass('fa-eye').removeClass('fa-eye-slash'); }

        var evaluation = getEval(game.fen());
        $('.fa-gear').addClass('fa-spin');
        if (evaluation) {
            evaluationIsFinished(evaluation);
            $('.fa-gear').removeClass('fa-spin');
        }
    }
};

function onOffBell() {
    var bell = $('.fa-bell');
    if (bell[0]){ bell.addClass('fa-bell-slash').removeClass('fa-bell') }
    else {
        bell = $('#bell');
        bell.addClass('fa-bell').removeClass('fa-bell-slash');
    }
};

function robotOn() {
    state.play_robot = true;
    $('#rbot-btn').addClass('btn-danger').removeClass('btn-dark');
};

function robotOff() {
    state.play_robot = false;
    $('#rbot-btn').removeClass('btn-danger').addClass('btn-dark');
};

function onOffRobot() {
    state.play_robot = !state.play_robot;
    if (state.play_robot){ robotOn() } else { robotOff() }
    if (!state.free_edit && !state.play_robot){ resetButton(); }
};

function editOn() {
    state.free_edit = true;
    undone_moves = [];
    $('#edit-btn').removeClass('btn-dark').addClass('btn-danger');
    $('#hint-btn').prop('disabled', true);
    $('#shot-btn').prop('disabled', true);
    $('#tree-btn').prop('disabled', true);
    $('#tags-btn').prop('disabled', true);
    $('#bomb-btn').prop('disabled', true);
    $('#rand-btn').prop('disabled', true);
    $('#errs-btn').prop('disabled', true);
};

function editOff() {
    state.free_edit = false;
    $('#edit-btn').removeClass('btn-danger').addClass('btn-dark');
    $('#hint-btn').prop('disabled', false);
    $('#shot-btn').prop('disabled', false);
    $('#tree-btn').prop('disabled', false);
    $('#tags-btn').prop('disabled', false);
    $('#bomb-btn').prop('disabled', false);
    $('#rand-btn').prop('disabled', false);
    $('#errs-btn').prop('disabled', false);
    if (!state.play_robot){ robotOn(); }
};

function onOffEdit() {
    state.free_edit = !state.free_edit;
    if (state.free_edit){ editOn() } else { editOff() }
};

function nextTag() {
    fen_id = state.tags[tag_id]-1;
    tag_id += 1;
    state.bombs_active   = false;
    state.errors_active = false;
    state.random_active = false;
    $('#bomb-btn').addClass('btn-dark').removeClass('btn-danger');
    $('#errs-btn').addClass('btn-dark').removeClass('btn-danger');
    $('#rand-btn').addClass('btn-dark').removeClass('btn-danger');
    loadNewFen();
};

function bombMode() {
    fen_id = 0;
    state.bombs_active = !state.bombs_active;
    if (state.bombs_active){
        $('#bomb-btn').addClass('btn-danger').removeClass('btn-dark');
        errorsOff();
        state.errors_active = false;
    }
    else { $('#bomb-btn').removeClass('btn-danger').addClass('btn-dark'); }
    loadNewFen();
};

function errorsOff() {
    state.errors_active = false;
    $('#errs-btn').addClass('btn-dark').removeClass('btn-danger');
};

function errorsMode() {
    if (state.errors.length === 0){ errorsOff(); return; }
    fen_id = 0;
    state.errors_active = !state.errors_active;
    if (state.errors_active){
        $('#errs-btn').addClass('btn-danger').removeClass('btn-dark');
        $('#bomb-btn').addClass('btn-dark').removeClass('btn-danger');
        state.bombs_active = false;
    } else { errorsOff(); }
    loadNewFen();
};

var treeClicksCount = 0;

function nextTree() {
    treeClicksCount++;
    setTimeout(function(){ treeClicksCount = 0; }, 200);
    if (treeClicksCount >= 2){ state.tree_bound = TREE_LIMIT; }

    if (state.tree_bound > TREE_LIMIT){ state.tree_bound = 7; }

    state.tree_bound += 1;
    if (state.tree_bound > TREE_LIMIT){ state.tree_bound = 10000; $('#tree-num').html('&infin;'); }
    else { $('#tree-num').html(state.tree_bound); }

    state.puzzles = filterByTree(state.puzzles);
    if (state.puzzles.length === 0){ state.puzzles = [0]; }
    loadNewFen();
};

function randMode() {
    state.random_active = !state.random_active;
    if (state.random_active){ $('#rand-btn').addClass('btn-danger').removeClass('btn-dark'); loadNewFen(); }
    else {                     $('#rand-btn').removeClass('btn-danger').addClass('btn-dark'); }
};

window.addEventListener('keypress', function (e) {
    if (e.keyCode === 13) {
        newPassword();
    }
}, false);

function newPassword() {
    var pass = document.getElementById('password').value;
    $('#passwordModal').modal('hide');
    document.getElementById('password').value = null;

    state.passwordHash = sha256(pass);
    sessionStorage.setItem('passwordHash', state.passwordHash);

    setTimeout(function(){ getPuzzles(); loadNewFen(); }, 500);
}

function showHideBestMove() {
    if ($('.engine-white')[0] || $('.engine-black')[0]){
        removeEngineHighlights();
    } else {
        highlightBestMove();
    }
};

function deeperSearch() {
    removeEngineHighlights();
    if (analyzing) {
        analyzing = false;
        $('.fa-gear').removeClass('fa-spin');
    } else {
        evaluation = getEval(game.fen());
        $('.fa-gear').addClass('fa-spin');

        if (evaluation && last_depth){
            var eval_depth = evaluation[1+evaluation.indexOf('depth')];
            if (last_depth+1 > parseInt(eval_depth, 10)){
                getEval(game.fen(), last_depth+1);
            }
        } else {
            if (evaluation) {
                setTimeout(function(){
                    evaluationIsFinished(evaluation);
                    $('.fa-gear').removeClass('fa-spin');
                }, 300);
            }
        }
    }
}

function evaluationColor(v, mate){
    reds   = ['#E74C3C', '#EC7063', '#F1948A', '#F5B7B1', '#FADBD8', '#FDEDEC'];
    greens = ['#2ECC71', '#58D68D', '#82E0AA', '#ABEBC6', '#D5F5E3', '#EAFAF1'];
    white  = '#F8F9F9';

    if (mate) { if (v > 0){ return greens[0] } else { return reds[0] } }

    if      (v < -500) { return reds[0]   }
    else if (v < -200) { return reds[1]   }
    else if (v < -150) { return reds[2]   }
    else if (v < -100) { return reds[3]   }
    else if  (v < -50) { return reds[4]   }
    else if    (v < 0) { return reds[5]   }
    else if  (v === 0) { return white     }
    else if  (v > 500) { return greens[0] }
    else if  (v > 200) { return greens[1] }
    else if  (v > 150) { return greens[2] }
    else if  (v > 100) { return greens[3] }
    else if   (v > 50) { return greens[4] }
    else if    (v > 0) { return greens[5] }

}

function highlightBestMove(){
    highlightSquare(last_bestmove.substr(0,2), 'engine');
    highlightSquare(last_bestmove.substr(2,2), 'engine');
}

function evaluationIsFinished(eval) {
    if (!eval){ return; }
    var eye = $('.fa-eye');
    if (!eye[0]){ return; }

    var idx = eval.indexOf('cp');
    var mate = false;
    if (idx === -1){ idx = eval.indexOf('mate'); mate = true; }

    var turn = eval[eval.indexOf('turn')+1];

    var v = parseInt(eval[idx+1], 10);

    if (eval[eval.indexOf('turn')+1] === 'b'){ v = -v; }
    var color = evaluationColor(v, mate);

    last_depth = parseInt(eval[1+eval.indexOf('depth')], 10);

    eval_str = v / 100;
    if (v > 0){ eval_str = '+' + eval_str }
    else if (v === 0){ eval_str = '&nbsp;0.00'; }
    while (eval_str.length < 5){
        if (eval_str.indexOf('.') === -1){ eval_str += '.'; }
        else { eval_str += '0' }
    }
    if (eval_str.length > 5 && eval_str.indexOf('.') !== -1){
        eval_str = eval_str.slice(0,2+eval_str.indexOf('.'));
    }

    if (mate) { eval_str = '#' + v; }

    last_bestmove = eval[1+eval.indexOf('pv')]

    $('#eval-btn').css('background-color', color);
    document.getElementById('eval-btn').innerHTML = eval_str;
    document.getElementById('dpth-btn').innerHTML = last_depth;
    $('#eval-btn').removeClass('btn-hidden');
    $('#dpth-btn').removeClass('btn-hidden');
    $('.fa-gear').removeClass('fa-spin');
}
