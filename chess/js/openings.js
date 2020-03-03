
function puzzleIsFinished() {
    if (state.errors_active && !state.mistake){
        var this_puzzle = state.puzzles[fen_id];
        var idx = state.errors.indexOf(this_puzzle);
        if (idx !== -1){ state.errors.splice(idx, 1); fen_id--;}
    }
    if (state.errors.length === 0){
        errorsOff();
        var warning = $('.fa-warning');
        $('#errors').addClass('fa-check-circle').removeClass('fa-warning');
        if (warning[0]){
            $('#errs-btn').addClass('btn-success').removeClass('btn-dark');
            setTimeout(function(){ $('#errs-btn').addClass('btn-dark').removeClass('btn-success'); }, 1000);
        }
    }
    fen_id++;
    loadNewFen();
};

function highlightSquare(square, hcolor, ms) {
    var squareEl = $('#myBoard .square-' + square);
    if (squareEl.hasClass('black-3c85d') === true) { highlight = hcolor + '-black'; }
    else                                           { highlight = hcolor + '-white'; }
    squareEl.addClass(highlight);

    if (ms) {
        setTimeout(function(){
            $('#myBoard .white-1e1d7').removeClass(hcolor + '-white');
            $('#myBoard .black-3c85d').removeClass(hcolor + '-black');
        }, ms);
    }
};

function showNextMove(move) {
    state.humansMoving = false;
    onDrop(move.substr(0,2), move.substr(2,2), '');
    board.position(game.fen());
    highlightSquare(move.substr(0,2), 'suggestion', 700);
    highlightSquare(move.substr(2,2), 'suggestion', 700);
    game.undo();
    setTimeout(function(){ board.position(game.fen()); }, 700);
};

function undo_until_move() {
    game.undo();
    board.position(game.fen());

    state.variantIdx++;
    var ans = state.openingVariant[state.variantIdx];

    setTimeout(function(){
        if (ans === 'undo'){ undo_until_move(); return; }

        var info = process_move(ans, game.turn());
        evaluationIsFinished(info.eval);

        onDrop(info.move.substr(0,2), info.move.substr(2,2), '');
        board.position(game.fen());
        evaluations[game.fen()] = info.eval;
        state.variantIdx++;
        if (state.variantIdx >= state.openingVariant.length){
            setTimeout(function(){ puzzleIsFinished(); }, 700);
        }
    }, 700);
};

function process_move(move, turn){
    var eval = null;
    if (move.length > 5){
        var parts = move.split('(');
        var move = parts[0]
        var eval_data = parts[1].replace(')','').split('|');
        var fen = game.fen();
        var score = parseInt(eval_data[1], 10);
        var cp = 'cp';
        if (score >  100000){ score =  (1000000 - score)/1000; cp = 'mate'; }
        if (score < -100000){ score = -(score + 1000000)/1000; cp = 'mate'; }

        eval = ['info', 'depth', eval_data[2], cp, score, 'pv', eval_data[0], 'turn', turn];
    }
    return { move: move, eval: eval }
};

function negate_turn (t) {
    if (t === 'w'){ return 'b' }
    else          { return 'w' }
};

function openingInteraction(move) {
    var m = move.from + move.to;
    if (move.promotion){
        m += move.promotion;
        state.promotionPiece = move.promotion;
    }

    var turn = negate_turn(game.turn());

    var suggested = state.openingVariant[state.variantIdx];
    var info = process_move(suggested, turn);
    var suggested = info.move;

    if (suggested && m === suggested){
        if ($('.fa-bell')[0]){
            bell_sound.play();
        }
        state.hint_counter = 0;
        evaluationIsFinished(info.eval);
        evaluations[game.fen()] = info.eval;
        highlightSquare(move.from, 'golden', 700);
        highlightSquare(move.to, 'golden', 700);
    }

    setTimeout(function(){
        if (m === suggested){
            if (state.variantIdx >= state.openingVariant.length){ puzzleIsFinished(); return; }
            state.variantIdx++;
            var ans = state.openingVariant[state.variantIdx];

            if (!ans){ puzzleIsFinished(); return; }
            if (ans === 'undo'){ undo_until_move(); return; }

            var info = process_move(ans, negate_turn(turn));
            var ans = info.move;

            evaluationIsFinished(info.eval);

            onDrop(ans.substr(0,2), ans.substr(2,2), '');
            board.position(game.fen());
            evaluations[game.fen()] = info.eval;

            state.variantIdx++;
            if (state.variantIdx >= state.openingVariant.length){
                setTimeout(function(){ puzzleIsFinished(); }, 700);
            }

        } else {
            state.mistake = true;
            var this_puzzle = state.puzzles[fen_id];
            var idx = state.errors.indexOf(this_puzzle);
            if (!state.game_active){
                if (idx === -1 ){ state.errors.push(this_puzzle); }
                $('#errors').addClass('fa-warning').removeClass('fa-check-circle');
            };
            game.undo();
            board.position(game.fen());
            updateStatus();
            if (!state.game_active){
                setTimeout(function(){ showNextMove(state.openingVariant[state.variantIdx]); }, 700);
            }
            state.humansMoving = true;
        }
    }, 700);
};
