# Changelog

## v0.6.1
- fixed unclickable navbar
- added a home link to navbar, hardcoded

## v0.6
- added page cache
- added a shadow for the sticky navbar
- added a accent color, use var(--accents)
- disabled code highlighting for now
- added embedding features for markdown
- added an inbuilt documentation browser
- implemented a error message when client loses connection on content loading

## v0.5:
- added native darkmode
- added ?anims=1 override (see documentation)
- made navbar sticky (uhh, this one will be fun later)
- added a back and a home button
- fixed a directory traversal bug, hashes will now get sanitized with RegExp
- clicked pages will now get saved in an array
- checked the markdown compatibility, safe for now