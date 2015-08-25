'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x15, _x16, _x17) { var _again = true; _function: while (_again) { var object = _x15, property = _x16, receiver = _x17; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x15 = parent; _x16 = property; _x17 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _genotypeJs = require('./genotype.js');

/**
 * Created by lyschoening on 5/19/15.
 */

// TODO ranges are not currently supported because they make the logic of computing a genotype radically more difficult

var Genotype = (function () {
    /**
     *
     * Only one variant of a gene is considered realistic, so an insertion of a gene with a variant replaces the
     * gene without the variant. This may need to change to allow multiple non-wildtype variants.
     *
     *
     * @param ancestor
     * @param {...(Insertion|Replacement|Deletion|Plasmid)} changes
     */

    function Genotype(ancestor, changes) {
        if (ancestor === undefined) ancestor = null;

        _classCallCheck(this, Genotype);

        this.ancestor = ancestor;
        this.changes = changes;

        // TODO currently the code must assume that naming is consistent. i.e. if a feature
        // has only a name, it always has a name, if it has only an accession, it always has an accession.

        // TODO support ranges
        // NOTE ranges are currently ignored; proper handling of ranges would require splitting/merging etc. of
        // features based on the range or describing the mutation in the variant string.

        // TODO enumerate all features from the changes.
        var sites = this.ancestor ? Array.from(this.ancestor.sites) : []; // any features used like sites
        var markers = this.ancestor ? Array.from(this.ancestor.markers) : []; // any features/phenes used like markers

        // TODO also remove markers from features
        // TODO combine features and phenes somehow

        var features = { added: [], removed: [] };
        var episomes = { added: [], removed: [] };

        function remove(array, value) {
            return array.filter(function (element) {
                return !value.equals(element);
            });
        }

        function upsert(array, value) {
            return remove(array, value).concat([value]);
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = changes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var change = _step.value;

                if (change instanceof Plasmid) {
                    var plasmid = change;
                    if (plasmid.isEpisome()) {
                        episomes.removed = remove(episomes.removed, plasmid);
                        episomes.added = upsert(episomes.added, plasmid);
                        continue;
                    } else {
                        console.warn('Deprecated: Insertion of a plasmid with insertion site as episome.');
                        change = plasmid.toInsertion();
                    }
                } else if (change instanceof Phene) {
                    change = change.toInsertion();
                }

                if (change instanceof Insertion) {
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = change.contents.features()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var feature = _step2.value;

                            features.removed = remove(features.removed, feature);
                            features.added = upsert(features.added, feature);
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                                _iterator2['return']();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }
                } else if (change instanceof Replacement) {
                    // NOTE if an insertion site is within a fusion, the fusion needs to be replaced.
                    //      Likewise, if a deleted feature is within a fusion, that fusion, too, needs to be replaced.
                    sites = upsert(sites, change.site);
                    markers = remove(markers, change.site);

                    features.added = remove(features.added, change.site);
                    features.removed = upsert(features.removed, change.site);

                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = change.contents.features()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var feature = _step3.value;

                            features.removed = remove(features.removed, feature);
                            features.added = upsert(features.added, feature);
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                                _iterator3['return']();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                } else {
                    // change instanceof Deletion
                    if (change.contents instanceof Plasmid) {
                        var plasmid = change;
                        episomes.added = remove(episomes.added, plasmid);
                        episomes.removed = upsert(episomes.removed, plasmid);
                    } else {
                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = change.contents.features()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var feature = _step4.value;

                                features.added = remove(features.added, feature);
                                features.removed = upsert(features.removed, feature);
                            }
                        } catch (err) {
                            _didIteratorError4 = true;
                            _iteratorError4 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                                    _iterator4['return']();
                                }
                            } finally {
                                if (_didIteratorError4) {
                                    throw _iteratorError4;
                                }
                            }
                        }
                    }
                }

                // Any marker is added (variant applied) at the very end
                if (change.marker) {
                    markers = upsert(markers, change.marker);

                    features.removed = remove(features.removed, change.marker);
                    features.added = upsert(features.added, change.marker);
                }
            }

            // TODO freeze with Object.freeze()
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        this.addedFeatures = Object.freeze(features.added);
        this.removedFeatures = Object.freeze(features.removed);
        this.addedEpisomes = Object.freeze(episomes.added);
        this.removedEpisomes = Object.freeze(episomes.removed);
        this.sites = Object.freeze(sites);
        this.markers = Object.freeze(markers);
    }

    _createClass(Genotype, [{
        key: 'episomes',

        //toString() {
        //
        //}

        /**
         * A list of all episomes in the genotype
         */
        value: function episomes() {
            var _this = this;

            var inclusive = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            if (inclusive || !this.ancestor) {
                return this.addedEpisomes;
            } else {
                return this.addedEpisomes.filter(function (episome) {
                    return !_this.ancestor.addedEpisomes.some(function (e) {
                        return episome.equals(e);
                    });
                });
            }
        }

        /**
         * A list of insertions and deletions on a gene level. On
         * @param inclusive
         */
    }, {
        key: 'features',
        value: regeneratorRuntime.mark(function features() {
            var inclusive = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

            var _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _loop, _iterator5, _step5;

            return regeneratorRuntime.wrap(function features$(context$2$0) {
                var _this2 = this;

                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        return context$2$0.delegateYield(this.addedFeatures, 't0', 1);

                    case 1:
                        if (!(inclusive && this.ancestor)) {
                            context$2$0.next = 27;
                            break;
                        }

                        _iteratorNormalCompletion5 = true;
                        _didIteratorError5 = false;
                        _iteratorError5 = undefined;
                        context$2$0.prev = 5;
                        _loop = regeneratorRuntime.mark(function callee$2$0() {
                            var feature;
                            return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                                while (1) switch (context$3$0.prev = context$3$0.next) {
                                    case 0:
                                        feature = _step5.value;

                                        if (!this.removedFeatures.some(function (f) {
                                            return feature.equals(f);
                                        })) {
                                            context$3$0.next = 4;
                                            break;
                                        }

                                        context$3$0.next = 4;
                                        return feature;

                                    case 4:
                                    case 'end':
                                        return context$3$0.stop();
                                }
                            }, callee$2$0, _this2);
                        });
                        _iterator5 = this.ancestor.features()[Symbol.iterator]();

                    case 8:
                        if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
                            context$2$0.next = 13;
                            break;
                        }

                        return context$2$0.delegateYield(_loop(), 't1', 10);

                    case 10:
                        _iteratorNormalCompletion5 = true;
                        context$2$0.next = 8;
                        break;

                    case 13:
                        context$2$0.next = 19;
                        break;

                    case 15:
                        context$2$0.prev = 15;
                        context$2$0.t2 = context$2$0['catch'](5);
                        _didIteratorError5 = true;
                        _iteratorError5 = context$2$0.t2;

                    case 19:
                        context$2$0.prev = 19;
                        context$2$0.prev = 20;

                        if (!_iteratorNormalCompletion5 && _iterator5['return']) {
                            _iterator5['return']();
                        }

                    case 22:
                        context$2$0.prev = 22;

                        if (!_didIteratorError5) {
                            context$2$0.next = 25;
                            break;
                        }

                        throw _iteratorError5;

                    case 25:
                        return context$2$0.finish(22);

                    case 26:
                        return context$2$0.finish(19);

                    case 27:
                    case 'end':
                        return context$2$0.stop();
                }
            }, features, this, [[5, 15, 19, 27], [20,, 22, 26]]);
        })
    }], [{
        key: 'parse',
        value: function parse(string) {
            var ancestor = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

            return new Genotype(ancestor, (0, _genotypeJs.parse)(string));
        }
    }]);

    return Genotype;
})();

exports.Genotype = Genotype;

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
function Deletion(deletion) {
    var marker = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, Deletion);

    if (deletion instanceof Feature) {
        deletion = new FeatureTree(deletion);
    }
    this.contents = deletion;
    this.marker = marker;
};

exports.Deletion = Deletion;

var Insertion =
// TODO change site from a string to a feature, allow ranges.
/**
 *
 * @param {(Feature|FeatureTree)} insertable
 * @param {(string|null)} marker selection marker
 */
function Insertion(insertion) {
    var marker = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, Insertion);

    if (insertion instanceof Feature) {
        insertion = new FeatureTree(insertion);
    } else if (insertion instanceof Plasmid) {
        marker = marker || insertion.marker;
        insertion.marker |= marker;
    }

    this.contents = insertion;
    this.marker = marker;
};

exports.Insertion = Insertion;

var Replacement =
/**
 * @param {(Feature|Phene)} site integration site
 * @param {(Feature|FeatureTree)} insertion
 * @param {(Feature|Phene)} marker
 * @param {bool} multiple whether the site is for multiple integration
 */
function Replacement(site, insertion) {
    var marker = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
    var multiple = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

    _classCallCheck(this, Replacement);

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

exports.Replacement = Replacement;

var FeatureTree = (function () {
    /**
     *
     * @param {...(Phene|Feature|FeatureTree)} contents
     */

    function FeatureTree() {
        _classCallCheck(this, FeatureTree);

        for (var _len = arguments.length, contents = Array(_len), _key = 0; _key < _len; _key++) {
            contents[_key] = arguments[_key];
        }

        this.contents = contents;
    }

    /**
     * Enumerates all features of the feature tree.
     */

    _createClass(FeatureTree, [{
        key: 'features',
        value: regeneratorRuntime.mark(function features() {
            var _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, item;

            return regeneratorRuntime.wrap(function features$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        _iteratorNormalCompletion6 = true;
                        _didIteratorError6 = false;
                        _iteratorError6 = undefined;
                        context$2$0.prev = 3;
                        _iterator6 = this.contents[Symbol.iterator]();

                    case 5:
                        if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
                            context$2$0.next = 16;
                            break;
                        }

                        item = _step6.value;

                        if (!(item instanceof FeatureTree)) {
                            context$2$0.next = 11;
                            break;
                        }

                        return context$2$0.delegateYield(item.features(), 't0', 9);

                    case 9:
                        context$2$0.next = 13;
                        break;

                    case 11:
                        context$2$0.next = 13;
                        return item;

                    case 13:
                        _iteratorNormalCompletion6 = true;
                        context$2$0.next = 5;
                        break;

                    case 16:
                        context$2$0.next = 22;
                        break;

                    case 18:
                        context$2$0.prev = 18;
                        context$2$0.t1 = context$2$0['catch'](3);
                        _didIteratorError6 = true;
                        _iteratorError6 = context$2$0.t1;

                    case 22:
                        context$2$0.prev = 22;
                        context$2$0.prev = 23;

                        if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                            _iterator6['return']();
                        }

                    case 25:
                        context$2$0.prev = 25;

                        if (!_didIteratorError6) {
                            context$2$0.next = 28;
                            break;
                        }

                        throw _iteratorError6;

                    case 28:
                        return context$2$0.finish(25);

                    case 29:
                        return context$2$0.finish(22);

                    case 30:
                    case 'end':
                        return context$2$0.stop();
                }
            }, features, this, [[3, 18, 22, 30], [23,, 25, 29]]);
        })
    }]);

    return FeatureTree;
})();

exports.FeatureTree = FeatureTree;

var Group = (function (_FeatureTree) {
    _inherits(Group, _FeatureTree);

    /**
     *
     * @param {...(Feature|Fusion)} contents
     */

    function Group() {
        _classCallCheck(this, Group);

        for (var _len2 = arguments.length, contents = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            contents[_key2] = arguments[_key2];
        }

        _get(Object.getPrototypeOf(Group.prototype), 'constructor', this).apply(this, contents);
    }

    // TODO compare all features from both groups.

    _createClass(Group, [{
        key: 'equals',
        value: function equals() {
            return false;
        }
    }]);

    return Group;
})(FeatureTree);

exports.Group = Group;

var Plasmid = (function (_FeatureTree2) {
    _inherits(Plasmid, _FeatureTree2);

    /**
     *
     * @param {(string|null)} name
     * @param {(string|null)} marker selection marker (carried over from insertion).
     * @param {...(Phene|Feature|Fusion)} contents
     */

    function Plasmid(name) {
        var site = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
        var marker = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

        _classCallCheck(this, Plasmid);

        for (var _len3 = arguments.length, contents = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
            contents[_key3 - 3] = arguments[_key3];
        }

        _get(Object.getPrototypeOf(Plasmid.prototype), 'constructor', this).apply(this, contents);
        this.name = name;
        this.site = site;
        this.marker = marker;

        if (!(this.name || this.site)) {
            throw 'An unintegrated plasmid MUST have a name.';
        }
    }

    _createClass(Plasmid, [{
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
})(FeatureTree);

exports.Plasmid = Plasmid;

var Fusion = (function (_FeatureTree3) {
    _inherits(Fusion, _FeatureTree3);

    /**
     *
     * @param {...Feature} features
     */

    function Fusion() {
        _classCallCheck(this, Fusion);

        for (var _len4 = arguments.length, features = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            features[_key4] = arguments[_key4];
        }

        _get(Object.getPrototypeOf(Fusion.prototype), 'constructor', this).apply(this, features);
    }

    return Fusion;
})(FeatureTree);

exports.Fusion = Fusion;

var Feature = (function () {
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

        _classCallCheck(this, Feature);

        this.name = name;
        this.type = type;
        this.accession = accession;
        this.organism = organism;
        this.variant = variant;
        this.range = range;
        // TODO verify that either an accession or a name is given.
    }

    _createClass(Feature, [{
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
                return this.name == other.name;
            } else {
                return false; // no way to compare these features.
            }
        }
    }]);

    return Feature;
})();

exports.Feature = Feature;

var Phene = (function (_Feature) {
    _inherits(Phene, _Feature);

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

        _classCallCheck(this, Phene);

        _get(Object.getPrototypeOf(Phene.prototype), 'constructor', this).call(this, name, { type: 'phene', organism: organism, variant: variant });
    }

    /**
     *
     */

    // TODO make zero-indexed and disallow points

    _createClass(Phene, [{
        key: 'toInsertion',
        value: function toInsertion() {
            return new Insertion(this);
        }
    }]);

    return Phene;
})(Feature);

exports.Phene = Phene;

var Range = (function () {
    /**
     *
     * @param {int} start
     * @param {int} end
     * @param {string} sequence one of 'coding' and 'protein'
     */

    function Range(start, end) {
        var sequence = arguments.length <= 2 || arguments[2] === undefined ? 'coding' : arguments[2];

        _classCallCheck(this, Range);

        this.start = start;
        this.end = end;
        this.sequence = sequence;
    }

    _createClass(Range, [{
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
})();

exports.Range = Range;

var Accession = (function () {
    function Accession(identifier) {
        var database = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        _classCallCheck(this, Accession);

        this.identifier = identifier;
        this.database = database;
    }

    _createClass(Accession, [{
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
})();

exports.Accession = Accession;

var Organism = (function () {
    function Organism(name) {
        var aliases = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, Organism);

        this.name = name;
        this.aliases = aliases;
    }

    _createClass(Organism, [{
        key: 'matches',
        value: function matches(name) {}
    }, {
        key: 'defaultAlias',
        get: function get() {
            return this.aliases[0] || this.name;
        }
    }]);

    return Organism;
})();

exports.Organism = Organism;

var DEFAULT_ORGANISMS = [new Organism('Escherichia coli', ['E.coli', 'Eco', 'Ec']), new Organism('Saccharomyces cerevisiae', ['S.Ce', 'Sce', 'Sc'])];