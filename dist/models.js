'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Organism = exports.Accession = exports.Range = exports.Phene = exports.Feature = exports.Fusion = exports.Plasmid = exports.FeatureTree = exports.Mutation = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _iterator2 = require('babel-runtime/core-js/symbol/iterator');

var _iterator3 = _interopRequireDefault(_iterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _grammar = require('./grammar.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Mutation = exports.Mutation = function () {
    function Mutation(before, after) {
        var _ref = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        var _ref$marker = _ref.marker;
        var marker = _ref$marker === undefined ? null : _ref$marker;
        var _ref$multiple = _ref.multiple;
        var multiple = _ref$multiple === undefined ? false : _ref$multiple;
        (0, _classCallCheck3.default)(this, Mutation);

        if (before instanceof Array || before !== null && !(before instanceof Plasmid)) {
            before = new FeatureTree(before);
        }

        if (after instanceof Array || after !== null && !(after instanceof Plasmid)) {
            after = new FeatureTree(after);
        }

        this.before = before;
        this.after = after;
        this.marker = marker;
        this.multiple = multiple;
    }

    (0, _createClass3.default)(Mutation, [{
        key: 'equals',
        value: function equals(other) {
            return other instanceof Mutation && this.before == other.before && this.after == other.after && this.multiple == other.multiple;
        }
    }], [{
        key: 'Ins',
        value: function Ins(feature) {
            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return new (Function.prototype.bind.apply(Mutation, [null].concat([null, feature], args)))();
        }
    }, {
        key: 'Sub',
        value: function Sub(before, after) {
            for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
                args[_key2 - 2] = arguments[_key2];
            }

            return new (Function.prototype.bind.apply(Mutation, [null].concat([before, after], args)))();
        }
    }, {
        key: 'Del',
        value: function Del(feature) {
            for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                args[_key3 - 1] = arguments[_key3];
            }

            return new (Function.prototype.bind.apply(Mutation, [null].concat([feature, null], args)))();
        }
    }]);
    return Mutation;
}();

var FeatureTree = exports.FeatureTree = function () {
    /**
     *
     * @param {...(Phene|Feature|FeatureTree)} contents
     */

    function FeatureTree() {
        (0, _classCallCheck3.default)(this, FeatureTree);

        for (var _len4 = arguments.length, contents = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            contents[_key4] = arguments[_key4];
        }

        this.contents = contents;
    }

    /**
     * Enumerates all features of the feature tree.
     */

    (0, _createClass3.default)(FeatureTree, [{
        key: 'features',
        value: _regenerator2.default.mark(function features() {
            var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item;

            return _regenerator2.default.wrap(function features$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            _iteratorNormalCompletion = true;
                            _didIteratorError = false;
                            _iteratorError = undefined;
                            _context.prev = 3;
                            _iterator = (0, _getIterator3.default)(this.contents);

                        case 5:
                            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                                _context.next = 16;
                                break;
                            }

                            item = _step.value;

                            if (!(item instanceof FeatureTree)) {
                                _context.next = 11;
                                break;
                            }

                            return _context.delegateYield(item.features(), 't0', 9);

                        case 9:
                            _context.next = 13;
                            break;

                        case 11:
                            _context.next = 13;
                            return item;

                        case 13:
                            _iteratorNormalCompletion = true;
                            _context.next = 5;
                            break;

                        case 16:
                            _context.next = 22;
                            break;

                        case 18:
                            _context.prev = 18;
                            _context.t1 = _context['catch'](3);
                            _didIteratorError = true;
                            _iteratorError = _context.t1;

                        case 22:
                            _context.prev = 22;
                            _context.prev = 23;

                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }

                        case 25:
                            _context.prev = 25;

                            if (!_didIteratorError) {
                                _context.next = 28;
                                break;
                            }

                            throw _iteratorError;

                        case 28:
                            return _context.finish(25);

                        case 29:
                            return _context.finish(22);

                        case 30:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, features, this, [[3, 18, 22, 30], [23,, 25, 29]]);
        })
    }, {
        key: 'equals',
        value: function equals(other) {
            if (!(other instanceof FeatureTree)) {
                return false;
            }

            if (this.contents.length != other.contents.length) {
                return false;
            }

            for (var i = 0; i < this.contents.length; i++) {
                if (!this.contents[i].equals(other.contents[i])) {
                    return false;
                }
            }

            return true;
        }
    }, {
        key: 'match',
        value: function match(other) {
            if (!(other instanceof FeatureTree)) {
                return false;
            }

            if (this.contents.length != other.contents.length) {
                return false;
            }

            for (var i = 0; i < this.contents.length; i++) {
                if (!this.contents[i].match(other.contents[i])) {
                    return false;
                }
            }

            return true;
        }
    }, {
        key: _iterator3.default,
        value: function value() {
            return (0, _getIterator3.default)(this.contents);
        }
    }]);
    return FeatureTree;
}();

var Plasmid = exports.Plasmid = function (_FeatureTree) {
    (0, _inherits3.default)(Plasmid, _FeatureTree);

    /**
     *
     * @param {(string|null)} name
     * @param {(string|null)} marker selection marker (carried over from insertion).
     * @param {...(Phene|Feature|Fusion)} contents
     */

    function Plasmid(name) {
        var _Object$getPrototypeO;

        var site = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
        var marker = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
        (0, _classCallCheck3.default)(this, Plasmid);

        for (var _len5 = arguments.length, contents = Array(_len5 > 3 ? _len5 - 3 : 0), _key5 = 3; _key5 < _len5; _key5++) {
            contents[_key5 - 3] = arguments[_key5];
        }

        var _this = (0, _possibleConstructorReturn3.default)(this, (_Object$getPrototypeO = (0, _getPrototypeOf2.default)(Plasmid)).call.apply(_Object$getPrototypeO, [this].concat(contents)));

        _this.name = name;
        _this.site = site;
        _this.marker = marker;

        if (!(_this.name || _this.site)) {
            throw 'An unintegrated plasmid MUST have a name.';
        }
        return _this;
    }

    (0, _createClass3.default)(Plasmid, [{
        key: 'equals',
        value: function equals(other) {
            if (this.name) {
                return this.name == other.name;
            } else if (other.name) {
                return false;
            } else {
                // no way to compare these plasmids except by comparing contents.
                return (0, _get3.default)((0, _getPrototypeOf2.default)(Plasmid.prototype), 'equals', this).call(this, other);
            }
        }
    }]);
    return Plasmid;
}(FeatureTree);

var Fusion = exports.Fusion = function (_FeatureTree2) {
    (0, _inherits3.default)(Fusion, _FeatureTree2);

    /**
     *
     * @param {...Feature} features
     */

    function Fusion() {
        var _Object$getPrototypeO2;

        (0, _classCallCheck3.default)(this, Fusion);

        for (var _len6 = arguments.length, features = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
            features[_key6] = arguments[_key6];
        }

        return (0, _possibleConstructorReturn3.default)(this, (_Object$getPrototypeO2 = (0, _getPrototypeOf2.default)(Fusion)).call.apply(_Object$getPrototypeO2, [this].concat(features)));
    }

    return Fusion;
}(FeatureTree);

var Feature = exports.Feature = function () {
    /**
     *
     * @param {(string|null)} name
     * @param type one of 'gene', 'promoter', 'terminator', null
     * @param {Accession} accession
     * @param {(Organism|null)} organism
     * @param {(string|null)} variant
     * @param {Range} range a restriction on the feature
     */
    // TODO consider new feature type 'phene' that cannot have ranges.
    // TODO consider then a 'RangedFeature' or something like that.
    // TODO ranges are not yet supported upstream.

    function Feature(name) {
        var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref2$type = _ref2.type;
        var type = _ref2$type === undefined ? null : _ref2$type;
        var _ref2$accession = _ref2.accession;
        var accession = _ref2$accession === undefined ? null : _ref2$accession;
        var _ref2$organism = _ref2.organism;
        var organism = _ref2$organism === undefined ? null : _ref2$organism;
        var _ref2$variant = _ref2.variant;
        var variant = _ref2$variant === undefined ? null : _ref2$variant;
        var _ref2$range = _ref2.range;
        var range = _ref2$range === undefined ? null : _ref2$range;
        (0, _classCallCheck3.default)(this, Feature);

        this.name = name;
        this.type = type;
        this.accession = accession;
        this.organism = organism;
        this.variant = variant;
        this.range = range;
        // TODO verify that either an accession or a name is given.
    }

    (0, _createClass3.default)(Feature, [{
        key: 'toString',
        value: function toString() {
            var s = '';

            if (this.name) {
                if (this.organism) {
                    s += this.organism.defaultAlias + '/';
                }
                if (this.type && this.type != 'gene') {
                    s += this.type.charAt(0) + '.';
                }
                s += '' + this.name;
                if (this.variant) {
                    s += '(' + this.variant + ')';
                }
            }

            if (this.accession) {
                s += '#' + this.accession.toString();
            }

            if (this.range) {
                s += '[' + this.range.toString() + ']';
            }

            return s;
        }

        /**
         * Compares two features ignoring the 'variant' flag.
         * @param {(Feature|Phene)} other
         */

    }, {
        key: 'equals',
        value: function equals(other) {
            if (this.accession && other.accession) {
                return this.accession.equals(other.accession);
            } else if (this.name) {
                // TODO check organism too here.
                if (this.name != other.name) {
                    return false;
                }

                if (other.organism || this.organism) {
                    if (!this.organism) {
                        return false;
                    }

                    if (this.organism.name != other.organism.name) {
                        return false;
                    }
                }

                if (this.variant != other.variant) {
                    return false;
                }

                return true;
            } else {
                return false; // no way to compare these features.
            }
        }
    }, {
        key: 'match',
        value: function match(other) {
            var matchVariant = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            if (!(other instanceof Feature)) {
                return false;
            }

            if (this.accession && other.accession) {
                return this.accession.equals(other.accession);
            } else if (this.name) {
                // only match features with the same name
                if (this.name != other.name) {
                    return false;
                }

                // if an organism is specified, match only features with the same organism
                if (this.organism && !this.organism.equals(other.organism)) {
                    return false;
                }

                // if this feature has no variant, match any other feature; otherwise, match only features with the same
                // variant
                if (!this.variant || !matchVariant) {
                    return true;
                }

                return this.variant == other.variant;
            } else {
                return false;
            }
        }
    }]);
    return Feature;
}();

var Phene = exports.Phene = function (_Feature) {
    (0, _inherits3.default)(Phene, _Feature);

    /**
     *
     * @param name
     * @param organism
     * @param variant
     */

    function Phene(name) {
        var _ref3 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref3$organism = _ref3.organism;
        var organism = _ref3$organism === undefined ? null : _ref3$organism;
        var _ref3$variant = _ref3.variant;
        var variant = _ref3$variant === undefined ? 'wild-type' : _ref3$variant;
        (0, _classCallCheck3.default)(this, Phene);
        return (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Phene).call(this, name, { type: 'phene', organism: organism, variant: variant }));
    }

    (0, _createClass3.default)(Phene, [{
        key: 'toInsertion',
        value: function toInsertion() {
            return new Insertion(this);
        }
    }]);
    return Phene;
}(Feature);

/**
 *
 */

// TODO make zero-indexed and disallow points

var Range = exports.Range = function () {
    /**
     *
     * @param {int} start
     * @param {int} end
     * @param {string} sequence one of 'coding' and 'protein'
     */

    function Range(start, end) {
        var sequence = arguments.length <= 2 || arguments[2] === undefined ? 'coding' : arguments[2];
        (0, _classCallCheck3.default)(this, Range);

        this.start = start;
        this.end = end;
        this.sequence = sequence;
    }

    (0, _createClass3.default)(Range, [{
        key: 'isPoint',
        value: function isPoint() {
            return this.start == this.end;
        }
    }, {
        key: 'toString',
        value: function toString() {
            if (this.isPoint()) {
                return '[' + this.sequence.charAt(0) + '.' + this.start + ']';
            } else {
                return '[' + this.sequence.charAt(0) + '.' + this.start + '_' + this.end + ']';
            }
        }
    }]);
    return Range;
}();

var Accession = exports.Accession = function () {
    function Accession(identifier) {
        var database = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
        (0, _classCallCheck3.default)(this, Accession);

        this.identifier = identifier;
        this.database = database;
    }

    (0, _createClass3.default)(Accession, [{
        key: 'toString',
        value: function toString() {
            return this.database + ':' + this.identifier;
        }
    }, {
        key: 'equals',
        value: function equals(other) {
            return other instanceof Accession && this.database == other.database && this.identifier == other.identifier;
        }
    }]);
    return Accession;
}();

var Organism = exports.Organism = function () {
    function Organism(name) {
        var aliases = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
        (0, _classCallCheck3.default)(this, Organism);

        this.name = name;
        this.aliases = aliases;
    }

    (0, _createClass3.default)(Organism, [{
        key: 'equals',
        value: function equals(other) {
            return this.name == other.name;
        }
    }, {
        key: 'defaultAlias',
        get: function get() {
            return this.aliases[0] || this.name;
        }
    }]);
    return Organism;
}();

var DEFAULT_ORGANISMS = [new Organism('Escherichia coli', ['E.coli', 'Eco', 'Ec']), new Organism('Saccharomyces cerevisiae', ['S.Ce', 'Sce', 'Sc'])];