
module.exports = {
    parse: require('./dist/grammar.js').parse,
    Genotype = require('./dist/genotype.js').Genotype
};

var types = require('./dist/types.js');

Object.keys(types).forEach(function (name) {
    module.exports[name] = types[name];
});
