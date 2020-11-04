let content, audioCtx, analyser, gain, dataArray, htmlElements, cbStream, mediaStream, playing;

const height = parseInt(getParam("h") ?? 15);
const width = parseInt(getParam("bc") ?? 64);
const DEFAULT_GLYPH = "";

window.onload = () => {
  if (getParam("dbg")) {
    createDebugAdapter(getParam("dbg"));
  }

  content = document.querySelector("#content");
  createBackground(width, height, content);
  startCapture(0);
}

function createBackground(fnWidth, fnHeight, fnWindow = null) {
  if (!fnWindow) throw new Error("You didn't specify an element");

  for (let lY = fnHeight - 1; lY > -1; lY--) {
    let row = document.createElement("div");
    row.dataset.rowNumber = lY
    for (let lX = 0; lX < fnWidth; lX++) {
      let col = document.createElement("span");
      col.innerText = DEFAULT_GLYPH;
      col.dataset.colNumber = lX;
      row.append(col);
    }
    fnWindow.append(row);
    // fnWindow.append(document.createElement("br"));
  }
}

function getXY(x, y) {
  let cell = content.querySelector(`div[data-row-number='${y}'] span[data-col-number='${x}']`);
  return cell;
}

// AudioContext Initialization and all other stuff you need to process Audio Data
function initAudioContext() {
  // if (!"AudioContext" in window || !AudioContext) {alert("AudioContext not supported"); throw new Error("Failed to catch AudioContext - Not supported")};

  // let acAudioContext = window.AudioContext || window.webkitAudioContext;

  let AudioContext_ = null;
  if (!("AudioContext" in window) /*&& !AudioContext*/) AudioContext_ = window.webkitAudioContext;

  if (!audioCtx) {
    audioCtx = new (AudioContext_ ?? AudioContext)({
      latencyHint: 'interactive'
      // sampleRate: 44100,
    });
  }
  disconnect(); //Disconnect old inputs, if there are any

  // debugger;
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = width * 2;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  initMicrophone(audioCtx, analyser);
}

function initGain(fnCtx) {
  gain = fnCtx.createGain();
  return gain;
}

function initMicrophone(fnCtx) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((sound) => {
      // debugger;
      mediaStream = sound;
      cbStream = fnCtx.createMediaStreamSource(sound);
      let gain = initGain(fnCtx);
      gain.connect(analyser);
      cbStream.connect(gain);
      // cbStream.connect(analyser);
      playing = true;
      // capture();
    }).catch((e) => {
      console.log(e);
    });
}

function startCapture(e) {
  reinit(); //reset the screen before modifying the screen
  // console.log(e);
  analyser?.getByteFrequencyData(dataArray);
  if (dataArray?.length > 0) drawToDOM(dataArray);
  requestAnimationFrame(startCapture);
}

function drawToDOM(fnDataArray) {
  for (let i = 0; i < fnDataArray.length; i++) {
    let h = parseInt(map(fnDataArray[i], 0, 255, 0, height - 1));
    let opacity = map(fnDataArray[i], 0, 255, 0, 1);

    for (let k = 0; k < h + 1; k++) {
      let fg = getXY(i, k);
      if (!fg) {
        debugger;
        throw Error("Not a HTML element, h: " + h + " w: " + i);
      }

      // fg.innerText = 0;
      if (h > height - 5 && k > height - 5) {
        fg.className = "clipping";
      } else {
        fg.className = "black";
      }

      if (k == h && k != 0) {
        fg.style.opacity = opacity;
      }
    }
  }
}

function map(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function reinit() {
  for (let e of content.children) {
    for (let f of e.children) {
      // f.innerText = DEFAULT_GLYPH;
      f.className = "";
      f.style.opacity = 1;
    }
  }
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
  gain.gain.value = elem.value / 100 * 20;
}

function showCSSGrid() {
  document.querySelectorAll("*").forEach(function (a) { a.style.outline = "1px solid #" + (~~(Math.random() * (1 << 24))).toString(16) });
}