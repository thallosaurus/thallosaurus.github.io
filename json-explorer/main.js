let _layerLimit = 100;
let layer = 0;  //Counts how many layers deep we are
let pathSelector = [""];

function createTreeLayer(rootHTMLELement, obj = {}) {
    let listLayer = document.createElement("ul");
    listLayer.classList.add(`color-${layer % 4}`);
    listLayer.dataset.layer = layer;

    for (o in obj) {
        if (typeof obj[o] == "function") continue;      //Skip functions since json can't hold functions anyway
        // debugOut(obj, o);

        //Check if key o is a string or a number
        let __p = parseInt(o);

        if (Number.isNaN(__p)) {    //if obj[o] is not a number, parseInt returns NaN, so we know that this is not a number
            __p = o;
        } else {
            __p = `[${__p}]`;
        }
        pathSelector[layer] = __p;  //push the path selector to the path stack

        let li = document.createElement("li");
        li.title = `Type: ${typeof obj[o]}\nObject-Selector: ${joinPathSelector(pathSelector)}`;
        li.dataset.layer = layer;

        let _type = obj[o] == null ? "null" : typeof obj[o];

        let span = document.createElement("span");
        span.innerText = obj[o] == null ? "null" : obj[o];
        span.className = _type;

        li.append(document.createTextNode(o + ": "));
        li.append(span);

        listLayer.appendChild(li);
        let iconClass = obj[o] == null ? "null-icon" : typeof obj[o] + "-icon";
        li.classList.add(iconClass);                                        //push object type to class list so we can visually differenciate between values

        if (typeof obj[o] === "object" && obj[o] != null/*&& !(obj[o] instanceof Array)*/) {         //Object is not an array and can be added to tree, recursive call to the nested object
            try {
                li.innerText = `${o}: ${obj[o].constructor.name}`;
            } catch (e) {
                console.error(e);
                console.log(o);
                console.log(obj[o]);
                console.log(layer);
                console.log(joinPathSelector(pathSelector));
                debugOut(obj, o);
            }
            li.dataset.show = false;

            li.addEventListener("click", showNested);
            // console.log("--- NESTING ---");
            if (layer <= _layerLimit) {
                layer++;                                                            //Increment Layer Counter by one
                pathSelector.push("");
                createTreeLayer(listLayer, obj[o]);
                layer--;                        //Decrement Layer Counter by one because we left the nested layer
                pathSelector.pop();

                // li.append(createToolbar(li));
            } else {
                listLayer.append(createLayerLimitExceeded());
            }
            // console.log("--- NESTING END ---");
        }
    }
    rootHTMLELement.append(listLayer);

    return;                                                                 //Make sure we always return to last function
}

function createToolbar(elem) {
    let g = document.createElement("span");
    g.className = "toolbar";
    // g.innerText = "Hallo";

    let showAll_ = document.createElement("span");
    showAll_.innerText = "Show All";
    showAll_.onclick = () => {
        showAll(elem);
    }
    g.append(showAll_);
    return g;
}

function joinPathSelector(sel) {
    let buf = "";

    let useDot = false;

    for (let i = 0; i < sel.length; i++) {
        if (sel[i + 1] != undefined && sel[i + 1][0] == "["){
            buf += sel[i];
            useDot = false;
        } else {
            buf += sel[i];
            useDot = true;
        }

        if (i == sel.length - 1) {
            useDot = false;
        }

        buf += useDot ? "." : "";
    }

    return buf;
}

function createLayerLimitExceeded() {
    let ul = document.createElement("ul");
    ul.className = "warning";
    ul.append(document.createTextNode("Redacted (Layer Limit Exceeded)"));
    return ul; 
}

function showNested(event) {
    // console.log(event);
    event.target.dataset.show = (event.target.dataset.show == "true" ? "false" : "true");
}

function showAll(node = document) {
    node.querySelectorAll("li[data-show='false']").forEach(e => {
        e.dataset.show = "true";
    });
}

function hideAll(node = document) {
    node.querySelectorAll("li[data-show='true']").forEach(e => {
        e.dataset.show = "false";
    });
}

function debugOut(obj, key) {
    console.log("--------");
    console.log("Type", typeof obj[key]);
    console.log("Is InstanceOf Array?", obj[key] instanceof Array);
    console.log("Key", o);
    console.log("Value", obj[key]);
}

function removeTree(HTMLElement) {
    HTMLElement.innerHTML = "";
}

function loadJson() {
    let g = document.getElementById("jsonInput").value;
    let f;
    if (g != "") {
        try {
            f = JSON.parse(g);
            console.log(f);
        } catch (e) {
            console.error(e);
        }

        removeTree(document.getElementById("tree"));
        createTreeLayer(document.getElementById("tree"), f);
    } else {
        removeTree(document.getElementById("tree"));
        createTreeLayer(document.getElementById("tree"), exampleData); 
    }
    // console.log(g);
}

function openModal(id = "modal-1") {
    MicroModal.show(id);
}

window.onload = () => {
    MicroModal.init();
    openModal("modal-1");
    // removeTree(document.getElementById("tree"));
    // createTreeLayer(document.getElementById("tree"));
}