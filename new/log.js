function log() {
    return new Promise(async (res, rej) => {

        // alert(shouldLogPlay());

        if (shouldLogPlay()) {
            let file = (await (await fetch("log.txt")).text());

            // file = file.replaceAll("\r", "");
            file = file.split("\r");

            // console.log(file);

            for (let i = 0; i < file.length; i++) {
                await typeOut(file[i]);
            }

            // document.querySelector(".log-container").classList.toggle("hide");

            // disableLog();

            setTimeout(res, 500);
        } else {
            res();
        }
        document.querySelector(".log-container").classList.toggle("hide");
    });
}

function isValidChar(c) {
    // return "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890".includes(c);
    return true;
}

function shouldLogPlay() {
    if (window.localStorage.playLog == undefined) {
        window.localStorage.playLog = "true";
    }
    
    return window.localStorage.playLog === "true";
    // return true;
}

function disableLog() {
    window.localStorage.playLog = "false";
}

function enableLog() {
    return window.localStorage.playLog = "true";
}

async function typeOut(text) {
    let e = document.querySelector("#log");
    return new Promise((res, rej) => {

        // if (isValidChar(text)) {
        if (text.includes("{{TIME}}")) {
            text = text.replace("{{TIME}}", "");
            setTimeout(res, 500);
        } else if (text.includes("{{SKIP}}")) {
            text = text.replace("{{SKIP}}");
            res();
            //noop
        } else {
            setTimeout(res, 2);
        }

        e.innerText += text;
        // } else {
        // res();
        // }

        document.querySelector(".log-container").scrollBy(0, 100);
    });
}