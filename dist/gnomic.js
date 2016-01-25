"format global";
(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var getOwnPropertyDescriptor = true;
  try {
    Object.getOwnPropertyDescriptor({ a: 0 }, 'a');
  }
  catch(e) {
    getOwnPropertyDescriptor = false;
  }

  var defineProperty;
  (function () {
    try {
      if (!!Object.defineProperty({}, 'a', {}))
        defineProperty = Object.defineProperty;
    }
    catch (e) {
      defineProperty = function(obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }
  })();

  function register(name, deps, declare) {
    if (arguments.length === 4)
      return registerDynamic.apply(this, arguments);
    doRegister(name, {
      declarative: true,
      deps: deps,
      declare: declare
    });
  }

  function registerDynamic(name, deps, executingRequire, execute) {
    doRegister(name, {
      declarative: false,
      deps: deps,
      executingRequire: executingRequire,
      execute: execute
    });
  }

  function doRegister(name, entry) {
    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry;

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }


  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;
      exports[name] = value;

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          for (var j = 0; j < importerModule.dependencies.length; ++j) {
            if (importerModule.dependencies[j] === module) {
              importerModule.setters[j](exports);
            }
          }
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;
 
    if (exports && exports.__esModule) {
      entry.esModule = exports;
    }
    else {
      entry.esModule = {};
      
      // don't trigger getters/setters in environments that support them
      if (typeof exports == 'object' || typeof exports == 'function') {
        if (getOwnPropertyDescriptor) {
          var d;
          for (var p in exports)
            if (d = Object.getOwnPropertyDescriptor(exports, p))
              defineProperty(entry.esModule, p, d);
        }
        else {
          var hasOwnProperty = exports && exports.hasOwnProperty;
          for (var p in exports) {
            if (!hasOwnProperty || exports.hasOwnProperty(p))
              entry.esModule[p] = exports[p];
          }
         }
       }
      entry.esModule['default'] = exports;
      defineProperty(entry.esModule, '__useDefault', {
        value: true
      });
    }
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    // exported modules get __esModule defined for interop
    if (entry.declarative)
      defineProperty(entry.module.exports, '__esModule', { value: true });

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, depNames, declare) {
    return function(formatDetect) {
      formatDetect(function(deps) {
        var System = {
          _nodeRequire: typeof require != 'undefined' && require.resolve && typeof process != 'undefined' && require,
          register: register,
          registerDynamic: registerDynamic,
          get: load, 
          set: function(name, module) {
            modules[name] = module; 
          },
          newModule: function(module) {
            return module;
          }
        };
        System.set('@empty', {});

        // register external dependencies
        for (var i = 0; i < depNames.length; i++) (function(depName, dep) {
          if (dep && dep.__esModule)
            System.register(depName, [], function(_export) {
              return {
                setters: [],
                execute: function() {
                  for (var p in dep)
                    if (p != '__esModule' && !(typeof p == 'object' && p + '' == 'Module'))
                      _export(p, dep[p]);
                }
              };
            });
          else
            System.registerDynamic(depName, [], false, function() {
              return dep;
            });
        })(depNames[i], arguments[i]);

        // register modules in this bundle
        declare(System);

        // load mains
        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], ['external-dep'], function($__System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(['external-dep'], factory);
  // etc UMD / module pattern
})*/

(['0', '1'], [], function($__System) {

$__System.registerDynamic("0", ["2", "3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {parse: require("2").parse};
  var types = require("3");
  Object.keys(types).forEach(function(name) {
    module.exports[name] = types[name];
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3", ["2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  Object.defineProperty(exports, '__esModule', {value: true});
  var _get = function get(_x15, _x16, _x17) {
    var _again = true;
    _function: while (_again) {
      var object = _x15,
          property = _x16,
          receiver = _x17;
      desc = parent = getter = undefined;
      _again = false;
      if (object === null)
        object = Function.prototype;
      var desc = Object.getOwnPropertyDescriptor(object, property);
      if (desc === undefined) {
        var parent = Object.getPrototypeOf(object);
        if (parent === null) {
          return undefined;
        } else {
          _x15 = parent;
          _x16 = property;
          _x17 = receiver;
          _again = true;
          continue _function;
        }
      } else if ('value' in desc) {
        return desc.value;
      } else {
        var getter = desc.get;
        if (getter === undefined) {
          return undefined;
        }
        return getter.call(receiver);
      }
    }
  };
  var _createClass = (function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ('value' in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps)
        defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();
  function _inherits(subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
      throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }});
    if (superClass)
      Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
    }
  }
  var _genotypeJs = require("2");
  var Genotype = (function() {
    function Genotype(ancestor, changes) {
      if (ancestor === undefined)
        ancestor = null;
      _classCallCheck(this, Genotype);
      this.ancestor = ancestor;
      this.changes = changes;
      var sites = this.ancestor ? Array.from(this.ancestor.sites) : [];
      var markers = this.ancestor ? Array.from(this.ancestor.markers) : [];
      var features = {
        added: [],
        removed: []
      };
      var episomes = {
        added: [],
        removed: []
      };
      function remove(array, value) {
        return array.filter(function(element) {
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
        for (var _iterator = changes[Symbol.iterator](),
            _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
              for (var _iterator2 = change.contents.features()[Symbol.iterator](),
                  _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
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
            sites = upsert(sites, change.site);
            markers = remove(markers, change.site);
            features.added = remove(features.added, change.site);
            features.removed = upsert(features.removed, change.site);
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;
            try {
              for (var _iterator3 = change.contents.features()[Symbol.iterator](),
                  _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
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
            if (change.contents instanceof Plasmid) {
              var plasmid = change;
              episomes.added = remove(episomes.added, plasmid);
              episomes.removed = upsert(episomes.removed, plasmid);
            } else {
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;
              try {
                for (var _iterator4 = change.contents.features()[Symbol.iterator](),
                    _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
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
          if (change.marker) {
            markers = upsert(markers, change.marker);
            features.removed = remove(features.removed, change.marker);
            features.added = upsert(features.added, change.marker);
          }
        }
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
      value: function episomes() {
        var _this = this;
        var inclusive = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
        if (inclusive || !this.ancestor) {
          return this.addedEpisomes;
        } else {
          return this.addedEpisomes.filter(function(episome) {
            return !_this.ancestor.addedEpisomes.some(function(e) {
              return episome.equals(e);
            });
          });
        }
      }
    }, {
      key: 'features',
      value: regeneratorRuntime.mark(function features() {
        var inclusive = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
        var _iteratorNormalCompletion5,
            _didIteratorError5,
            _iteratorError5,
            _loop,
            _iterator5,
            _step5;
        return regeneratorRuntime.wrap(function features$(context$2$0) {
          var _this2 = this;
          while (1)
            switch (context$2$0.prev = context$2$0.next) {
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
                    while (1)
                      switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                          feature = _step5.value;
                          if (!this.removedFeatures.some(function(f) {
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
        }, features, this, [[5, 15, 19, 27], [20, , 22, 26]]);
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
  var Deletion = function Deletion(deletion) {
    var marker = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    _classCallCheck(this, Deletion);
    if (deletion instanceof Feature) {
      deletion = new FeatureTree(deletion);
    }
    this.contents = deletion;
    this.marker = marker;
  };
  exports.Deletion = Deletion;
  var Insertion = function Insertion(insertion) {
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
  var Replacement = function Replacement(site, insertion) {
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
  var FeatureTree = (function() {
    function FeatureTree() {
      _classCallCheck(this, FeatureTree);
      for (var _len = arguments.length,
          contents = Array(_len),
          _key = 0; _key < _len; _key++) {
        contents[_key] = arguments[_key];
      }
      this.contents = contents;
    }
    _createClass(FeatureTree, [{
      key: 'features',
      value: regeneratorRuntime.mark(function features() {
        var _iteratorNormalCompletion6,
            _didIteratorError6,
            _iteratorError6,
            _iterator6,
            _step6,
            item;
        return regeneratorRuntime.wrap(function features$(context$2$0) {
          while (1)
            switch (context$2$0.prev = context$2$0.next) {
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
        }, features, this, [[3, 18, 22, 30], [23, , 25, 29]]);
      })
    }]);
    return FeatureTree;
  })();
  exports.FeatureTree = FeatureTree;
  var Group = (function(_FeatureTree) {
    _inherits(Group, _FeatureTree);
    function Group() {
      _classCallCheck(this, Group);
      for (var _len2 = arguments.length,
          contents = Array(_len2),
          _key2 = 0; _key2 < _len2; _key2++) {
        contents[_key2] = arguments[_key2];
      }
      _get(Object.getPrototypeOf(Group.prototype), 'constructor', this).apply(this, contents);
    }
    _createClass(Group, [{
      key: 'equals',
      value: function equals() {
        return false;
      }
    }]);
    return Group;
  })(FeatureTree);
  exports.Group = Group;
  var Plasmid = (function(_FeatureTree2) {
    _inherits(Plasmid, _FeatureTree2);
    function Plasmid(name) {
      var site = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var marker = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
      _classCallCheck(this, Plasmid);
      for (var _len3 = arguments.length,
          contents = Array(_len3 > 3 ? _len3 - 3 : 0),
          _key3 = 3; _key3 < _len3; _key3++) {
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
    }, {
      key: 'equals',
      value: function equals(other) {
        if (this.name) {
          return this.name == other.name;
        } else if (other.name) {
          return false;
        } else {
          return this.contents.equals(other);
        }
      }
    }]);
    return Plasmid;
  })(FeatureTree);
  exports.Plasmid = Plasmid;
  var Fusion = (function(_FeatureTree3) {
    _inherits(Fusion, _FeatureTree3);
    function Fusion() {
      _classCallCheck(this, Fusion);
      for (var _len4 = arguments.length,
          features = Array(_len4),
          _key4 = 0; _key4 < _len4; _key4++) {
        features[_key4] = arguments[_key4];
      }
      _get(Object.getPrototypeOf(Fusion.prototype), 'constructor', this).apply(this, features);
    }
    return Fusion;
  })(FeatureTree);
  exports.Fusion = Fusion;
  var Feature = (function() {
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
    }, {
      key: 'equals',
      value: function equals(other) {
        if (this.accession && other.accession) {
          return this.accession.equals(other.accession);
        } else if (this.name) {
          return this.name == other.name;
        } else {
          return false;
        }
      }
    }]);
    return Feature;
  })();
  exports.Feature = Feature;
  var Phene = (function(_Feature) {
    _inherits(Phene, _Feature);
    function Phene(name) {
      var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var _ref2$organism = _ref2.organism;
      var organism = _ref2$organism === undefined ? null : _ref2$organism;
      var _ref2$variant = _ref2.variant;
      var variant = _ref2$variant === undefined ? 'wild-type' : _ref2$variant;
      _classCallCheck(this, Phene);
      _get(Object.getPrototypeOf(Phene.prototype), 'constructor', this).call(this, name, {
        type: 'phene',
        organism: organism,
        variant: variant
      });
    }
    _createClass(Phene, [{
      key: 'toInsertion',
      value: function toInsertion() {
        return new Insertion(this);
      }
    }]);
    return Phene;
  })(Feature);
  exports.Phene = Phene;
  var Range = (function() {
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
  var Accession = (function() {
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
  var Organism = (function() {
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2", ["3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "use strict";
  Object.defineProperty(exports, "__esModule", {value: true});
  var _bind = Function.prototype.bind;
  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};
      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key))
            newObj[key] = obj[key];
        }
      }
      newObj["default"] = obj;
      return newObj;
    }
  }
  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0,
          arr2 = Array(arr.length); i < arr.length; i++)
        arr2[i] = arr[i];
      return arr2;
    } else {
      return Array.from(arr);
    }
  }
  var _types = require("3");
  var types = _interopRequireWildcard(_types);
  var _ref = (function() {
    function peg$subclass(child, parent) {
      function ctor() {
        this.constructor = child;
      }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }
    function SyntaxError(message, expected, found, offset, line, column) {
      this.message = message;
      this.expected = expected;
      this.found = found;
      this.offset = offset;
      this.line = line;
      this.column = column;
      this.name = "SyntaxError";
    }
    peg$subclass(SyntaxError, Error);
    function parse(input) {
      var options = arguments.length > 1 ? arguments[1] : {},
          peg$FAILED = {},
          peg$startRuleFunctions = {start: peg$parsestart},
          peg$startRuleFunction = peg$parsestart,
          peg$c0 = peg$FAILED,
          peg$c1 = [],
          peg$c2 = function peg$c2(changes) {
            return changes;
          },
          peg$c3 = function peg$c3(c) {
            return c;
          },
          peg$c4 = function peg$c4(start, last) {
            return start.concat(last);
          },
          peg$c5 = function peg$c5(c) {
            return [c];
          },
          peg$c6 = "+",
          peg$c7 = {
            type: "literal",
            value: "+",
            description: "\"+\""
          },
          peg$c8 = null,
          peg$c9 = function peg$c9(i, m) {
            return new types.Insertion(i, m);
          },
          peg$c10 = ">",
          peg$c11 = {
            type: "literal",
            value: ">",
            description: "\">\""
          },
          peg$c12 = function peg$c12(s, i, m) {
            return new types.Replacement(s, i, m);
          },
          peg$c13 = ">>",
          peg$c14 = {
            type: "literal",
            value: ">>",
            description: "\">>\""
          },
          peg$c15 = function peg$c15(s, i, m) {
            return new types.Replacement(s, i, m, true);
          },
          peg$c16 = "-",
          peg$c17 = {
            type: "literal",
            value: "-",
            description: "\"-\""
          },
          peg$c18 = function peg$c18(d, m) {
            return new types.Deletion(d, m);
          },
          peg$c19 = function peg$c19(fs) {
            return new (_bind.apply(types.Group, [null].concat(_toConsumableArray(fs))))();
          },
          peg$c20 = function peg$c20(p, m) {
            p.marker = m;
            return p;
          },
          peg$c21 = function peg$c21(name, fs) {
            return new (_bind.apply(types.Plasmid, [null].concat([name, null, null], _toConsumableArray(fs))))();
          },
          peg$c22 = "{}",
          peg$c23 = {
            type: "literal",
            value: "{}",
            description: "\"{}\""
          },
          peg$c24 = function peg$c24(name) {
            return new types.Plasmid(name);
          },
          peg$c25 = "::",
          peg$c26 = {
            type: "literal",
            value: "::",
            description: "\"::\""
          },
          peg$c27 = function peg$c27(m) {
            return m;
          },
          peg$c28 = function peg$c28(o, name, a, v) {
            return new types.Phene(name, {
              accession: a,
              variant: v,
              organism: o
            });
          },
          peg$c29 = function peg$c29(a, v) {
            return new types.Phene(null, {
              accession: a,
              variant: v
            });
          },
          peg$c30 = function peg$c30(o, name, v) {
            return new types.Phene(name, {
              variant: v,
              organism: o
            });
          },
          peg$c31 = function peg$c31(o, name, v, a, r) {
            return new types.Feature(name, {
              organism: o,
              accession: a,
              variant: v,
              range: r
            });
          },
          peg$c32 = function peg$c32(a, r) {
            return new types.Feature(null, {
              accession: a,
              range: r
            });
          },
          peg$c33 = "/",
          peg$c34 = {
            type: "literal",
            value: "/",
            description: "\"/\""
          },
          peg$c35 = function peg$c35(o) {
            return new types.Organism(o);
          },
          peg$c36 = "{",
          peg$c37 = {
            type: "literal",
            value: "{",
            description: "\"{\""
          },
          peg$c38 = function peg$c38(f) {
            return f;
          },
          peg$c39 = "}",
          peg$c40 = {
            type: "literal",
            value: "}",
            description: "\"}\""
          },
          peg$c41 = function peg$c41(f) {
            return [f];
          },
          peg$c42 = ":",
          peg$c43 = {
            type: "literal",
            value: ":",
            description: "\":\""
          },
          peg$c44 = function peg$c44(start, rest) {
            return new (_bind.apply(types.Fusion, [null].concat(_toConsumableArray([start].concat(rest)))))();
          },
          peg$c45 = "(",
          peg$c46 = {
            type: "literal",
            value: "(",
            description: "\"(\""
          },
          peg$c47 = ")",
          peg$c48 = {
            type: "literal",
            value: ")",
            description: "\")\""
          },
          peg$c49 = function peg$c49(v) {
            return v;
          },
          peg$c50 = function peg$c50() {
            return 'wild-type';
          },
          peg$c51 = function peg$c51() {
            return 'mutant';
          },
          peg$c52 = "[",
          peg$c53 = {
            type: "literal",
            value: "[",
            description: "\"[\""
          },
          peg$c54 = "_",
          peg$c55 = {
            type: "literal",
            value: "_",
            description: "\"_\""
          },
          peg$c56 = "]",
          peg$c57 = {
            type: "literal",
            value: "]",
            description: "\"]\""
          },
          peg$c58 = function peg$c58(type, start, end) {
            return {
              type: type || 'coding',
              start: start,
              end: end
            };
          },
          peg$c59 = function peg$c59(type, pos) {
            return {
              type: type || 'coding',
              start: pos,
              end: pos
            };
          },
          peg$c60 = /^[cp]/,
          peg$c61 = {
            type: "class",
            value: "[cp]",
            description: "[cp]"
          },
          peg$c62 = ".",
          peg$c63 = {
            type: "literal",
            value: ".",
            description: "\".\""
          },
          peg$c64 = function peg$c64(type) {
            return ({
              c: 'coding',
              p: 'protein'
            })[type];
          },
          peg$c65 = "#",
          peg$c66 = {
            type: "literal",
            value: "#",
            description: "\"#\""
          },
          peg$c67 = function peg$c67(db, id) {
            return new types.Accession(id, db);
          },
          peg$c68 = function peg$c68(id) {
            return new types.Accession(id);
          },
          peg$c69 = /^[A-Za-z0-9\-]/,
          peg$c70 = {
            type: "class",
            value: "[A-Za-z0-9\\-]",
            description: "[A-Za-z0-9\\-]"
          },
          peg$c71 = /^[A-Za-z0-9]/,
          peg$c72 = {
            type: "class",
            value: "[A-Za-z0-9]",
            description: "[A-Za-z0-9]"
          },
          peg$c73 = {
            type: "other",
            description: "integer"
          },
          peg$c74 = /^[0-9]/,
          peg$c75 = {
            type: "class",
            value: "[0-9]",
            description: "[0-9]"
          },
          peg$c76 = function peg$c76(digits) {
            return parseInt(digits.join(""), 10);
          },
          peg$c77 = /^[A-Za-z0-9_\-]/,
          peg$c78 = {
            type: "class",
            value: "[A-Za-z0-9_\\-]",
            description: "[A-Za-z0-9_\\-]"
          },
          peg$c79 = /^[a-zA-Z0-9]/,
          peg$c80 = {
            type: "class",
            value: "[a-zA-Z0-9]",
            description: "[a-zA-Z0-9]"
          },
          peg$c81 = ",",
          peg$c82 = {
            type: "literal",
            value: ",",
            description: "\",\""
          },
          peg$c83 = /^[ \t\r\n]/,
          peg$c84 = {
            type: "class",
            value: "[ \\t\\r\\n]",
            description: "[ \\t\\r\\n]"
          },
          peg$currPos = 0,
          peg$reportedPos = 0,
          peg$cachedPos = 0,
          peg$cachedPosDetails = {
            line: 1,
            column: 1,
            seenCR: false
          },
          peg$maxFailPos = 0,
          peg$maxFailExpected = [],
          peg$silentFails = 0,
          peg$result;
      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }
      function text() {
        return input.substring(peg$reportedPos, peg$currPos);
      }
      function offset() {
        return peg$reportedPos;
      }
      function line() {
        return peg$computePosDetails(peg$reportedPos).line;
      }
      function column() {
        return peg$computePosDetails(peg$reportedPos).column;
      }
      function expected(description) {
        throw peg$buildException(null, [{
          type: "other",
          description: description
        }], peg$reportedPos);
      }
      function error(message) {
        throw peg$buildException(message, null, peg$reportedPos);
      }
      function peg$computePosDetails(pos) {
        function advance(details, startPos, endPos) {
          var p,
              ch;
          for (p = startPos; p < endPos; p++) {
            ch = input.charAt(p);
            if (ch === "\n") {
              if (!details.seenCR) {
                details.line++;
              }
              details.column = 1;
              details.seenCR = false;
            } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
              details.line++;
              details.column = 1;
              details.seenCR = true;
            } else {
              details.column++;
              details.seenCR = false;
            }
          }
        }
        if (peg$cachedPos !== pos) {
          if (peg$cachedPos > pos) {
            peg$cachedPos = 0;
            peg$cachedPosDetails = {
              line: 1,
              column: 1,
              seenCR: false
            };
          }
          advance(peg$cachedPosDetails, peg$cachedPos, pos);
          peg$cachedPos = pos;
        }
        return peg$cachedPosDetails;
      }
      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) {
          return;
        }
        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected);
      }
      function peg$buildException(message, expected, pos) {
        function cleanupExpected(expected) {
          var i = 1;
          expected.sort(function(a, b) {
            if (a.description < b.description) {
              return -1;
            } else if (a.description > b.description) {
              return 1;
            } else {
              return 0;
            }
          });
          while (i < expected.length) {
            if (expected[i - 1] === expected[i]) {
              expected.splice(i, 1);
            } else {
              i++;
            }
          }
        }
        function buildMessage(expected, found) {
          function stringEscape(s) {
            function hex(ch) {
              return ch.charCodeAt(0).toString(16).toUpperCase();
            }
            return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\x08/g, '\\b').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\f/g, '\\f').replace(/\r/g, '\\r').replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) {
              return '\\x0' + hex(ch);
            }).replace(/[\x10-\x1F\x80-\xFF]/g, function(ch) {
              return '\\x' + hex(ch);
            }).replace(/[\u0180-\u0FFF]/g, function(ch) {
              return "\\u0" + hex(ch);
            }).replace(/[\u1080-\uFFFF]/g, function(ch) {
              return "\\u" + hex(ch);
            });
          }
          var expectedDescs = new Array(expected.length),
              expectedDesc,
              foundDesc,
              i;
          for (i = 0; i < expected.length; i++) {
            expectedDescs[i] = expected[i].description;
          }
          expectedDesc = expected.length > 1 ? expectedDescs.slice(0, -1).join(", ") + " or " + expectedDescs[expected.length - 1] : expectedDescs[0];
          foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";
          return "Expected " + expectedDesc + " but " + foundDesc + " found.";
        }
        var posDetails = peg$computePosDetails(pos),
            found = pos < input.length ? input.charAt(pos) : null;
        if (expected !== null) {
          cleanupExpected(expected);
        }
        return new SyntaxError(message !== null ? message : buildMessage(expected, found), expected, found, pos, posDetails.line, posDetails.column);
      }
      function peg$parsestart() {
        var s0,
            s1,
            s2,
            s3,
            s4;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsesep();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsesep();
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsechange_list();
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsesep();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsesep();
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c2(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        return s0;
      }
      function peg$parsechange_list() {
        var s0,
            s1,
            s2,
            s3,
            s4;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$currPos;
        s3 = peg$parsechange();
        if (s3 !== peg$FAILED) {
          s4 = peg$parselist_separator();
          if (s4 !== peg$FAILED) {
            peg$reportedPos = s2;
            s3 = peg$c3(s3);
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$c0;
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$parsechange();
          if (s3 !== peg$FAILED) {
            s4 = peg$parselist_separator();
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s2;
              s3 = peg$c3(s3);
              s2 = s3;
            } else {
              peg$currPos = s2;
              s2 = peg$c0;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$c0;
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsechange();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c4(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsechange();
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c5(s1);
          }
          s0 = s1;
        }
        return s0;
      }
      function peg$parsechange() {
        var s0;
        s0 = peg$parseinsertion();
        if (s0 === peg$FAILED) {
          s0 = peg$parsereplacement();
          if (s0 === peg$FAILED) {
            s0 = peg$parsedeletion();
            if (s0 === peg$FAILED) {
              s0 = peg$parseepisome();
              if (s0 === peg$FAILED) {
                s0 = peg$parsephene();
              }
            }
          }
        }
        return s0;
      }
      function peg$parseinsertion() {
        var s0,
            s1,
            s2,
            s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 43) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c7);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseinsertable();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsemarker();
            if (s3 === peg$FAILED) {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c9(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        return s0;
      }
      function peg$parsereplacement() {
        var s0,
            s1,
            s2,
            s3,
            s4;
        s0 = peg$currPos;
        s1 = peg$parsefeature();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 62) {
            s2 = peg$c10;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c11);
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseinsertable();
            if (s3 !== peg$FAILED) {
              s4 = peg$parsemarker();
              if (s4 === peg$FAILED) {
                s4 = peg$c8;
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c12(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsefeature();
          if (s1 !== peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c13) {
              s2 = peg$c13;
              peg$currPos += 2;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c14);
              }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseinsertable();
              if (s3 !== peg$FAILED) {
                s4 = peg$parsemarker();
                if (s4 === peg$FAILED) {
                  s4 = peg$c8;
                }
                if (s4 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c15(s1, s3, s4);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
        return s0;
      }
      function peg$parsedeletion() {
        var s0,
            s1,
            s2,
            s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 45) {
          s1 = peg$c16;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c17);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseinsertable();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsemarker();
            if (s3 === peg$FAILED) {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c18(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        return s0;
      }
      function peg$parseinsertable() {
        var s0,
            s1;
        s0 = peg$parseplasmid();
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsefeature_set();
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c19(s1);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$parsefusion();
            if (s0 === peg$FAILED) {
              s0 = peg$parsefeature();
            }
          }
        }
        return s0;
      }
      function peg$parseepisome() {
        var s0,
            s1,
            s2;
        s0 = peg$currPos;
        s1 = peg$parseplasmid();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsemarker();
          if (s2 === peg$FAILED) {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c20(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        return s0;
      }
      function peg$parseplasmid() {
        var s0,
            s1,
            s2;
        s0 = peg$currPos;
        s1 = peg$parseidentifier();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsefeature_set();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c21(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseidentifier();
          if (s1 !== peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c22) {
              s2 = peg$c22;
              peg$currPos += 2;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c23);
              }
            }
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c24(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
        return s0;
      }
      function peg$parsemarker() {
        var s0,
            s1,
            s2;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c25) {
          s1 = peg$c25;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c26);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsephene();
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c27(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        return s0;
      }
      function peg$parsephene() {
        var s0,
            s1,
            s2,
            s3,
            s4;
        s0 = peg$currPos;
        s1 = peg$parsefeature_organism();
        if (s1 === peg$FAILED) {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseidentifier();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseaccession();
            if (s3 !== peg$FAILED) {
              s4 = peg$parsebinary_variant();
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c28(s1, s2, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseaccession();
          if (s1 !== peg$FAILED) {
            s2 = peg$parsebinary_variant();
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c29(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsefeature_organism();
            if (s1 === peg$FAILED) {
              s1 = peg$c8;
            }
            if (s1 !== peg$FAILED) {
              s2 = peg$parseidentifier();
              if (s2 !== peg$FAILED) {
                s3 = peg$parsevariant();
                if (s3 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c30(s1, s2, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          }
        }
        return s0;
      }
      function peg$parsefeature() {
        var s0,
            s1,
            s2,
            s3,
            s4,
            s5;
        s0 = peg$currPos;
        s1 = peg$parsefeature_organism();
        if (s1 === peg$FAILED) {
          s1 = peg$c8;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseidentifier();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsevariant();
            if (s3 === peg$FAILED) {
              s3 = peg$c8;
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parseaccession();
              if (s4 === peg$FAILED) {
                s4 = peg$c8;
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parserange();
                if (s5 === peg$FAILED) {
                  s5 = peg$c8;
                }
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c31(s1, s2, s3, s4, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseaccession();
          if (s1 !== peg$FAILED) {
            s2 = peg$parserange();
            if (s2 === peg$FAILED) {
              s2 = peg$c8;
            }
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c32(s1, s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
        return s0;
      }
      function peg$parsefeature_organism() {
        var s0,
            s1,
            s2;
        s0 = peg$currPos;
        s1 = peg$parseorganism();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 47) {
            s2 = peg$c33;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c34);
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c35(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        return s0;
      }
      function peg$parsefeature_set() {
        var s0,
            s1,
            s2,
            s3,
            s4,
            s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
          s1 = peg$c36;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c37);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          s4 = peg$parsefusion();
          if (s4 === peg$FAILED) {
            s4 = peg$parsefeature();
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parselist_separator();
            if (s5 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c38(s4);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parsefusion();
            if (s4 === peg$FAILED) {
              s4 = peg$parsefeature();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parselist_separator();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c38(s4);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsefusion();
            if (s3 === peg$FAILED) {
              s3 = peg$parsefeature();
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 125) {
                s4 = peg$c39;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c40);
                }
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c4(s2, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c36;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c37);
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parsefusion();
            if (s2 === peg$FAILED) {
              s2 = peg$parsefeature();
            }
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 125) {
                s3 = peg$c39;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c40);
                }
              }
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c41(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
        return s0;
      }
      function peg$parsefusion() {
        var s0,
            s1,
            s2,
            s3,
            s4,
            s5;
        s0 = peg$currPos;
        s1 = peg$parsefeature();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 58) {
            s4 = peg$c42;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c43);
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsefeature();
            if (s5 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c38(s5);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 58) {
                s4 = peg$c42;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c43);
                }
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parsefeature();
                if (s5 !== peg$FAILED) {
                  peg$reportedPos = s3;
                  s4 = peg$c38(s5);
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            }
          } else {
            s2 = peg$c0;
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c44(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        return s0;
      }
      function peg$parsevariant() {
        var s0,
            s1,
            s2,
            s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s1 = peg$c45;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c46);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseidentifier();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s3 = peg$c47;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c48);
              }
            }
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c49(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsebinary_variant();
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c49(s1);
          }
          s0 = s1;
        }
        return s0;
      }
      function peg$parsebinary_variant() {
        var s0,
            s1;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 43) {
          s1 = peg$c6;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c7);
          }
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c50();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 45) {
            s1 = peg$c16;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c17);
            }
          }
          if (s1 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c51();
          }
          s0 = s1;
        }
        return s0;
      }
      function peg$parserange() {
        var s0,
            s1,
            s2,
            s3,
            s4,
            s5,
            s6;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
          s1 = peg$c52;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c53);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parserange_sequence_type();
          if (s2 === peg$FAILED) {
            s2 = peg$c8;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseinteger();
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 95) {
                s4 = peg$c54;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c55);
                }
              }
              if (s4 !== peg$FAILED) {
                s5 = peg$parseinteger();
                if (s5 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 93) {
                    s6 = peg$c56;
                    peg$currPos++;
                  } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c57);
                    }
                  }
                  if (s6 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c58(s2, s3, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 91) {
            s1 = peg$c52;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c53);
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parserange_sequence_type();
            if (s2 === peg$FAILED) {
              s2 = peg$c8;
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseinteger();
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 93) {
                  s4 = peg$c56;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c57);
                  }
                }
                if (s4 !== peg$FAILED) {
                  peg$reportedPos = s0;
                  s1 = peg$c59(s2, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
        return s0;
      }
      function peg$parserange_sequence_type() {
        var s0,
            s1,
            s2;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (peg$c60.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c61);
          }
        }
        if (s2 !== peg$FAILED) {
          s2 = input.substring(s1, peg$currPos);
        }
        s1 = s2;
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 46) {
            s2 = peg$c62;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c63);
            }
          }
          if (s2 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c64(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        return s0;
      }
      function peg$parseaccession() {
        var s0,
            s1,
            s2,
            s3,
            s4;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 35) {
          s1 = peg$c65;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c66);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsedatabase();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s3 = peg$c42;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c43);
              }
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parseinteger();
              if (s4 === peg$FAILED) {
                s4 = peg$parseidentifier();
              }
              if (s4 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c67(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 35) {
            s1 = peg$c65;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c66);
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parseinteger();
            if (s2 === peg$FAILED) {
              s2 = peg$parseidentifier();
            }
            if (s2 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c68(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
        return s0;
      }
      function peg$parsedatabase() {
        var s0,
            s1,
            s2,
            s3,
            s4;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (peg$c69.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c70);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          if (peg$c71.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c72);
            }
          }
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              if (peg$c71.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c72);
                }
              }
            }
          } else {
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        return s0;
      }
      function peg$parseinteger() {
        var s0,
            s1,
            s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        if (peg$c74.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c75);
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c74.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c75);
              }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c76(s1);
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c73);
          }
        }
        return s0;
      }
      function peg$parseidentifier() {
        var s0,
            s1,
            s2,
            s3,
            s4,
            s5;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$c71.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c72);
          }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c71.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c72);
              }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = [];
          if (peg$c77.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c78);
            }
          }
          if (s5 !== peg$FAILED) {
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              if (peg$c77.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c78);
                }
              }
            }
          } else {
            s4 = peg$c0;
          }
          if (s4 !== peg$FAILED) {
            if (peg$c71.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c72);
              }
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          if (s3 === peg$FAILED) {
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        return s0;
      }
      function peg$parseorganism() {
        var s0,
            s1,
            s2,
            s3,
            s4,
            s5,
            s6;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$c79.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c80);
          }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c79.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c80);
              }
            }
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 46) {
            s4 = peg$c62;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c63);
            }
          }
          if (s4 !== peg$FAILED) {
            s5 = [];
            if (peg$c79.test(input.charAt(peg$currPos))) {
              s6 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c80);
              }
            }
            if (s6 !== peg$FAILED) {
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                if (peg$c79.test(input.charAt(peg$currPos))) {
                  s6 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c80);
                  }
                }
              }
            } else {
              s5 = peg$c0;
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
          if (s3 === peg$FAILED) {
            s3 = peg$c8;
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$c0;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          s1 = input.substring(s0, peg$currPos);
        }
        s0 = s1;
        return s0;
      }
      function peg$parselist_separator() {
        var s0,
            s1,
            s2,
            s3,
            s4;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsesep();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsesep();
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s2 = peg$c81;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c82);
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsesep();
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsesep();
            }
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
        if (s0 === peg$FAILED) {
          s0 = [];
          s1 = peg$parsesep();
          if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
              s0.push(s1);
              s1 = peg$parsesep();
            }
          } else {
            s0 = peg$c0;
          }
        }
        return s0;
      }
      function peg$parsesep() {
        var s0;
        if (peg$c83.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c84);
          }
        }
        return s0;
      }
      peg$result = peg$startRuleFunction();
      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail({
            type: "end",
            description: "end of input"
          });
        }
        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
      }
    }
    return {
      SyntaxError: SyntaxError,
      parse: parse
    };
  })();
  var SyntaxError = _ref.SyntaxError;
  var parse = _ref.parse;
  exports.SyntaxError = SyntaxError;
  exports.parse = parse;
  global.define = __define;
  return module.exports;
});

})
(function(factory) {
  factory();
});
//# sourceMappingURL=gnomic.js.map