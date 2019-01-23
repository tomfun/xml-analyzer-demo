'use strict';

const fs = require('fs');
const { JSDOM } = require('jsdom');
const styleParse = require('style-parser');
const bunyan = require('bunyan');

const logger = bunyan.createLogger({ name: 'myapp' });

const cssQuery = '#page-wrapper > div:nth-child(3) > div.col-lg-8 > div > div.panel-body > a#make-everything-ok-button';
// const cssQuery = '#page-wrapper > div:nth-child(3) > div.col-lg-8 > div > div.panel-footer > a';
// const cssQuery = '#page-wrapper > div:nth-child(3) > div.col-lg-8 > div > div > button';
const file0 = 'input-samples/sample-0-origin.html';
// const file0 = 'input-samples/sample-4-the-mash.html';
// const fileWithDiff = 'input-samples/sample-0-origin.html';
const fileWithDiff = 'input-samples/sample-4-the-mash.html';

/**
 * @typedef {{classes: string[], attributes, styles: (*|r.value), tagName: string}} ElementFingerprint
 */

/**
 * @param {Element} elm JSDOM element
 * @returns {ElementFingerprint}
 */
function buildFingerPrint(elm) {
    const attributes = {};
    for (const attr of elm.attributes) {
        if (attr.name === 'style' || attr.name === 'class') {
            continue;
        }
        attributes[attr.name] = attr.value;
    }
    const rawStyles = elm.attributes.getNamedItem('style') || { value: '' };
    const styles = styleParse(rawStyles.value);
    const classesRaw = elm.attributes.getNamedItem('class') || { value: '' };
    const classes = classesRaw.value.split(' ').filter(v => v);

    return { attributes, classes, styles, tagName: elm.tagName };
}

function buildTrace(inDom, forElement) {
    const trace = [];
    let elm = forElement;
    while (elm && elm !== inDom.window && elm !== inDom.window.document) {
        trace.push(buildFingerPrint(elm));
        elm = elm.parentNode;
    }
    return trace.reverse();
}

function buildSelector(inDom, forElement) {
    function childNumber(elm) {
        let element = elm;
        let i = 0;
        while (element) {
            if (element.nodeType === 1) {
                i++;
            }
            element = element.previousSibling;
        }
        return i;
    }

    const path = [];
    let elm = forElement;
    while (elm && elm !== inDom.window && elm !== inDom.window.document) {
        if (elm.id) {
            path.unshift(`#${elm.id}`);
            break;
        }
        path.unshift(`${elm.tagName.toLowerCase()}:nth-child(${childNumber(elm)})`);
        elm = elm.parentNode;
    }
    return path.join(' > ');
}

const scoreMap = {
    element: {
        new: 2,
        del: 2,
    },
    tagName: {
        notEqual: 1,
    },
    classes: {
        notEqual: 1,
    },
    attributes: {
        notEqual: 1,
        new: 1,
    },
    styles: {
        notEqual: 1,
        new: 1,
    },
};

function objectMatcher(config, lObj, rObj) {
    const keysLeft = Object.keys(lObj);
    const notEqual = keysLeft.filter(attrName => attrName in rObj && lObj[attrName] !== rObj[attrName]).length;
    const notFound = keysLeft.filter(attrName => !(attrName in rObj)).length
        + Object.keys(rObj).filter(attrName => !(attrName in lObj)).length;
    return config.notEqual * notEqual
        + config.new * notFound;
}

function arrayMatcher(config, lArr, rArr) {
    const notEqualLeft = lArr.filter(val => !rArr.includes(val)).length;
    const notEqualRight = rArr.filter(val => !lArr.includes(val)).length;
    return config.notEqual * (notEqualLeft + notEqualRight);
}

/**
 * @param {ElementFingerprint} left
 * @param {ElementFingerprint} right
 */
function score(left, right) {
    const same = scoreMap.tagName.notEqual * (left.tagName !== right.tagName)
        + arrayMatcher(scoreMap.classes, left.classes, right.classes)
        + objectMatcher(scoreMap.attributes, left.attributes, right.attributes)
        + objectMatcher(scoreMap.styles, left.styles, right.styles);
    return same;
}

function findInTail(elm, traceTail, fuzziness) {
    let elements = [];
    const tailOfTail = traceTail.slice(1);
    const elmScore = score(buildFingerPrint(elm), traceTail[0]);
    const newFuzziness = fuzziness - elmScore;
    if (newFuzziness < 0) {
        return [];
    }
    if (!tailOfTail.length) {
        return [{ elm, score: newFuzziness }];
    }

    for (const child of elm.children) {
        const res = findInTail(child, tailOfTail, newFuzziness);
        // if (res.length && res[0].score === 0) {
        //     return [res[0]];
        // }
        elements = elements.concat(res);
    }
    if (scoreMap.element.new < fuzziness) {
        for (const child of elm.children) {
            const res = findInTail(child, traceTail, fuzziness - scoreMap.element.new);
            elements = elements.concat(res);
        }
    }
    if (scoreMap.element.del < fuzziness) {
        const res = findInTail(elm, tailOfTail, fuzziness - scoreMap.element.del);
        elements = elements.concat(res);
    }
    return elements;
}

function find(inDom, byTrace, fuzziness) {
    const elements = findInTail(inDom.window.document.children[0], byTrace, fuzziness);
    if (!elements.length) {
        return null;
    }
    elements.sort(({ score: a }, { score: b }) => b - a);
    return elements[0].elm;
}

function showCssSelector(elementSelector, original, modified) {
    const elmOriginal = original.window.document.querySelector(elementSelector);
    logger.info(`Successfully found element. Element Text: ${elmOriginal.textContent.trim()}`);

    const trace = buildTrace(original, elmOriginal);
    console.log('trace', trace);
    const elm2 = find(modified, trace, 10);
    if (!elm2) {
        console.log('nothing');
        return null;
    }
    logger.info(`Successfully found element in modified DOM. Element Text: ${elm2.textContent.trim()}`);
    const traceNew = buildTrace(modified, elm2);
    console.log('traceNew', traceNew);

    return buildSelector(modified, elm2);
}

function toDom(path) {
    const sampleFile = fs.readFileSync(path);
    return new JSDOM(sampleFile);
}

process.stdout.write(showCssSelector(cssQuery, toDom(file0), toDom(fileWithDiff)));
