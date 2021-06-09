let x1, y1, x2, y2;

function ontouchstart(event) {
    if (event.touches.length > 2) {
        keyHandler(K_PAUSE);
        return;
    }
    x1 = event.touches[0].clientX;
    y1 = event.touches[0].clientY;
}

function ontouchmove(event) {
    if ( !x1 || !y1) return;
    x2 = event.touches[0].clientX;
    y2 = event.touches[0].clientY;
    calculate();
    resetCoordinates();
}

function ontouchend(event) {
    console.log(event);
/*     if (event.touches.length > 2) {
        keyHandler(K_PAUSE);
    } */
}

function resetCoordinates() {
    x1 = null;
    y1 = null;
    x2 = null;
    y2 = null;
}

function calculate() {
    let xDiff = x1 - x2;
    let yDiff = y1 - y2;

    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {
        if (xDiff > 0) {
            /* left swipe */
            keyHandler(K_LEFT);
        } else {
            /* right swipe */
            keyHandler(K_RIGHT);
        }
    } else {
        if (yDiff > 0) {
            /* up swipe */
            keyHandler(K_UP);
        } else {
            /* down swipe */
            keyHandler(K_DOWN);
        }
    }
}

function setupListener(element) {
    element.addEventListener("touchstart", ontouchstart);
    element.addEventListener("touchmove", ontouchmove);
    element.addEventListener("touchend", ontouchend);
}