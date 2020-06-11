const LOADINGERROR = `# Oh-uh!
Looks like there was an Error while catching the content.

Found a bug or noticed something strange? Report it [here](https://github.com/thallosaurus/thallosaurus.github.io/issues)`;

const urlParams = new URL(location.href).searchParams;
//const page = urlParams.get("p") || "index";

//const page = getHash();
const useAnims = getHash() == DEFAULTPAGE || urlParams.get("anims") == 1;

let histArray = [getHash()];

let drawSpeed = useAnims ? DEFAULT_DRAWSPEED : 0;

let finished = false;

const SETTINGS = {
    "marked": {
        breaks: true
    }
}

window.onload = function () {

    this.registerHashListener();

    this.fetch("elements.json")
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
    let p = page.replace(/[#,\\,/,.]/g, "");
    console.log(p);
    fetch(`md/${p}.md`).then((data) => {
        console.log(data);
        if (data.ok) {
            data.text().then((t) => {
                writeToContent(t);
//                hljs.initHighlightingOnLoad();
                hljs.initHighlighting();
            });
        }
        else {
            throw data;
        }
    }).catch((e) => {
        writeToContent(LOADINGERROR + `\n\n(${e.status} - ${e.statusText})`);
    });
}

function unhideText() {
    document.getElementById("text_container").style.opacity = "1";
    document.getElementById("foot").style.opacity = "1";

    //make page scrollable
    showPage();
}

function hideText()
{
    document.getElementById("text_container").style.opacity = "0";
    document.getElementById("foot").style.opacity = "0";
}

function writeToContent(text) {
    document.getElementById("text_container").innerHTML = `<div class="textContent">${marked(text)}</div>${marked(getBreadcrumbs())}`;
}

function registerHashListener()
{
    //alert("registered listener");
    window.onhashchange = (e) => {
        changeContent(getHash());
    }
}

function changeContent(hash, dontAddToHistory)
{
    hideText();
    setTimeout(() => {
        insertContent(hash);
    }, 500);
    setTimeout(unhideText, 750);

    if (!dontAddToHistory)
    {
        addHistory();
    }
}

function getHash()
{
    return (location.hash == "" || location.hash == DEFAULTPAGE ? DEFAULTPAGE : location.hash);
}

function getBreadcrumbs()
{
    //return getHash() != "#index" ? "[< Back](#index)" : "";
    let bc = "<p><a data-role='breadcrumb' onclick='historyBack()' href='" + goBackOnePage() + "'>< Back</a>";
    if (histArray.length > 2)
    {
        bc += "<a data-role='breadcrumb' onclick='clearHistory()' href='" + DEFAULTPAGE + "'>Home</a>";
    }
    bc += "</p>";
    return getHash() != DEFAULTPAGE ? bc : "";
}

//functions for the history

function historyBack()
{
    histArray.pop();
    histArray.pop();
}

function clearHistory()
{
    histArray = [];
    console.log(histArray);
}

function addHistory()
{
    histArray.push(getHash());
}

function goBackOnePage()
{
    let temp = [...histArray];

    temp.pop();
    let p = temp.slice(-1)[0];
    return p != undefined ? p : DEFAULTPAGE;
}

function b()
{
    
}