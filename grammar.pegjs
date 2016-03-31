
start
    = sep* changes:change_list sep* { return changes }

change_list
    = start:(c:change list_separator { return c })* last:change { return start.concat(last) }
    / c:change { return [c] }

change
    = insertion
    / replacement
    / deletion
    / episome
    / phene

insertion
    = "+" i:insertable m:marker? { return new types.Mutation(null, i, {marker: m}) }

replacement
    = s:feature ">" i:insertable m:marker? { return new types.Mutation(s, i, {marker: m}) }
    / s:feature ">>" i:insertable m:marker? { return new types.Mutation(s, i, {marker: m, multiple: true}) }

deletion
    = "-" d:insertable m:marker? { return new types.Mutation(d, null, {marker: m}) }

insertable
    = plasmid
    / fs:feature_set { return fs }
    / fusion
    / feature

episome
    = p:plasmid m:marker? { p.marker = m; return p }

plasmid
    = name:identifier fs:feature_set { return new types.Plasmid(name, {}, ...fs) }
    / name:identifier "{}" { return new types.Plasmid(name) }

marker = "::" m:phene { return m }

phene
    = o:feature_organism? name:identifier a:accession v:binary_variant {
        return new types.Phene(name, {accession: a, variant: v, organism: o})
    }
    / a:accession v:binary_variant {
        return new types.Phene(null, {accession: a, variant: v})
    }
    / o:feature_organism? name:identifier v:variant {
        return new types.Phene(name, {variant: v, organism: o})
    }

/* todo variant */

feature
    = o:feature_organism? name:identifier v:variant? a:accession? r:range? { return new types.Feature(name, {
                                                                       organism: o,
                                                                       accession: a,
                                                                       variant: v,
                                                                       range: r}) }
    / a:accession r:range? { return new types.Feature(null, {accession: a, range: r}) }

feature_organism
    = o:organism "/" { return new types.Organism(o) }

feature_set
    = "{" sep? start:(f:(fusion/feature) list_separator { return f })* last:(fusion/feature) sep? "}" { return start.concat(last) }
    / "{" sep?  f:(fusion/feature) sep? "}" { return [f] }

fusion
    = start:feature rest:(":" f:feature { return f })+ { return new types.Fusion(...[start].concat(rest)) }

variant
    = "(" v:variant_definition ")" { return v }
    / v:binary_variant { return v }

variant_definition
    = start:identifier rest:([,;] sep* v:identifier {return v})* { return [start].concat(rest).join(', ')}

binary_variant
    = "+" { return 'wild-type' }
    / "-" { return 'mutant' }

range = "[" level:range_sequence_level? start:integer "_" end:integer "]" { return new types.Range(start, end, level || 'coding') }
      / "[" level:range_sequence_level? pos:integer "]" { return new types.Range(pos, pos, level || 'coding') }

range_sequence_level = (type:$([cp]) ".") { return {c: 'coding', p: 'protein'}[type] }

accession
    = "#" db:database ":" id:(integer/identifier) { return new types.Accession(id, db); }
    / "#" id:(integer/identifier) { return new types.Accession(id); }

database
    = $([A-Za-z0-9]+([\-][A-Za-z0-9]+)*)

integer "integer"
    = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

identifier
    = $([A-Za-z0-9]+([_\-][A-Za-z0-9]+)*)

organism
    = $([a-zA-Z0-9]+("."[a-zA-Z0-9]+)?)

list_separator
    = sep* "," sep*
    / sep+

sep
    = [ \t]
