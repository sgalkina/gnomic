'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _arguments = arguments;
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Genotype = undefined;

var _models = require('./models.js');

var _grammar = require('./grammar.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Genotype = exports.Genotype = function () {
    /**
     *
     * Only one variant of a gene is considered realistic, so an insertion of a gene with a variant replaces the
     * gene without the variant. This may need to change to allow multiple non-wildtype variants.
     *
     *
     * @param ancestor
     * @param {...(Insertion|Replacement|Deletion|Plasmid)} changes
     */

    function Genotype() {
        var ancestor = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
        var changes = arguments[1];
        (0, _classCallCheck3.default)(this, Genotype);

        this.ancestor = ancestor;
        this.changes = changes;

        // TODO currently the code must assume that naming is consistent. i.e. if a feature
        // has only a name, it always has a name, if it has only an accession, it always has an accession.

        // TODO support ranges
        // NOTE ranges are currently ignored; proper handling of ranges would require splitting/merging etc. of
        // features based on the range or describing the mutation in the variant string.

        // TODO enumerate all features from the changes.
        var sites = this.ancestor ? (0, _from2.default)(this.ancestor.sites) : []; // any features used like sites
        var markers = this.ancestor ? (0, _from2.default)(this.ancestor.markers) : []; // any features/phenes used like markers

        // TODO also remove markers from features
        // TODO combine features and phenes somehow

        var features = { added: [], removed: [] };
        var episomes = { added: [], removed: [] };

        function remove(array, value) {
            return array.filter(function (item) {
                return !value.match(item);
            });
        }

        function upsert(array, value) {
            return remove(array, value).concat([value]);
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = (0, _getIterator3.default)(changes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var change = _step.value;

                if (change instanceof _models.Plasmid) {
                    var plasmid = change;
                    if (plasmid.isEpisome()) {
                        episomes.removed = remove(episomes.removed, plasmid);
                        episomes.added = upsert(episomes.added, plasmid);
                        continue;
                    } else {
                        console.warn('Deprecated: Insertion of a plasmid with insertion site as episome.');
                        change = plasmid.toInsertion();
                    }
                } else if (change instanceof _models.Phene) {
                    change = change.toInsertion();
                }

                if (change instanceof _models.Insertion) {
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = (0, _getIterator3.default)(change.contents.features()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var feature = _step2.value;

                            features.removed = remove(features.removed, feature);
                            features.added = upsert(features.added, feature);
                            console.log('ins', features.removed, features.added, feature);
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }
                } else if (change instanceof _models.Replacement) {
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
                        for (var _iterator3 = (0, _getIterator3.default)(change.contents.features()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var feature = _step3.value;

                            features.removed = remove(features.removed, feature);
                            features.added = upsert(features.added, feature);
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                } else {
                    // change instanceof Deletion
                    if (change.contents instanceof _models.Plasmid) {
                        var plasmid = change;
                        episomes.added = remove(episomes.added, plasmid);
                        episomes.removed = upsert(episomes.removed, plasmid);
                    } else {
                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = (0, _getIterator3.default)(change.contents.features()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var feature = _step4.value;

                                features.added = remove(features.added, feature);
                                features.removed = upsert(features.removed, feature);
                            }
                        } catch (err) {
                            _didIteratorError4 = true;
                            _iteratorError4 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                    _iterator4.return();
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
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        this.addedFeatures = (0, _freeze2.default)(features.added);
        this.removedFeatures = (0, _freeze2.default)(features.removed);
        this.addedEpisomes = (0, _freeze2.default)(episomes.added);
        this.removedEpisomes = (0, _freeze2.default)(episomes.removed);
        this.sites = (0, _freeze2.default)(sites);
        this.markers = (0, _freeze2.default)(markers);
    }

    (0, _createClass3.default)(Genotype, [{
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
         * @param removed
         */

    }, {
        key: 'features',
        value: _regenerator2.default.mark(function features() {
            var _this2 = this;

            var removed = _arguments.length <= 0 || _arguments[0] === undefined ? false : _arguments[0];

            var _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _loop, _iterator5, _step5, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _loop2, _iterator6, _step6;

            return _regenerator2.default.wrap(function features$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            if (!removed) {
                                _context3.next = 30;
                                break;
                            }

                            return _context3.delegateYield(this.removedFeatures, 't0', 2);

                        case 2:
                            if (!this.ancestor) {
                                _context3.next = 28;
                                break;
                            }

                            _iteratorNormalCompletion5 = true;
                            _didIteratorError5 = false;
                            _iteratorError5 = undefined;
                            _context3.prev = 6;
                            _loop = _regenerator2.default.mark(function _loop() {
                                var feature;
                                return _regenerator2.default.wrap(function _loop$(_context) {
                                    while (1) {
                                        switch (_context.prev = _context.next) {
                                            case 0:
                                                feature = _step5.value;

                                                if (_this2.addedFeatures.some(function (f) {
                                                    return f.match(feature);
                                                })) {
                                                    _context.next = 4;
                                                    break;
                                                }

                                                _context.next = 4;
                                                return feature;

                                            case 4:
                                            case 'end':
                                                return _context.stop();
                                        }
                                    }
                                }, _loop, _this2);
                            });
                            _iterator5 = (0, _getIterator3.default)(this.ancestor.features(true));

                        case 9:
                            if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
                                _context3.next = 14;
                                break;
                            }

                            return _context3.delegateYield(_loop(), 't1', 11);

                        case 11:
                            _iteratorNormalCompletion5 = true;
                            _context3.next = 9;
                            break;

                        case 14:
                            _context3.next = 20;
                            break;

                        case 16:
                            _context3.prev = 16;
                            _context3.t2 = _context3['catch'](6);
                            _didIteratorError5 = true;
                            _iteratorError5 = _context3.t2;

                        case 20:
                            _context3.prev = 20;
                            _context3.prev = 21;

                            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                _iterator5.return();
                            }

                        case 23:
                            _context3.prev = 23;

                            if (!_didIteratorError5) {
                                _context3.next = 26;
                                break;
                            }

                            throw _iteratorError5;

                        case 26:
                            return _context3.finish(23);

                        case 27:
                            return _context3.finish(20);

                        case 28:
                            _context3.next = 57;
                            break;

                        case 30:
                            return _context3.delegateYield(this.addedFeatures, 't3', 31);

                        case 31:
                            if (!this.ancestor) {
                                _context3.next = 57;
                                break;
                            }

                            _iteratorNormalCompletion6 = true;
                            _didIteratorError6 = false;
                            _iteratorError6 = undefined;
                            _context3.prev = 35;
                            _loop2 = _regenerator2.default.mark(function _loop2() {
                                var feature;
                                return _regenerator2.default.wrap(function _loop2$(_context2) {
                                    while (1) {
                                        switch (_context2.prev = _context2.next) {
                                            case 0:
                                                feature = _step6.value;

                                                if (_this2.removedFeatures.some(function (f) {
                                                    return feature.match(f);
                                                })) {
                                                    _context2.next = 4;
                                                    break;
                                                }

                                                _context2.next = 4;
                                                return feature;

                                            case 4:
                                            case 'end':
                                                return _context2.stop();
                                        }
                                    }
                                }, _loop2, _this2);
                            });
                            _iterator6 = (0, _getIterator3.default)(this.ancestor.features(false));

                        case 38:
                            if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
                                _context3.next = 43;
                                break;
                            }

                            return _context3.delegateYield(_loop2(), 't4', 40);

                        case 40:
                            _iteratorNormalCompletion6 = true;
                            _context3.next = 38;
                            break;

                        case 43:
                            _context3.next = 49;
                            break;

                        case 45:
                            _context3.prev = 45;
                            _context3.t5 = _context3['catch'](35);
                            _didIteratorError6 = true;
                            _iteratorError6 = _context3.t5;

                        case 49:
                            _context3.prev = 49;
                            _context3.prev = 50;

                            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                _iterator6.return();
                            }

                        case 52:
                            _context3.prev = 52;

                            if (!_didIteratorError6) {
                                _context3.next = 55;
                                break;
                            }

                            throw _iteratorError6;

                        case 55:
                            return _context3.finish(52);

                        case 56:
                            return _context3.finish(49);

                        case 57:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, features, this, [[6, 16, 20, 28], [21,, 23, 27], [35, 45, 49, 57], [50,, 52, 56]]);
        })
    }], [{
        key: 'parse',
        value: function parse(string) {
            var ancestor = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

            return new Genotype(ancestor, (0, _grammar.parse)(string));
        }
    }]);
    return Genotype;
}();