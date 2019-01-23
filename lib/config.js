'use strict';

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

module.exports = {
    scoreMap,
};
