const LOADINGERROR = `# Oh-uh!
Looks like there was an Error while catching the content.

Found a bug or noticed something strange? Report it [here](https://github.com/thallosaurus/thallosaurus.github.io/issues)`;

const WAITING_ICON = `<div class="waiting">
<span class='first'></span>
<span class='second'></span>
<span class='third'></span>
</div>`;

const urlParams = new URL(location.href).searchParams;

const docmode = urlParams.get("doc") == 1;
const useAnims = ((getHash() == DEFAULTPAGE) && !docmode && getCookie("a") !== "shown") || urlParams.get("anims") == 1;
const useBreadcrumbs = urlParams.get("bc") != 0;
const useCache = urlParams.get("nocache") != 1;

let isPlayerEnlarged = false;

let histArray = [getHash()];

let drawSpeed = useAnims ? DEFAULT_DRAWSPEED : 0;

let finished = false;

let visu;

let playlist = null;

const SETTINGS = {
    "marked": {
        breaks: true
    }
}

let pageCache = {};

function isPageInCache(pagename) {
    return Object.keys(pageCache).includes(pagename);
}

function addToCache(pagename, data) {
    if (!isPageInCache(pagename)) {
        return new Promise((res, rej) => {
            if (data.ok) {
                data.text().then(d => {
                    pageCache[pagename] = d;
                    res(d);
                });
            } else {
                rej(data);
            }
        });
    }
}

function getPageFromCache(pagename) {
    return pageCache[pagename];
}

function getFile(file) {
    //console.log(`loading file ${file} from online`);
    return fetch(file);
}

async function getPage(file) {
    if (!isPageInCache(file)) {
        console.log(`Loaded ${file} from the internet`);

        return getFile(file).then(async e => {
            await addToCache(file, e);
            return getPageFromCache(file);
        }).catch((r) => {
            return LOADINGERROR + `\n\n(${r.status} - ${r.statusText})`;
        });
    }
    else {
        console.log(`Loaded ${file} from the cache`)
        return getPageFromCache(file);
    }
}

function initVisualizer(elemid) {
    visu = new Main(elemid);
    visu.addMusicStartCallback(() => {
        document.querySelector("#ppIcon").innerHTML = "||";
    });
}

function playFile(name) {
    visu.playFile(name);
    document.querySelector("#filename").innerText = " " + name;
    document.querySelector("#ppIcon").innerHTML = WAITING_ICON;
}

function stopFile() {
    visu.disconnect();
    document.querySelector("#filename").innerText = "Paused";
    document.querySelector("#ppIcon").innerHTML = "&#x25BA;";
}

function togglePlay() {
    if (!visu.playing) {
        playRandomTrack();
        // (track);
    } else {
        stopFile();
    }
}

async function playRandomTrack() {
    if (playlist == null) {
        await this.getFile("playlist.json")
        .then((request) => {
            return request.json();
        }).then((pl) => {
            playlist = pl;
        });
    }

    console.log(playlist);

    let track = playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];
    playFile(track);

    // return "Hope";
}

window.onload = function () {
    this.registerHashListener();
    initObserver();

    this.getFile("elements.json")
        .then((data) => {
            return data.json();
        }).then((json) => {
            asyncCreateFromObject(json);
        }).catch(e => {
            console.log(e);
        });

    initVisualizer("#v");

    if (useHTMLAudio) {
        document.querySelector("#audioPlayer").className = "";
    }

    this.insertContent(getHash());
}

function showPage() {
    //document.getElementById("hider").className = "show";
    document.body.className = "";
}

async function asyncCreateFromObject(jsonMap) {
    //append elements before they get typed out, so the page doesnt jump around
    jsonMap.map(e => {
        let f = document.createElement(e.element);
        Object.assign(f, e);
        f.textContent = "";

        document.querySelector(e.querySelector).append(f);
        e.__element = f;
    });

    //setTimeout(showPage, 50);
    for (let i = 0; i < jsonMap.length; i++) {
        await this.animObject(jsonMap[i]);
    }

    setCookie("a", "shown");

    unhideText();
}

function animObject(obj) {
    return new Promise((res, rej) => {
        let text = obj.text;
        let index = 0;

        //console.log(obj);

        //clear content
        if (useAnims) {
            let r = setInterval(() => {
                if (index != text.length) {
                    obj.__element.dataset.animstate = "drawing";
                    obj.__element.textContent += text[index++];
                }
                else {
                    obj.__element.dataset.animstate = "finished";
                    setTimeout(() => {
                        res();
                    }, obj.waitAfterDraw ? PAUSE_BETWEEN_WORDS : 0);
                    clearInterval(r);
                }
            }, obj.drawSpeed || drawSpeed);
        }
        else {
            if (text != "") {
                obj.__element.textContent = text;
            }
            obj.__element.dataset.animstate = "finished";
            res();
        }
    });
}

function insertContent(page) {
    let p = sanitizeFilename(page);

    //console.log(p);
    getPage(`${docmode ? "docs/" : "md/"}${p}.md`).then(async (t) => {
        let fullPage = await pullAdditionalData(t);

        writeToContent(fullPage);
        hljs.initHighlighting();
    });
    //});
    if (1 == 2) {
        throw data;
    };
}

function unhideText() {
    /* document.getElementById("text_container").style.opacity = "1";
    document.getElementById("foot").style.opacity = "1"; */
    document.querySelectorAll(".fadein").forEach(e => {
        e.style.opacity = 1;
    });

    //make page scrollable
    showPage();
}

function hideText() {
    document.getElementById("text_container").style.opacity = "0";
    document.getElementById("foot").style.opacity = "0";
}

function writeToContent(text) {
    document.getElementById("text_container").innerHTML = `<div class="textContent">${marked(text)}</div>${marked(getBreadcrumbs())}`;
}

function registerHashListener() {
    window.onhashchange = (e) => {
        changeContent(getHash());
    }
}

function changeContent(hash, dontAddToHistory) {
    hideText();
    setTimeout(() => {
        insertContent(hash);
    }, 500);
    setTimeout(unhideText, 750);

    if (!dontAddToHistory) {
        addHistory();
    }
}

function getHash() {
    return (location.hash == "" || location.hash == DEFAULTPAGE ? DEFAULTPAGE : location.hash);
}

function getBreadcrumbs() {
    let bc = "<p><a data-role='breadcrumb' onclick='historyBack()' href='" + goBackOnePage() + "'>< Back</a>";
    if (histArray.length > 2) {
        bc += "<a data-role='breadcrumb' onclick='clearHistory()' href='" + DEFAULTPAGE + "'>Home</a>";
    }
    bc += "</p>";
    return getHash() != DEFAULTPAGE && useBreadcrumbs ? bc : "";
}

//functions for the history

function historyBack() {
    histArray.pop();
    histArray.pop();
}

function clearHistory() {
    histArray = [];
    console.log(histArray);
}

function addHistory() {
    histArray.push(getHash());
}

function goBackOnePage() {
    let temp = [...histArray];

    temp.pop();
    let p = temp.slice(-1)[0];
    return p != undefined ? p : DEFAULTPAGE;
}

function b() {

}

/**
 * searches for @import <filename>
 * @param {string} text - the pulled file as string
 */
async function pullAdditionalData(rawText) {

    //console.log(rawText);

    if (typeof rawText === "Exception") {
        console.log("There was an exception");
    }

    let tags = [];
    const regex_embed = new RegExp(EMBEDDING_TAG);

    let retStr = rawText;

    while ((tags = regex_embed.exec(rawText)) !== null) {
        console.log(`Found ${tags[0]}. Next starts at ${regex_embed.lastIndex}.`);
        let fileName = tags[0].split(" ")[1];
        if (fileName != null) {
            let t = {
                file: fileName,
                string: tags[0]
            };

            let text = await replaceWith(t);

            retStr = retStr.replace(tags[0], text);
        }
    }

    let c_tags = [];
    const cache_regex = new RegExp(CACHE_EMBEDDING_TAG);

    while ((c_tags = cache_regex.exec(rawText)) !== null) {
        console.log(`Found ${c_tags[0]}. Next starts at ${cache_regex.lastIndex}.`);
        let c_json = getCacheContentAsJSON();
        console.log(c_json);
        retStr = retStr.replace(c_tags[0], c_json);
    }

    //console.log(retStr);

    return retStr;
}

function replaceWith(importTag) {
    return new Promise((res, rej) => {
        getPage(importTag.file)
            .then((e) => {
                res(e);
            });
    });
}

function sanitizeFilename(name) {
    return name.replace(/[#,\\,/,.]/g, "");
}

function toggleDocmode(elem) {
    docmode == !docmode;
    elem.href = (docmode ? "?doc=0" : "?doc=1");
}

function getCacheContentAsJSON() {
    return "\n```\n" +
        JSON.stringify(pageCache) +
        "\n```\n\n";
}

//navbar
function initObserver(sel = "nav.blackBg") {
    const stickyElem = document.querySelector(sel);
    console.log(stickyElem);

    const observer = new IntersectionObserver(([e]) => e.target.classList.toggle("isSticky", e.intersectionRatio < 1), { threshold: [1] });

    observer.observe(stickyElem);
}

//cookies (thxx https://www.w3schools.com/js/js_cookies.asp)
function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function enlargePlayer() {
    if (!isPlayerEnlarged) {
        document.querySelector("#player").classList.add("enlarged");
        document.body.classList.add("prevent-scrolling");
        visu.resize(64, 64, 5 + "px", 5 + "px");
        isPlayerEnlarged = true;
    } else {
        document.querySelector("#player").classList.remove("enlarged");
        document.body.classList.remove("prevent-scrolling");
        visu.resize(width, height, 2 + "px", 2 + "px");
        isPlayerEnlarged = false;
    }
}