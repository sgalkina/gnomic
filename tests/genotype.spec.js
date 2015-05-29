import {Feature, Phene, Plasmid, Genotype, Insertion, Deletion, Replacement, Fusion, Group} from '../dist/types';

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
        var plasmid2 = new Plasmid('plasmid2', site2, marker3, gene5);
        var g = new Genotype(null,
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
            plasmid2
        );

        expect(g.addedFeatures).toEqual([promoter1, gene1, gene4, gene5]); // TODO markers should be added too.
        expect(g.removedFeatures).toEqual([gene2, gene3, site1]);
        expect(g.addedEpisomes).toEqual([plasmid1]);
        expect(g.sites).toEqual([site1, site2]);
        expect(g.markers).toEqual([marker1, marker2, marker3]);
    });
});