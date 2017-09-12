#!/usr/bin/env node
'use strict';

var fs = require('fs');
var program = require('commander');
var path = require('path');
var recursive = require("recursive-readdir");
var _ = require('lodash');
console.log(process.cwd());
var filesSuffix = ['constants', 'selectors', 'reducers', 'actions'];
var handleActions = function handleActions(file, param, type) {
    var constText = 'SET_' + _.snakeCase(param).toUpperCase();
    var text = '\n/**\n * Dispatch ' + constText + '\n */\nexport const set' + _.upperFirst(param) + ' = (value: ' + type + ') => (dispatch: Function) => {\n    dispatch({ type: act.' + constText + ', payload: value });\n};\n';

    fs.appendFileSync(file, text);
};

var handleSelectors = function handleSelectors(file, comp, param, type) {
    var text = '\nexport const select' + _.upperFirst(param) + ' = (state: Object): ' + type + ' =>\n    state.' + comp + '.' + param + ';\n';
    fs.appendFileSync(file, text);
};

var handleReducers = function handleReducers(file, comp, param, type, init) {
    var patern = 'Immutable(\n    ({';
    var eol = require('os').EOL;
    var constText = 'SET_' + _.snakeCase(param).toUpperCase();
    var paramText = eol + '        ' + param + ': ' + init + ',';
    var text = fs.readFileSync(file, 'utf8');
    var position = text.indexOf(patern) + patern.length;
    var output = [text.slice(0, position), paramText, text.slice(position)].join('');
    patern = '}: {';
    position = output.indexOf(patern) + patern.length;
    paramText = eol + '        ' + param + ': ' + type + ',';
    output = [output.slice(0, position), paramText, output.slice(position)].join('');
    patern = 'const actions = {';
    position = output.indexOf(patern) + patern.length;
    paramText = eol + '        [act.' + constText + ']: () =>\n            Immutable.merge(state, { ' + param + ': action.payload }),';
    output = [output.slice(0, position), paramText, output.slice(position)].join('');
    fs.writeFileSync(file, output);
};

var handleConstants = function handleConstants(file, param) {
    var patern = "  ui: [";
    var eol = require('os').EOL;
    var constText = eol + '        \'SET_' + _.snakeCase(param).toUpperCase() + '\',';
    var text = fs.readFileSync(file, 'utf8');
    var position = text.indexOf(patern) + patern.length;
    var output = [text.slice(0, position), constText, text.slice(position)].join('');
    fs.writeFileSync(file, output);
};

program.arguments('<comp>').option('-p, --param <param>', 'The param name').option('-t, --type <type>', 'The flow type').option('-i, --init <init>', 'The init value').action(function (comp) {
    var filesToFind = filesSuffix.map(function (file) {
        return comp + '.' + file + '.js';
    });
    recursive(process.cwd() + '/', [function (file, stats) {
        return stats.isDirectory() ? false : !filesToFind.includes(path.basename(file));
    }], function (err, files) {
        files.forEach(function (file) {
            if (file.endsWith('actions.js')) {
                handleActions(file, program.param, program.type);
            } else if (file.endsWith('constants.js')) {
                handleConstants(file, program.param);
            } else if (file.endsWith('reducers.js')) {
                handleReducers(file, comp, program.param, program.type, program.init);
            } else if (file.endsWith('selectors.js')) {
                handleSelectors(file, comp, program.param, program.type);
            }
        });
    });
}).parse(process.argv);