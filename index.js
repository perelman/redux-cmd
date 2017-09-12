#!/usr/bin/env node
var fs = require('fs');
var program = require('commander');
var path = require('path');
var recursive = require("recursive-readdir");
var _ = require('lodash');
console.log(process.cwd());
const filesSuffix = ['constants', 'selectors', 'reducers', 'actions'];
const handleActions = (file, param, type) => {
    const constText = `SET_${_.snakeCase(param).toUpperCase()}`;
    const text =`
/**
 * Dispatch ${constText}
 */
export const set${_.upperFirst(param)} = (value: ${type}) => (dispatch: Function) => {
    dispatch({ type: act.${constText}, payload: value });
};
`

    fs.appendFileSync(file, text);
};

const handleSelectors = (file, comp, param, type) => {
    const text =`
export const select${_.upperFirst(param)} = (state: Object): ${type} =>
    state.${comp}.${param};
`
    fs.appendFileSync(file, text);
};

const handleReducers = (file, comp, param, type, init) => {
    var patern = `Immutable(
    ({`;
    const eol = require('os').EOL;
    const constText = `SET_${_.snakeCase(param).toUpperCase()}`;
    var paramText = `${eol}        ${param}: ${init},`;
    var text = fs.readFileSync(file,'utf8');
    var position = text.indexOf(patern) + patern.length;
    var output = [text.slice(0, position), paramText, text.slice(position)].join('');
    patern = `}: {`;
    position = output.indexOf(patern) + patern.length;
    paramText = `${eol}        ${param}: ${type},`;
    output = [output.slice(0, position), paramText, output.slice(position)].join('');
    patern = `const actions = {`;
    position = output.indexOf(patern) + patern.length;
    paramText = `${eol}        [act.${constText}]: () =>
            Immutable.merge(state, { ${param}: action.payload }),`
    output = [output.slice(0, position), paramText, output.slice(position)].join('');
    fs.writeFileSync(file, output);
};

const handleConstants = (file, param) => {
    const patern = "  ui: [";
    const eol = require('os').EOL;
    const constText = `${eol}        'SET_${_.snakeCase(param).toUpperCase()}',`;
    var text = fs.readFileSync(file,'utf8')
    var position = text.indexOf(patern) + patern.length;
    var output = [text.slice(0, position), constText, text.slice(position)].join('');
    fs.writeFileSync(file, output);
};




program
    .arguments('<comp>')
    .option('-p, --param <param>', 'The param name')
    .option('-t, --type <type>', 'The flow type')
    .option('-i, --init <init>', 'The init value')
    .action(function (comp) {
        const filesToFind = filesSuffix.map(file => `${comp}.${file}.js`);
        recursive(process.cwd() + '/', [(file, stats) => stats.isDirectory() ? false : !filesToFind.includes(path.basename(file))], function (err, files) {
            files.forEach((file) => {
                if (file.endsWith('actions.js')) {
                    handleActions(file, program.param, program.type);
                }
                else if (file.endsWith('constants.js')) {
                    handleConstants(file, program.param);
                }
                else if (file.endsWith('reducers.js')) {
                    handleReducers(file, comp, program.param, program.type, program.init);
                }
                else if (file.endsWith('selectors.js')) {
                    handleSelectors(file, comp, program.param, program.type);
                }
            })
        });
    })
    .parse(process.argv);