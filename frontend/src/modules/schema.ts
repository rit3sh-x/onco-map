import { z } from "zod";

export const GenomeIdSchema = z.object({
  genomeId: z.string().min(1, "Genome ID is required"),
});

export const SearchGenesSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  genome: z.string().min(1, "Genome is required"),
});

export const GeneDetailsSchema = z.object({
  geneId: z.string().min(1, "Gene ID is required"),
});

export const GeneSequenceSchema = z.object({
  chrom: z.string().min(1, "Chromosome is required"),
  start: z.number().int().positive("Start position must be positive"),
  end: z.number().int().positive("End position must be positive"),
  genomeId: z.string().min(1, "Genome ID is required"),
});

export const ClinvarVariantsSchema = z.object({
  chrom: z.string().min(1, "Chromosome is required"),
  geneBound: z.object({
    min: z.number().int(),
    max: z.number().int(),
  }),
  genomeId: z.string().min(1, "Genome ID is required"),
});

export const AnalyzeVariantSchema = z.object({
  position: z.number().int().positive("Position must be positive"),
  alternative: z.string().min(1, "Alternative sequence is required"),
  genomeId: z.string().min(1, "Genome ID is required"),
  chromosome: z.string().min(1, "Chromosome is required"),
});

export const UcscGenomeInfoSchema = z.object({
  description: z.string().optional(),
  organism: z.string().optional(),
  sourceName: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export const UcscGenomesResponseSchema = z.object({
  ucscGenomes: z.record(z.string(), UcscGenomeInfoSchema),
});

export const UcscChromosomesResponseSchema = z.object({
  chromosomes: z.record(z.string(), z.number()),
});

export const UcscSequenceResponseSchema = z.object({
  dna: z.string().optional(),
  error: z.string().optional(),
});

export const NcbiGeneSearchResponseSchema = z.tuple([
  z.number(),
  z.unknown(),
  z.object({
    GeneID: z.array(z.string()).optional(),
  }),
  z.array(z.array(z.string())),
]).rest(z.any());

export const NcbiEsearchResponseSchema = z.object({
  esearchresult: z.object({
    idlist: z.array(z.string()),
  }).optional(),
});

export const NcbiGeneSummarySchema = z.object({
  summary: z.string().optional(),
  genomicinfo: z.array(z.object({
    chrstart: z.number(),
    chrstop: z.number(),
    strand: z.string().optional(),
  })).optional(),
  organism: z.object({
    scientificname: z.string(),
    commonname: z.string(),
  }).optional(),
});

export const NcbiEsummaryResponseSchema = z.object({
  result: z.record(z.string(), z.union([
    z.array(z.string()),
    NcbiGeneSummarySchema,
    z.object({
      title: z.string().optional(),
      variation_type: z.string().optional(),
      clinical_significance: z.string().optional(),
      gene_sort: z.string().optional(),
      chromosome: z.string().optional(),
      location: z.string().optional(),
    }),
  ])).optional(),
});

export const GenomeAssemblySchema = z.object({
  id: z.string(),
  name: z.string(),
  sourceName: z.string(),
  active: z.boolean(),
});

export const ChromosomeSchema = z.object({
  name: z.string(),
  size: z.number(),
});

export const GeneFromSearchSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  chrom: z.string(),
  description: z.string(),
  gene_id: z.string().optional(),
});

export const GeneDetailsFromSearchSchema = z.object({
  genomicinfo: z.array(z.object({
    chrstart: z.number(),
    chrstop: z.number(),
    strand: z.string().optional(),
  })).optional(),
  summary: z.string().optional(),
  organism: z.object({
    scientificname: z.string(),
    commonname: z.string(),
  }).optional(),
});

export const GeneBoundsSchema = z.object({
  min: z.number(),
  max: z.number(),
});

export const ClinvarVariantSchema = z.object({
  clinvar_id: z.string(),
  title: z.string(),
  variation_type: z.string(),
  classification: z.string(),
  gene_sort: z.string(),
  chromosome: z.string(),
  location: z.string(),
  evo2Result: z.object({
    prediction: z.string(),
    delta_score: z.number(),
    classification_confidence: z.number(),
  }).optional(),
  isAnalyzing: z.boolean().optional(),
  evo2Error: z.string().optional(),
});

export const AnalysisResultSchema = z.object({
  position: z.number(),
  reference: z.string(),
  alternative: z.string(),
  delta_score: z.number(),
  prediction: z.string(),
  classification_confidence: z.number(),
});

export type GenomeAssembly = z.infer<typeof GenomeAssemblySchema>;
export type Chromosome = z.infer<typeof ChromosomeSchema>;
export type GeneFromSearch = z.infer<typeof GeneFromSearchSchema>;
export type ClinvarVariant = z.infer<typeof ClinvarVariantSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type UcscGenomeInfo = z.infer<typeof UcscGenomeInfoSchema>;
export type NcbiGeneSummary = z.infer<typeof NcbiGeneSummarySchema>;
export type GenomeId = z.infer<typeof GenomeIdSchema>;
export type SearchGenes = z.infer<typeof SearchGenesSchema>;
export type GeneDetails = z.infer<typeof GeneDetailsSchema>;
export type GeneSequence = z.infer<typeof GeneSequenceSchema>;
export type ClinvarVariants = z.infer<typeof ClinvarVariantsSchema>;
export type AnalyzeVariant = z.infer<typeof AnalyzeVariantSchema>;
export type UcscGenomesResponse = z.infer<typeof UcscGenomesResponseSchema>;
export type UcscChromosomesResponse = z.infer<typeof UcscChromosomesResponseSchema>;
export type UcscSequenceResponse = z.infer<typeof UcscSequenceResponseSchema>;
export type NcbiGeneSearchResponse = z.infer<typeof NcbiGeneSearchResponseSchema>;
export type NcbiEsearchResponse = z.infer<typeof NcbiEsearchResponseSchema>;
export type NcbiEsummaryResponse = z.infer<typeof NcbiEsummaryResponseSchema>;
export type GeneDetailsFromSearch = z.infer<typeof GeneDetailsFromSearchSchema>;
export type GeneBounds = z.infer<typeof GeneBoundsSchema>;