# Genotype.js

This library describes a genotype and phenotype definition language and parser for microbial strains. 

## Language definition

The language consists of a space or comma separated list of genotype or phenotype designations described using the following nomenclature:

Designation                                 | Language expression
------------------------------------------- | -------------------------
`gene` deleted                              | ``-gene``
`gene` inserted                             | ``gene`` or ``+gene``
`gene` of `organism`                        | ``organism/gene``
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
`gene` inserted at `locus` using `marker`   | ``locus::gene::marker*``
`Phenotype`: wild-type                      | ``Phene+`` or ``Phene(wild-type)``
`Phenotype`: mutant                         | ``Phene-`` or ``Phene`` or ``Phene(mutant)``
`selection marker` used                     | ``marker*``
`selection marker` available                | ``-marker*``
`designation` achieved using `marker`       | ``{designation}::marker*``


This language definition alone does not avoid all ambiguity in the specification. The following assumptions and
guidelines apply:

- Upper-case names are assumed to be phenotypes unless an accession number is given
- Lower-case names are assumed to be genes or other components unless an accession number is given
- Accessions are encouraged to be database cross references in the format ``DATABASE:ID``.

#### Language terms

Term           | Description
-------------- | --------------
``gene``       | a ``feature`` that is a gene
``feature``    | a named DNA sequence such as a gene, promoter, or terminator
``locus``      | a ``feature`` (typically a ``gene``) with a specific location inside the genome of the original strain
``Phene``      | an identifier for a characteristic or trait which can be present in two or more designated variations
``marker``     | a phenotype important for its role as a selection marker


#### Missing/not yet finalized

- gene organisms:
  - could instead be part of the mutation definition (e.g. `abcD(Ecoli)`)
  - Accession numbers would generally be preferred.
- reliable way to distinguish between gene and phenotype
  e.g. A phenotype must begin with an upper-case letter and/or be in the list of possible phenotypes.
- Use of `*` to distinguish markers from other phenotypes/loci is both required by the language definition to 
  avoid clashes with loci — and is easily forgotten
- accommodate different methods for down-regulation and possible required additional information


## Examples

| Example code | Description                          |
| ------------------------------------- | -------------------------------------------------------------- |
|                                       |                                      |
| `#SGD:YOR202W` | insertion of yeast gene 'YOR202W' referenced in the [Saccharomyces Genome Database (SGD)](http://www.yeastgenome.org/)|
| `-CAB5#SGD:YDR196C` | deletion of yeast gene 'YDR196C' with standard name 'GAB5' referenced in [SGD](http://www.yeastgenome.org/) ]|
| `-abcD` | deletion of feature 'abcD' in the parent strain |
| `+E.coli/abcD` | insertion of E.coli gene 'abcD' |
| `+abcD::His5*` | insertion of feature 'abcD' using the 'His5' selection marker |
| `-efgH::abcD` | insertion of feature 'abcD' at the location of 'efgH', replacing (deleting) 'efgH' |
| `efgH::abcD` | insertion of feature 'abcD' at the location of 'efgH' |
| `abcD(cr)` | insertion of gene 'abcD' with 'cr' (i.e. cold-resistant) mutation |
| `Pmtr:abcD:Trmt` | insertion of the fusion of features 'Pmtr', 'abcD', 'Trmt' with implied types of 'promotor', 'gene' and 'terminator' |
| `abcD:efgH:His5*` | insertion of genes 'abcD' and 'efgH' next to each other using the 'His5' selection marker |
| `Abc+` | Abc wild-type phenotype |
| `Abc-` | Abc mutant phenotype |


## JSON format

TODO

## Planned features

- Automatic resolution & validation hooks for feature names, mutations, phenotypes, markers
- JSON schema
- NPM package

## Contributions

Are very welcome. Please contact the author (Lars Schöning) if you would like to collaborate on any significant changes.

## References


- [Wikipedia -- Bacterial genetic nomenclature](http://en.wikipedia.org/wiki/Bacterial_genetic_nomenclature)
- [Journal of Bacteriology -- Instructions to Authors](http://jb.asm.org/site/misc/journal-ita_nom.xhtml#03)
- [Human Genome Variation Society -- Recommendations for the description of sequence variants](http://www.hgvs.org/mutnomen/recs.html)
- [Databases cross-referenced in UniProtKB](http://www.uniprot.org/docs/dbxref)
