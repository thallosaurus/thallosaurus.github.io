function log() {
    return new Promise(async (res, rej) => {
        let file = (await (await fetch("log.txt")).text());

        file = file.split("\r");

        // console.log(file);

        for (let i = 0; i < file.length; i++) {
            await typeOut(file[i]);
        }

        document.querySelector(".log-container").classList.toggle("hide");

        setTimeout(res, 500);
    });
}

function isValidChar(c) {
    // return "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890".includes(c);
    return true;
}

function shouldLogPlay() {
    return window.localStorage.playLog ?? true;
}

function disableLog() {
    return window.localStorage.playLog = false;
}

function disableLog() {
    return window.localStorage.playLog = true;
}

async function typeOut(text) {
    let e = document.querySelector("#log");
    return new Promise((res, rej) => {

        // if (isValidChar(text)) {
            if (text.includes("{{TIME}}")) {
                text = text.replace("{{TIME}}", "");
                setTimeout(res, 500);
            } if (text.includes("{{SKIP}}")) {
                text = text.replace("{{SKIP}}");
                //noop
            } else {
                setTimeout(res, 2);
            }

            e.innerText += text;
        // } else {
            // res();
        // }

        document.querySelector(".log-container").scrollBy(0,100);
    });
}