{
    var Feature = require('./types.js').Feature;

}

start
	= sep* list:designation_list sep* { return list }

designation_list
	= start:(d:designation list_separator { return d })* last:designation { return start.concat(last) }
        / d:designation { return [d] }

designation
	= vector
        / phenotype
        / genotype

list_separator
    = sep* "," sep*
    / sep+

phenotype
	= p:phene "+" { return { phenotype: { name: p, variant: 'wild-type' } } }
	/ p:phene "-" { return { phenotype: { name: p, variant: 'mutant' } } }
	/ p:phene v:variant { return { phenotype: { name: p, variant: v } } }

genotype
    = g:genotype_without_locus "::" marker:identifier "+" { g.marker = marker; return g }
    / g:genotype_with_locus "::" marker:identifier "+" { g.marker = marker; return g }
    / genotype_with_locus
    / genotype_without_locus

genotype_with_locus
	= "-" locus:identifier "::" i:insertable { return { type: 'insertion', site: locus, of: i, replacement: true } }
	/ locus:identifier "::" i:insertable { return { type: 'insertion', site: locus, of: i } }
	/ locus:identifier ">" i:insertable { return { type: 'insertion', site: locus, of: i, replacement: true } }
	/ locus:identifier ">>" i:insertable { return { type: 'insertion', site: locus, of: i, replacement: true, multiple: true } }


genotype_without_locus
        = "-" name:identifier "()" { return { type: 'deletion', of: { type: 'episome', name: name } } } 
        / "-" g:gene_feature { return { type: 'deletion', of: g } }
	/ "+" i:insertable { return { type: 'insertion', of: i } }
	/ g:gene_feature ">>" { return { type: 'insertion', of: g, multiple: true } }
	/ g:gene_feature ">" { return { type: 'upRegulation', of: g, } }
	/ i:insertable { return { type: 'insertion', of: i } }

insertable
    = insertable_item
    / "(" item:insertable_item ")" { return item }
    / "(" set:insertable_item_set ")" { return set }

insertable_item_set
	= start:(i:insertable_item list_separator { return i })* last:insertable_item { return start.concat(last) }
        / i:insertable_item { return [i] }

insertable_item
	= phenotype
        / fusion
        / feature

fusion
	= start:(f:feature ":" { return f })+ last:feature { return { fusion: start.concat(last) } }


// TODO: p.promoter, t.terminator,

feature
	= type:$([PTpt]) "." name:identifier { return { feature: { name: name, type: {
               t: 'terminator', 
               p: 'promoter' }[type.toLowerCase()] }}}
	/ g:gene_feature


gene_feature
        = o:organism "/" g:gene_feature_pt2 range:range? { 
            g.range = range; 
            g.feature.organism = o; 
            return g }
        / g:gene_feature_pt2 range:range? { g.range = range; return g }

gene_feature_pt2
   	= "#" a:accession { return { feature: { accession: a } } }
	/ n:gene v:variant "#" a:accession { return { feature: { name: n, variant: v, accession: a, type: 'gene' } } }
	/ n:gene "#" a:accession { return { feature: { name: n, accession: a, type: 'gene' } } }
	/ n:gene v:variant { return { feature: { name: n, variant: v, type: 'gene' } } }
	/ n:gene { return { feature: { name: n, typeHint: 'gene' } } }


// TODO negative ranges?

range = "[" type:range_sequence_type? start:integer "_" end:integer "]" { return {type: type || 'coding', start: start, end: end} }
      / "[" type:range_sequence_type? pos:integer "]" { return {type: type || 'coding', start: pos, end: pos} }

range_sequence_type = (type:$([cp]) ".") { return {c: 'coding', p: 'protein'}[type] }

vector
    = v:integrated_vector "::" marker:identifier "+" { v.marker = marker; return v }
    / e:episome "::" marker:identifier "+" { e.marker = marker; return e }
    / v:integrated_vector
    / e:episome

integrated_vector
   = site:identifier "::" name:identifier? "(" contents:insertable_item_set ")" { return { type: 'integrated-vector', contents: contents, name: name, site: site }}
   / site:identifier "::" name:identifier "()" { return { type: 'integrated-vector', site: site, contents: undefined }}

episome
   = name:identifier? "(" contents:insertable_item_set ")" { return { type: 'episome', name: name, contents: contents } }
   / name:identifier "()" { return { type: 'episome', name: name, contents: undefined }}

gene
    = $([a-zA-Z0-9]+)

phene
    = $([A-Z][a-zA-Z0-9]+)

organism
    = $([a-zA-Z0-9]+("."[a-zA-Z0-9]+)?)


variant
    = "(" variant:identifier ")" { return variant }

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


/*
 * types
 *  fusion
 *  range
 *  feature<type, variant>
 *  Phene<variant>
 * integrated vector/plasmid
 * episome/plasmid
 *
 *
 *
 * marker
 */