    const cutthroatRules = require('./cutthroatRules');
    const drawRules = require('./drawRules');
    const points150Rules = require('./points150Rules');

    function getRules(mode) {
    switch (mode) {
        case 'cutthroat':
        return cutthroatRules;
        case 'draw':
        return drawRules;
        case 'points':
        return points150Rules;
        default:
        return cutthroatRules; // safe default
    }
    }

    module.exports = { getRules };