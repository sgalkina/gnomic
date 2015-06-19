
start
    = sep* changes:change_list sep* { return changes }

change_list
    = start:(c:change list_separator { return c })* last:change { return start.concat(last) }
    / c:change { return [c] }

change
    = insertion
    / replacement
    / deletion
    / plasmid 
    / phene

insertion
    = "+" i:insertable m:marker? { return new types.Insertion(i, m) }

replacement
    = s:feature ">" i:insertable m:marker? { return new types.Replacement(s, i, m) }
    / s:feature ">>" i:insertable m:marker? { return new types.Replacement(s, i, m, true) }

deletion
    = "-" d:insertable m:marker? { return new types.Deletion(d, m) }

insertable
    = plasmid
    / fs:feature_set { return new types.Group(...fs) }
    / fusion
    / feature

plasmid
    = name:identifier fs:feature_set { return new types.Plasmid(name, null, null, ...fs) }
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
    = "{" start:(f:(fusion/feature) list_separator { return f })* last:(fusion/feature) "}" { return start.concat(last) }
    / "{" f:(fusion/feature) "}" { return [f] }

fusion
    = start:feature rest:(":" f:feature { return f })+ { return new types.Fusion(...[start].concat(rest)) }

variant
    = "(" v:identifier ")" { return v }
    / v:binary_variant { return v }

binary_variant
    = "+" { return 'wild-type' }
    / "-" { return 'mutant' }

range = "[" type:range_sequence_type? start:integer "_" end:integer "]" { return {type: type || 'coding', start: start, end: end} }
      / "[" type:range_sequence_type? pos:integer "]" { return {type: type || 'coding', start: pos, end: pos} }

range_sequence_type = (type:$([cp]) ".") { return {c: 'coding', p: 'protein'}[type] }

accession
    = "#" db:database ":" id:(integer/identifier) { return new types.Accession(id, db); }
    / "#" id:(integer/identifier) { return new types.Accession(id); }

database
    = $([A-Za-z0-9-][A-Za-z0-9]+)

integer "integer"
    = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

identifier
    = $([A-Za-z0-9]+([A-Za-z0-9_-]+[A-Za-z0-9])?)

organism
    = $([a-zA-Z0-9]+("."[a-zA-Z0-9]+)?)

list_separator
    = sep* "," sep*
    / sep+

sep
    = [ \t\r\n]
