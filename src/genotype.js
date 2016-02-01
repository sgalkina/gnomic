import {Plasmid, Phene, Insertion, Replacement, Deletion} from './models.js';
import {parse} from './grammar.js';

export class Genotype {
    /**
     *
     * Only one variant of a gene is considered realistic, so an insertion of a gene with a variant replaces the
     * gene without the variant. This may need to change to allow multiple non-wildtype variants.
     *
     *
     * @param ancestor
     * @param {...(Insertion|Replacement|Deletion|Plasmid)} changes
     */
    constructor(ancestor=null, changes) {
        this.ancestor = ancestor;
        this.changes = changes;

        // TODO currently the code must assume that naming is consistent. i.e. if a feature
        // has only a name, it always has a name, if it has only an accession, it always has an accession.

        // TODO support ranges
        // NOTE ranges are currently ignored; proper handling of ranges would require splitting/merging etc. of
        // features based on the range or describing the mutation in the variant string.

        // TODO enumerate all features from the changes.
        var sites = this.ancestor ? Array.from(this.ancestor.sites) : []; // any features used like sites
        var markers = this.ancestor ? Array.from(this.ancestor.markers) :  []; // any features/phenes used like markers

        // TODO also remove markers from features
        // TODO combine features and phenes somehow

        var features = {added: [], removed: []};
        var episomes = {added: [],removed: []};

        function remove(array, value) {
            return array.filter((item) => !value.match(item));
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
                    continue;
                } else {
                    console.warn('Deprecated: Insertion of a plasmid with insertion site as episome.');
                    change = plasmid.toInsertion();
                }
            } else if(change instanceof Phene) {
                change = change.toInsertion();
            }

            if(change instanceof Insertion) {
                for(let feature of change.contents.features()) {
                    features.removed = remove(features.removed, feature);
                    features.added = upsert(features.added, feature);
                    console.log('ins', features.removed, features.added, feature)
                }
            } else if(change instanceof Replacement) {
                // NOTE if an insertion site is within a fusion, the fusion needs to be replaced.
                //      Likewise, if a deleted feature is within a fusion, that fusion, too, needs to be replaced.
                sites = upsert(sites, change.site);
                markers = remove(markers, change.site);

                features.added = remove(features.added, change.site);
                features.removed = upsert(features.removed, change.site);

                for(let feature of change.contents.features()) {
                    features.removed = remove(features.removed, feature);
                    features.added = upsert(features.added, feature);
                }
            } else { // change instanceof Deletion
                if(change.contents instanceof Plasmid) {
                    let plasmid = change;
                    episomes.added = remove(episomes.added, plasmid);
                    episomes.removed = upsert(episomes.removed, plasmid);
                } else {
                    for(let feature of change.contents.features()) {
                        features.added = remove(features.added, feature);
                        features.removed = upsert(features.removed, feature);
                    }
                }
            }

            // Any marker is added (variant applied) at the very end
            if(change.marker) {
                markers = upsert(markers, change.marker);

                features.removed = remove(features.removed, change.marker);
                features.added = upsert(features.added, change.marker);
            }
        }

        // TODO freeze with Object.freeze()
        this.addedFeatures = Object.freeze(features.added);
        this.removedFeatures = Object.freeze(features.removed);
        this.addedEpisomes = Object.freeze(episomes.added);
        this.removedEpisomes = Object.freeze(episomes.removed);
        this.sites = Object.freeze(sites);
        this.markers = Object.freeze(markers);
    }

    static parse(string, ancestor = null) {
        return new Genotype(ancestor, parse(string));
    }

    //toString() {
    //
    //}

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
     * @param removed
     */
    *features(removed = false) {
        if(removed) {
            yield *this.removedFeatures;

            if(this.ancestor) {
                for(let feature of this.ancestor.features(true)) {
                    if(!this.addedFeatures.some((f) => f.match(feature))) {
                        yield feature;
                    }
                }
            }
        } else {
            yield *this.addedFeatures;

            if(this.ancestor) {
                for(let feature of this.ancestor.features(false)) {
                    if(!this.removedFeatures.some((f) => feature.match(f))) {
                        yield feature;
                    }
                }
            }
        }
    }
}
