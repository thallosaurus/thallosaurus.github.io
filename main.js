const LOADINGERROR = `# Oh-uh!
Looks like there was an Error while catching the content.

Found a bug or noticed something strange? Report it [here](https://github.com/thallosaurus/thallosaurus.github.io/issues)`;

const urlParams = new URL(location.href).searchParams;

const page = urlParams.get("p") || "index";

let navbar;

let drawSpeed = 25;
let howLongAfterWriteFinishShouldWriterStay = 500;

window.onload = function () {
    this.fetch("elements.json")
        .then((data) => {
            return data.json();
        }).then((json) => {
            asyncCreateFromObject(json);
        }).catch(e => {
            console.log(e);
        });

    this.insertContent(page);
    this.unhideText();
}

function showPage() {
    document.getElementById("hider").className = "show";
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

    setTimeout(showPage, 50);

    for (let i = 0; i < jsonMap.length; i++) {
        await this.animObject(jsonMap[i]);
    }
}

function animObject(obj) {
    return new Promise((res, rej) => {
        let text = obj.text;
        let index = 0;

        //clear content

        let r = setInterval(() => {
            if (index != text.length) {
                obj.__element.dataset.animstate = "drawing";
                obj.__element.textContent += text[index++];
            }
            else {
                obj.__element.dataset.animstate = "finished";
                setTimeout(() => {
                    res();
                }, obj.waitAfterDraw ? howLongAfterWriteFinishShouldWriterStay : 0);
                clearInterval(r);
            }
        }, obj.drawSpeed || 25);
    });
}

function insertContent(page) {
    fetch(`md/${page}.md`).then((data) => {
        if (data.ok) {
            data.text().then((t) => {
                writeToContent(marked(t));
            });
        }
        else {
            throw data;
        }
    }).catch((e) => {
        writeToContent(marked(LOADINGERROR + `\n\n(${e.status} - ${e.statusText})`));
    });
}

function unhideText() {
    document.getElementById("text_container").style.opacity = "1";
}

function writeToContent(text)
{
    document.getElementById("text_container").innerHTML = `<div class="textContent">${text}</div>`;
}