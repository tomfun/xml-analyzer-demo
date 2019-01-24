'use strict';

const styleParse = require('style-parser');

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

/**
 * @param {JSDOM} inDom
 * @param {Element} forElement JSDOM element
 * @returns {ElementFingerprint[]}
 */
function buildTrace(inDom, forElement) {
    const trace = [];
    let elm = forElement;
    while (elm && elm !== inDom.window && elm !== inDom.window.document) {
        trace.push(buildFingerPrint(elm));
        elm = elm.parentNode;
    }
    return trace.reverse();
}

/**
 * @param {JSDOM} inDom
 * @param {Element} forElement JSDOM element
 * @returns {string}
 */
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

module.exports = {
    buildFingerPrint,
    buildTrace,
    buildSelector,
};
