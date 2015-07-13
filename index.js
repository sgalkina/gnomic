
module.exports = {
    parse: require('./dist/genotype.js').parse,
};

var types = require('./dist/types.js');

Object.keys(types).forEach(function (name) {
    module.exports[name] = types[name];
});