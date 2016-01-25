import {parse} from './grammar.js';

/**
 * Created by lyschoening on 5/19/15.
 */


// TODO ranges are not currently supported because they make the logic of computing a genotype radically more difficult

export class Deletion {

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

export class Insertion {
    // TODO change site from a string to a feature, allow ranges.
    /**
     *
     * @param {(Feature|FeatureTree)} insertable
     * @param {(string|null)} marker selection marker
     */
    constructor(insertion, marker = null) {
        if(insertion instanceof Feature) {
            insertion = new FeatureTree(insertion);
        } else if(insertion instanceof Plasmid) {
            marker = marker || insertion.marker;
            insertion.marker |= marker;
        }

        this.contents = insertion;
        this.marker = marker;
    }
}


export class Replacement {
    /**
     * @param {(Feature|Phene)} site integration site
     * @param {(Feature|FeatureTree)} insertion
     * @param {(Feature|Phene)} marker
     * @param {bool} multiple whether the site is for multiple integration
     */
    constructor(site, insertion, marker = null, multiple = false) {
        if(insertion instanceof Feature) {
            insertion = new FeatureTree(insertion);
        } else if(insertion instanceof Plasmid) {
            marker = marker || insertion.marker;
            site = site || insertion.site;
            insertion.marker |= marker;
            insertion.site |= site;
        }

        this.contents = insertion;
        this.site = site;
        this.marker = marker;
        this.multiple = multiple;
    }
}


export class FeatureTree {
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
    *features() {
        for(let item of this.contents) {
            if(item instanceof FeatureTree) {
                yield* item.features();
            } else {
                yield item;
            }
        }
    }
}

export class Group extends FeatureTree {
    /**
     *
     * @param {...(Feature|Fusion)} contents
     */
    constructor(...contents) {
        super(...contents);
    }

    // TODO compare all features from both groups.
    equals(other) {
        return false;
    }

    match(other) {
        return this.equals(other);
    }
}

export class Plasmid extends FeatureTree {

    /**
     *
     * @param {(string|null)} name
     * @param {(string|null)} marker selection marker (carried over from insertion).
     * @param {...(Phene|Feature|Fusion)} contents
     */
    constructor(name, site=null, marker=null, ...contents) {
        super(...contents);
        this.name = name;
        this.site = site;
        this.marker = marker;

        if(!(this.name || this.site)) {
            throw 'An unintegrated plasmid MUST have a name.';
        }
    }

    toInsertion() {
        if(this.isIntegrated()) {
            return new Replacement(this.site, this, this.marker);
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

export class Fusion extends FeatureTree {

    /**
     *
     * @param {...Feature} features
     */
    constructor(...features) {
        super(...features);
    }
}


export class Feature {
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
            if(this.name != other.name) {
                return false;
            }

            if(other.organism || this.organism) {
                if(!this.organism) {
                    return false;
                }

                if(this.organism.name != other.organism.name) {
                    return false
                }
            }

            if(this.variant != other.variant) {
                return false;
            }

            return true;
        } else {
            return false; // no way to compare these features.
        }
    }

    match(other) {
        if(this.accession && other.accession) {
            return this.accession.equals(other.accession);
        } else if(this.name) {
            if(this.name != other.name) {
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
            console.log(this.name, '|', this.variant, other.variant, !this.variant || this.variant == other.variant)
            return !this.variant || this.variant == other.variant;
        } else {
            return false;
        }
    }
}

export class Phene extends Feature {
    /**
     *
     * @param name
     * @param organism
     * @param variant
     */
    constructor(name, {organism = null, variant='wild-type'} = {}) {
        super(name, {type: 'phene', organism, variant})
    }
    toInsertion() {
        return new Insertion(this);
    }
}

/**
 *
 */

// TODO make zero-indexed and disallow points
export class Range {
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

export class Accession {
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

export class Organism {
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