// Functions for decrypting the puzzles
// This file is used by board.js and openings-menu.js

function hexToBase64(hexstring) {
    return btoa(hexstring.match(/\w{2}/g).map(function(a) {
        return String.fromCharCode(parseInt(a, 16));
    }).join(""));
}

function base64toHEX(base64) {
  var raw = atob(base64);
  var HEX = '';
  for ( i = 0; i < raw.length; i++ ) {
    var _hex = raw.charCodeAt(i).toString(16)
    HEX += (_hex.length==2?_hex:'0'+_hex);
  }
  return HEX.toUpperCase();
}

function padding(msg) {
    // Let's make it simple and use a symbol that certainly does not appear in the message, e.g., '@'
    if (msg.length%16){
        return msg + '@'.repeat(16 - msg.length%16);
    }
    return msg
}

function unpad(msg) {
    return msg.replace(/@/g,'');
}

function decrypt_puzzles(key, iv, Puzzles) {
    var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    var decrypted_puzzles = [];

    for (var i = 0; i < Puzzles.length; i++) {
        var fens = Puzzles[i].puzzles;
        var decrypted = [];

        for (var j = 0; j < fens.length; j++){
            var encryptedHex = base64toHEX(fens[j]);
            var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
            var decryptedBytes = aesCbc.decrypt(encryptedBytes);
            var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
            decrypted.push(unpad(decryptedText));
        }
        decrypted_puzzles.push(decrypted);
    }
    return decrypted_puzzles
}

function decrypt_info(key, iv, opening_info) {
    var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    var decrypted_info = [];

    for (var i = 0; i < opening_info.length; i++) {

        function dec(string){
            var encryptedHex = base64toHEX(string);//opening-info[i].name);
            var encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
            var decryptedBytes = aesCbc.decrypt(encryptedBytes);
            var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
            return unpad(decryptedText);
        };
        var opening_element = {
            name : dec(opening_info[i].name),
            variant : dec(opening_info[i].variant),
            fen : dec(opening_info[i].fen),
            mainline : dec(opening_info[i].mainline)
        };
        decrypted_info.push(opening_element);
    }
    return decrypted_info
}
