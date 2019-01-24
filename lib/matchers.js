'use strict';

const { buildFingerPrint } = require('./build-from-dom');
const { scoreMap } = require('./config');


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
    return scoreMap.tagName.notEqual * (left.tagName !== right.tagName)
        + arrayMatcher(scoreMap.classes, left.classes, right.classes)
        + objectMatcher(scoreMap.attributes, left.attributes, right.attributes)
        + objectMatcher(scoreMap.styles, left.styles, right.styles);
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

module.exports = {
    findInTail,
};
