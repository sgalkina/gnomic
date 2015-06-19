# Gnomic

[![Build Status](https://travis-ci.org/biosustain/gnomic.svg?branch=master)](https://travis-ci.org/biosustain/gnomic)

Gnomic is a grammar for describing genotypes and phenotypes of microbial strains. It is designed to provide an unambiguous, human and machine readable genotype definition notation with flexibility in the level of detail of the definition. The `gnomic-grammar` NodeJS package contains methods for parsing and analysis of genotype definitions written in gnomic. 

## Installation

Install the `gnomic-grammar` package via NPM:

    npm install gnomic-grammar

## Usage

TODO

## Grammar

The grammar consists of a *space-* or *comma-*separated list of genotype or phenotype designations described using the following nomenclature:

Designation                                 | Grammar expression
------------------------------------------- | -------------------------
`feature` deleted                              | ``-feature``
`feature` inserted                             | ``+feature``
`feature` inserted at `site`                   | ``+site::feature``
`site` replaced with `feature`                 | ``site>feature``
multiple integration `site` replaced with `feature` | ``site>>feature``
`feature` of `organism`                        | ``organism/feature``
`feature` with mutation designation            | ``feature(mutation-designation)``
`feature` with accession number                | ``feature#GB:123456``
`feature` from accession number                | ``#GB:123456``
fusion of `feature1` and `feature2`         | ``feature1:feature2``
`fusion` inserted at `site` using `marker`   | ``site::fusion::marker+``
phenotype: wild-type                      | ``phene+`` or ``phene(wild-type)``
phenotype: mutant                         | ``phene-`` or ``phene`` or ``phene(mutant)``
selection marker: used (wild-type)         | ``marker+``
selection marker: available (missing/mutant) | ``marker-``
a non-integrated episome | ``episome{}`` or ``episome{feature, [...]}``
episome with selection marker | ``episome{feature, [...]}::marker+``
integrated vector with mandatory integration site | ``+site::vector{feature, [...]}``
nucleotide range of a `feature` | ``feature[startBase_endBase]``
coding nucleotide range of a `gene` | ``gene[c.startBase_endBase]``
protein amino-acid range of a `gene` | ``gene[p.startAA_endAA]``
protein amino-acid of a `gene` | ``gene[p.AA]``

### Term definitions

Term           | Description
-------------- | --------------
``gene``       | a ``feature`` that is a gene
``feature``    | a named DNA sequence such as a gene, promoter, or terminator
``site``      | a ``feature`` (such as a ``gene``) with a specific location inside the genome of the original strain
``phene``      | an identifier for a ``feature`` that comes with a variant definition.
``marker``     | a phenotype important for its role as a selection marker

## Examples

| Example code | Description                          |
| ------------------------------------- | ------------------------------------- |
| `X1>{abcD defG}::M2+, XII2>hijK::M2+, M3- ` | integrate vector containg `abcD` and `defG` at `X1` using `M1` marker, insert `hijK` at `XII2` using `M2` marker, state that `M3` marker is available (mutant) in strain
| `#SGD:YOR202W` | insertion of yeast gene 'YOR202W' referenced in the [Saccharomyces Genome Database (SGD)](http://www.yeastgenome.org/)|
| `-CAB5#SGD:YDR196C` | deletion of yeast gene 'YDR196C' with standard name 'CAB5' referenced in [SGD](http://www.yeastgenome.org/) |
| `+E.coli/abcD::Leu2+` | insertion of _E.coli_ gene 'abcD' using 'Leu2' selection marker
| `-abcD` | deletion of feature 'abcD' in the parent strain |
| `+abcD::His5+` | insertion of feature 'abcD' using the 'His5' selection marker |
| `efgH>abcD` | insertion of feature 'abcD' at the location of 'efgH', substituting (deleting) 'efgH' |
| `+efgH::abcD` | insertion of feature 'abcD' at the location of 'efgH' |
| `abcD(cr)` | insertion of gene 'abcD' with 'cr' (i.e. cold-resistant) mutation |
| `Pmtr:abcD:Trmt` | insertion of the fusion of features 'Pmtr', 'abcD', 'Trmt' with implied types of 'promotor', 'gene' and 'terminator' |
| `abcD:efgH:His5+` | insertion of genes 'abcD' and 'efgH' next to each other using the 'His5' selection marker |
| `Abc+` | Abc wild-type phenotype |
| `Abc-` | Abc mutant phenotype |
| `p123{}` | Plasmid `p123` present |
| `X1>p123{geneA geneB}::KanMX+` | Integration of `p123` containing `geneA` and `geneB` at `X1` using `KanMX` marker |

## JSON-representation

TODO

## Planned features

- Automatic resolution & validation hooks for feature names, insertion sites, mutations, phenotypes, markers
- JSON schema
- Views over parts of the genotype information, e.g. markers, added/deleted, sites.

## Contributions

Contributions are very welcome. Please create an issue or contact the author (Lars Schöning) if you would like to propose any significant/breaking changes. Let us know if you want to help us out with a Python version of the grammar.

## References

- [Wikipedia — Bacterial genetic nomenclature](http://en.wikipedia.org/wiki/Bacterial_genetic_nomenclature)
- [Journal of Bacteriology — Instructions to Authors](http://jb.asm.org/site/misc/journal-ita_nom.xhtml#03)
- [Human Genome Variation Society — Recommendations for the description of sequence variants](http://www.hgvs.org/mutnomen/recs.html)
- [Databases cross-referenced in UniProtKB](http://www.uniprot.org/docs/dbxref)
