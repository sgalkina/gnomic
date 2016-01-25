import {parse, SyntaxError} from '../src/grammar.js';
import {Feature, Accession, Phene, Plasmid, Fusion, Group, Organism, Replacement, Insertion, Deletion} from '../src/models.js';
import {expect} from 'chai';



describe('Language parser', function() {

    it('should handle simple insertions', function() {
        expect(parse('+abcD')).to.deep.equal([
            new Insertion(new Feature('abcD'))]);
        expect(parse('+abcD#db:123')).to.deep.equal([
            new Insertion(new Feature('abcD', {accession: new Accession(123, 'db')}))]);
        expect(parse('+#db:123')).to.deep.equal([
            new Insertion(new Feature(null, {accession: new Accession(123, 'db')}))]);
    });

    it('should handle variants/phenotypes', function() {
        expect(parse('A+')).to.deep.equal([new Phene('A')]);
        expect(parse('A-')).to.deep.equal([new Phene('A', {variant: 'mutant'})]);
        expect(parse('A(custom)')).to.deep.equal([new Phene('A', {variant: 'custom'})]);
        expect(parse('E.coli/A+')).to.deep.equal([
            new Phene('A', {
                organism: new Organism('E.coli')
            })
        ]);

        expect(parse('#ABC:123+')).to.deep.equal([
            new Phene(null, {accession: new Accession(123, 'ABC')})
        ]);
    });

    it('should handle simple deletions', function() {
        expect(parse('-gene1')).to.deep.equal([
            new Deletion(new Feature('gene1'))
        ]);

        expect(parse('-xyz{}')).to.deep.equal([
            new Deletion(new Plasmid('xyz'))
        ]);

        expect(parse('-xyz{abc}')).to.deep.equal([
            new Deletion(new Plasmid('xyz', null, null, new Feature('abc')))
        ]);
    });

    it('should handle simple replacements', function() {
        expect(parse('a>b')).to.deep.equal([new Replacement(new Feature('a'), new Feature('b'))]);
        expect(parse('a>>b')).to.deep.equal([new Replacement(new Feature('a'), new Feature('b'), null, true)]);
        expect(parse('a>b::m+')).to.deep.equal([new Replacement(new Feature('a'), new Feature('b'), new Phene('m'))]);
    });

    it('should handle feature sets', function() {
        expect(parse('+{a}')).to.deep.equal([
            new Insertion(new Group(new Feature('a')))
        ]);

        expect(parse('+{a b c}')).to.deep.equal([
            new Insertion(new Group(new Feature('a'), new Feature('b'), new Feature('c')))
        ]);

        expect(parse('+{a b:c d}')).to.deep.equal([
            new Insertion(
                new Group(
                    new Feature('a'),
                    new Fusion(new Feature('b'), new Feature('c')),
                    new Feature('d')))
        ]);
    });

    it('should handle advanced plasmid deletions', function() {
        expect(parse('-xyz{abc, xyz}')).to.deep.equal([
            new Deletion(new Plasmid('xyz', null, null, new Feature('abc'), new Feature('xyz')))
        ]);

        expect(parse('-xyz{a:b:c}')).to.deep.equal([
            new Deletion(new Plasmid('xyz', null, null,
                new Fusion(
                    new Feature('a'), // {type: 'promoter'}
                    new Feature('b'),
                    new Feature('c')
                )))
        ]);
    });

    it('should handle fusions', function() {
        expect(parse('+a:b')).to.deep.equal([
            new Insertion(new Fusion(new Feature('a'), new Feature('b')))
        ]);

        expect(parse('+a:b::m+')).to.deep.equal([
            new Insertion(new Fusion(new Feature('a'), new Feature('b')), new Phene('m'))
        ]); // +{a:b}::m+ is equivalent.

        expect(parse('+{a:b}::m+')).to.deep.equal([
            new Insertion(new Group(new Fusion(new Feature('a'), new Feature('b'))), new Phene('m'))
        ]);

        expect(parse('-abc:def')).to.deep.equal([
            new Deletion(new Fusion(new Feature('abc'), new Feature('def')))
        ]);

        expect(parse('+abc:def')).to.deep.equal([
            new Insertion(new Fusion(new Feature('abc'), new Feature('def')))
        ]);

        expect(parse('site>abc:def:ghi')).to.deep.equal([
            new Replacement(new Feature('site'),
                new Fusion(
                    new Feature('abc'),
                    new Feature('def'),
                    new Feature('ghi')))
        ]);
    });

    // TODO organism
    // TODO Feature types

    it('should handle variants in groups', function() {
        expect(parse('#123>p123{x A+ B+}::C(custom)')).to.deep.equal([
            new Replacement(
                new Feature(null, {accession: new Accession(123)}),
                new Plasmid(
                    'p123',
                    null,
                    null,
                    new Feature('x'),
                    new Feature('A', {variant: 'wild-type'}),
                    new Feature('B', {variant: 'wild-type'})),
                new Phene('C', {variant: 'custom'}))
        ]);
    });

    it('should handle different marker expressions', function() {
        expect(parse('a>b::Marker+')).to.deep.equal([
            new Replacement(new Feature('a'), new Feature('b'), new Phene('Marker'))
        ]);

        expect(parse('a>b::Marker(xyz)')).to.deep.equal([
            new Replacement(new Feature('a'), new Feature('b'), new Phene('Marker', {variant: 'xyz'}))
        ]);

        expect(parse('-abc::Marker+')).to.deep.equal([
            new Deletion(new Feature('abc'), new Phene('Marker'))
        ]);

        expect(parse('-abc::Marker(xyz)')).to.deep.equal([
            new Deletion(new Feature('abc'), new Phene('Marker', {variant: 'xyz'}))
        ]);

        expect(parse('+abc::Marker+')).to.deep.equal([
            new Insertion(new Feature('abc'), new Phene('Marker'))
        ]);

        expect(parse('+abc::Marker(xyz)')).to.deep.equal([
            new Insertion(new Feature('abc'), new Phene('Marker', {variant: 'xyz'}))
        ]);

        expect(parse('+{a b}::Marker+')).to.deep.equal([
            new Insertion(new Group(new Feature('a'), new Feature('b')), new Phene('Marker'))
        ]);

        expect(parse('+p123{b c}::Marker+')).to.deep.equal([
            new Insertion(
                new Plasmid(
                    'p123',
                    null,
                    null,
                    new Feature('b'),
                    new Feature('c')),
                new Phene('Marker'))
        ]);

        expect(parse('s>p123{b c}::Marker+')).to.deep.equal([
            new Replacement(
                new Feature('s'),
                new Plasmid(
                    'p123',
                    null,
                    null,
                    new Feature('b'),
                    new Feature('c')),
                new Phene('Marker'))
        ]);
    });

    it('should not allow insertion with site', function() {
        expect(() => parse('+a::b::c+')).to.throw(SyntaxError);
        // instead use +a:b::c+ or +{a b}::c+
        expect(() => parse('+a:b::c+')).to.not.throw(SyntaxError);
        expect(() => parse('+{a b}::c+')).to.not.throw(SyntaxError);
    });

    it('should not allow nested feature groups/plasmids', function() {
        expect(() => parse('+{a b {c d}}')).to.throw(SyntaxError);
        expect(() => parse('+p1{a p2{} c}')).to.throw(SyntaxError);
    });

    it('should distinguish between episomes and plasmids', function() {
        expect(parse('p1{} +p2{} -p3{}')).to.deep.equal([
            new Plasmid('p1'),
            new Insertion(new Plasmid('p2')),
            new Deletion(new Plasmid('p3')) // NOTE this is a deletion of an episome, never an integrated plasmid.
        ]);
    });

    it('should allow an episome with a selection marker', function() {
        expect(parse('p1{}::m+ p2{a}::m(R)')).to.deep.equal([
            new Plasmid('p1', null, new Phene('m')),
            new Plasmid('p2', null, new Phene('m', {variant: 'R'}), new Feature('a'))
        ]);
    });

    it('should handle multiple things', function() {
        expect(parse('-a +b c>>d p{}')).to.deep.equal([
        new Deletion(new Feature('a')),
            new Insertion(new Feature('b')),
            new Replacement(new Feature('c'), new Feature('d'), null, true),
            new Plasmid('p')
        ])
    });
});



// TODO error handling