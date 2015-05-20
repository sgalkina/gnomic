/**
 * Created by lyschoening on 5/19/15.
 */


// TODO ranges are not currently supported because they make the logic of computing a genotype radically more difficult
class Genotype {
    /**
     *
     * Only one variant of a gene is considered realistic, so an insertion of a gene with a variant replaces the
     * gene without the variant. This may need to change to allow multiple non-wildtype variants.
     *
     *
     * @param ancestor
     * @param {...(Insertion|Replacement|Deletion|Plasmid)} changes
     */
    constructor(ancestor=null, ...changes) {
        this.ancestor = ancestor;
        this.changes = changes;

        // TODO currently the code must assume that naming is consistent. i.e. if a feature
        // has only a name, it always has a name, if it has only an accession, it always has an accession.

        // TODO support ranges
        // NOTE ranges are currently ignored; proper handling of ranges would require splitting/merging etc. of
        // features based on the range or describing the mutation in the variant string.

        // TODO enumerate all features from the changes.
        var sites = this.ancestor ? this.ancestor.sites : []; // any features used like sites
        var markers = this.ancestor ? this.ancestor.markers :  []; // any features/phenes used like markers


        // TODO also remove markers from features
        // TODO combine features and phenes somehow

        var features = {
            added: this.ancestor ? this.ancestor.addedFeatures : [],
            removed: this.ancestor ? this.ancestor.removedFeatures : []
        };

        var episomes = {
            added: this.ancestor ? this.ancestor.addedEpisomes : [],
            removed: this.ancestor ? this.ancestor.removedEpisomes : []
        };

        function remove(array, value) {
            return array.filter((element) => !value.equals(element));
        }

        function upsert(array, value) {
            return remove(array, value).concat([value]);
        }

        for(let change of changes) {
            if(change instanceof Plasmid) {
                let plasmid = change;
                if(plasmid.isEpisome()) {
                    episomes.removed = remove(episomes.removed, plasmid);
                    episomes.added = upsert(episomes.added, plasmid);
                } else {
                    change = plasmid.toInsertion();
                }
            }

            if(change instanceof Insertion) {
                if(change.marker) {
                    markers = upsert(markers, change.marker);
                }

                for(let feature of change.contents.features()) {
                    features.removed = remove(features.removed, feature);
                    features.added = upsert(features.added, feature);
                }
            } else if(change instanceof Replacement) {
                // NOTE if an insertion site is within a fusion, the fusion needs to be replaced.
                //      Likewise, if a deleted feature is within a fusion, that fusion, too, needs to be replaced.
                sites = upsert(sites, change.site);
                markers = remove(markers, change.site);

                features.added = remove(features.added, change.site);
                features.removed = upsert(features.removed, change.site);

                if(change.marker) {
                    markers = upsert(markers, change.marker);
                }

                for(let feature of change.contents.features()) {
                    features.removed = remove(features.removed, feature);
                    features.added = upsert(features.added, feature);
                }
            } else { // change instanceof Deletion

                // TODO FIXME handle deletion of Plasmids!

                for(let feature of change.contents.features()) {
                    features.added = remove(features.added, feature);
                    features.removed = upsert(features.removed, feature);
                }

                if(change.marker) {
                    markers = upsert(markers, change.marker);
                }

                // FIXME the language currently makes it difficult to do a deletion with a marker
                // e.g.  -abc::Marker(R) is fine enough because abc is seen as a site,
                //       But what if instead we use #X:123?
                //       -#X:123 still works, but -#X:123::Marker(R) does not -- only -#X:123::Marker+ does
                //        -- because now the marker is considered plain text
                // The language should be changed so that sites are features and markers are phenes
                // A replacement with two components should always be before>after
                // e.g. #abc:123>Marker(R)
                // Now, before>after::Marker is possible, but then both after and Marker are inserted
                // -before::after is equivalent to before>after, which also means that
                // -before::Marker+ is equivalent to -before>Marker+
                // There is a difficulty here in determining if after is a marker or a gene.
                // 1. it is always a gene if no variant indicator is present (and it cannot be '-')
                // 2. it is either a gene or a phene if a variant indicator is present.
                // 2.1. If the first character is uppercase, that suggests phene, but it is not a strong suggestion.
                // 3. Ultimately it shouldn't matter much. The search should maybe start in phenes and then continue to features.
            }

            // TODO freeze with Object.freeze()
            this._features = features;
            this._episomes = episomes;
            this._sites = sites;
            this._markers = markers;
        }
    }

    //toString() {
    //
    //}

    get sites() {
        return this._sites;
    }

    get markers() {
        return this._markers;
    }

    /**
     * A list of all episomes in the genotype
     */
    episomes(inclusive=true) {
        if(inclusive || !this.ancestor) {
            return this.addedEpisomes;
        } else {
            return this.addedEpisomes
                .filter((episome) => !this.ancestor.addedEpisomes.some((e) => episome.equals(e)));
        }
    }

    /**
     * A list of insertions and deletions on a gene level. On
     * @param inclusive
     */
    features(inclusive=true) {
        if(inclusive || !this.ancestor) {
            return this.addedFeatures;
        } else {
            return this.addedFeatures
                .filter((feature) => !this.ancestor.addedFeatures.some((f) => feature.equals(f)));
        }
    }

    get addedFeatures() {
        return this._features.added;
    }

    get removedFeatures() {
        return this._features.removed;
    }

    get addedEpisomes() {
        return this._episomes.added;
    }

    get removedEpisomes() {
        return this._episomes.removed;
    }
}

class Deletion {

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
    constructor(deletion, marker=null) {
        if(deletion instanceof Feature) {
            deletion = new FeatureTree(deletion);
        }
        this.contents = deletion;
        this.marker = marker;
    }
}

class Insertion {
    // TODO change site from a string to a feature, allow ranges.
    /**
     *
     * @param {(Feature|FeatureTree)} insertable
     * @param {(string|null)} marker selection marker
     */
    constructor(insertion, marker = null) {
        if(insertion instanceof Feature) {
            insertion = new FeatureTree(insertion);
        }
        this.contents = insertion;
        this.marker = marker;
    }
}


class Replacement {
    /**
     * @param {(Feature|Phene)} site integration site
     * @param {(Feature|FeatureTree)} insertion
     * @param {(Feature|Phene)} marker
     */
    constructor(site, insertion, marker = null) {
        if(insertion instanceof Feature) {
            insertion = new FeatureTree(insertion);
        }
        this.contents = insertion;
        this.site = site;
        this.marker = marker;
    }
}


class FeatureTree {
    /**
     *
     * @param {...(Phene|Feature|FeatureTree)} contents
     */
    constructor(...contents) {
        this.contents = contents;
    }

    /**
     * Enumerates all features of the feature tree.
     */
    features() {
        for(let item of this.contents) {
            if(item instanceof FeatureTree) {
                yield* item.features();
            } else {
                yield item;
            }
        }
    }
}

class Group extends FeatureTree {
    /**
     *
     * @param {...(Feature|Fusion)} contents
     */
    constructor(...contents) {
        super(contents);
    }

    // TODO compare all features from both groups.
    equals() {
        return false;
    }
}

class Plasmid extends Group {

    /**
     *
     * @param {(string|null)} name
     * @param {(string|null)} site integration site
     * @param {(string|null)} marker selection marker
     * @param {...(Phene|Feature|Fusion)} contents
     */
    constructor(name, site=null, marker=null, ...contents) {
        super(contents);
        this.name = name;
        this.site = site;
        this.marker = marker;

        if(!(this.name || this.site)) {
            throw 'An unintegrated plasmid MUST have a name.';
        }
    }

    toInsertion() {
        if(this.isIntegrated()) {
            return new Replacement(this.site, this.contents, this.marker);
        } else {
            throw `Plasmid(${this.name}) can't be converted to an insertion because it is not integrated.`;
        }
    }

    isIntegrated() {
        return this.site != null;
    }

    isEpisome() {
        return this.site == null;
    }

    // TODO An integrated plasmid and an insertion are identical.

    equals(other) {
        if(this.name) {
            return this.name == other.name;
        } else if(other.name) {
            return false;
        } else { // no way to compare these plasmids except by comparing contents.
            return this.contents.equals(other);
        }
    }
}

class Fusion extends FeatureTree {

    /**
     *
     * @param {...Feature} features
     */
    constructor(...features) {
        super(features);
    }
}


class Feature {
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
    constructor(name, {type=null, accession=null, organism=null, variant=null, range=null} = {}) {
        this.name = name;
        this.type = type;
        this.accession = accession;
        this.organism = organism;
        this.variant = variant;
        this.range = range;
        // TODO verify that either an accession or a name is given.
    }

    toString() {
        var s = '';

        if(this.name) {
            if(this.organism) {
                s += `${this.organism.defaultAlias}/`;
            }
            if(this.type && this.type != 'gene') {
                s += `${this.type.charAt(0)}.`;
            }
            s += `${this.name}`;
            if(this.variant) {
                s += `(${this.variant})`;
            }
        }

        if(this.accession) {
            s += `#${this.accession.toString()}`;
        }

        if(this.range) {
            s += `[${this.range.toString()}]`;
        }

        return s;
    }

    /**
     * Compares two features ignoring the 'variant' flag.
     * @param {(Feature|Phene)} other
     */
    equals(other) {
        if(this.accession && other.accession) {
            return this.accession.equals(other.accession);
        } else if(this.name) {
            // TODO check organism too here.
            return this.name == other.name;
        } else {
            return false; // no way to compare these features.
        }
    }
}

class Phene extends  Feature {
    /**
     *
     * @param name
     * @param organism
     * @param variant
     */
    constructor(name, {organism = null, variant='wild-type'} = {}) {
        super(name, {type: 'phene', organism, variant})
    }
}

/**
 *
 */

// TODO make zero-indexed and disallow points
class Range {
    /**
     *
     * @param {int} start
     * @param {int} end
     * @param {string} sequence one of 'coding' and 'protein'
     */
    constructor(start, end, sequence='coding') {
        this.start = start;
        this.end = end;
        this.sequence = sequence;
    }

    isPoint() {
        return this.start == this.end;
    }

    toString() {
        if(this.isPoint()) {
            return `[${this.sequence.charAt(0)}.${this.start}]`
        } else {
            return `[${this.sequence.charAt(0)}.${this.start}_${this.end}]`
        }
    }
}

class Accession {
    constructor(identifier, database=null) {
        this.identifier = identifier;
        this.database = database;
    }

    toString() {
        return `${this.database}:${this.identifier}`
    }

    equals(other) {
        return other instanceof Accession &&
                this.database == other.database &&
                this.identifier == other.identifier;
    }
}

class Organism {
    constructor(name, aliases=[]) {
        this.name = name;
        this.aliases = aliases;
    }

    matches(name) {

    }

    get defaultAlias() {
        return this.aliases[0] || this.name;
    }
}

const DEFAULT_ORGANISMS = [
    new Organism('Escherichia coli', ['E.coli', 'Eco', 'Ec']),
    new Organism('Saccharomyces cerevisiae', ['S.Ce', 'Sce', 'Sc'])
];