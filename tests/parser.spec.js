import parse from '../dist/genotype';

console.log(parse.parse);

describe('Language parser', function() {



    it('should handle simple insertions', function() {
        expect(parse('abcD')).to.deep.equal(new Feature('abcD'));
        expect(parse('+abcD')).to.deep.equal(new Feature('abcD'));
        expect(parse('+abcD#db:123')).to.deep.equal(new Feature('abcD', {accession: new Accession(123, 'db')}));
        expect(parse('+#db:123')).to.deep.equal(new Feature(null, {accession: new Accession(123, 'db')}));
    });


    it('should handle simple deletions', function() {
        expect(parse('')).toEqual(

        )
    });

    it('should handle simple replacements', function() {
        expect(parse('')).toEqual();
    });

    // TODO markers


    // TODO phenotypes...

    // site>p123{abc, def, ghi, His}::His+
    // p123{


    it('should handle different marker expressions', function() {
        expect(parse('a>b::Marker+')).toEqual()
        expect(parse('a>b::Marker(xyz)')).toEqual()

        expect(parse('-abc::Marker+').equals()).toBe(true);
        expect(parse('-abc::Marker(xyz)')).toEqual()

        expect(parse('+abc::Marker+')).toEqual()
        expect(parse('+abc::Marker(xyz)')).toEqual()

        expect(parse('+(a b)::Marker+')).toEqual()
        expect(parse('+a::(b c)::Marker+')).toEqual()
        expect(parse('+a::p123(b c)::Marker+')).toEqual()

        expect(parse('+(a b)::Marker(xyz)')).toEqual()
        expect(parse('+a::(b c)::Marker(xyz)')).toEqual()
        expect(parse('+a::p123(b c)::Marker(xyz)')).toEqual()

        expect(parse('p123()::Marker+')).toEqual()
        expect(parse('+p123()::Marker+')).toEqual()
        expect(parse('-p123()::Marker+')).toEqual()

        expect(parse('p123()::Marker(xyz)')).toEqual()
        expect(parse('+p123()::Marker(xyz)')).toEqual()
        expect(parse('-p123{}::Marker(xyz)')).toEqual()

        expect(parse('abc::Marker(xyz)')).to.fail() // or mean plasmid?
        // NOTE site::p123(content) has the same format as gene::Marker(xyz)
        // The best solution is probably to require the insertion format to be wrapped:
        // (gene)::Marker(xyz)

        expect(parse('a>b::Marker-')).to.fail();
    });


    it('should handle insertion of episomes', function() {
        expect(parse('')).toEqual(

        )
    });

    it('should handle integration of plasmids', function() {
        expect(parse('')).toEqual()
    });


    it('should handle multiple things', function() {
        expect(parse('')).toEqual(

        )
    });
});



// TODO error handling