function calculateRatio(num_1, num_2){
    for(num=num_2; num>1; num--) {
        if((num_1 % num) == 0 && (num_2 % num) == 0) {
            num_1=num_1/num;
            num_2=num_2/num;
        }
    }
    // var ratio = num_1+":"+num_2;
    return [num_1, num_2];
}


const HEIGHT = 25;
// const HEIGHT = Math.floor(window.innerHeight / 25)
const WIDTH = 35;
// const WIDTH = Math.floor(window.innerWidth / 25);

function getCanvasHeight() {
    return canvas.height / HEIGHT;
}

function getCanvasWidth() {
    return canvas.width / WIDTH;
}

let dx, dy;
let paused = false;
let peaceMode = true;
let dumpParts = false;

let canvas, ctx, parts, length;

let btnQueue = [];
let powerUps = [];

let snakeheadSprites = null;
let pauseSprite = null;

let updateDelay = 0;

const LEFT = 0;
const UP = 1;
const RIGHT = 2;
const DOWN = 3;

const direction = [
    [
        -1, 0
    ],
    [
        0, -1
    ],
    [
        1, 0
    ],
    [
        0, 1
    ]
]

function updateCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.onload = async function () {
    canvas = document.getElementById("canvas"),
        ctx = canvas.getContext("2d");

    snakeheadSprites = await loadImage('head.png', 25, 25);
    pauseSprite = await loadImage('pause.png', 100, 100);

    updateCanvasSize();
    window.addEventListener("resize", () => {
        updateCanvasSize();
    });

    // console.log(snakeheadSprites);

    window.addEventListener("keydown", (e) => {
        keyHandler(e.key)
    });

    setupListener(canvas);

    // window.addEventListener

    // pxs = new Array(WIDTH * HEIGHT);
    setupGame();
    draw();
}

function randomDirection() {
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"][Math.floor(Math.random() * 4)];
}

function colorCycle(seed) {
    let r = "#" + (
        parseInt(((seed % 255) << 8), 16)
        & parseInt(((seed % 255) << 16), 16)
        & parseInt(((seed % 255) << 24), 16)
    );
    // console.log(r);
    return r;
}

function loadImage(src, w = WIDTH, h = HEIGHT) {
    return new Promise((res, rej) => {
        let img = new Image();
        img.src = src;
        img.onload = () => {
            res(img);
        }

        img.width = w;
        img.height = h;

        img.onerror = rej;
    });
}

function setupGame() {
    dx = 1;
    dy = 0;
    length = 3;
    parts = [new SnakePart()];
    frames = 0;
    powerUps.pop();
    dirSprite = RIGHT;
    spawnItem();
}

function getHead() {
    return parts[
        parts.length - 1
    ];
}

function addBodypart() {
    powerUps.pop();
    length++;
    spawnItem();
    console.log("Added powerup at " + powerUps[0].x + " and " + powerUps[0].y);
}

function isPowerupInSnake(x, y) {
    let sp = parts[0];
    if (x == sp.x && y == sp.y) {
        return true;
    }

    return false;
}

function addToQueue(dir) {
    if (!paused) {
        if (btnQueue[btnQueue.length - 1] !== dir) btnQueue.push(dir);
        console.log(btnQueue);

        frames = 0;
    }
}

function loadRandomButtonQueue() {
    for (let i = 0; i < 20; i++) {
        keyHandler(randomDirection());
    }
}

let dirSprite = RIGHT;

const K_UP = "ArrowUp";
const K_DOWN = "ArrowDown";
const K_LEFT = "ArrowLeft";
const K_RIGHT = "ArrowRight";
const K_PAUSE = "Escape";

function keyHandler(key) {
    let b = (btnQueue.length > 0 ? btnQueue[btnQueue.length - 1] : -1);
    console.log(b);

    switch (key) {
        case "ArrowUp":
            if (dirSprite !== DOWN) {
                addToQueue(UP);

                // dirSprite = UP;
            }
            break;

        case "ArrowDown":
            if (dirSprite !== UP) {
                // dy = 1;
                // dx = 0;

                // btnQueue.push([1, 0]);
                addToQueue(DOWN);

                // dirSprite = DOWN;
            }
            break;

        case "ArrowLeft":
            if (dirSprite !== RIGHT) {
                // dy = 0;
                // dx = -1;

                // btnQueue.push([0, -1]);
                addToQueue(LEFT);

                // dirSprite = LEFT;
            }
            break;

        case "ArrowRight":
            if (dirSprite !== LEFT) {
                // dy = 0;
                // dx = 1;

                // btnQueue.push([0, 1]);
                addToQueue(RIGHT);

                // dirSprite = RIGHT;
            }
            break;

        case "r":
            loadRandomButtonQueue();
            break;

        case "a":
            //add a bodypart
            addBodypart();
            break;

        case "d":
            //dump parts
            dumpParts = !dumpParts;
            break;

        case "u":
            updateDelay = 100;
            break;

        case "Escape":
            paused = !paused;
            break;

        // case 
    }
}

function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateQueue() {
    let g = btnQueue.pop()
    if (g !== undefined) {
        dy = direction[g][1];
        dx = direction[g][0];
        dirSprite = g;
    }
    if (dumpParts) console.log(dx, dy);
}

function timedGameReset(delay = 1000) {
    setTimeout(() => {
        setupGame();
    }, delay);
}

function update() {
    updateQueue();

    let tmp = parts[0];
    let sp = new SnakePart(tmp.x + dx, tmp.y + dy);
    if (!peaceMode) {
        if (sp.x >= WIDTH || sp.y >= HEIGHT || sp.x < 0 || sp.y < 0) {
            // alert("You lost");
            setupGame();
            return;
        }
    } else {
        if (sp.x >= WIDTH) sp.x = 0;
        if (sp.y >= HEIGHT) sp.y = 0;
        if (sp.x < 0) sp.x = WIDTH - 1;
        if (sp.y < 0) sp.y = HEIGHT - 1;
    }

    //check if snake bit itself
    for (let i = 1; i < parts.length; i++) {
        if (parts[i].x == sp.x && parts[i].y == sp.y) {
            setupGame();
            return;
        }
    }

    for (let i = 0; i < powerUps.length; i++) {
        if (powerUps[i].x == sp.x && powerUps[i].y == sp.y) {
            addBodypart();
        }
    }

    parts.unshift(sp);

    while (parts.length > length) { parts.pop(); }
}

let frames = 0;

function spawnItem() {
    let rndX, rndY;
    do {
        rndX = Math.floor(Math.random() * (WIDTH));
        rndY = Math.floor(Math.random() * (HEIGHT));
    } while (isPowerupInSnake(rndX, rndY));

    powerUps.push(new Item(rndX, rndY));
    // console.log(rndX, rndY);
}

function draw() {
    clear();

/*     let i = 0;
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            i++;
            ctx.fillStyle = /* ["lightgrey", "darkgrey"][i % 2] *  "black";
            ctx.fillRect(x * getCanvasWidth(), y * getCanvasHeight(), getCanvasWidth(), getCanvasHeight());
        }
    } */

    powerUps.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.getBlockX(), e.getBlockY(), e.getBlockWidth(), e.getBlockHeight());
    });

    drawSnake(frames);
    
    if (!paused) {
        // console.log(frames % (10 + updateDelay));
        if (frames % (10 + updateDelay) == 0) {
            if (dumpParts) console.log(parts);
            updateDelay = 0;
            update();
        }

        frames++;
    } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(pauseSprite, (canvas.width / 2) - (pauseSprite.width / 2), (canvas.height / 2) - (pauseSprite.height / 2));

    }
    requestAnimationFrame(draw);
}

function drawSnake(frame) {
    for (let i = 0; i < parts.length; i++) {
        ctx.fillStyle = parts[i].color;
        ctx.fillRect(parts[i].getBlockX(), parts[i].getBlockY(), parts[i].getBlockWidth(), parts[i].getBlockHeight());
        if (i === 0) drawSnakeHead(parts[0]);
    }
}

function drawSnakeHead(p) {
    if (dumpParts) console.log("Sprite: " + dirSprite);
    ctx.drawImage(snakeheadSprites, dirSprite * WIDTH, 0, 25, 25, p.getBlockX(), p.getBlockY(), p.getBlockWidth(), p.getBlockHeight());
}

class SnakePart {

    leftPadding = false;
    rightPadding = false;
    topPadding = false;
    bottomPadding = false;

    constructor(x = 5, y = 5) {
        this.x = x;
        this.y = y;
        this.color = "white";
    }

    overrideColor(col) {
        this.color = col;
    }

    resetColor() {
        this.color = "white";
    }

    getBlockX() {
        return (this.leftPadding ? 2 : 0) + this.x * getCanvasWidth();
    }

    getBlockY() {
        return (this.topPadding ? 2 : 0) + this.y * getCanvasHeight();
    }

    getBlockWidth() {
        return getCanvasWidth() - (this.rightPadding ? 4 : 0);
    }

    getBlockHeight() {
        return getCanvasHeight() - (this.bottomPadding ? 4 : 0);;
    }
}

class Item extends SnakePart {
    constructor(x, y) {
        super(x, y);
        this.color = "red";
    }

    getBlockX() {
        return this.x * getCanvasWidth() + 3;
    }

    getBlockY() {
        return this.y * getCanvasHeight() + 3;
    }

    getBlockWidth() {
        if (super.getBlockWidth() < 1) return getCanvasWidth() * 1;
        return super.getBlockWidth() - 6;
    }

    getBlockHeight() {
        if (super.getBlockHeight() < 1) return getCanvasHeight() * 1;
        return super.getBlockHeight() - 6;
    }
}

function getCSSVariable() {

}