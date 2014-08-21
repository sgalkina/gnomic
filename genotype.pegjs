start
	= sep* list:designation_list sep* { return list }

designation_list
	= start:(d:designation list_separator { return d })* last:designation { return start.concat(last) }
        / d:designation { return [d] }

designation
	= phenotype
        / marker_presence
        / genotype

list_separator
    = sep* "," sep*
    / sep+

marker_presence
    = "+"? marker:identifier "*" { return { marker: { name: marker, used: true } } }
    / "-" marker:identifier "*" { return { marker: { name: marker, used: false } } } 

phenotype
	= p:phene "+" { return { phenotype: { name: p, mutation: 'wild-type' } } }
	/ p:phene "-" { return { phenotype: { name: p, mutation: 'mutant' } } }
	/ p:phene m:mutation { return { phenotype: { name: p, mutation: m } } }

genotype
    = g:genotype_without_locus "::" marker:identifier "*" { g.marker = marker; return g }
    / g:genotype_with_locus "::" marker:identifier "*" { g.marker = marker; return g }
    / genotype_with_locus
    / genotype_without_locus
    
genotype_with_locus
	= "-" locus:identifier "::" i:insertable { return { type: 'insertion', replacingLocus: locus, with: i } } 
	/ locus:identifier "::" i:insertable { return { type: 'insertion', atLocus: locus, of: i } } 
	
genotype_without_locus
	= "-" g:gene_feature { return { type: 'deletion', of: g } }
	/ "+" i:insertable { return { type: 'insertion', of: i } }
	/ g:gene_feature "^^" { return { type: 'upRegulation', of: g, multiple: true } }
	/ g:gene_feature "^" { return { type: 'upRegulation', of: g, } }
	/ g:gene_feature "<" { return { type: 'downRegulation', of: g, } }
	/ i:insertable { return { type: 'insertion', of: i } }

insertable
    = fusion
    / feature
    
fusion
	= start:(f:feature ":" { return f })+ last:feature { return { fusion: start.concat(last) } }

feature
	= n:$("P" identifier) { return { feature: { name: n, typeHint: 'promoter' } }}
	/ n:$("T" identifier) { return { feature: { name: n, typeHint: 'terminator' } }}
	/ gene_feature

gene_feature
        = o:organism "/" g:gene_feature_pt2 { g.feature.organism = o; return g }
        / gene_feature_pt2

gene_feature_pt2
   	= "#" a:accession { return { feature: { accession: a } } }
	/ n:gene m:mutation "#" a:accession { return { feature: { name: n, mutation: m, accession: a, type: 'gene' } } }
	/ n:gene "#" a:accession { return { feature: { name: n, accession: a, type: 'gene' } } }
	/ n:gene m:mutation { return { feature: { name: n, mutation: m, type: 'gene' } } }
	/ n:gene { return { feature: { name: n, weakType: 'gene' } } }

gene
    = $([a-zA-Z0-9]+)

phene
    = $([A-Z][a-zA-Z0-9]+)

organism
    = $([a-zA-Z0-9]+("."[a-zA-Z0-9]+)?)


mutation
    = "(" mutation:identifier ")" { return mutation }

/**
 * Accession number in DBXREF format.
 * 
 * http://www.uniprot.org/docs/dbxref
 */
accession
    = name:database ":" id:integer { return { name: name, value: id }; }
    / name:database ":" id:identifier { return { name: name, value: id }; }


database
    = $([A-Za-z0-9-][A-Za-z0-9]+)

integer "integer"
    = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

identifier
    = $([A-Za-z0-9]+([A-Za-z0-9_-]+[A-Za-z0-9])?)

sep
	= [ \t\r\n]
