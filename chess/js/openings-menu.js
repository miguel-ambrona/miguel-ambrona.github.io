
active_idx = 0;

var decrypted_opening_info;

function loadOpening(i) {
    window.location.href = 'index.html?id=' + i;
};

function setup() {
    var passwordHash = sessionStorage.getItem('passwordHash');
    if (!passwordHash){ $('#passwordModal').modal('toggle'); return false; }

    var key32 = key_of_sha256(passwordHash);
    var key = key32.slice(0,16);
    var iv  = key32.slice(16,32);

    decrypted_opening_info = decrypt_info(key, iv, opening_info);

    for (var i = 0; i < decrypted_opening_info.length; i++){

        var active;
        if (i === 0){ active = 'active' } else { active = '' }

        document.getElementById('myCarousel').innerHTML +=
            '<div class="carousel-item ' + active + '">' +
            '<div class="card mycard" style="width: 23rem" onclick="loadOpening(' + i + ')">' +
            '<div id="myBoard' + i + '" style="width: 23rem; padding: 13px"></div><div class="card-body">' +
            '<h4 class="card-title" style="text-align: center">' + decrypted_opening_info[i].name + '</h4>' +
            '<p class="card-title" style="text-align: center">' + decrypted_opening_info[i].variant + '</p>' +
            '</div></div></div>';

        document.getElementById('myCarouselIndicatorsList').innerHTML +=
            '<li data-target="#myCarouselIndicators" data-slide-to="' + i + '" class="' + active + '" value="' + i + '"></li>';

        var fen = decrypted_opening_info[i].fen;

        // All positions are set after a the main player's move
        var turn;
        if (fen.split(' ')[1] === 'b'){ turn = 'white'; } else { turn = 'black'; }
        var this_board = Chessboard('myBoard' + i, { showNotation: false, position: decrypted_opening_info[i].fen });
        this_board.orientation(turn);
    }
};

function showVariant (i, board, game, moves, j) {
    setTimeout(function(){
        var fen = decrypted_opening_info[i].fen;
        if (active_idx !== i){ return; }
        if (j < moves.length) {
            game.move({ from: moves[j].substr(0,2), to: moves[j].substr(2,2), promotion: moves[j].substr(4,1) });
            if (active_idx !== i){ board.position(fen); return; }
            board.position(game.fen());
            showVariant(i, board, game, moves, j+1);
        } else {
            game.load(fen)
            board.position(fen);
            showVariant(i, board, game, moves, 0);
        }
    }, 1100);
};

function movePieces (i) {
    setTimeout(function(){
        moves = decrypted_opening_info[i].mainline.split(' ');

        var fen = decrypted_opening_info[i].fen;

        // All positions are set after a the main player's move
        var turn;
        if (fen.split(' ')[1] === 'b'){ turn = 'white'; } else { turn = 'black'; }
        var game = new Chess();
        var board = Chessboard('myBoard' + i, { showNotation: false, position: fen, moveSpeed: 'fast'});
        board.orientation(turn);
        board.position('start')
        showVariant(i, board, game, moves, 0)
    }, 2000);
}

// This function triggers when the carousel starts to change: 'slide'
$('#myCarouselIndicators').on('slide.bs.carousel', function () {
    active_idx = -1;
});

// This function triggers when the carousel has just changed: 'slid'
$('#myCarouselIndicators').on('slid.bs.carousel', function () {
    var i = $('.active')[0].value;
    active_idx = i;
    //movePieces(i);
});

$('#myCarouselIndicators').carousel({
    interval: false
})


try {
    setup();
    //movePieces(0);
} catch {
    // Nothing
}
