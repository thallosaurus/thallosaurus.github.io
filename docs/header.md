# Header

This document serves as the documentation of the effect you can see, when you open up the page on the index or with the ?anims=1 parameter active. The whole procedure is really simple:

* First, the client fetches the [elements.json](elements.md) file and parses it.
* After it is done parsing, the array of elements is passed on
* Native JavaScript creates a HTML DOM element for each entry and copies the information of the array element into the newly created element
* The HTML-Elements text gets replaced with nothing ("") and gets appended to the element specified in the array.
* The array element gets a reference to the appended element
* The array element then gets passed on to the asyncronous function, that draws the letters while the routine waits, until the element is done drawing
* After each letter is drawn, the #content element gets unhidden, specifically setting opacity to 1