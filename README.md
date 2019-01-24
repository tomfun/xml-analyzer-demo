## Demo project
### The task

Create CSS selector generator according to two documents:
 - original (HTML/XML)
 - modified, which has the element but with little DOM modification
 
 ## Solution
 
Inspired by [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance). Create trace of elements and calculate "score"
between new and old DOMs per element

Example of original path:

```css
#page-wrapper > div:nth-child(3) > div.col-lg-8 > div > div.panel-body > a#make-everything-ok-button
```
Example of modified paths (see input-samples folder for details:

```css
#page-wrapper > div:nth-child(3) > div.col-lg-8 > div > div.panel-body > a.btn.btn-success
#page-wrapper > div:nth-child(3) > div.col-lg-8 > div > div.panel-body > div > a
#page-wrapper > div:nth-child(3) > div.col-lg-8 > div > div.panel-footer > a
#page-wrapper > div:nth-child(3) > div.col-lg-8 > div > div.panel-footer > a
```
Potential output (not so pretty as can be):
```css
#page-wrapper > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > a:nth-child(2)
#page-wrapper > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > a:nth-child(1)
#page-wrapper > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > a:nth-child(1)
#page-wrapper > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > a:nth-child(1)
```

### Logger

There is [logger](https://www.npmjs.com/package/bunyan)
so you can see debug or info logs

## How to run

```bash
#node dom-analyzer.js <origin.html> <modified.html> [<selector of element>]
node dom-analyzer.js input-samples/sample-0-origin.html input-samples/sample-1-evil-gemini.html
node dom-analyzer.js input-samples/sample-0-origin.html input-samples/sample-1-evil-gemini.html a#make-everything-ok-button
```