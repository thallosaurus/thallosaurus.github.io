/**
 * URL-Parameters:
 * h: Bestimmt die Anzahl der Reihen
 * bc: Bestimmt die Anzahl der Spalten (16 - 32768, wird auf die nächste Hochzahl gerundet)
 * cl: Bestimmt, ab wann die Anzeige "clippt" (gesamte höhe - cl)
 * tb: Aktiviert den Talkback Modus (Achtung, bitte Lautsprecher leiser drehen)
 * dbg: Verbindet zu remotejs.com mit dem angegeben Token (1 für Popup um ID einzugeben)
 */

let content, audioCtx, analyser, gain, dataArray, peakArray, htmlElements, cbStream, mediaStream, playing, fpsCounter;

let main;
let cancelRedraw = false;

const height = parseInt(getParam("h") ?? 15);
const width = fft(getParam("bc") ?? 16);
const clipLevel = parseInt(getParam("cl") ?? 5);
const talkback = parseInt(getParam("tb") ?? 0) == 1;
const useInfile = getParam("file") != null && getParam("file") != "";
const useObj = (getParam("obj") == 1) ?? false;
const DEFAULT_GLYPH = "";
const peakHoldTime = 1000;

function fft(input) {
  for (let pow = 4; pow < 16; pow++) {
    let v = 2 ** pow;
    if (input > v) {
      continue;
    } else return v;
  }
  return 2 ** 15;
}

window.onload = () => {
  // if (!useObj) {
  //   if (getParam("dbg")) {
  //     createDebugAdapter(getParam("dbg"));
  //   }

  //   content = document.querySelector("#content");
  //   countFPS();
  //   createBackground(width, height, content);
  //   startCapture(0);
  // } else {
  main = new Main("#content");
  // }
}

/**
 * Hole Zelle aus Tabelle mit Koordinaten
 * @param {number} x X-Koordinate
 * @param {number} y Y-Koordinate
 */
/* function getXY(x, y) {
  // let cell = content.querySelector(`div[data-row-number='${y}'] span[data-col-number='${x}']`);
  try {
    let cell = htmlElements[y][x];
    return cell;
  } catch (e) {
    debugger;
  }
} */

function countFPS() {
  fpsCounter ??= document.querySelector("#fps");
  fpsCounter.value = fps();
  requestAnimationFrame(countFPS);
}

function map(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


function getParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function changeGain(elem) {
  //gain.gain.value = 100 - (100 / elem.value);/* / 100 * 2;*/
}

function showCSSGrid() {
  document.querySelectorAll("*").forEach(function (a) { a.style.outline = "1px solid #" + (~~(Math.random() * (1 << 24))).toString(16) });
}
class Peak {
  constructor(val, ts) {
    this.peak(val, ts);
  }

  peak(v, i) {
    this.value = v;
    this.t = i;
  }

  update(ts) {
    if (ts > this.t + peakHoldTime) {
      this.value -= 5;
    }
  }
}

function getTrueOpacityValue(value) {
  return map(value % height, 0, height, 0, 1);
}

function getRedishToneHex(value) {
  return "#" + ((value << 16) | (0 << 8) | 255 - value).toString(16);
}

function getRedishToneRGBA(value) {
  return "rgba(" + value + ",0," + (255 - value) + "," + getTrueOpacityValue(value) + ")";
}

function sleep(time) {
  return new Promise((res) => {
    setTimeout(res, time);
  });
}

fps = (function () {
  var lastLoop = (new Date()).getMilliseconds();
  var count = 1;
  var fps = 0;

  return function () {
    var currentLoop = (new Date()).getMilliseconds();
    if (lastLoop > currentLoop) {
      fps = count;
      count = 1;
    } else {
      count += 1;
    }
    lastLoop = currentLoop;
    return fps;
  };
}());

class Main {
  constructor(qSel) {
    if (getParam("dbg")) {
      this.createDebugAdapter(getParam("dbg"));
    }

    debugger;

    this.output = useObj ? new CanvasOutput() : new DOMOutput();

    content = document.querySelector(qSel);
    // countFPS();
    this.output.init(width, height, content);
    this.capture(0);
  }

  initAudioContext() {
    let AudioContext_ = null;
    if (!("AudioContext" in window) /*&& !AudioContext*/) AudioContext_ = window.webkitAudioContext;

    if (!audioCtx) {
      audioCtx = new (AudioContext_ ?? AudioContext)({
        latencyHint: 'interactive'
      });
    }
    this.disconnect(); //Disconnect old inputs, if there are any

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = width * 2;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    this.initPeakMeter();
  }

  initMicAndContext() {
    this.initAudioContext();
    if (useInfile) {
      this.initAudioFile(getParam("file"), audioCtx, analyser);
    } else this.initMicrophone(audioCtx, analyser);
  }

  initAudioFile(fileName, fnCtx, fnAnalyser) {
    fetch("songs/" + fileName + ".mp3").then((res) => {
      if (res.ok) {
        return res.arrayBuffer();
      }
    }).then(res => {

      fnCtx.decodeAudioData(res, (data) => {
        const source = fnCtx.createBufferSource();
        source.buffer = data;

        gain = this.initGain(fnCtx);
        gain.connect(fnAnalyser);
        source.connect(gain);

        fnAnalyser.connect(fnCtx.destination);

        source.start();
      });
    });
  }

  initMicrophone(fnCtx, fnAnalyser) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((sound) => {
        // debugger;
        mediaStream = sound;
        cbStream = fnCtx.createMediaStreamSource(sound);
        gain = this.initGain(fnCtx);
        gain.connect(fnAnalyser);
        cbStream.connect(gain);
        if (talkback) {
          alert("Bitte jetzt leiser drehen");
          cbStream.connect(audioCtx.destination);
        }
        playing = true;
      }).catch((e) => {
        console.log(e);
        alert(e);
      });
  }

  initGain(fnCtx) {
    gain = fnCtx.createGain();
    return gain;
  }

  initPeakMeter() {
    peakArray = new Array(dataArray.length).fill(new Peak(0, 0));
  }

  transferToPeakMeter(fnDataArray, fnPeakArray, ts) {
    for (let i = 0; i < fnDataArray?.length; i++) {
      if (fnDataArray[i] > fnPeakArray[i].value) {
        fnPeakArray[i] = new Peak(fnDataArray[i], ts);
      }
      fnPeakArray[i].update(ts);
    }
  }

  capture(e) {
    // console.log(e);
    this.output.reinit(); //reset the screen before modifying the screen
    analyser?.getByteFrequencyData(dataArray);
    this.transferToPeakMeter(dataArray, peakArray, e);
    if (dataArray?.length > 0) /*this.drawToDOM(dataArray, peakArray);*/ this.output.draw(dataArray, peakArray);
    setTimeout(() => {
      requestAnimationFrame((t) => { this.capture(t) });
    }, 25);
  }

  createDebugAdapter(fnToken) {
    let dbg = document.createElement("script");
    if (fnToken == 1) {
      fnToken = prompt("Debug-Token:");
    }

    if (fnToken !== null) {
      dbg.dataset.consolejsChannel = fnToken;
      dbg.src = "https://remotejs.com/agent/agent.js";
      document.head.append(dbg);
    }
  }

  disconnect() {
    if (playing) gain.disconnect(analyser);
    mediaStream?.getTracks()[0].stop();
    playing = false;
  }
}

/* Template Class for Output Interface */
class OutputInterface {
  constructor() {
    this.wQty = parseInt(getComputedStyle(document.body).getPropertyValue("--visu-width"));
    this.hQty = parseInt(getComputedStyle(document.body).getPropertyValue("--visu-height"));
  }

  init(fnWidth, fnHeight, fnWindow = null) {

  }

  reinit() {

  }

  draw(fnDataArray, fnPeakArray) {

  }

  getXY(x, y) {

  }
}

class CanvasOutput extends OutputInterface {
  constructor() {
    super();
  }

  init(fnWidth, fnHeight, fnWindow = null) {
    if (!fnWindow) throw new Error("You didn't specify an element");
    this.canvas = document.createElement("canvas");

    this.width = fnWidth;
    this.height = fnHeight;

    this.canvas.width = fnWidth * this.wQty;
    this.canvas.height = fnHeight * (this.hQty) + this.hQty;
    this.ctx = this.canvas.getContext("2d");
    fnWindow.append(this.canvas);
  }

  reinit() {
    if (!cancelRedraw) {
      this.ctx.fillStyle = "white";
      this.ctx.fillRect(0, 0, this.width * this.wQty, this.height * this.hQty);
    }
  }

  draw(fnDataArray, fnPeakArray) {
    for (let i = 0; i < fnDataArray.length; i++) {

      /*this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, fnDataArray[i]);
      this.ctx.stroke();*/
      let meterHeight = parseInt(map(fnDataArray[i], 0, 255, 0, this.height));
      // console.log(meterHeight);

      // if (h > height - clipLevel && k > height - clipLevel) {

      for (let j = 0; j < meterHeight; j++) {

        let color;

        if (meterHeight > height - clipLevel && j > height - clipLevel) {
          color = "yellow";
        } else {
          color = getRedishToneHex(fnDataArray[i]);
        }
        if (j == meterHeight - 1) {
          color = getRedishToneRGBA(fnDataArray[i]);
        }
        this.drawXY(i, j, color);
      }

      /* this.ctx.fillStyle = getRedishTone(fnDataArray[i]);
      this.ctx.fillRect(this.wQty * i, 0, this.wQty, fnDataArray[i]);*/
    }

    for (let i = 0; i < fnPeakArray.length; i++) {
      let peakMeter = parseInt(map(fnPeakArray[i].value, 0, 255, 0, this.height));
      // console.log(fnPeakArray[i]);
      this.drawXY(i, peakMeter, "green");
    }
  }

  drawXY(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.wQty * x, (this.canvas.height - this.hQty) - this.hQty * y, this.wQty, this.hQty);
  }
}

class DOMOutput extends OutputInterface {
  constructor() {
    super();
  }

  init(fnWidth, fnHeight, fnWindow = null) {
    if (!fnWindow) throw new Error("You didn't specify an element");

    htmlElements = {};

    for (let lY = fnHeight - 1; lY > -1; lY--) {
      let row = document.createElement("div");
      row.dataset.rowNumber = lY;
      // let wQty = parseInt(getComputedStyle(content).getPropertyValue("--visu-width"));
      row.style.width = (width * this.wQty) + "px";

      htmlElements[lY] = {};

      for (let lX = 0; lX < fnWidth; lX++) {
        let col = document.createElement("span");
        col.innerText = DEFAULT_GLYPH;
        col.dataset.colNumber = lX;
        col.dataset.modified = 0;
        // debugger;
        htmlElements[lY][lX] = col;
        // row.append(htmlElements[arrayPointer][lX]);
        row.append(col);
      }

      fnWindow.append(row);
    }
  }

  reinit() {
    for (let y in htmlElements) {
      for (let x in htmlElements[y]) {
        // console.log(x);
        htmlElements[y][x].className = "";
        htmlElements[y][x].style.opacity = 1;
        htmlElements[y][x].style.backgroundColor = "";
        htmlElements[y][x].dataset.modified = 0;
      }
    }
  }

  draw(fnDataArray, fnPeakArray) {
    for (let i = 0; i < fnDataArray.length; i++) {
      let h = parseInt(map(fnDataArray[i], 0, 255, 0, height - 1));
      let opacity = getTrueOpacityValue(fnDataArray[i]);

      for (let k = 0; k < h + 1; k++) {
        let fg = getXY(i, k);
        if (!fg) {
          debugger;
          throw Error("Not a HTML element, h: " + h + " w: " + i);
        }

        if (h > height - clipLevel && k > height - clipLevel) {
          fg.className = "clipping";
          fg.dataset.modified = 1;
        } else {
          fg.className = "meter";
          let color = getRedishToneHex(fnDataArray[i]);
          fg.style.backgroundColor = color;
          fg.dataset.modified = 1;
        }

        if (k == h && k != 0 && fg.className == "meter") {
          fg.className = "last";
          fg.style.opacity = opacity;
        }
      }
    }

    function getXY(x, y) {
      // let cell = content.querySelector(`div[data-row-number='${y}'] span[data-col-number='${x}']`);
      try {
        let cell = htmlElements[y][x];
        return cell;
      } catch (e) {
        debugger;
      }
    }

    for (let i = 0; i < fnPeakArray?.length; i++) {
      let h = parseInt(map(fnPeakArray[i].value, 0, 255, 0, height - 1));
      let elem = getXY(i, h);
      elem.className = "peak";
      elem.dataset.modified = 1;
    }
  }
}

function initMicAndContext() {
  main.initMicAndContext();
}

function disconnect() {
  main.disconnect();
}

function dbgDraw(x, y) {
  // main.output.ctx.fillStyle = "black";
  main.output.drawXY(x, y, "black");
}