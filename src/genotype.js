import {Mutation, Feature, Plasmid, Phene} from './models.js';
import {parse} from './grammar.js';

export const FUSION_MATCH_WHOLE = 'match-whole-fusions';

export class Genotype {
    /**
     *
     * Only one variant of a gene is considered realistic, so an insertion of a gene with a variant replaces the
     * gene without the variant. This may need to change to allow multiple non-wildtype variants.
     *
     * @param {(Insertion|Replacement|Deletion|Plasmid)} changes
     * @param parent
     */
    constructor(changes, {parent=null, fusionStrategy=FUSION_MATCH_WHOLE} = {}) {
        this.parent = parent;
        this.raw = Object.freeze(changes);

        // TODO currently the code must assume that naming is consistent. i.e. if a feature
        // has only a name, it always has a name, if it has only an accession, it always has an accession.

        // TODO support ranges
        // NOTE ranges are currently ignored; proper handling of ranges would require splitting/merging etc. of
        // features based on the range or describing the mutation in the variant string.

        function remove(items, value, ...args) {
            for(let item of items.filter((item) => value.match(item, ...args))) {
                items.splice(items.indexOf(item), 1);
                // FIXME support removing multiple copies
            }
            return items;
        }

        function upsert(items, value, ...args) {
            remove(items, value, ...args);
            items.push(value);
            return items;
        }

        function removeOrExclude(addedItems, removedItems, value) {
            for(let item of addedItems) {
                if(item.equals(value)) {
                    return [remove(addedItems, value), removedItems]
                }
            }

            return [remove(addedItems, value), upsert(removedItems, value)]
        }

        //def remove_or_exclude(added_features, removed_features, exclude):
        //  for feature in added_features:
        //      if exclude == feature:
        //  return remove(added_features, exclude), removed_features
        //  return remove(added_features, exclude), upsert(removed_features, exclude)

        let sites = parent ? Array.from(parent.sites) : [];
        let markers = parent ? Array.from(parent.markers) : [];
        let addedPlasmids = parent ? Array.from(parent.addedPlasmids) : [];
        let removedPlasmids = parent ? Array.from(parent.removedPlasmids) : [];

        let addedFeatures = parent ? Array.from(parent.addedFeatures) : [];
        let removedFeatures = parent ? Array.from(parent.removedFeatures) : [];

        let addedFusionFeatures = parent ? Array.from(parent.addedFusionFeatures) : [];
        let removedFusionFeatures = parent ? Array.from(parent.removedFusionFeatures) : [];

        for(let change of changes) {

            // addition of an un-integrated plasmid
            if(change instanceof Plasmid) {
                upsert(addedPlasmids, change);
                removeOrExclude(removedPlasmids, change);
            } else if(change instanceof Feature) {
                upsert(addedFeatures, change, false);
                remove(removedFeatures, change, false);

                // fusion-sensitive implementation:
                upsert(addedFusionFeatures, change, false);
                remove(removedFusionFeatures, change, false);
            } else {

                // deletion of a plasmid; change.after MUST be null
                if (change.before instanceof Plasmid) {
                    remove(addedPlasmids, change.before);
                    upsert(removedPlasmids, change.before);
                } else if(change.before !== null) {
                    // deletion of one (or more) features or fusions
                    for(let feature of change.before.features()) {
                        removeOrExclude(addedFeatures, removedFeatures, feature);
                    }

                    if(fusionStrategy != FUSION_MATCH_WHOLE) {
                        throw `Unsupported fusion strategy: ${fusionStrategy}`;
                    }

                    switch (fusionStrategy) {
                        case FUSION_MATCH_WHOLE:
                            for (let featureOrFusion of change.before) {
                                removeOrExclude(addedFusionFeatures, removedFusionFeatures, featureOrFusion);
                            }
                            break;
                    }
                }

                if(change.after !== null) {
                    // insertion of one (or more) features or fusions
                    for(let feature of change.after.features()) {
                        upsert(addedFeatures, feature);
                        remove(removedFeatures, feature);
                    }

                    // fusion-sensitive implementation:
                    for (let featureOrFusion of change.after) {
                        upsert(addedFusionFeatures, featureOrFusion);
                        remove(removedFusionFeatures, featureOrFusion);
                    }
                }

                if(change.before !== null && change.after !== null) {
                    // in a replacement, the removed part MUST be a single feature
                    upsert(sites, change.before.contents[0])
                }

                if(change.marker !== null) {
                    // FIXME markers need to be updated also when regular features are updated.
                    upsert(markers, change.marker, false);
                    upsert(addedFeatures, change.marker, false);
                    remove(removedFeatures, change.marker, false);
                    upsert(addedFusionFeatures, change.marker, false);
                    remove(removedFusionFeatures, change.marker, false);
                }
            }
        }

        this.addedPlasmids = Object.freeze(addedPlasmids);
        this.removedPlasmids = Object.freeze(removedPlasmids);
        this.addedFeatures = Object.freeze(addedFeatures);
        this.removedFeatures = Object.freeze(removedFeatures);
        this.addedFusionFeatures = Object.freeze(addedFusionFeatures);
        this.removedFusionFeatures = Object.freeze(removedFusionFeatures);
        this.sites = Object.freeze(sites);
        this.markers = Object.freeze(markers);
    }

    static parse(string, {parent = null, fusionStrategy=FUSION_MATCH_WHOLE} = {}) {
        return new Genotype(parse(string), {parent, fusionStrategy});
    }

    *iterChanges(fusions = false) {
        if(fusions) {
            for(let feature of this.addedFusionFeatures) {
                yield Mutation.Ins(feature);
            }

            for(let feature of this.removedFusionFeatures) {
                yield Mutation.Del(feature);
            }
        } else {
            for(let feature of this.addedFeatures) {
                yield Mutation.Ins(feature);
            }

            for(let feature of this.removedFeatures) {
                yield Mutation.Del(feature);
            }

        }

        for(let plasmid of this.addedPlasmids) {
            yield plasmid;
        }

        for(let plasmid of this.removedPlasmids) {
            yield Mutation.Del(plasmid);
        }
    }

    changes(fusions = false) {
        return Array.from(this.iterChanges(fusions))
    }
}
