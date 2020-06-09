let title = "DJ PRiSMFLUX";
let titleIndex = 0;
let titleElement;
let titleDrawInterval;

let undertitle = "best techno outta steinwald";
let undertitleIndex = 0;
let undertitleElement;
let undertitleDrawInterval;

let navbar;

const urlParams = new URLSearchParams(window.location);

let drawSpeed = 25;
let howLongAfterWriteFinishShouldWriterStay = 500;

window.onload = function()
{
    this.fetch("elements.json")
    .then((data) => {
        return data.json();
    }).then((json) => {
        asyncCreateFromObject(json);
    }).catch(e => {
        console.log(e);
    });
}

async function asyncCreateFromObject(jsonMap)
{
    //append elements before they get typed out, so the page doesnt jump around
    jsonMap.map(e => {
        let f = document.createElement(e.element);
        //e.id = obj.id;
        Object.assign(f, e);
        f.textContent = "";
        
        document.querySelector(e.querySelector).append(f);
        e.__element = f;
    });

    for (let i = 0; i < jsonMap.length; i++)
    {
        await this.animObject(jsonMap[i]);
    }
}

function animObject(obj)
{
    return new Promise((res, rej) => {
        let text = obj.text;
        let index = 0;

        //clear content

        let r = setInterval(() => {
            if (index != text.length)
            {
                obj.__element.dataset.animstate = "drawing";
                obj.__element.textContent += text[index++];
            }
            else
            {
                obj.__element.dataset.animstate = "finished";
                setTimeout(() => {
                    res();
                }, obj.waitAfterDraw ? howLongAfterWriteFinishShouldWriterStay : 0);
                clearInterval(r);
            }
        }, drawSpeed);
    });
}