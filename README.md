# Gnomic

GNOMIC is a software package and formal grammar for describing genotypes and phenotypes of microbial strains.

The gnomic grammar is designed to provide a clear, unambiguous, human and machine readable, genotype definition
notation with flexibility in the level of detail of the definition.


## Usage

TODO

## Grammar definition

The grammar consists of **a *space-* or *comma-*separated list** of genotype or phenotype designations described using the following nomenclature:

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
a non-integrated episome | ``episome{}` or ``episome{feature, [...]}``
episome with selection marker | ``episome{feature, [...]}::marker+``
integrated vector with mandatory integration site | ``+site::vector{feature, [...]}``
nucleotide range of a `feature` | ``feature[startBase_endBase]``
coding nucleotide range of a `gene` | ``gene[c.startBase_endBase]``
protein amino-acid range of a `gene` | ``gene[p.startAA_endAA]``
protein amino-acid of a `gene` | ``gene[p.base]``		+protein AA of a `gene` | ``gene[p.AA]``

### Potential Excel- and File-safe extensions

Designation                                 | Grammar expression
------------------------------------------- | -------------------------
Excel & file-safe insertion, deletion or replacement          | `insert_gene` (eqv. `+gene`), `delete_gene` (eqv. ``-gene``), `replace_site_gene` (eqv. `site>gene`)
File-safe use of loci and markers           | `insert_gene_at_site_using_markers` (eqv. `+site::gene::marker`)
File-save spaces between statements | `insert_gene1__delete_gene2` (eqv. `+gene1, -gene2`)

### Proposed grammar additions

Designation                                 | Grammar expression
------------------------------------------- | -------------------------
feature name containing spaces or underscores | e.g. `"some feature name"` or `'some feature name'`

### Ambiguity

This grammar definition alone does not avoid all ambiguity in the specification. The following assumptions and
guidelines apply:

- Phenotypes must always end with `+` or `-` or a custom type designation. The grammar makes no distinction between a specific
  variant of a gene, and a phenotype.
- Accessions must be database cross references in the format ``DATABASE:ID`` or ``ID``, where the ID then must belong to the own organization.
- A standard for identifying promoters, terminators and other features should be employed on an organizational level; possibly through a consistent prefix. e.g. `p.xyz` for promoters, ``t.xyz`` for terminators.

### Grammar terms

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
| `X-1>{abcD defG}::M2+, XII-2>hijK::M2+, M3- ` | integrate vector containg `abcD` and `defG` at `X-1` using `M1` marker, insert `hijK` at `XII-2` using `M2` marker, state that `M3` marker is available (mutant) in strain
| `#SGD:YOR202W` | insertion of yeast gene 'YOR202W' referenced in the [Saccharomyces Genome Database (SGD)](http://www.yeastgenome.org/)|
| `-CAB5#SGD:YDR196C` | deletion of yeast gene 'YDR196C' with standard name 'GAB5' referenced in [SGD](http://www.yeastgenome.org/) ]|
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
| `-loxP:KanMX:loxP::loxP` | Replacement of `loxP:KanMX:loxP` with `loxP`|
| `X-1>p123{geneA geneB}::KanMX+` | Integration of `p123` containing `geneA` and `geneB` at `X-1` using `KanMX` marker |

## JSON-representation

TODO

## Planned features

- Automatic resolution & validation hooks for feature names, insertion sites, mutations, phenotypes, markers
- JSON schema
- Views over parts of the genotype information, e.g. markers, added/deleted, sites.

## Contributions

Contributions are very welcome. Please create an issue or contact the author (Lars Schöning) if you would like to propose any significant/breaking changes.

## References

- [Wikipedia -- Bacterial genetic nomenclature](http://en.wikipedia.org/wiki/Bacterial_genetic_nomenclature)
- [Journal of Bacteriology -- Instructions to Authors](http://jb.asm.org/site/misc/journal-ita_nom.xhtml#03)
- [Human Genome Variation Society -- Recommendations for the description of sequence variants](http://www.hgvs.org/mutnomen/recs.html)
- [Databases cross-referenced in UniProtKB](http://www.uniprot.org/docs/dbxref)
