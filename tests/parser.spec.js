/**
 * Created by lyschoening on 5/20/15.
 */


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
        expect(parse('')).toEqual(

        )
    });

    // TODO markers


    // TODO phenotypes...




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