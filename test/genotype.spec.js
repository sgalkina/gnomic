import {Feature, Phene, Plasmid, Mutation, Fusion, Group} from '../src/models.js';
import {Genotype} from '../src/genotype.js';
import {expect} from 'chai';

function chain(...definitions) {
    let genotype = Genotype.parse(definitions.shift());
    for (let definition of definitions) {
        genotype = Genotype.parse(definition, {parent: genotype});
    }
    return genotype
}

describe('Genotypes', function () {

    it('should propagate added features.', function () {
        let genotype = chain('+geneA', '+geneB');

        expect(genotype.changes()).to.deep.have.members([
            Mutation.Ins(new Feature('geneA')),
            Mutation.Ins(new Feature('geneB'))
        ])
    });

    it('should propagate removed features.', function () {
        let genotype = chain('-geneA', '-geneB');

        expect(genotype.changes()).to.deep.have.members([
            Mutation.Del(new Feature('geneA')),
            Mutation.Del(new Feature('geneB'))
        ])
    });

    it('should integrate plasmid vectors.', function () {
        expect(chain('siteA>pA{}').changes()).to.deep.have.members([
            Mutation.Del(new Feature('siteA'))
        ]);

        expect(chain('siteA>pA{geneA geneB}').changes()).to.deep.have.members([
            Mutation.Del(new Feature('siteA')),
            Mutation.Ins(new Feature('geneA')),
            Mutation.Ins(new Feature('geneB'))
        ]);
    });

    it('should understand variants.', function () {
        expect(chain('+geneA(x)', '-geneA').changes()).to.deep.have.members([
            Mutation.Del(new Feature('geneA'))
        ]);

        expect(chain('+geneA', '-geneA(x)').changes()).to.deep.have.members([
            Mutation.Ins(new Feature('geneA')),
            Mutation.Del(new Feature('geneA', {variant: 'x'}))
        ]);

        expect(chain('-geneA(x)', '+geneA(y)').changes()).to.deep.have.members([
            Mutation.Ins(new Feature('geneA', {variant: 'y'})),
            Mutation.Del(new Feature('geneA', {variant: 'x'}))
        ]);
    });

    it('should have phenotypes replace variants', function () {
        // when variants are used (default case):
        expect(chain('+geneA(x) +geneA(y)', '+geneA(z)').changes()).to.deep.have.members([
            Mutation.Ins(new Feature('geneA', {variant: 'x'})),
            Mutation.Ins(new Feature('geneA', {variant: 'y'})),
            Mutation.Ins(new Feature('geneA', {variant: 'z'}))
        ]);

        // when phenotypes are used:
        expect(chain('pheneA+', 'pheneA-').changes()).to.deep.have.members([
            Mutation.Ins(new Phene('pheneA', {variant: 'mutant'}))
        ]);

        // when variants are mixed:
        expect(chain('+geneA(x) +geneA(y)', 'geneA(z)').changes()).to.deep.have.members([
            Mutation.Ins(new Phene('geneA', {variant: 'z'}))
        ]);

        expect(chain('+geneA(x) +geneA(y)', 'geneA(z)', '+geneA(x)').changes()).to.deep.have.members([
            Mutation.Ins(new Feature('geneA', {variant: 'x'})),
            Mutation.Ins(new Phene('geneA', {variant: 'z'}))
        ]);
    });

    it('should treat markers as phenotypes', function () {
        expect(chain('+geneA::pheneA+', 'pheneA-').changes()).to.deep.have.members([
            Mutation.Ins(new Feature('geneA')),
            Mutation.Ins(new Phene('pheneA', {variant: 'mutant'}))
        ]);

        expect(chain('+geneA::pheneA+', 'pheneA-', '-geneA::pheneA+').changes()).to.deep.have.members([
            Mutation.Ins(new Phene('pheneA', {variant: 'wild-type'}))
        ]);
    });

    it('should support multiple insertion', function () {
        expect(chain('siteA>>geneA').raw).to.deep.have.members([
            Mutation.Sub(new Feature('siteA'), new Feature('geneA'), {multiple: true})
        ]);

        expect(chain('siteA>geneA').raw).to.deep.have.members([
            Mutation.Sub(new Feature('siteA'), new Feature('geneA'), {multiple: false})
        ]);
    });

    it('should not mark features as removed if they were added previously', function () {
        // geneA(x) is not marked as deleted as the removal was an exact match
        expect(chain('+geneA(x) +geneB', '-geneA(x)').changes()).to.deep.have.members([
            Mutation.Ins(new Feature('geneB'))
        ]);

        // geneA(x) is marked as deleted as it was not present before
        expect(chain('+geneB', '-geneA(x)').changes()).to.deep.have.members([
            Mutation.Ins(new Feature('geneB')),
            Mutation.Del(new Feature('geneA', {variant: 'x'}))
        ]);

        // geneA is marked as deleted because the match was not exact
        expect(chain('+geneA(x)', '-geneA').changes()).to.deep.have.members([
            Mutation.Del(new Feature('geneA'))
        ]);
    });


    it('should handle deletion of fusions with fusionStrategy=FUSION_MATCH_WHOLE (default)', function () {
        expect(chain('+geneA:geneB +geneC', '-geneA').changes(true)).to.deep.have.members([
            Mutation.Ins(new Fusion(new Feature('geneA'), new Feature('geneB'))),
            Mutation.Ins(new Feature('geneC')),
            Mutation.Del(new Feature('geneA'))
        ]);

        expect(chain('+geneA:geneB +geneC', '-geneC').changes(true)).to.deep.have.members([
            Mutation.Ins(new Fusion(new Feature('geneA'), new Feature('geneB')))
        ]);

        expect(chain('+geneA:geneB +geneC', '-geneA:geneB').changes(true)).to.deep.have.members([
            Mutation.Ins(new Feature('geneC'))
        ]);

        expect(chain('+geneA:geneB +geneC', '-geneA:geneB(x)').changes(true)).to.deep.have.members([
            Mutation.Ins(new Fusion(new Feature('geneA'), new Feature('geneB'))),
            Mutation.Del(new Fusion(new Feature('geneA'), new Feature('geneB', {variant: 'x'}))),
            Mutation.Ins(new Feature('geneC'))
        ]);
    });

    it('should handle fusions on integrated vectors', function () {
        expect(chain('siteA>pA{geneA:geneB}').changes(false)).to.deep.have.members([
            Mutation.Del(new Feature('siteA')),
            Mutation.Ins(new Feature('geneA')),
            Mutation.Ins(new Feature('geneB'))
        ]);

        expect(chain('siteA>pA{geneA:geneB}').changes(true)).to.deep.have.members([
            Mutation.Del(new Feature('siteA')),
            Mutation.Ins(new Fusion(new Feature('geneA'), new Feature('geneB')))
        ]);
    });
});