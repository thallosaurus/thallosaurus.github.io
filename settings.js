const PAUSE_BETWEEN_WORDS = 500;
const DEFAULT_DRAWSPEED = 25;
const DEFAULTPAGE = "#index";

const EMBEDDING_TAG = /^@import (.*)/gim;
const CACHE_EMBEDDING_TAG = /^@cache/gim;

/* VISUALIZER */
const height = parseInt(getParam("h") ?? 16);
const width = fft(getParam("bc") ?? 16);
const clipLevel = parseInt(getParam("cl") ?? 5);
const talkback = parseInt(getParam("tb") ?? 0) == 1;
const useInfile = getParam("file") != null && getParam("file") != "";
const useDOM = (getParam("useDOM") == 1) ?? false;
const DEFAULT_GLYPH = "";
const peakHoldTime = 1000;