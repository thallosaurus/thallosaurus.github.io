# elements.json

This document serves as a documentation of the elements.json file

|Key|Type|Description|
|---|---|---|
|text|string|The text, that should get drawn|
|id|string|The HTML-Id, the element should get assigned|
|querySelector|string|The query selector, of the parent element|
|element|string|The HTML-Tag the element should have|
|waitAfterDraw|boolean|specifies, if the routine should pause for 1000 seconds after drawing has been finished|
|drawSpeed|integer|Specifies, how long the routine should wait after each letter|

The animation gets called only when:
- The page gets opened on the defaultpage (#index)
- The page is NOT in document mode
- The cookie "a" is unset

but can be overridden with the "?anims=1" url parameter. Then, it will play everytime the page itself is refreshed (not by a hash change!)