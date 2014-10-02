# Genotype.js

This library describes a genotype and phenotype definition language and parser for microbial strains. 


## Purpose

The purpose of the language is to provide a clear, unambiguous, human and machine readable, genotype definition format at a resonable granularity, while making the information expressed in the genotype definitions accessible to different stakeholders of the genome engineering process, who might focus on different subsets of the whole genotype definition for their own work.

### Typical stakeholders

- Modelers: care mostly about what genes where added or deleted or over and underexpressed
- Cultivators: care mostly about auxotrophies & prototrophies described in the Phenotype
- Genome Engineers: care about everything at the low level


## Language definition

The language consists of **a *space-* or *comma-*separated list** of genotype or phenotype designations described using the following nomenclature:

Designation                                 | Language expression
------------------------------------------- | -------------------------
`gene` deleted                              | ``-gene``
`gene` inserted                             | ``gene`` or ``+gene``
`gene` with mutation designation            | ``gene(mutation-designation)``
`gene` with accession number                | ``gene#GB:123456``
`gene` from accession number                | ``#GB:123456``
`gene` up-regulated                         | ``gene^``
`gene` up-regulated multiple insertion      | ``gene^^``
`gene` down-regulated                       | ``gene<``
fusion of `feature1` and `feature2`         | ``feature1:feature2``
`gene` with `promoter`                      | ``promoter:gene``
`gene` with `promoter` & `terminator`       | ``promoter:gene:terminator``
`gene` inserted at `locus`                  | ``locus::gene``
`locus` replaced with `gene`                | ``-locus::gene``
`gene` inserted at `locus` using `Marker`   | ``locus::gene::Marker+``
`Phenotype`: wild-type                      | ``Phene+`` or ``Phene(wild-type)``
`Phenotype`: mutant                         | ``Phene-`` or ``Phene`` or ``Phene(mutant)``
`Phenotype` or `Marker` of a certain source organism | `organism/Phene+` or `organism/Marker*`
`selection marker` used                     | ``Marker*``
`selection marker` available                | ``Marker*-``

### Proposed Excel- and File-safe extensions

Designation                                 | Language expression
------------------------------------------- | -------------------------
Excel & file-safe insertion, deletion or replacement          | `insert_gene` (eqv. `+gene`), `delete_gene` (eqv. ``-gene``), `replace_locus::gene` (eqv. `-locus::gene`)
File-safe use of loci and markers           | `insert_gene_at_locus_using_markers` (eqv. `+locus::gene::marker`), `replace_locus_with_gene` or `-locus_with_gene` (eqv. `-locus::gene`)
File-save spaces between statements | `insert_gene1___delete_gene2` (eqv. `+gene1, -gene2`)

### Proposed language additions 

Designation                                 | Language expression
------------------------------------------- | -------------------------
coding bases 123-345 of `gene` | `gene(c.123_345)` or `gene[c.123_345]`
coding bases 123-345 of `gene` with `cr` mutation designation | `gene(cr; c.123_345)` or `gene(cr)(c.123_345)` or `gene(cr)[c.123_345]`
feature name containing spaces or underscores | `"some feature name"` 

### Ambiguity

This language definition alone does not avoid all ambiguity in the specification. The following assumptions and
guidelines apply:

- Upper-case names are assumed to be phenotypes unless an accession number is given
- Lower-case names are assumed to be genes or other components unless an accession number is given
- Accessions are encouraged to be database cross references in the format ``DATABASE:ID``.
- The use of the marker designator `*` is only required if the marker is unknown to the implementation.
- A standard for identifying promoters, terminators and other features should be employed on an organizational level; possibly through a consistent prefix. e.g. `p.XYZ` for promoters.

### Language terms

Term           | Description
-------------- | --------------
``gene``       | a ``feature`` that is a gene
``feature``    | a named DNA sequence such as a gene, promoter, or terminator
``locus``      | a ``feature`` (typically a ``gene``) with a specific location inside the genome of the original strain
``Phene``      | an identifier for a characteristic or trait which can be present in two or more designated variations
``Marker``     | a phenotype important for its role as a selection marker


#### Missing/not yet finalized

- gene organisms:
  - could be part of the mutation definition (e.g. `abcD(Ecoli)`)
  - alternatively could do `Ecoli/abcD` 
  - Accession numbers would generally be preferred.
- reliable way to distinguish between gene and phenotype
  e.g. A phenotype must begin with an upper-case letter and/or be in the list of possible phenotypes.
- Use of `*` to distinguish markers from other phenotypes/loci is both required by the language definition to 
  avoid clashes with loci — and is easily forgotten
- accommodate different methods for down-regulation and possible required additional information


## Examples

| Example code | Description                          |
| ------------------------------------- | ------------------------------------- |
| `X-1::abcD:defG::M2, XII-2::hijK::M2, M3- ` | insert `abcD` and `defG` at `X-1` using `M1` marker, insert `hijK` at `XII-2` using `M2` marker, state that `M3` marker is available (mutant) in strain
| `#SGD:YOR202W` | insertion of yeast gene 'YOR202W' referenced in the [Saccharomyces Genome Database (SGD)](http://www.yeastgenome.org/)|
| `-CAB5#SGD:YDR196C` | deletion of yeast gene 'YDR196C' with standard name 'GAB5' referenced in [SGD](http://www.yeastgenome.org/) ]|
| `+E.coli/abcD::Leu2+` | insertion of _E.coli_ gene 'abcD' using 'Leu2' selection marker 
| `-abcD` | deletion of feature 'abcD' in the parent strain |
| `+abcD::His5+` | insertion of feature 'abcD' using the 'His5' selection marker |
| `-efgH::abcD` | insertion of feature 'abcD' at the location of 'efgH', replacing (deleting) 'efgH' |
| `efgH::abcD` | insertion of feature 'abcD' at the location of 'efgH' |
| `abcD(cr)` | insertion of gene 'abcD' with 'cr' (i.e. cold-resistant) mutation |
| `Pmtr:abcD:Trmt` | insertion of the fusion of features 'Pmtr', 'abcD', 'Trmt' with implied types of 'promotor', 'gene' and 'terminator' |
| `Abc+` | Abc wild-type phenotype |
| `Abc-` | Abc mutant phenotype |
| `-Abc::loxP:KanMX:loxP` | Deletion/disruption of `Abc` using a fusion of `loxP:KanMX:loxP` (XXX: this might rather be `-Abc::loxP::KanMX`, must verify)


## JSON format

TODO

## Planned features

- Automatic resolution & validation hooks for feature names, insertion sites, mutations, phenotypes, markers
- JSON schema
- Views over parts of the genotype information, e.g. markers, added/deleted, sites.
- NPM package

## Contributions

Are very welcome. Please contact the author (Lars Schöning) if you would like to collaborate on any significant changes.

## References


- [Wikipedia -- Bacterial genetic nomenclature](http://en.wikipedia.org/wiki/Bacterial_genetic_nomenclature)
- [Journal of Bacteriology -- Instructions to Authors](http://jb.asm.org/site/misc/journal-ita_nom.xhtml#03)
- [Human Genome Variation Society -- Recommendations for the description of sequence variants](http://www.hgvs.org/mutnomen/recs.html)
- [Databases cross-referenced in UniProtKB](http://www.uniprot.org/docs/dbxref)