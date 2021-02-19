let exampleUrl = "https://tools.learningcontainer.com/sample-json.json";

function loadUrl(url, method, callback, data = null) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open(method, url);
    xmlhttp.responseType = "json";
    if (method.toUpperCase() === "POST") {
        xmlhttp.setRequestHeader("Content-Type", "application/json");
    }
    xmlhttp.onreadystatechange = () => {
       if (xmlhttp.readyState === XMLHttpRequest.DONE) {
           if (xmlhttp.status === 0 || (xmlhttp.status >=200 && xmlhttp.status < 400)) {
               callback(xmlhttp.response);
           } else {
               alert("Returned Error: " + xmlhttp.status + ",\nTry again");
                // throw xmlhttp.status;
               openModal("modal-3");
           }
       } 

    //    console.log(xmlhttp);
    }
    // try {
        xmlhttp.send(data);
/*     } catch (e) {
        alert("Returned Error: " + xmlhttp.status); 
        openModal("modal-3");
    } */
}

/* function init() {
    document.getElementById("loadXHRForm").addEventListener("submit", (e) => {
        e.preventDefault();
        // alert("ok");
        console.log(e);
    });
}*/
