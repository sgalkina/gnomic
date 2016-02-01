'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Organism = exports.Accession = exports.Range = exports.Phene = exports.Feature = exports.Fusion = exports.Plasmid = exports.Group = exports.FeatureTree = exports.Replacement = exports.Insertion = exports.Deletion = undefined;

var _grammar = require('./grammar.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by lyschoening on 5/19/15.
 */

// TODO ranges are not currently supported because they make the logic of computing a genotype radically more difficult

var Deletion =

/**
 *
 * e.g.
 *  -pExample()         (deletion of an episome)
 *  -abcD               (deletion of a feature)
 *  -abcD[c.12_34]      (deletion of part of a gene)
 *
 *
 * @param {(Feature|FeatureTree)} deletion delible
 * @param {(string|null)} marker selection marker
 *
 */
exports.Deletion = function Deletion(deletion) {
    var marker = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    (0, _classCallCheck3.default)(this, Deletion);

    if (deletion instanceof Feature) {
        deletion = new FeatureTree(deletion);
    }
    this.contents = deletion;
    this.marker = marker;
};

var Insertion =
// TODO change site from a string to a feature, allow ranges.
/**
 *
 * @param {(Feature|FeatureTree)} insertable
 * @param {(string|null)} marker selection marker
 */
exports.Insertion = function Insertion(insertion) {
    var marker = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    (0, _classCallCheck3.default)(this, Insertion);

    if (insertion instanceof Feature) {
        insertion = new FeatureTree(insertion);
    } else if (insertion instanceof Plasmid) {
        marker = marker || insertion.marker;
        insertion.marker |= marker;
    }

    this.contents = insertion;
    this.marker = marker;
};

var Replacement =
/**
 * @param {(Feature|Phene)} site integration site
 * @param {(Feature|FeatureTree)} insertion
 * @param {(Feature|Phene)} marker
 * @param {bool} multiple whether the site is for multiple integration
 */
exports.Replacement = function Replacement(site, insertion) {
    var marker = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
    var multiple = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
    (0, _classCallCheck3.default)(this, Replacement);

    if (insertion instanceof Feature) {
        insertion = new FeatureTree(insertion);
    } else if (insertion instanceof Plasmid) {
        marker = marker || insertion.marker;
        site = site || insertion.site;
        insertion.marker |= marker;
        insertion.site |= site;
    }

    this.contents = insertion;
    this.site = site;
    this.marker = marker;
    this.multiple = multiple;
};

var FeatureTree = exports.FeatureTree = function () {
    /**
     *
     * @param {...(Phene|Feature|FeatureTree)} contents
     */

    function FeatureTree() {
        (0, _classCallCheck3.default)(this, FeatureTree);

        for (var _len = arguments.length, contents = Array(_len), _key = 0; _key < _len; _key++) {
            contents[_key] = arguments[_key];
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
    }]);
    return FeatureTree;
}();

var Group = exports.Group = function (_FeatureTree) {
    (0, _inherits3.default)(Group, _FeatureTree);

    /**
     *
     * @param {...(Feature|Fusion)} contents
     */

    function Group() {
        var _Object$getPrototypeO;

        (0, _classCallCheck3.default)(this, Group);

        for (var _len2 = arguments.length, contents = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            contents[_key2] = arguments[_key2];
        }

        return (0, _possibleConstructorReturn3.default)(this, (_Object$getPrototypeO = (0, _getPrototypeOf2.default)(Group)).call.apply(_Object$getPrototypeO, [this].concat(contents)));
    }

    // TODO compare all features from both groups.

    (0, _createClass3.default)(Group, [{
        key: 'equals',
        value: function equals(other) {
            return false;
        }
    }, {
        key: 'match',
        value: function match(other) {
            return this.equals(other);
        }
    }]);
    return Group;
}(FeatureTree);

var Plasmid = exports.Plasmid = function (_FeatureTree2) {
    (0, _inherits3.default)(Plasmid, _FeatureTree2);

    /**
     *
     * @param {(string|null)} name
     * @param {(string|null)} marker selection marker (carried over from insertion).
     * @param {...(Phene|Feature|Fusion)} contents
     */

    function Plasmid(name) {
        var _Object$getPrototypeO2;

        var site = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
        var marker = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
        (0, _classCallCheck3.default)(this, Plasmid);

        for (var _len3 = arguments.length, contents = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
            contents[_key3 - 3] = arguments[_key3];
        }

        var _this2 = (0, _possibleConstructorReturn3.default)(this, (_Object$getPrototypeO2 = (0, _getPrototypeOf2.default)(Plasmid)).call.apply(_Object$getPrototypeO2, [this].concat(contents)));

        _this2.name = name;
        _this2.site = site;
        _this2.marker = marker;

        if (!(_this2.name || _this2.site)) {
            throw 'An unintegrated plasmid MUST have a name.';
        }
        return _this2;
    }

    (0, _createClass3.default)(Plasmid, [{
        key: 'toInsertion',
        value: function toInsertion() {
            if (this.isIntegrated()) {
                return new Replacement(this.site, this, this.marker);
            } else {
                throw 'Plasmid(' + this.name + ') can\'t be converted to an insertion because it is not integrated.';
            }
        }
    }, {
        key: 'isIntegrated',
        value: function isIntegrated() {
            return this.site != null;
        }
    }, {
        key: 'isEpisome',
        value: function isEpisome() {
            return this.site == null;
        }

        // TODO An integrated plasmid and an insertion are identical.

    }, {
        key: 'equals',
        value: function equals(other) {
            if (this.name) {
                return this.name == other.name;
            } else if (other.name) {
                return false;
            } else {
                // no way to compare these plasmids except by comparing contents.
                return this.contents.equals(other);
            }
        }
    }]);
    return Plasmid;
}(FeatureTree);

var Fusion = exports.Fusion = function (_FeatureTree3) {
    (0, _inherits3.default)(Fusion, _FeatureTree3);

    /**
     *
     * @param {...Feature} features
     */

    function Fusion() {
        var _Object$getPrototypeO3;

        (0, _classCallCheck3.default)(this, Fusion);

        for (var _len4 = arguments.length, features = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            features[_key4] = arguments[_key4];
        }

        return (0, _possibleConstructorReturn3.default)(this, (_Object$getPrototypeO3 = (0, _getPrototypeOf2.default)(Fusion)).call.apply(_Object$getPrototypeO3, [this].concat(features)));
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
        var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref$type = _ref.type;
        var type = _ref$type === undefined ? null : _ref$type;
        var _ref$accession = _ref.accession;
        var accession = _ref$accession === undefined ? null : _ref$accession;
        var _ref$organism = _ref.organism;
        var organism = _ref$organism === undefined ? null : _ref$organism;
        var _ref$variant = _ref.variant;
        var variant = _ref$variant === undefined ? null : _ref$variant;
        var _ref$range = _ref.range;
        var range = _ref$range === undefined ? null : _ref$range;
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
            if (this.accession && other.accession) {
                return this.accession.equals(other.accession);
            } else if (this.name) {
                if (this.name != other.name) {
                    return false;
                }

                //if(!this.organism != !other.organism || (this.organism && this.organism.name != other.organism.name)) {
                //    return false
                //}

                // a feature without a variant matches other features with a variant:
                // this | other
                // null | null -> true
                // foo  | null -> false
                // null | foo  -> true
                // foo  | foo  -> true
                // foo  | bar  -> false
                console.log(this.name, '|', this.variant, other.variant, !this.variant || this.variant == other.variant);
                return !this.variant || this.variant == other.variant;
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
        var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref2$organism = _ref2.organism;
        var organism = _ref2$organism === undefined ? null : _ref2$organism;
        var _ref2$variant = _ref2.variant;
        var variant = _ref2$variant === undefined ? 'wild-type' : _ref2$variant;
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
        key: 'matches',
        value: function matches(name) {}
    }, {
        key: 'defaultAlias',
        get: function get() {
            return this.aliases[0] || this.name;
        }
    }]);
    return Organism;
}();

var DEFAULT_ORGANISMS = [new Organism('Escherichia coli', ['E.coli', 'Eco', 'Ec']), new Organism('Saccharomyces cerevisiae', ['S.Ce', 'Sce', 'Sc'])];