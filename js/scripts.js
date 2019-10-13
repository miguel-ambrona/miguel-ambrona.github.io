var moving = false;

function rotation(element, deg, dir) {

    if (moving && deg == 0) { return 0; }
    element.style.MozTransform = "rotate("+ deg + "deg)";

    if (deg < 360 && deg > -360){
        moving = true;
        setTimeout(function() { rotation(element, deg-5*dir, dir); }, 5);
    } else {
        moving = false;
    }
};
