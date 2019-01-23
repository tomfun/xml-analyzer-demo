'use strict';

const fs = require('fs');
const { JSDOM } = require('jsdom');

function toDom(path) {
    const sampleFile = fs.readFileSync(path);
    return new JSDOM(sampleFile);
}

module.exports = {
    toDom,
};
