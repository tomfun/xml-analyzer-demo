'use strict';

const bunyan = require('bunyan');

const { buildSelector } = require('./build-from-dom');
const { buildTrace } = require('./build-from-dom');
const { findInTail } = require('./matchers');

const logger = bunyan.createLogger({ name: 'xml-analyzer-demo' });
logger.level('warn'); // change me

/**
 * @param {JSDOM} inDom
 * @param {ElementFingerprint[]} byTrace
 * @param {Number} fuzziness
 * @returns {null}
 */
function find(inDom, byTrace, fuzziness) {
    const elements = findInTail(inDom.window.document.children[0], byTrace, fuzziness);
    if (!elements.length) {
        return null;
    }
    elements.sort(({ score: a }, { score: b }) => b - a);
    return elements[0].elm;
}

/**
 * @param {string} elementSelector
 * @param {JSDOM} original
 * @param {JSDOM} modified
 * @returns {string|null}
 */
function getCssSelector(elementSelector, original, modified) {
    const elmOriginal = original.window.document.querySelector(elementSelector);
    logger.info(`Successfully found element. Element Text: ${elmOriginal.textContent.trim()}`);

    const trace = buildTrace(original, elmOriginal);
    logger.info('trace', trace);
    const elm2 = find(modified, trace, 10);
    if (!elm2) {
        logger.info('nothing');
        return null;
    }
    logger.info(`Successfully found element in modified DOM. Element Text: ${elm2.textContent.trim()}`);
    const traceNew = buildTrace(modified, elm2);
    logger.info('traceNew', traceNew);

    return buildSelector(modified, elm2);
}

module.exports = {
    getCssSelector,
};
