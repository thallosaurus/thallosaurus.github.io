/**
 * URL-Parameters:
 * h: Bestimmt die Anzahl der Reihen
 * bc: Bestimmt die Anzahl der Spalten (16 - 32768, wird auf die nächste Hochzahl gerundet)
 * cl: Bestimmt, ab wann die Anzeige "clippt" (gesamte höhe - cl)
 * tb: Aktiviert den Talkback Modus (Achtung, bitte Lautsprecher leiser drehen)
 * dbg: Verbindet zu remotejs.com mit dem angegeben Token (1 für Popup um ID einzugeben)
 * file: Gibt an, welche Externe Datei statt des Mikrofons genutzt werden soll
 */

let content, audioCtx, analyser, gain, dataArray, peakArray, htmlElements, cbStream, mediaStream, playing, fpsCounter;

const height = parseInt(getParam("h") ?? 15);
const width = fft(getParam("bc") ?? 16);
const clipLevel = parseInt(getParam("cl") ?? 5);
const talkback = parseInt(getParam("tb") ?? 0) == 1;
const useInfile = getParam("file") != null && getParam("file") != "";
const DEFAULT_GLYPH = "";
const peakHoldTime = 1000;

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

window.onload = () => {
  if (getParam("dbg")) {
    createDebugAdapter(getParam("dbg"));
  }

  content = document.querySelector("#content");
  countFPS();
  createBackground(width, height, content);
  startCapture(0);
}

/**
 * Initialisiert den AudioContext und das Mikrofon
 */
function initMicAndContext() {
  initAudioContext();
  if (useInfile) {
    initAudioFile(getParam("file"), audioCtx, analyser);
  } else initMicrophone(audioCtx, analyser);
}

/**
 * Erstellt die "Tabelle"
 * @param {number} fnWidth Die Breite der Tabelle
 * @param {number} fnHeight Die Höhe der Tabelle
 * @param {HTMLElement} fnWindow Der Platzhalter im DOMContentTree
 */
function createBackground(fnWidth, fnHeight, fnWindow = null) {
  if (!fnWindow) throw new Error("You didn't specify an element");

  for (let lY = fnHeight - 1; lY > -1; lY--) {
    let row = document.createElement("div");
    row.dataset.rowNumber = lY;
    let wQty = parseInt(getComputedStyle(content).getPropertyValue("--visu-width"));
    row.style.width = (width * wQty) + "px";

    for (let lX = 0; lX < fnWidth; lX++) {
      let col = document.createElement("span");
      col.innerText = DEFAULT_GLYPH;
      col.dataset.colNumber = lX;
      col.dataset.modified = 0;
      row.append(col);
    }
    fnWindow.append(row);
  }
}

/**
 * Hole Zelle aus Tabelle mit Koordinaten
 * @param {number} x X-Koordinate
 * @param {number} y Y-Koordinate
 */
function getXY(x, y) {
  let cell = content.querySelector(`div[data-row-number='${y}'] span[data-col-number='${x}']`);
  return cell;
}

/**
 * Initialisiert den AudioContext. Muss vor Initialisierung der Eingabequellen aufgerufen werden
 */
function initAudioContext() {
  let AudioContext_ = null;
  if (!("AudioContext" in window) /*&& !AudioContext*/) AudioContext_ = window.webkitAudioContext;

  if (!audioCtx) {
    audioCtx = new (AudioContext_ ?? AudioContext)({
      latencyHint: 'interactive'
    });
  }
  disconnect(); //Disconnect old inputs, if there are any

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = width * 2;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  initPeakMeter();
}

/**
 * Initialisert das GainNode
 * @param {AudioContext} fnCtx Der bestehende AudioContext
 */
function initGain(fnCtx) {
  gain = fnCtx.createGain();
  return gain;
}

/**
 * Initialisert das Mikrofon und verbindet es an den bestehenden AudioContext
 * @param {AudioContext} fnCtx Der bestehende AudioContext
 * @param {AnalyserNode} fnAnalyser Der AudioAnalyser welcher das Signal prozessiert
 */
function initMicrophone(fnCtx, fnAnalyser) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((sound) => {
      // debugger;
      mediaStream = sound;
      cbStream = fnCtx.createMediaStreamSource(sound);
      gain = initGain(fnCtx);
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

function initAudioFile(fileName, fnCtx, fnAnalyser) {
  fetch("sounds/" + fileName + ".mp3").then((res) => {
    if (res.ok) {
      return res.arrayBuffer();
    }
  }).then(res => {

    fnCtx.decodeAudioData(res, (data) => {
      const source = fnCtx.createBufferSource();
      source.buffer = data;

      gain = initGain(fnCtx);
      gain.connect(fnAnalyser);
      source.connect(gain);

      fnAnalyser.connect(fnCtx.destination);

      source.start();
    });
  })
}

/**
 * Loop Funktion, welche den Bildschirm füllt
 * @param {number} e 
 */
function startCapture(e) {
  reinit(); //reset the screen before modifying the screen
  analyser?.getByteFrequencyData(dataArray);
  transferToPeakMeter(dataArray, peakArray, e);
  if (dataArray?.length > 0) drawToDOM(dataArray, peakArray);
  setTimeout(() => {
    requestAnimationFrame(startCapture);
  }, 10);
}

/**
 * Initialisiert den FPS Counter
 */
function countFPS() {
  fpsCounter ??= document.querySelector("#fps");
  fpsCounter.value = fps();
  requestAnimationFrame(countFPS);
}

/**
 * Malt die Kästchen im DOM an
 * @param {*} fnDataArray 
 * @param {*} fnPeakArray 
 */
function drawToDOM(fnDataArray, fnPeakArray) {
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
        let color = getRedishTone(fnDataArray[i]);
        fg.style.backgroundColor = color;
        fg.dataset.modified = 1;
      }

      if (k == h && k != 0 && fg.className == "meter") {
        fg.style.opacity = opacity;
      }
    }
  }

  for (let i = 0; i < fnPeakArray?.length; i++) {
    let h = parseInt(map(fnPeakArray[i].value, 0, 255, 0, height - 1));
    let elem = getXY(i, h);
    elem.className = "peak";
    elem.dataset.modified = 1;
  }
}

/**
 * Mapping Hilfsfunktion
 */
function map(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

/**
 * Setzt die Tabellarische Anzeige zurück
 */
function reinit() {
  content.querySelectorAll('span[data-modified="1"]').forEach((f) => {
    f.className = "";
    f.style.opacity = 1;
    f.style.backgroundColor = "";
    f.dataset.modified = 0;
  });
}

function disconnect() {
  if (playing) gain.disconnect(analyser);
  mediaStream?.getTracks()[0].stop();
  playing = false;
}

function getParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function createDebugAdapter(id) {
  let dbg = document.createElement("script");
  if (id == 1) {
    id = prompt("Debug-Token:");
  }

  if (id !== null) {
    dbg.dataset.consolejsChannel = id;
    dbg.src = "https://remotejs.com/agent/agent.js";
    document.head.append(dbg);
  }
}

function changeGain(elem) {
  //gain.gain.value = 100 - (100 / elem.value);/* / 100 * 2;*/
}

function showCSSGrid() {
  document.querySelectorAll("*").forEach(function (a) { a.style.outline = "1px solid #" + (~~(Math.random() * (1 << 24))).toString(16) });
}

function initPeakMeter() {
  peakArray = new Array(dataArray.length).fill(new Peak(0, 0));
}

function transferToPeakMeter(fnDataArray, fnPeakArray, ts) {
  for (let i = 0; i < fnDataArray?.length; i++) {
    if (fnDataArray[i] > fnPeakArray[i].value) {
      fnPeakArray[i] = new Peak(fnDataArray[i], ts);
    }
    fnPeakArray[i].update(ts);
  }
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

function getRedishTone(value) {
  return "#" + ((value << 16) | (0 << 8) | 255 - value).toString(16);
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
