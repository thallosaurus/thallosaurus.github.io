/**
 * URL-Parameters:
 * h: Bestimmt die Anzahl der Reihen
 * bc: Bestimmt die Anzahl der Spalten (16 - 32768, wird auf die nächste Hochzahl gerundet)
 * cl: Bestimmt, ab wann die Anzeige "clippt" (gesamte höhe - cl)
 * tb: Aktiviert den Talkback Modus (Achtung, bitte Lautsprecher leiser drehen)
 * dbg: Verbindet zu remotejs.com mit dem angegeben Token (1 für Popup um ID einzugeben)
 * file: Gibt an, welche Externe Datei statt des Mikrofons genutzt werden soll
 */

//let content, audioCtx, analyser, gain, dataArray, peakArray, htmlElements, cbStream, mediaStream, playing, fpsCounter;

let main;
let cancelRedraw = false;
let showIndividualFrequencyVolume = true;
let showTimeDomainData = false;
let showPeakMeter = true;
let showLevels = true;

/**
 * Gibt eine Zahl aus, welche zwischen 2^4 und 2^15 liegt
 * @param {number} input Die Zahl, welche gerundet werden soll
 */
function fft(input) {
  for (let pow = 4; pow < 16; pow++) {
    let v = 2 ** pow;
    if (input > v) {
      continue;
    } else return v;
  }
  return 2 ** 15;
}

/*window.onload = () => {
  main = new Main("#content");
}*/

/**
 * Initialisiert den FPS Counter
 */
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
  main.changeGain(elem.value);
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
      if (this.value < 0) {
        this.value = 0;
      } else this.value -= 5;
    }
  }
}

function getTrueOpacityValue(value) {
  return map(value % height, 0, height, 0, 1);
}

function getRedishToneHex(value) {
  if (showIndividualFrequencyVolume) {
    return "#" + ((value << 16) | (0 << 8) | 255 - value).toString(16);
  } else return "#0000ff";
}

function getRedishToneRGBA(value) {
  if (showIndividualFrequencyVolume) {
    return "rgba(" + value + ",0," + (255 - value) + "," + getTrueOpacityValue(value) + ")";
  } else return "rgba(0,0,255," + getTrueOpacityValue(value) + ")";
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

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // const newColorScheme = e.matches ? "dark" : "light";
      this.output.fetchColorSchemes();
    });

    // debugger;

    this.output = useDOM ? new DOMOutput() : new CanvasOutput();
    this.playing = false;

    this.fft = width;

    this.fileSource = null;

    this.content = document.querySelector(qSel);
    this.dataArray = this.initDataArray(width);
    this.peakArray = this.initPeakMeter();
    this.timeDomainData = new Uint8Array(width).fill(128);
    // countFPS();
    this.output.init(width, height, this.content);
    this.output.referenceParent(this);
    this.capture(0);
  }

  set fft(v) {
    this.fftSize = fft(v) * 2;
    // this?.analyser?.fftSize = this.fftSize;
    if (this.analyser) {
      this.analyser.fftSize = this.fftSize;
      console.log
    }
  }

  /*resize(w, h) {
    this.output?.setSize(w, h);
  }*/

  addMusicStartCallback(cb) {
    this.musicStartCallback = cb; 
  }

  set playing(v) {
    this.playState = v;
    this.output.notifyPlayState(v);
  }

  get playing() {
    return this.playState;
  }

  initDataArray(fnW) {
    return new Uint8Array(fnW).fill(0);
  }

  initPeakMeter() {
    return new Array(this.dataArray.length).fill(new Peak(0, 0));
  }

  initAudioContext() {
    let AudioContext_ = null;
    if (!("AudioContext" in window) /*&& !AudioContext*/) AudioContext_ = window.webkitAudioContext;

    if (!this.audioCtx) {
      this.audioCtx = new (AudioContext_ ?? AudioContext)({
        latencyHint: 'interactive'
      });
    }
    this.disconnect(); //Disconnect old inputs, if there are any

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    // this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  setFFT(fnValue) {
    // if (this.analyser != null) {
      // this.analyser.fftSize = fft(fnValue) * 2;
    // }
      //reinit buffer arrays
      this.dataArray = this.initDataArray(fnValue);
      this.peakArray = this.initPeakMeter();
      this.timeDomainData = new Uint8Array(width).fill(128);
    // }
  }

  initMicAndContext() {
    this.initAudioContext();
    if (useInfile) {
      this.initAudioFile(getParam("file"), this.audioCtx, this.analyser);
    } else this.initMicrophone(this.audioCtx, this.analyser);
  }

  playFile(filename) {
    this.initAudioContext();
    this.initAudioFile(filename, this.audioCtx, this.analyser);
  }

  stopFile() {
    this.disconnect();
  }

  initAudioFile(fileName, fnCtx, fnAnalyser) {
    fetch("songs/" + fileName + ".mp3").then((res) => {
      if (res.ok) {
        return res.arrayBuffer();
      }
    }).then(res => {

      fnCtx.decodeAudioData(res, (data) => {
        this.fileSource = fnCtx.createBufferSource();
        this.fileSource.buffer = data;

        let lgain = this.initGain(fnCtx);
        lgain.connect(fnAnalyser);
        this.fileSource.connect(lgain);

        fnAnalyser.connect(fnCtx.destination);

        /* this.fileSource.onstart = function() {
          alert("Ready");
        } */

        this.fileSource.start();
        console.log(this.fileSource);
        if (this.musicStartCallback) {
          this.musicStartCallback();
        }
        this.playing = true;
      });
    });
  }

  initMicrophone(fnCtx, fnAnalyser) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((sound) => {
        // debugger;
        this.mediaStream = sound;
        this.cbStream = fnCtx.createMediaStreamSource(sound);
        let gain = this.initGain(fnCtx);
        gain.connect(fnAnalyser);
        this.cbStream.connect(gain);
        if (talkback) {
          alert("Bitte jetzt leiser drehen");
          this.cbStream.connect(this.audioCtx.destination);
        }
        this.playing = true;
      }).catch((e) => {
        console.log(e);
        alert(e);
      });
  }

  initGain(fnCtx) {
    this.gain = fnCtx.createGain();
    return this.gain;
  }

  changeGain(val) {
    console.log(val);
    this.gain.gain.value = map(val, 0, 100, 0, 2);
    //(100 / val * 2) ;
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
    if (!cancelRedraw) this.output.reinit(); //reset the screen before modifying the screen

    this.analyser?.getByteFrequencyData(this.dataArray);
    this.transferToPeakMeter(this.dataArray, this.peakArray, e);
    this.analyser?.getByteTimeDomainData(this.timeDomainData);
    this.output.draw(this.dataArray, this.peakArray, this.timeDomainData);

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
      showCSSGrid();
    }
  }

  disconnect() {
    if (this.playing) this.gain.disconnect(this.analyser);
    this.mediaStream?.getTracks()[0].stop();
    this.fileSource?.stop();
    this.playing = false;
  }

  resize(w, h, wp, hp) {
    this.output.setSize(w, h, wp, hp);
    this.setFFT(w);
  }
}

/* Template Class for Output Interface */
class OutputInterface {
  constructor() {
    this.fetchColorSchemes();
  }

  fetchColorSchemes() {
    this.wQty = parseInt(getComputedStyle(document.body).getPropertyValue("--visu-width"));
    if (isNaN(this.wQty)) this.wQty = 10;

    this.hQty = parseInt(getComputedStyle(document.body).getPropertyValue("--visu-height"));
    if (isNaN(this.hQty)) this.hQty = 10;


    this.backgroundColor = getComputedStyle(document.body).getPropertyValue("--background");
    this.peakColor = getComputedStyle(document.body).getPropertyValue("--accent");

    console.log(this);
  }

  setSize(fnWidth, fnHeight, fnVisuWidth, fnVisuHeight) {
    if (fnVisuHeight) {
      document.documentElement.style.setProperty("--visu-height", fnVisuHeight);
    }

    if (fnVisuWidth) {
      document.documentElement.style.setProperty("--visu-width", fnVisuWidth);
    }

    this.fetchColorSchemes();
    this.width = fnWidth;
    this.height = fnHeight;
  }

  referenceParent(parentObj) {
    this.parent = parentObj;
  }

  init(fnWidth, fnHeight, fnWindow = null) {

  }

  reinit() {

  }

  draw(fnDataArray, fnPeakArray, fnTimeDomainData) {

  }

  drawTimeDomainData(fnTimeDomainData) {

  }

  notifyPlayState(s) {
    this.playing = s;
  }
}

class CanvasOutput extends OutputInterface {
  constructor() {
    super();
    // this.modifiedBuffer = new Array();
  }

  init(fnWidth, fnHeight, fnWindow = null) {
    if (!fnWindow) throw new Error("You didn't specify an element");
    this.canvas = document.createElement("canvas");

    this.setSize(fnWidth, fnHeight);

    this.ctx = this.canvas.getContext("2d");
    fnWindow.append(this.canvas);
  }

  setSize(fnWidth, fnHeight, fnPixelWidth, fnPixelHeight) {
    super.setSize(fnWidth, fnHeight, fnPixelWidth, fnPixelHeight);
    this.canvas.width = fnWidth * this.wQty;
    this.canvas.height = fnHeight * this.hQty;
  }

  reinit() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width * this.wQty, this.height * this.hQty + this.hQty);
  }

  draw(fnDataArray, fnPeakArray, fnTimeDomainData) {
    if (showLevels) this.drawLevels(fnDataArray);
    if (showPeakMeter) this.drawPeakMeter(fnPeakArray);
    if (showTimeDomainData) this.drawTimeDomainData(fnTimeDomainData);

    if (!this.playing) {
      // this.drawInfo();
    }
  }

  drawInfo() {
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "black";
    this.ctx.font = "50px Arial";
    this.ctx.fillText("Click here to enable Audio", this.canvas.width / 2, this.canvas.height / 2);
  }

  drawLevels(fnDataArray) {
    for (let i = 0; i < fnDataArray.length; i++) {
      let meterHeight = parseInt(map(fnDataArray[i], 0, 255, 0, this.height));

      for (let j = 0; j < meterHeight; j++) {

        let color;

        if (meterHeight > this.height - clipLevel && j > this.height - clipLevel) {
          color = "yellow";
        } else {
          color = getRedishToneHex(fnDataArray[i]);
        }
        if (j == meterHeight - 1) {
          color = getRedishToneRGBA(fnDataArray[i]);
        }
        this.drawXY(i, j, color);
      }
    }
  }

  drawPeakMeter(fnPeakArray) {
    for (let i = 0; i < fnPeakArray.length; i++) {
      let peakMeter = parseInt(map(fnPeakArray[i].value, 0, 255, 0, this.height));
      // console.log(fnPeakArray[i]);
      if (peakMeter[i] < 0) {
        console.log(peakMeter);
        debugger;
      }
      this.drawXY(i, peakMeter, this.peakColor);
    }

  }

  drawTimeDomainData(fnTimeDomainData) {
    for (let i = 0; i < fnTimeDomainData.length; i++) {
      let meterHeight = parseInt(map(fnTimeDomainData[i], 0, 255, 0, this.height));
      this.drawXY(i, meterHeight, "purple");
    }
  }

  drawXY(x, y, color) {
    this.ctx.fillStyle = color;
    if (y < 0) {
      // let mmed = map(y, 0,this.height, 0, 255);
      console.log("underrun " + y);
    }
    this.ctx.fillRect(this.wQty * x, (this.canvas.height - this.hQty) - this.hQty * y, this.wQty, this.hQty);
  }

  drawScale() {
    for (let i = 0; i < height; i++) {
      //TODO
    }
  }
}

class DOMOutput extends OutputInterface {
  constructor() {
    super();
  }

  init(fnWidth, fnHeight, fnWindow = null) {
    if (!fnWindow) throw new Error("You didn't specify an element");

    this.htmlElements = {};

    this.setSize(fnWidth, fnHeight);

    for (let lY = this.fnHeight - 1; lY > -1; lY--) {
      let row = document.createElement("div");
      row.dataset.rowNumber = lY;
      row.style.width = (this.width * this.wQty) + "px";

      this.htmlElements[lY] = {};

      for (let lX = 0; lX < this.fnWidth; lX++) {
        let col = document.createElement("span");
        col.innerText = DEFAULT_GLYPH;
        col.dataset.colNumber = lX;
        col.dataset.modified = 0;
        // debugger;
        this.htmlElements[lY][lX] = col;
        // row.append(htmlElements[arrayPointer][lX]);
        row.append(col);
      }

      fnWindow.append(row);
    }
  }

  /*setSize(fnWidth, fnHeight) {
    super.setSize(fnWidth, fnHeight);
    this.canvas.width = fnWidth * this.wQty;
    this.canvas.height = fnHeight * this.hQty;
  }*/

  reinit() {
    for (let y in this.htmlElements) {
      for (let x in this.htmlElements[y]) {
        // console.log(x);
        this.htmlElements[y][x].className = "";
        this.htmlElements[y][x].style.opacity = 1;
        this.htmlElements[y][x].style.backgroundColor = "";
        this.htmlElements[y][x].dataset.modified = 0;
      }
    }
  }

  draw(fnDataArray, fnPeakArray) {
    for (let i = 0; i < fnDataArray.length; i++) {
      let h = parseInt(map(fnDataArray[i], 0, 255, 0, height - 1));
      let opacity = getTrueOpacityValue(fnDataArray[i]);

      for (let k = 0; k < h + 1; k++) {
        let fg = this.getXY(i, k);
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

    for (let i = 0; i < fnPeakArray?.length; i++) {
      let h = parseInt(map(fnPeakArray[i].value, 0, 255, 0, height - 1));
      let elem = this.getXY(i, h);
      elem.className = "peak";
      elem.dataset.modified = 1;
    }
  }

  getXY(x, y) {
    // let cell = content.querySelector(`div[data-row-number='${y}'] span[data-col-number='${x}']`);
    try {
      let cell = this.htmlElements[y][x];
      return cell;
    } catch (e) {
      debugger;
    }
  }
}

function disconnect() {
  main.disconnect();
}

function dbgDraw(x, y) {
  // main.output.ctx.fillStyle = "black";
  main.output.drawXY(x, y, "black");
}
