"use client";

import { useTRPC } from "@/trpc/client";
import type { GeneFromSearch, ClinvarVariant } from "@/modules/schema";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { GeneInformation } from "./gene-information";
import { GeneSequence } from "./gene-sequence";
import KnownVariants from "./known-variant";
import { VariantComparisonModal } from "./variant-comparison-modal";
import VariantAnalysis, { type VariantAnalysisHandle } from "./variant-analysis";
import { useQuery } from "@tanstack/react-query";

interface GeneViewerProps {
    gene: GeneFromSearch;
    genomeId: string;
    onClose: () => void;
}

export default function GeneViewer({ gene, genomeId, onClose }: GeneViewerProps) {
    const trpc = useTRPC();

    const [queryStart, setQueryStart] = useState<number | null>(null);
    const [queryEnd, setQueryEnd] = useState<number | null>(null);
    const [comparisonVariant, setComparisonVariant] = useState<ClinvarVariant | null>(null);
    const [activeSequencePosition, setActiveSequencePosition] = useState<number | null>(null);
    const [activeReferenceNucleotide, setActiveReferenceNucleotide] = useState<string | null>(null);
    const variantAnalysisRef = useRef<VariantAnalysisHandle>(null);

    const { data } = useQuery(trpc.data.fetchGeneDetails.queryOptions({
        geneId: gene.gene_id || ""
    }, {
        enabled: !!gene.gene_id
    }));

    const geneDetail = data?.geneDetails || null;
    const geneBounds = data?.geneBounds || null;
    const initialRange = data?.initialRange || null;

    const actualStart = queryStart ?? initialRange?.start ?? 1;
    const actualEnd = queryEnd ?? initialRange?.end ?? 2;

    const { data: sequenceData, isLoading: isLoadingSequence, error: sequenceError } = useQuery(trpc.data.fetchGeneSequence.queryOptions(
        {
            chrom: gene.chrom,
            start: actualStart,
            end: actualEnd,
            genomeId,
        },
        {
            enabled: !!(gene.gene_id && (initialRange || (queryStart && queryEnd))),
        }
    ));

    const { data: clinvarQueryResult, refetch, isLoading: isLoadingVariants, error: variantsError } = useQuery(trpc.data.fetchClinvarVariants.queryOptions({
        genomeId,
        chrom: gene.chrom,
        geneBound: geneBounds ?? { max: 100, min: 0 },
    }, {
        enabled: !!gene.gene_id
    }));

    const clinvarVariants: ClinvarVariant[] = clinvarQueryResult ?? [];

    const updateClinvarVariant = (clinvar_id: string, updateVariant: ClinvarVariant) => {
        return clinvarVariants.map((v) =>
            v.clinvar_id === clinvar_id ? updateVariant : v
        );
    };

    const handleSequenceClick = (position: number, nucleotide: string) => {
        setActiveSequencePosition(position);
        setActiveReferenceNucleotide(nucleotide);
        window.scrollTo({ top: 0, behavior: "smooth" });
        variantAnalysisRef.current?.focusAlternativeInput();
    };

    const showComparison = (variant: ClinvarVariant) => {
        if (variant.evo2Result) {
            setComparisonVariant(variant);
        }
    };

    if (!gene.gene_id) {
        return (
            <div role="alert" className="p-4 text-red-500 bg-red-100 rounded">
                Error: the selected gene has no gene id.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer text-[#3c4f3d] hover:bg-[#e9eeea]/70"
                onClick={onClose}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to results
            </Button>

            <VariantAnalysis
                ref={variantAnalysisRef}
                gene={gene}
                genomeId={genomeId}
                chromosome={gene.chrom}
                clinvarVariants={clinvarVariants}
                referenceSequence={activeReferenceNucleotide}
                sequencePosition={activeSequencePosition}
                geneBounds={geneBounds}
            />

            <KnownVariants
                refreshVariants={refetch}
                showComparison={showComparison}
                updateClinvarVariant={updateClinvarVariant}
                clinvarVariants={clinvarVariants}
                isLoadingClinvar={isLoadingVariants}
                clinvarError={variantsError?.message || null}
                genomeId={genomeId}
                gene={gene}
            />

            <GeneSequence
                geneBounds={geneBounds}
                geneDetail={geneDetail}
                startPosition={queryStart?.toString() || initialRange?.start.toString() || ""}
                endPosition={queryEnd?.toString() || initialRange?.end.toString() || ""}
                onStartPositionChange={(value) => setQueryStart(value ? parseInt(value) : null)}
                onEndPositionChange={(value) => setQueryEnd(value ? parseInt(value) : null)}
                sequenceData={sequenceData?.sequence || ""}
                sequenceRange={sequenceData?.actualRange || null}
                isLoading={isLoadingSequence}
                error={sequenceError?.message || null}
                onSequenceClick={handleSequenceClick}
                maxViewRange={10000}
            />

            <GeneInformation
                gene={gene}
                geneDetail={geneDetail}
                geneBounds={geneBounds}
            />

            <VariantComparisonModal
                comparisonVariant={comparisonVariant}
                onClose={() => setComparisonVariant(null)}
            />
        </div>
    );
}