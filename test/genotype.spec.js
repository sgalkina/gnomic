import {Feature, Phene, Plasmid, Insertion, Deletion, Replacement, Fusion, Group} from '../src/models.js';
import {Genotype} from '../src/genotype.js';
import {expect} from 'chai';

describe('Genotypes', function() {
    it('should work with one generation.', function() {
        var gene2 = new Feature('gene2');
        var gene3 = new Feature('gene3');
        var gene1 = new Feature('gene1');
        var marker1 = new Phene('marker1');
        var site1 = new Feature('site1');
        var gene4 = new Feature('gene4');
        var marker2 = new Phene('marker2');
        var promoter1 = new Feature('promoter1', 'promoter');
        var plasmid1 = new Plasmid('plasmid1');
        var site2 = new Feature('site2');
        var marker3 = new Phene('marker3');
        var gene5 = new Feature('gene5');
        var plasmid2 = new Plasmid('plasmid2', null, marker3, gene5);
        var g = new Genotype(null, [
            new Insertion(new Fusion(promoter1, gene1)),
            new Deletion(new Group(
                gene2,
                gene3
            ), marker1),
            new Replacement(
                site1,
                gene4,
                marker2
            ),
            plasmid1,
            new Replacement(site2, plasmid2)
        ]);

        expect(g.addedFeatures).to.have.members([marker1, marker2, marker3, promoter1, gene1, gene4, gene5]); // TODO markers should be added too.
        expect(g.removedFeatures).to.have.members([gene2, gene3, site1, site2]);
        expect(g.addedEpisomes).to.have.members([plasmid1]);
        expect(g.sites).to.have.members([site1, site2]);
        expect(g.markers).to.have.members([marker1, marker2, marker3]);
    });

    it('should work with phenotypes.', function() {
        var g = new Genotype(null, [
            new Phene('Phene', {variant: 'foo'})
        ]);

        expect(g.addedFeatures).to.deep.have.members([new Phene('Phene', {variant: 'foo'})]);
    });

    it('should work with multiple generations.', function() {
        var g1 = new Genotype(null, [
            new Insertion(new Group(new Feature('gene1'), new Feature('gene2')))
        ]);

        expect(g1.addedFeatures).to.deep.have.members([new Feature('gene1'), new Feature('gene2')]);
        expect(Array.from(g1.features())).to.deep.have.members([new Feature('gene1'), new Feature('gene2')]);

        var g2 = new Genotype(g1, [
            new Deletion(new Feature('gene1'))
        ]);

        expect(g2.removedFeatures).to.deep.have.members([new Feature('gene1')]);

        expect(g2.addedFeatures).to.be.empty;
        expect(Array.from(g2.features())).to.deep.have.members([new Feature('gene2')]);
    })

    //
    //it('should handle deletion of a specific variant', function() {
    //    var g1 = new Genotype(null, [
    //        new Deletion(new Group(
    //            new Feature('gene1', {variant: 'a'}),
    //            new Feature('gene1', {variant: 'b'})))
    //    ]);
    //
    //    expect(g1.removedFeatures).to.deep.have.members([
    //        new Feature('gene1', {variant: 'a'}),
    //        new Feature('gene1', {variant: 'b'})
    //    ]);
    //
    //    var g2 = new Genotype(g1, [
    //        new Insertion(new Feature('gene1', {variant: 'b'})),
    //        new Deletion(new Feature('gene1', {variant: 'c'})),
    //        new Insertion(new Feature('gene1', {variant: 'd'}))
    //    ]);
    //
    //    expect(g2.removedFeatures).to.deep.have.members([
    //        new Feature('gene1', {variant: 'c'})
    //    ]);
    //
    //    expect(Array.from(g2.features(true))).to.deep.have.members([
    //        new Feature('gene1', {variant: 'a'}),
    //        new Feature('gene1', {variant: 'c'})
    //    ]);
    //
    //    expect(g2.addedFeatures).to.deep.have.members([
    //        new Feature('gene1', {variant: 'b'}),
    //        new Feature('gene1', {variant: 'd'})
    //    ]);
    //
    //    var g3ins = new Genotype(g2, [
    //        new Insertion(new Feature('gene1'))
    //    ]);
    //
    //    expect(g3ins.addedFeatures).to.deep.have.members([
    //        new Feature('gene1')
    //    ]);
    //
    //    console.log('ex', Array.from(g3ins.features()))
    //    expect(Array.from(g3ins.features())).to.deep.have.members([
    //        new Feature('gene1')
    //    ]);
    //
    //    var g3del = new Genotype(g2, [
    //        new Deletion(new Feature('gene1'))
    //    ]);
    //
    //    expect(g3del.removedFeatures).to.deep.have.members([
    //        new Feature('gene1')
    //    ]);
    //
    //    expect(Array.from(g3del.features())).to.deep.have.members([]);
    //})
});