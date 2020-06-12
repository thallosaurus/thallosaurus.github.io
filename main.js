const LOADINGERROR = `# Oh-uh!
Looks like there was an Error while catching the content.

Found a bug or noticed something strange? Report it [here](https://github.com/thallosaurus/thallosaurus.github.io/issues)`;

const urlParams = new URL(location.href).searchParams;
//const page = urlParams.get("p") || "index";

//const page = getHash();
const docmode = urlParams.get("doc") == 1;
const useAnims = ((getHash() == DEFAULTPAGE) && !docmode) || urlParams.get("anims") == 1;
const useCache = urlParams.get("nocache") != 1;

let histArray = [getHash()];

let drawSpeed = useAnims ? DEFAULT_DRAWSPEED : 0;

let finished = false;

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
        //let cpy = new Promise(data);
        //        Object.copy(cpy, data);
        //console.log(cpy);
        //console.trace(pagename);
        return new Promise((res, rej) => {
            if (data.ok) {
                data.text().then(d => {
                    pageCache[pagename] = d;
                    res(d);
                });
            } else {
                throw LOADINGERROR + `\n\n(${data.status} - ${data.statusText})`;
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
    /* if (!isPageInCache()) {
        return getFile(file).then(e => {
            addToCache(file, e);
            return e;
        });
    }
    else {
        console.log(`Loaded ${file} from cache`);
        return getPageFromCache(file);
    } */

    if (!isPageInCache(file)) {
        console.log(`Loaded ${file} from the internet`);

        return getFile(file).then(async e => {
            await addToCache(file, e);
            return getPageFromCache(file);
        }).catch((r) => {
            console.log(r);
            return r;
        });
    }
    else {
        console.log(`Loaded ${file} from the cache`)
        return getPageFromCache(file);
    }
}

window.onload = function () {
    this.registerHashListener();

    this.getFile("elements.json")
        .then((data) => {
            return data.json();
        }).then((json) => {
            asyncCreateFromObject(json);
        }).catch(e => {
            console.log(e);
        });

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

    //console.log("When do you get executed?");
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
    //let p = page.split("/").pop().split("#").pop();
    let p = sanitizeFilename(page);

    //console.log(p);
    getPage(`${docmode ? "docs/" : "md/"}${p}.md`).then(async (t) => {
        //if (data.ok) {
        //data.text().then(async (t) => {
        let fullPage = await pullAdditionalData(t);
        //console.log(fullPage);
        writeToContent(fullPage);
        hljs.initHighlighting();
    });
    //});
    if (1 == 2) {
        throw data;
    };
}

function unhideText() {
    document.getElementById("text_container").style.opacity = "1";
    document.getElementById("foot").style.opacity = "1";

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
    return getHash() != DEFAULTPAGE ? bc : "";
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
        retStr = retStr.replace(c_tags[0], getCacheContentAsJSON());
    }

    console.log(retStr);

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
    "\n```\n";
}