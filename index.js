const { getCssSelector } = require('./lib/dom-analyzer');
const { toDom } = require('./lib/to-dom');
const cssQuery = process.argv[4] || 'a#make-everything-ok-button';
const file0 = process.argv[2]; // 'input-samples/sample-0-origin.html';
const fileWithDiff = process.argv[3]; // 'input-samples/sample-1-evil-gemini.html';

process.stdout.write(getCssSelector(cssQuery, toDom(file0), toDom(fileWithDiff)));
process.stdout.write('\n');
