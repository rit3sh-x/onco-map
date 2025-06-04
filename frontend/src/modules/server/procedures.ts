import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { GENOME_UCSC_URL } from "@/utils/constants";
import { EUTILS_NCBI_URL } from "@/utils/constants";
import { CLINICTABLES_URL } from "@/utils/constants";
import { VARIANT_ANALYSIS_MODAL_URL } from "@/utils/constants";
import {
    GenomeIdSchema,
    SearchGenesSchema,
    GeneDetailsSchema,
    GeneSequenceSchema,
    ClinvarVariantsSchema,
    AnalyzeVariantSchema,
    GenomeAssemblySchema,
    ChromosomeSchema,
    GeneFromSearchSchema,
    GeneDetailsFromSearchSchema,
    GeneBoundsSchema,
    ClinvarVariantSchema,
    AnalysisResultSchema,
    UcscGenomesResponseSchema,
    UcscChromosomesResponseSchema,
    UcscSequenceResponseSchema,
    NcbiGeneSearchResponseSchema,
    NcbiEsearchResponseSchema,
    NcbiEsummaryResponseSchema,
    type GenomeAssembly,
    type Chromosome,
    type GeneFromSearch,
    type ClinvarVariant,
    type UcscGenomeInfo,
    type NcbiGeneSummary
} from '../schema';

export const dataRouter = createTRPCRouter({
    getAvailableGenomes: baseProcedure
        .output(z.object({ genomes: z.record(z.array(GenomeAssemblySchema)) }))
        .query(async () => {
            try {
                const apiUrl = `${GENOME_UCSC_URL}/list/ucscGenomes`;
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to fetch genome list from UCSC API",
                    });
                }

                const rawData = await response.json();
                const genomeData = UcscGenomesResponseSchema.parse(rawData);

                if (!genomeData.ucscGenomes) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "UCSC API error: missing ucscGenomes",
                    });
                }

                const genomes = genomeData.ucscGenomes;
                const structuredGenomes: Record<string, GenomeAssembly[]> = {};

                for (const genomeId in genomes) {
                    const genomeInfo: UcscGenomeInfo = genomes[genomeId];
                    const organism = genomeInfo.organism || "Other";

                    if (!structuredGenomes[organism]) structuredGenomes[organism] = [];
                    structuredGenomes[organism].push({
                        id: genomeId,
                        name: genomeInfo.description || genomeId,
                        sourceName: genomeInfo.sourceName || genomeId,
                        active: !!genomeInfo.active,
                    });
                }
                return { genomes: structuredGenomes };
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch available genomes",
                });
            }
        }),

    getGenomeChromosomes: baseProcedure
        .input(GenomeIdSchema)
        .output(z.object({ chromosomes: z.array(ChromosomeSchema) }))
        .query(async ({ input }) => {
            try {
                const apiUrl = `${GENOME_UCSC_URL}/list/chromosomes?genome=${input.genomeId}`;
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to fetch chromosome list from UCSC API",
                    });
                }

                const rawData = await response.json();
                const chromosomeData = UcscChromosomesResponseSchema.parse(rawData);

                if (!chromosomeData.chromosomes) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "UCSC API error: missing chromosomes",
                    });
                }

                const chromosomes: Chromosome[] = [];
                for (const chromId in chromosomeData.chromosomes) {
                    if (chromId.includes("_") || chromId.includes("Un") || chromId.includes("random")) continue;
                    chromosomes.push({
                        name: chromId,
                        size: chromosomeData.chromosomes[chromId],
                    });
                }

                chromosomes.sort((a, b) => {
                    const anum = a.name.replace("chr", "");
                    const bnum = b.name.replace("chr", "");
                    const isNumA = /^\d+$/.test(anum);
                    const isNumB = /^\d+$/.test(bnum);
                    if (isNumA && isNumB) return Number(anum) - Number(bnum);
                    if (isNumA) return -1;
                    if (isNumB) return 1;
                    return anum.localeCompare(bnum);
                });
                return { chromosomes };
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch genome chromosomes",
                });
            }
        }),

    searchGenes: baseProcedure
        .input(SearchGenesSchema)
        .output(z.object({
            query: z.string(),
            genome: z.string(),
            results: z.array(GeneFromSearchSchema),
        }))
        .query(async ({ input }) => {
            try {
                const url = new URL("/api/ncbi_genes/v3/search", CLINICTABLES_URL);

                url.searchParams.set("terms", input.query);
                url.searchParams.set("df", "chromosome,Symbol,description,map_location,type_of_gene");
                url.searchParams.set("ef", "chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID");

                const response = await fetch(url.toString(), {
                    method: "GET",
                });
                if (!response.ok) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "NCBI API Error",
                    });
                }

                const rawData = await response.json();
                const data = NcbiGeneSearchResponseSchema.parse(rawData);
                const results: GeneFromSearch[] = [];

                if (data[0] > 0) {
                    const fieldMap = data[2];
                    const geneIds = fieldMap.GeneID || [];
                    for (let i = 0; i < Math.min(10, data[0]); ++i) {
                        if (i < data[3].length) {
                            const row = data[3][i];
                            results.push({
                                symbol: row[1] || "",
                                name: row[3] || "",
                                chrom: row[0] || "",
                                description: row[2] || "",
                                gene_id: geneIds[i] || undefined,
                            });
                        }
                    }
                }
                return { query: input.query, genome: input.genome, results };
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to search genes",
                });
            }
        }),

    fetchGeneDetails: baseProcedure
        .input(GeneDetailsSchema)
        .output(z.object({
            geneDetails: GeneDetailsFromSearchSchema.nullable(),
            geneBounds: GeneBoundsSchema.nullable(),
            initialRange: z.object({
                start: z.number(),
                end: z.number(),
            }).nullable(),
        }))
        .query(async ({ input }) => {
            try {
                const detailUrl = `${EUTILS_NCBI_URL}/esummary.fcgi?db=gene&id=${input.geneId}&retmode=json`;
                const detailsResponse = await fetch(detailUrl);

                if (!detailsResponse.ok) {
                    console.error(
                        `Failed to fetch gene details: ${detailsResponse.statusText}`,
                    );
                    return { geneDetails: null, geneBounds: null, initialRange: null };
                }

                const rawData = await detailsResponse.json();
                const detailData = NcbiEsummaryResponseSchema.parse(rawData);

                if (detailData.result && detailData.result[input.geneId]) {
                    const detail = detailData.result[input.geneId] as NcbiGeneSummary;

                    if (detail.genomicinfo && detail.genomicinfo.length > 0) {
                        const genomicInfo = detail.genomicinfo[0];
                        const chrstart = genomicInfo.chrstart;
                        const chrstop = genomicInfo.chrstop;
                        const strand = genomicInfo.strand;

                        const geneDetails = {
                            genomicinfo: [{
                                chrstart,
                                chrstop,
                                strand,
                            }],
                            summary: detail.summary,
                            organism: detail.organism ? {
                                scientificname: detail.organism.scientificname,
                                commonname: detail.organism.commonname,
                            } : undefined,
                        };

                        const geneBounds = {
                            min: Math.min(chrstart, chrstop),
                            max: Math.max(chrstart, chrstop),
                        };

                        const padding = Math.max(1000, Math.floor((geneBounds.max - geneBounds.min) * 0.1));
                        const initialRange = {
                            start: Math.max(1, geneBounds.min - padding),
                            end: geneBounds.max + padding,
                        };

                        return { geneDetails, geneBounds, initialRange };
                    }
                }

                return { geneDetails: null, geneBounds: null, initialRange: null };
            } catch {
                return { geneDetails: null, geneBounds: null, initialRange: null };
            }
        }),

    fetchGeneSequence: baseProcedure
        .input(GeneSequenceSchema)
        .output(z.object({
            sequence: z.string(),
            actualRange: z.object({
                start: z.number(),
                end: z.number(),
            }),
            error: z.string().optional(),
        }))
        .query(async ({ input }) => {
            try {
                const chromosome = input.chrom.startsWith("chr") ? input.chrom : `chr${input.chrom}`;

                const apiStart = input.start - 1;
                const apiEnd = input.end;
                const apiUrl = `${GENOME_UCSC_URL}/getData/sequence?genome=${input.genomeId};chrom=${chromosome};start=${apiStart};end=${apiEnd}`;
                const response = await fetch(apiUrl);
                const rawData = await response.json();
                const data = UcscSequenceResponseSchema.parse(rawData);

                const actualRange = { start: input.start, end: input.end };

                if (data.error || !data.dna) {
                    return { sequence: "", actualRange, error: data.error };
                }

                const sequence = data.dna.toUpperCase();

                return { sequence, actualRange };
            } catch {
                return {
                    sequence: "",
                    actualRange: { start: input.start, end: input.end },
                    error: "Internal error in fetch gene sequence",
                };
            }
        }),

    fetchClinvarVariants: baseProcedure
        .input(ClinvarVariantsSchema)
        .output(z.array(ClinvarVariantSchema))
        .query(async ({ input }) => {
            try {
                const minBound = Math.min(input.geneBound.min, input.geneBound.max);
                const maxBound = Math.max(input.geneBound.min, input.geneBound.max);
                const positionField = input.genomeId === "hg19" ? "chrpos37" : "chrpos38";
                const chromFormatted = input.chrom.replace(/^chr/i, "");

                const searchTerm = `${chromFormatted}[chromosome] AND ${minBound}:${maxBound}[${positionField}]`;

                const searchUrl = new URL(`${EUTILS_NCBI_URL}/esearch.fcgi`);
                searchUrl.search = new URLSearchParams({
                    db: "clinvar",
                    term: searchTerm,
                    retmode: "json",
                    retmax: "20",
                }).toString();

                const searchResponse = await fetch(searchUrl.toString(), {
                    method: "GET",
                });

                if (!searchResponse.ok) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "ClinVar search failed: " + searchResponse.statusText,
                    });
                }

                const rawSearchData = await searchResponse.json();
                const searchData = NcbiEsearchResponseSchema.parse(rawSearchData);

                if (!searchData.esearchresult || !searchData.esearchresult.idlist || searchData.esearchresult.idlist.length === 0) {
                    console.log("No ClinVar variants found");
                    return [];
                }
                const variantIds = searchData.esearchresult.idlist;
                const summaryUrl = new URL(`${EUTILS_NCBI_URL}/esummary.fcgi`);
                summaryUrl.search = new URLSearchParams({
                    db: "clinvar",
                    id: variantIds.join(","),
                    retmode: "json",
                }).toString();

                const summaryResponse = await fetch(summaryUrl.toString(), {
                    method: "GET",
                });

                if (!summaryResponse.ok) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to fetch variant details: " + summaryResponse.statusText,
                    });
                }

                const rawSummaryData = await summaryResponse.json();
                const variants: ClinvarVariant[] = [];

                if (rawSummaryData.result && rawSummaryData.result.uids) {
                    for (const id of rawSummaryData.result.uids) {
                        const variant = rawSummaryData.result[id];
                        variants.push({
                            clinvar_id: id,
                            title: variant.title,
                            variation_type: (variant.obj_type || "Unknown")
                                .split(" ")
                                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(" "),
                            classification: variant.germline_classification.description || "Unknown",
                            gene_sort: variant.gene_sort || "",
                            chromosome: chromFormatted,
                            location: variant.location_sort ? parseInt(variant.location_sort).toLocaleString() : "Unknown",
                        });
                    }
                }
                return variants;
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch ClinVar variants",
                });
            }
        }),

    analyzeVariant: baseProcedure
        .input(AnalyzeVariantSchema)
        .output(AnalysisResultSchema)
        .query(async ({ input }) => {
            try {
                if (!VARIANT_ANALYSIS_MODAL_URL) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Analysis API URL not configured",
                    });
                }
                
                const chromosome = input.chromosome.startsWith("chr") ? input.chromosome : `chr${input.chromosome}`;

                const response = await fetch(VARIANT_ANALYSIS_MODAL_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        variant_position: input.position,
                        alternative: input.alternative,
                        genome: input.genomeId,
                        chromosome: chromosome,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to analyze variant: " + errorText,
                    });
                }

                const rawData = await response.json();
                return AnalysisResultSchema.parse(rawData);
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to analyze variant",
                });
            }
        }),
});