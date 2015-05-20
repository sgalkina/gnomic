# Genotype.js

This library describes a genotype and phenotype definition language and parser for microbial strains. 


## Purpose

The purpose of the language is to provide a clear, unambiguous, human and machine readable, genotype definition format at a resonable granularity, while making the information expressed in the genotype definitions accessible to different stakeholders of the genome engineering process, who might focus on different subsets of the whole genotype definition for their own work.

### Typical stakeholders

- Modelers: care mostly about what genes where added or deleted or over and underexpressed
- Cultivators: care mostly about required supplements as described by the Phenotype
- Genome Engineers: care about everything at the lowest level



## Language definition

The language consists of **a *space-* or *comma-*separated list** of genotype or phenotype designations described using the following nomenclature:

Designation                                 | Language expression
------------------------------------------- | -------------------------
`gene` deleted                              | ``-gene``
`gene` inserted                             | ``gene`` or ``+gene``
`gene` of `organism`                        | ``organism/gene``
`gene` with mutation designation            | ``gene(mutation-designation)``
`gene` with accession number                | ``gene#GB:123456``
`gene` from accession number                | ``#GB:123456``
fusion of `feature1` and `feature2`         | ``feature1:feature2``
`gene` with `promoter`                      | ``promoter:gene``
`gene` with `promoter` & `terminator`       | ``promoter:gene:terminator``
`gene` inserted at `site`                  | ``site::gene``
`site` replaced with `gene`                | ``-site::gene``
`site` substituted with `gene`             | ``site>gene`` (equivalent to replaced)
`site` occuring multiple times substituted with `gene` | ``site>>gene``
`gene` inserted at `site` using `Marker`   | ``site::gene::Marker+``
`Phenotype`: wild-type                      | ``Phene+`` or ``Phene(wild-type)``
`Phenotype`: mutant                         | ``Phene-`` or ``Phene`` or ``Phene(mutant)``
`Phenotype` or `Marker` of a certain source organism | `organism/Phene+` or `organism/Marker+`
`selection marker` used                     | ``Marker+``
`selection marker` available                | ``Marker-``
a non-integrated episome | ``(<feature, [...]>)``
episome with selection marker | ``(<feature, [...]>)::Marker+``
integrated vector with mandatory integration site | ``site::(<feature, [...]>)``
nucleotide range of a `feature` | ``feature[startBase_endBase]``
coding nucleotide range of a `gene` | ``gene[c.startBase_endBase]``
named `vector` containing `geneA` and `geneB` integrated at `site` | ``site::vector(geneA geneB)``

### Proposed Excel- and File-safe extensions

Designation                                 | Language expression
------------------------------------------- | -------------------------
Excel & file-safe insertion, deletion or replacement          | `insert_gene` (eqv. `+gene`), `delete_gene` (eqv. ``-gene``), `replace_site::gene` (eqv. `-site::gene`)
File-safe use of loci and markers           | `insert_gene_at_site_using_markers` (eqv. `+site::gene::marker`), `replace_site_with_gene` or `-site_with_gene` (eqv. `-site::gene`)
File-save spaces between statements | `insert_gene1___delete_gene2` (eqv. `+gene1, -gene2`)

### Proposed language additions 

Designation                                 | Language expression
------------------------------------------- | -------------------------
feature name containing spaces or underscores | e.g. `"some feature name"` or `{some feature name}`


### Ambiguity

This language definition alone does not avoid all ambiguity in the specification. The following assumptions and
guidelines apply:

- Phenotypes must always end with `+` or `-` or a custom type designation.
- Lower-case names are assumed to be genes or other features
- Accessions must be database cross references in the format ``DATABASE:ID``.
- A standard for identifying promoters, terminators and other features should be employed on an organizational level; possibly through a consistent prefix. e.g. `P.XYZ` for promoters.

### Language terms

Term           | Description
-------------- | --------------
``gene``       | a ``feature`` that is a gene
``feature``    | a named DNA sequence such as a gene, promoter, or terminator
``site``      | a ``feature`` (such as a ``gene``) with a specific location inside the genome of the original strain
``Phene``      | an identifier for a characteristic or trait which can be present in two or more designated variations
``Marker``     | a phenotype important for its role as a selection marker


## Examples

| Example code | Description                          |
| ------------------------------------- | ------------------------------------- |
| `X-1::(abcD defG)::M2, XII-2::hijK::M2, M3- ` | integrate vector containg `abcD` and `defG` at `X-1` using `M1` marker, insert `hijK` at `XII-2` using `M2` marker, state that `M3` marker is available (mutant) in strain
| `#SGD:YOR202W` | insertion of yeast gene 'YOR202W' referenced in the [Saccharomyces Genome Database (SGD)](http://www.yeastgenome.org/)|
| `-CAB5#SGD:YDR196C` | deletion of yeast gene 'YDR196C' with standard name 'GAB5' referenced in [SGD](http://www.yeastgenome.org/) ]|
| `+E.coli/abcD::Leu2+` | insertion of _E.coli_ gene 'abcD' using 'Leu2' selection marker 
| `-abcD` | deletion of feature 'abcD' in the parent strain |
| `+abcD::His5+` | insertion of feature 'abcD' using the 'His5' selection marker |
| `-efgH::abcD` | insertion of feature 'abcD' at the location of 'efgH', replacing (deleting) 'efgH' |
| `efgH::abcD` | insertion of feature 'abcD' at the location of 'efgH' |
| `abcD(cr)` | insertion of gene 'abcD' with 'cr' (i.e. cold-resistant) mutation |
| `Pmtr:abcD:Trmt` | insertion of the fusion of features 'Pmtr', 'abcD', 'Trmt' with implied types of 'promotor', 'gene' and 'terminator' |
| `abcD:efgH:His5+` | insertion of genes 'abcD' and 'efgH' next to each other using the 'His5' selection marker |
| `Abc+` | Abc wild-type phenotype |
| `Abc-` | Abc mutant phenotype |
| `-loxP:KanMX:loxP::loxP` | Replacement of `loxP:KanMX:loxP` with `loxP`| 
| `X-1::p123(geneA, geneB)::KanMX+` | Integration of `p123` containing `geneA` and `geneB` at `X-1` using `KanMX` marker |
 

## JSON format

TODO

## Planned features

- Automatic resolution & validation hooks for feature names, insertion sites, mutations, phenotypes, markers
- JSON schema
- Views over parts of the genotype information, e.g. markers, added/deleted, sites.
- NPM package

## Contributions

Are very welcome. Please contact the author (Lars Schöning) if you would like to propose on any significant/breaking changes.

## References


- [Wikipedia -- Bacterial genetic nomenclature](http://en.wikipedia.org/wiki/Bacterial_genetic_nomenclature)
- [Journal of Bacteriology -- Instructions to Authors](http://jb.asm.org/site/misc/journal-ita_nom.xhtml#03)
- [Human Genome Variation Society -- Recommendations for the description of sequence variants](http://www.hgvs.org/mutnomen/recs.html)
- [Databases cross-referenced in UniProtKB](http://www.uniprot.org/docs/dbxref)