
module.exports = {
    parse: require('./dist/grammar.js').parse,
    Genotype: require('./dist/genotype.js').Genotype
};

var models = require('./dist/models.js');

Object.keys(models).forEach(function (name) {
    module.exports[name] = models[name];
});
