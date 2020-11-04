let content, audioCtx, analyser, dataArray, htmlElements;

const height = 20;
const width = 128;
const DEFAULT_GLYPH = "0";

window.onload = () => {
  if (getParam("dbg")) {
    createDebugAdapter(getParam("dbg"));
  }
  content = document.querySelector("#content");
  htmlElements = [];
  createBackground(width, height, content);
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
  }
}

function getXY(x, y) {
  let cell = document.querySelector(`div[data-row-number='${y}'] span[data-col-number='${x}']`);
  return cell;
}

// AudioContext Initialization and all other stuff you need to process Audio Data
function initAudioContext() {
  // if (!"AudioContext" in window || !AudioContext) {alert("AudioContext not supported"); throw new Error("Failed to catch AudioContext - Not supported")};

  // let acAudioContext = window.AudioContext || window.webkitAudioContext;

  if (!"AudioContext" in window && !AudioContext) AudioContext = window.webkitAudioContext;

  audioCtx = new AudioContext({
    latencyHint: 'interactive',
    sampleRate: 44100,
  });
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = width * 2;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  initMicrophone(audioCtx, analyser);
}

function initMicrophone(fnCtx) {
  try {
    navigator.getUserMedia({ audio: true }, (sound) => {
      let cbStream = fnCtx.createMediaStreamSource(sound);
      cbStream.connect(analyser);
      capture(analyser, dataArray);
    }, (error) => { alert(error); throw error });
  } catch (e) {
    console.log(e.message + ": " + e.lineNumber);
    // alert(e.message + ":" + e.lineNumber);
  }
}

function capture(fnAnalyser, array) {
  analyser.getByteFrequencyData(dataArray);
  reinit(); //reset the screen before modifying the screen
  for (let i = 0; i < dataArray.length; i++) {
    let h = parseInt(map(dataArray[i], 0, 255, 0, height - 1));
    let opacity = map(dataArray[i], 0, 255, 0, 1);

    for (let k = 0; k < h + 1; k++) {
      let fg = getXY(i, k);
      if (!fg) {
        debugger;
        throw Error("Not a HTML element, h: " + h + " w: " + i);
      }

      fg.innerText = 0;
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
  requestAnimationFrame(() => { capture(fnAnalyser, dataArray) });
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

function getParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function createDebugAdapter(id) {
  let dbg = document.createElement("script");
  dbg.dataset.consolejsChannel = id;
  dbg.src = "https://remotejs.com/agent/agent.js";
  document.head.append(dbg);
}
