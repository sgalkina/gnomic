'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Genotype = exports.FUSION_MATCH_WHOLE = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _arguments = arguments;

var _models = require('./models.js');

var _grammar = require('./grammar.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FUSION_MATCH_WHOLE = exports.FUSION_MATCH_WHOLE = 'match-whole-fusions';

var Genotype = exports.Genotype = function () {
    /**
     *
     * Only one variant of a gene is considered realistic, so an insertion of a gene with a variant replaces the
     * gene without the variant. This may need to change to allow multiple non-wildtype variants.
     *
     * @param {(Insertion|Replacement|Deletion|Plasmid)} changes
     * @param parent
     */

    function Genotype(changes) {
        var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref$parent = _ref.parent;
        var parent = _ref$parent === undefined ? null : _ref$parent;
        var _ref$fusionStrategy = _ref.fusionStrategy;
        var fusionStrategy = _ref$fusionStrategy === undefined ? FUSION_MATCH_WHOLE : _ref$fusionStrategy;
        (0, _classCallCheck3.default)(this, Genotype);

        this.parent = parent;
        this.raw = (0, _freeze2.default)(changes);

        // TODO currently the code must assume that naming is consistent. i.e. if a feature
        // has only a name, it always has a name, if it has only an accession, it always has an accession.

        // TODO support ranges
        // NOTE ranges are currently ignored; proper handling of ranges would require splitting/merging etc. of
        // features based on the range or describing the mutation in the variant string.

        function remove(items, value) {
            for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                args[_key - 2] = arguments[_key];
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(items.filter(function (item) {
                    return value.match.apply(value, [item].concat(args));
                })), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var item = _step.value;

                    items.splice(items.indexOf(item), 1);
                    // FIXME support removing multiple copies
                }
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

            return items;
        }

        function upsert(items, value) {
            for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
                args[_key2 - 2] = arguments[_key2];
            }

            remove.apply(undefined, [items, value].concat(args));
            items.push(value);
            return items;
        }

        function removeOrExclude(addedItems, removedItems, value) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)(addedItems), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var item = _step2.value;

                    if (item.equals(value)) {
                        return [remove(addedItems, value), removedItems];
                    }
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

            return [remove(addedItems, value), upsert(removedItems, value)];
        }

        //def remove_or_exclude(added_features, removed_features, exclude):
        //  for feature in added_features:
        //      if exclude == feature:
        //  return remove(added_features, exclude), removed_features
        //  return remove(added_features, exclude), upsert(removed_features, exclude)

        var sites = parent ? (0, _from2.default)(parent.sites) : [];
        var markers = parent ? (0, _from2.default)(parent.markers) : [];
        var addedPlasmids = parent ? (0, _from2.default)(parent.addedPlasmids) : [];
        var removedPlasmids = parent ? (0, _from2.default)(parent.removedPlasmids) : [];

        var addedFeatures = parent ? (0, _from2.default)(parent.addedFeatures) : [];
        var removedFeatures = parent ? (0, _from2.default)(parent.removedFeatures) : [];

        var addedFusionFeatures = parent ? (0, _from2.default)(parent.addedFusionFeatures) : [];
        var removedFusionFeatures = parent ? (0, _from2.default)(parent.removedFusionFeatures) : [];

        console.log('added:\n', (0, _stringify2.default)(addedFeatures, null, 4), '\n');
        console.log('removed:\n', (0, _stringify2.default)(removedFeatures, null, 4), '\n');
        console.log('changes:\n', (0, _stringify2.default)(changes, null, 4), '\n\n');

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = (0, _getIterator3.default)(changes), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var change = _step3.value;

                // addition of an un-integrated plasmid
                if (change instanceof _models.Plasmid) {
                    upsert(addedPlasmids, change);
                    removeOrExclude(removedPlasmids, change);
                } else if (change instanceof _models.Feature) {
                    upsert(addedFeatures, change, false);
                    remove(removedFeatures, change, false);

                    // fusion-sensitive implementation:
                    upsert(addedFusionFeatures, change, false);
                    remove(removedFusionFeatures, change, false);
                } else {

                    // deletion of a plasmid; change.after MUST be null
                    if (change.before instanceof _models.Plasmid) {
                        remove(addedPlasmids, change.before);
                        upsert(removedPlasmids, change.before);
                    } else if (change.before !== null) {
                        // deletion of one (or more) features or fusions
                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = (0, _getIterator3.default)(change.before.features()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var feature = _step4.value;

                                removeOrExclude(addedFeatures, removedFeatures, feature);
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

                        if (fusionStrategy != FUSION_MATCH_WHOLE) {
                            throw 'Unsupported fusion strategy: ' + fusionStrategy;
                        }

                        switch (fusionStrategy) {
                            case FUSION_MATCH_WHOLE:
                                var _iteratorNormalCompletion5 = true;
                                var _didIteratorError5 = false;
                                var _iteratorError5 = undefined;

                                try {
                                    for (var _iterator5 = (0, _getIterator3.default)(change.before), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                        var featureOrFusion = _step5.value;

                                        removeOrExclude(addedFusionFeatures, removedFusionFeatures, featureOrFusion);
                                    }
                                } catch (err) {
                                    _didIteratorError5 = true;
                                    _iteratorError5 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                            _iterator5.return();
                                        }
                                    } finally {
                                        if (_didIteratorError5) {
                                            throw _iteratorError5;
                                        }
                                    }
                                }

                                break;
                        }
                    }

                    if (change.after !== null) {

                        console.log(change.after);
                        console.log('change after features:\n', (0, _stringify2.default)((0, _from2.default)(change.after.features()), null, 4), '\n');

                        // insertion of one (or more) features or fusions
                        var _iteratorNormalCompletion6 = true;
                        var _didIteratorError6 = false;
                        var _iteratorError6 = undefined;

                        try {
                            for (var _iterator6 = (0, _getIterator3.default)(change.after.features()), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                                var feature = _step6.value;

                                upsert(addedFeatures, feature);
                                remove(removedFeatures, feature);
                            }

                            // fusion-sensitive implementation:
                        } catch (err) {
                            _didIteratorError6 = true;
                            _iteratorError6 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                    _iterator6.return();
                                }
                            } finally {
                                if (_didIteratorError6) {
                                    throw _iteratorError6;
                                }
                            }
                        }

                        var _iteratorNormalCompletion7 = true;
                        var _didIteratorError7 = false;
                        var _iteratorError7 = undefined;

                        try {
                            for (var _iterator7 = (0, _getIterator3.default)(change.after), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                var featureOrFusion = _step7.value;

                                upsert(addedFusionFeatures, featureOrFusion);
                                remove(removedFusionFeatures, featureOrFusion);
                            }
                        } catch (err) {
                            _didIteratorError7 = true;
                            _iteratorError7 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                    _iterator7.return();
                                }
                            } finally {
                                if (_didIteratorError7) {
                                    throw _iteratorError7;
                                }
                            }
                        }
                    }

                    if (change.before !== null && change.after !== null) {
                        // in a replacement, the removed part MUST be a single feature
                        upsert(sites, change.before.contents[0]);
                    }

                    if (change.marker !== null) {
                        // FIXME markers need to be updated also when regular features are updated.
                        upsert(markers, change.marker, false);
                        //console.log('markerA', change.marker, addedFeatures)
                        upsert(addedFeatures, change.marker, false);
                        //console.log('markerB', change.marker, addedFeatures)
                        remove(removedFeatures, change.marker, false);
                        upsert(addedFusionFeatures, change.marker, false);
                        remove(removedFusionFeatures, change.marker, false);
                    }
                }
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

        console.log('added features:', addedFeatures);
        console.log('removed features:', removedFeatures);

        this.addedPlasmids = (0, _freeze2.default)(addedPlasmids);
        this.removedPlasmids = (0, _freeze2.default)(removedPlasmids);
        this.addedFeatures = (0, _freeze2.default)(addedFeatures);
        this.removedFeatures = (0, _freeze2.default)(removedFeatures);
        this.addedFusionFeatures = (0, _freeze2.default)(addedFusionFeatures);
        this.removedFusionFeatures = (0, _freeze2.default)(removedFusionFeatures);
        this.sites = (0, _freeze2.default)(sites);
        this.markers = (0, _freeze2.default)(markers);
    }

    (0, _createClass3.default)(Genotype, [{
        key: 'iterChanges',
        value: _regenerator2.default.mark(function iterChanges() {
            var fusions = _arguments.length <= 0 || _arguments[0] === undefined ? false : _arguments[0];

            var _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, feature, _iteratorNormalCompletion9, _didIteratorError9, _iteratorError9, _iterator9, _step9, _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, _iteratorNormalCompletion11, _didIteratorError11, _iteratorError11, _iterator11, _step11, _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, plasmid, _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13;

            return _regenerator2.default.wrap(function iterChanges$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            console.log('XX FUSIONS', fusions);

                            if (!fusions) {
                                _context.next = 57;
                                break;
                            }

                            _iteratorNormalCompletion8 = true;
                            _didIteratorError8 = false;
                            _iteratorError8 = undefined;
                            _context.prev = 5;
                            _iterator8 = (0, _getIterator3.default)(this.addedFusionFeatures);

                        case 7:
                            if (_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done) {
                                _context.next = 15;
                                break;
                            }

                            feature = _step8.value;

                            console.log('\nfusions:', feature);
                            _context.next = 12;
                            return _models.Mutation.Ins(feature);

                        case 12:
                            _iteratorNormalCompletion8 = true;
                            _context.next = 7;
                            break;

                        case 15:
                            _context.next = 21;
                            break;

                        case 17:
                            _context.prev = 17;
                            _context.t0 = _context['catch'](5);
                            _didIteratorError8 = true;
                            _iteratorError8 = _context.t0;

                        case 21:
                            _context.prev = 21;
                            _context.prev = 22;

                            if (!_iteratorNormalCompletion8 && _iterator8.return) {
                                _iterator8.return();
                            }

                        case 24:
                            _context.prev = 24;

                            if (!_didIteratorError8) {
                                _context.next = 27;
                                break;
                            }

                            throw _iteratorError8;

                        case 27:
                            return _context.finish(24);

                        case 28:
                            return _context.finish(21);

                        case 29:
                            _iteratorNormalCompletion9 = true;
                            _didIteratorError9 = false;
                            _iteratorError9 = undefined;
                            _context.prev = 32;
                            _iterator9 = (0, _getIterator3.default)(this.removedFusionFeatures);

                        case 34:
                            if (_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done) {
                                _context.next = 41;
                                break;
                            }

                            feature = _step9.value;
                            _context.next = 38;
                            return _models.Mutation.Del(feature);

                        case 38:
                            _iteratorNormalCompletion9 = true;
                            _context.next = 34;
                            break;

                        case 41:
                            _context.next = 47;
                            break;

                        case 43:
                            _context.prev = 43;
                            _context.t1 = _context['catch'](32);
                            _didIteratorError9 = true;
                            _iteratorError9 = _context.t1;

                        case 47:
                            _context.prev = 47;
                            _context.prev = 48;

                            if (!_iteratorNormalCompletion9 && _iterator9.return) {
                                _iterator9.return();
                            }

                        case 50:
                            _context.prev = 50;

                            if (!_didIteratorError9) {
                                _context.next = 53;
                                break;
                            }

                            throw _iteratorError9;

                        case 53:
                            return _context.finish(50);

                        case 54:
                            return _context.finish(47);

                        case 55:
                            _context.next = 110;
                            break;

                        case 57:
                            _iteratorNormalCompletion10 = true;
                            _didIteratorError10 = false;
                            _iteratorError10 = undefined;
                            _context.prev = 60;
                            _iterator10 = (0, _getIterator3.default)(this.addedFeatures);

                        case 62:
                            if (_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done) {
                                _context.next = 70;
                                break;
                            }

                            feature = _step10.value;

                            console.log('\nf:', feature);
                            _context.next = 67;
                            return _models.Mutation.Ins(feature);

                        case 67:
                            _iteratorNormalCompletion10 = true;
                            _context.next = 62;
                            break;

                        case 70:
                            _context.next = 76;
                            break;

                        case 72:
                            _context.prev = 72;
                            _context.t2 = _context['catch'](60);
                            _didIteratorError10 = true;
                            _iteratorError10 = _context.t2;

                        case 76:
                            _context.prev = 76;
                            _context.prev = 77;

                            if (!_iteratorNormalCompletion10 && _iterator10.return) {
                                _iterator10.return();
                            }

                        case 79:
                            _context.prev = 79;

                            if (!_didIteratorError10) {
                                _context.next = 82;
                                break;
                            }

                            throw _iteratorError10;

                        case 82:
                            return _context.finish(79);

                        case 83:
                            return _context.finish(76);

                        case 84:
                            _iteratorNormalCompletion11 = true;
                            _didIteratorError11 = false;
                            _iteratorError11 = undefined;
                            _context.prev = 87;
                            _iterator11 = (0, _getIterator3.default)(this.removedFeatures);

                        case 89:
                            if (_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done) {
                                _context.next = 96;
                                break;
                            }

                            feature = _step11.value;
                            _context.next = 93;
                            return _models.Mutation.Del(feature);

                        case 93:
                            _iteratorNormalCompletion11 = true;
                            _context.next = 89;
                            break;

                        case 96:
                            _context.next = 102;
                            break;

                        case 98:
                            _context.prev = 98;
                            _context.t3 = _context['catch'](87);
                            _didIteratorError11 = true;
                            _iteratorError11 = _context.t3;

                        case 102:
                            _context.prev = 102;
                            _context.prev = 103;

                            if (!_iteratorNormalCompletion11 && _iterator11.return) {
                                _iterator11.return();
                            }

                        case 105:
                            _context.prev = 105;

                            if (!_didIteratorError11) {
                                _context.next = 108;
                                break;
                            }

                            throw _iteratorError11;

                        case 108:
                            return _context.finish(105);

                        case 109:
                            return _context.finish(102);

                        case 110:
                            _iteratorNormalCompletion12 = true;
                            _didIteratorError12 = false;
                            _iteratorError12 = undefined;
                            _context.prev = 113;
                            _iterator12 = (0, _getIterator3.default)(this.addedPlasmids);

                        case 115:
                            if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
                                _context.next = 122;
                                break;
                            }

                            plasmid = _step12.value;
                            _context.next = 119;
                            return plasmid;

                        case 119:
                            _iteratorNormalCompletion12 = true;
                            _context.next = 115;
                            break;

                        case 122:
                            _context.next = 128;
                            break;

                        case 124:
                            _context.prev = 124;
                            _context.t4 = _context['catch'](113);
                            _didIteratorError12 = true;
                            _iteratorError12 = _context.t4;

                        case 128:
                            _context.prev = 128;
                            _context.prev = 129;

                            if (!_iteratorNormalCompletion12 && _iterator12.return) {
                                _iterator12.return();
                            }

                        case 131:
                            _context.prev = 131;

                            if (!_didIteratorError12) {
                                _context.next = 134;
                                break;
                            }

                            throw _iteratorError12;

                        case 134:
                            return _context.finish(131);

                        case 135:
                            return _context.finish(128);

                        case 136:
                            _iteratorNormalCompletion13 = true;
                            _didIteratorError13 = false;
                            _iteratorError13 = undefined;
                            _context.prev = 139;
                            _iterator13 = (0, _getIterator3.default)(this.removedPlasmids);

                        case 141:
                            if (_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done) {
                                _context.next = 148;
                                break;
                            }

                            plasmid = _step13.value;
                            _context.next = 145;
                            return _models.Mutation.Del(plasmid);

                        case 145:
                            _iteratorNormalCompletion13 = true;
                            _context.next = 141;
                            break;

                        case 148:
                            _context.next = 154;
                            break;

                        case 150:
                            _context.prev = 150;
                            _context.t5 = _context['catch'](139);
                            _didIteratorError13 = true;
                            _iteratorError13 = _context.t5;

                        case 154:
                            _context.prev = 154;
                            _context.prev = 155;

                            if (!_iteratorNormalCompletion13 && _iterator13.return) {
                                _iterator13.return();
                            }

                        case 157:
                            _context.prev = 157;

                            if (!_didIteratorError13) {
                                _context.next = 160;
                                break;
                            }

                            throw _iteratorError13;

                        case 160:
                            return _context.finish(157);

                        case 161:
                            return _context.finish(154);

                        case 162:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, iterChanges, this, [[5, 17, 21, 29], [22,, 24, 28], [32, 43, 47, 55], [48,, 50, 54], [60, 72, 76, 84], [77,, 79, 83], [87, 98, 102, 110], [103,, 105, 109], [113, 124, 128, 136], [129,, 131, 135], [139, 150, 154, 162], [155,, 157, 161]]);
        })
    }, {
        key: 'changes',
        value: function changes() {
            var fusions = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            return (0, _from2.default)(this.iterChanges(fusions));
        }
    }], [{
        key: 'parse',
        value: function parse(string) {
            var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var _ref2$parent = _ref2.parent;
            var parent = _ref2$parent === undefined ? null : _ref2$parent;
            var _ref2$fusionStrategy = _ref2.fusionStrategy;
            var fusionStrategy = _ref2$fusionStrategy === undefined ? FUSION_MATCH_WHOLE : _ref2$fusionStrategy;

            return new Genotype((0, _grammar.parse)(string), { parent: parent, fusionStrategy: fusionStrategy });
        }
    }]);
    return Genotype;
}();