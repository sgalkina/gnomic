import {parse} from './grammar.js';


export class Mutation {
    constructor(before, after, {marker=null, multiple=false} = {}) {

        if(before instanceof Array || (before !== null && !(before instanceof Plasmid))) {
            before = new FeatureTree(before)
        }

        if(after instanceof Array || (after !== null && !(after instanceof Plasmid))) {
            after = new FeatureTree(after)
        }

        this.before = before;
        this.after = after;
        this.marker = marker;
        this.multiple = multiple;
    }

    equals(other) {
        return other instanceof Mutation &&
            this.before == other.before &&
            this.after == other.after &&
            this.multiple == other.multiple;
    }

    static Ins(feature, ...args) {
        return new Mutation(null, feature, ...args);
    }

    static Sub(before, after, ...args) {
        return new Mutation(before, after, ...args);
    }

    static Del(feature, ...args) {
        return new Mutation(feature, null, ...args);
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

    equals(other) {
        if(!(other instanceof FeatureTree)) {
            return false
        }

        if(this.contents.length != other.contents.length) {
            return false
        }

        for(let i = 0; i < this.contents.length; i++) {
            if(!this.contents[i].equals(other.contents[i])) {
                return false
            }
        }

        return true
    }

    match(other) {
        if(!(other instanceof FeatureTree)) {
            return false
        }

        if(this.contents.length != other.contents.length) {
            return false
        }

        for(let i = 0; i < this.contents.length; i++) {
            if(!this.contents[i].match(other.contents[i])) {
                return false
            }
        }

        return true
    }

    [Symbol.iterator]() {
        return this.contents[Symbol.iterator]()
    }
}


export class Plasmid extends FeatureTree {

    /**
     *
     * @param {(string|null)} name
     * @param {(string|null)} marker selection marker (carried over from insertion).
     * @param {...(Phene|Feature|Fusion)} contents
     */
    constructor(name, {site = null, marker = null} = {}, ...contents) {
        super(...contents);
        this.name = name;
        this.site = site;
        this.marker = marker;

        if(!(this.name || this.site)) {
            throw 'An unintegrated plasmid MUST have a name.';
        }
    }

    equals(other) {
        if(this.name) {
            return this.name == other.name;
        } else if(other.name) {
            return false;
        } else { // no way to compare these plasmids except by comparing contents.
            return super.equals(other);
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

    match(other, matchVariant = true) {
        if(!(other instanceof Feature)) {
            return false
        }

        if(this.accession && other.accession) {
            return this.accession.equals(other.accession);
        } else if(this.name) {
            // only match features with the same name
            if(this.name != other.name) {
                return false;
            }

            // if an organism is specified, match only features with the same organism
            if(this.organism && !this.organism.equals(other.organism)) {
                return false
            }

            // if this feature has no variant, match any other feature; otherwise, match only features with the same
            // variant
            if(!this.variant || !matchVariant) {
                return true;
            }

            return this.variant == other.variant;
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

    equals(other) {
        return this.name == other.name;
    }

    get defaultAlias() {
        return this.aliases[0] || this.name;
    }
}

const DEFAULT_ORGANISMS = [
    new Organism('Escherichia coli', ['E.coli', 'Eco', 'Ec']),
    new Organism('Saccharomyces cerevisiae', ['S.Ce', 'Sce', 'Sc'])
];