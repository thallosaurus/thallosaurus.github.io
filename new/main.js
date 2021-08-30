let canvas, ctx;
let circles = [];
let debugCircle;

let mouseX = 0;
let mouseY = 0;

let fadeIn = true;

const totalElementCount = 200;

window.onload = () => {
    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        //console.log(mouseX, mouseY);
    });

    document.querySelector("#hidebtn").addEventListener("click", hideCard);

    setup();
    requestAnimationFrame(loop);
    log().then(e => {
        showMain();
    });
}

function showMain() {
    document.querySelector("#main_content").style.opacity = "1";
}

function hideMain() {
    document.querySelector("#main_content").style.opacity = "0";
}

function getAccentColor() {
    return "red";
}

function getDistanceToMouseCoords(elem) {
    let x__ = mouseX - elem.x_;
    let y__ = mouseY - elem.y_;

    return Math.sqrt(
        x__ ** 2 + y__ ** 2
    );
}

function getDistanceToMouseInPc(elem) {
    let mouse = getDistanceToMouseCoords(elem);

    let c = Math.sqrt((0 - canvas.width ** 2) + (0 - canvas.height ** 2));

    let p = mouse / c * 100;
    // console.log(p);

    return p;
}

function setup() {
    for (let i = 0; i < totalElementCount; i++) {
        let stringOp = i / totalElementCount * 100;
        console.log(stringOp);
        circles.push(new Circle(canvas, stringOp));
    }

    debugCircle = new DebugCircle(canvas);
}

function drawDebugCircle() {
    ctx.fillStyle = "white";
    let s = debugCircle.size;
    ctx.fillRect(debugCircle.x, debugCircle.y, s, s);
}

function loop(ts) {
    circles.forEach(e => e.update(ts));
    debugCircle.update(ts);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let c of circles) {
        ctx.fillStyle = c.color;
        //ctx.fillRect(c.x, c.y, c.radius, c.radius);
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius / 2, 0, 2 * Math.PI);
        ctx.fill();
    }

    connectAllTogether(circles);

    // drawDebugCircle();

    //return;
    requestAnimationFrame(loop);
}

function connectAllTogether(circles) {
    for (let i = 0; i < circles.length; i++) {
        if (circles[i + 1] !== undefined) {

            var gradient = ctx.createLinearGradient(circles[i].x, circles[i].y, circles[i + 1].x, circles[i + 1].y);
            gradient.addColorStop("0", circles[i].color);
            gradient.addColorStop("1.0", circles[i + 1].color);


            ctx.beginPath();
            // ctx.strokeStyle = "rgba(255, 255, 255, " + circles[i].stringOpacity + ")";
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.moveTo(circles[i].x, circles[i].y);
            ctx.lineTo(circles[i + 1].x, circles[i + 1].y);
            ctx.stroke();
        }
    }
}

class Circle {
    get x() {
        //return this.x_;
        return Math.cos(this.ts / this.speed * this.direction) * 3 + this.x_ + this.radius
    }

    get y() {
        return Math.sin(this.ts / this.speed * this.direction) * 3 + this.y_ + this.radius;
        //return this.y_;
    }

    get hue() {
        return getDistanceToMouseCoords(this);
    }

    get speed() {
        return this.speed_;
    }

    get color() {
        return this.color_ 
    }

    constructor(canvas, opacity = 100, x = null, y = null) {
        this.x_ = Math.floor(Math.random() * (!x ? canvas.width + 500 : x)) - 250;
        this.y_ = Math.floor(Math.random() * (!y ? canvas.height + 500 : y)) - 250;
        this.ts = 0;
        this.radius = 10;
        this.speed_ = 100 + Math.random() * 500;
        this.color_ = getRandomColor(opacity);
        console.log(this.color_);
        this.direction = Math.random() > 0.5 ? 1 : -1;

        this.stringOpacity = opacity;
    }

    update(ts) {
        this.ts = ts;
    }
}

function getRandomColor(a = 100) {
    // var letters = '0123456789ABCDEF';
    // return `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)}, ${a / 100})`;
    return `hsl(0, 0%, ${a}%)`;

    // return color;
}

class DebugCircle {
    get x() {
        // return this.x_;
        return Math.sin(this.ts / this.speed) * (this.canvas.width / 2) + this.x_;
    }

    get y() {
        // return this.y_;

        return Math.cos(this.ts / this.speed) * (this.canvas.height / 3) + this.y_;
        // console.log(g);
        // return g;
    }

    get size() {
        let d = getDistanceToMouseInPc(this);
        // console.log(d);
        return d;
    }

    constructor(canvas) {
        this.canvas = canvas;
        this.x_ = this.canvas.width / 2;
        this.y_ = this.canvas.height / 2;
        this.speed = 10000;
    }

    update(ts) {
        this.ts = ts;
    }
}

function hideCard() {
    document.querySelector(".main-container").classList.toggle("hide");
}