"use client";

import type { GeneBounds, ClinvarVariant, GeneFromSearch } from "@/modules/schema";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  getClassificationColorClasses,
  getNucleotideColorClass,
} from "@/utils/coloring";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

export interface VariantAnalysisHandle {
  focusAlternativeInput: () => void;
}

interface VariantAnalysisProps {
  gene: GeneFromSearch;
  genomeId: string;
  chromosome: string;
  clinvarVariants: Array<ClinvarVariant>;
  referenceSequence: string | null;
  sequencePosition: number | null;
  geneBounds: GeneBounds | null;
}

const VariantAnalysis = forwardRef<VariantAnalysisHandle, VariantAnalysisProps>((
  {
    gene,
    genomeId,
    chromosome,
    clinvarVariants = [],
    referenceSequence,
    sequencePosition,
    geneBounds,
  }: VariantAnalysisProps,
  ref,
) => {
  const trpc = useTRPC()
  const [variantPosition, setVariantPosition] = useState<string>(geneBounds?.min?.toString() || "");
  const [variantReference, setVariantReference] = useState("");
  const [variantAlternative, setVariantAlternative] = useState("");
  const [variantError, setVariantError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [shouldAnalyze, setShouldAnalyze] = useState(false);


  const alternativeInputRef = useRef<HTMLInputElement>(null);

  const queryParams = {
    position: parseInt(variantPosition.replaceAll(",", "")),
    alternative: variantAlternative,
    chromosome,
    genomeId,
  };

  const { data: variantResult, error, isLoading, refetch } = useQuery(trpc.data.analyzeVariant.queryOptions(
    {
      alternative: queryParams.alternative,
      position: queryParams.position,
      genomeId: queryParams.genomeId,
      chromosome: queryParams.chromosome
    },
    {
      enabled: shouldAnalyze && isValidated && !isNaN(queryParams.position) && variantAlternative.length === 1 && /^[ATGC]$/.test(variantAlternative),
      retry: false,
    }
  ));

  useImperativeHandle(ref, () => ({
    focusAlternativeInput: () => {
      if (alternativeInputRef.current) {
        alternativeInputRef.current.focus();
      }
    },
  }));

  useEffect(() => {
    if (sequencePosition && referenceSequence) {
      setVariantPosition(String(sequencePosition));
      setVariantReference(referenceSequence);
    }
  }, [sequencePosition, referenceSequence]);

  useEffect(() => {
    if (error) {
      setVariantError(error.message);
    }
  }, [error]); const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVariantPosition(e.target.value);
    setVariantReference("");
    setIsValidated(false);
    setShouldAnalyze(false);
  };

  const handleVariantVerify = () => {
    const position = parseInt(variantPosition.replaceAll(",", ""));

    if (isNaN(position)) {
      setVariantError("Please enter a valid position number");
      setIsValidated(false);
      return;
    }

    if (!/^[ATGC]$/.test(variantAlternative)) {
      setVariantError("Nucleotides must be A, C, G or T");
      setIsValidated(false);
      return;
    }

    setVariantError(null);
    setIsValidated(true);
  }; const handleVariantAnalyze = async () => {
    if (!isValidated) {
      handleVariantVerify();
      return;
    }

    setShouldAnalyze(true);

    try {
      await refetch();
    } catch (err) {
      console.error(err);
      setVariantError("Failed to analyze variant");
      setShouldAnalyze(false);
    }
  }; useEffect(() => {
    setIsValidated(false);
    setShouldAnalyze(false);
  }, [variantPosition, variantAlternative]);

  return (
    <Card className="gap-0 border-none bg-white py-0 shadow-sm">
      <CardHeader className="pt-4 pb-2">
        <CardTitle className="text-sm font-normal text-[#3c4f3d]/70">
          Variant Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="mb-4 text-xs text-[#3c4f3d]/80">
          Predict the impact of genetic variants using the Evo2 deep learning
          model.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs text-[#3c4f3d]/70">
              Position
            </label>
            <Input
              value={variantPosition}
              onChange={handlePositionChange}
              className="h-8 w-32 border-[#3c4f3d]/10 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#3c4f3d]/70">
              Alternative (variant)
            </label>
            <Input
              ref={alternativeInputRef}
              value={variantAlternative} onChange={(e) => {
                const val = e.target.value.toUpperCase();
                if (val === "" || /^[ATGC]$/.test(val)) {
                  setVariantAlternative(val);
                }
                setIsValidated(false);
                setShouldAnalyze(false);
              }}
              className="h-8 w-32 border-[#3c4f3d]/10 text-xs"
              placeholder="e.g., T"
              maxLength={1}
            />
          </div>
          {variantReference && (
            <div className="mb-2 flex items-center gap-2 text-xs text-[#3c4f3d]">
              <span>Substitution</span>
              <span
                className={`font-medium ${getNucleotideColorClass(variantReference)}`}
              >
                {variantReference}
              </span>
              <span>→</span>
              <span
                className={`font-medium ${getNucleotideColorClass(variantAlternative)}`}
              >
                {variantAlternative ? variantAlternative : "?"}
              </span>
            </div>)}
          <div className="flex gap-2">
            <Button
              disabled={!variantPosition || !variantAlternative}
              variant="outline"
              className="h-8 cursor-pointer border-[#3c4f3d]/20 bg-white text-xs text-[#3c4f3d] hover:bg-[#3c4f3d]/10"
              onClick={handleVariantVerify}
            >
              {isValidated ? "✓ Verified" : "Verify"}
            </Button>
            <Button
              disabled={!isValidated || isLoading}
              className="h-8 cursor-pointer bg-[#3c4f3d] text-xs text-white hover:bg-[#3c4f3d]/90"
              onClick={handleVariantAnalyze}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-middle"></span>
                  Analyzing...
                </>
              ) : (
                "Analyze variant"
              )}
            </Button>
          </div>
        </div>

        {variantPosition &&
          clinvarVariants
            .filter(
              (variant) =>
                variant?.variation_type
                  ?.toLowerCase()
                  .includes("single nucleotide") &&
                parseInt(variant?.location?.replaceAll(",", "")) ===
                parseInt(variantPosition.replaceAll(",", "")),
            )
            .map((matchedVariant) => {
              const refAltMatch = matchedVariant.title.match(/(\w)>(\w)/);

              let ref = null;
              let alt = null;
              if (refAltMatch && refAltMatch.length === 3) {
                ref = refAltMatch[1];
                alt = refAltMatch[2];
              }

              if (!ref || !alt) return null;

              return (
                <div
                  key={matchedVariant.clinvar_id}
                  className="mt-4 rounded-md border border-[#3c4f3d]/10 bg-[#e9eeea]/30 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-[#3c4f3d]">
                      Known Variant Detected
                    </h4>
                    <span className="text-xs text-[#3c4f3d]/70">
                      Position: {matchedVariant.location}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-1 text-xs font-medium text-[#3c4f3d]/70">
                        Variant Details
                      </div>
                      <div className="text-sm">{matchedVariant.title}</div>
                      <div className="mt-2 text-sm">
                        {gene?.symbol} {variantPosition}{" "}
                        <span className="font-mono">
                          <span className={getNucleotideColorClass(ref)}>
                            {ref}
                          </span>
                          <span>{">"}</span>
                          <span className={getNucleotideColorClass(alt)}>
                            {alt}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-[#3c4f3d]/70">
                        ClinVar classification
                        <span
                          className={`ml-1 rounded-sm px-2 py-0.5 ${getClassificationColorClasses(matchedVariant.classification)}`}
                        >
                          {matchedVariant.classification || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="h-7 cursor-pointer border-[#3c4f3d]/20 bg-[#e9eeea] text-xs text-[#3c4f3d] hover:bg-[#3c4f3d]/10"
                        onClick={() => {
                          setVariantAlternative(alt);
                          setTimeout(() => handleVariantVerify(), 0);
                        }}
                      >
                        <Zap className="mr-1 inline-block h-3 w-3" />
                        Verify this Variant
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })[0]}          {variantError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-600">
                {variantError}
              </div>
            )}
        {isValidated && !variantError && !variantResult && (
          <div className="mt-4 rounded-md bg-green-50 p-3 text-xs text-green-700">
            ✓ Variant verified successfully. Click &quot;Analyze variant&quot; to proceed with analysis.
          </div>
        )}
        {variantResult && (
          <div className="mt-6 rounded-md border border-[#3c4f3d]/10 bg-[#e9eeea]/30 p-4">
            <h4 className="mb-3 text-sm font-medium text-[#3c4f3d]">
              Analysis Result
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2">
                  <div className="text-xs font-medium text-[#3c4f3d]/70">
                    Variant
                  </div>
                  <div className="text-sm">
                    {gene?.symbol} {variantResult.position}{" "}
                    <span className="font-mono">
                      {variantResult.reference}
                      {">"}
                      {variantResult.alternative}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#3c4f3d]/70">
                    Delta likelihood score
                  </div>
                  <div className="text-sm">
                    {variantResult.delta_score.toFixed(6)}
                  </div>
                  <div className="text-xs text-[#3c4f3d]/60">
                    Negative score indicates loss of function
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#3c4f3d]/70">
                  Prediction
                </div>
                <div
                  className={`inline-block rounded-lg px-3 py-1 text-xs ${getClassificationColorClasses(variantResult.prediction)}`}
                >
                  {variantResult.prediction}
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-[#3c4f3d]/70">
                    Confidence
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-[#e9eeea]">
                    <div
                      className={`h-2 rounded-full ${variantResult.prediction.toLowerCase().includes("pathogenic")
                        ? "bg-red-500"
                        : "bg-green-500"
                        }`}
                      style={{
                        width: `${variantResult.classification_confidence * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-[#3c4f3d]/70">
                    {Math.round(variantResult.classification_confidence * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
},
);

VariantAnalysis.displayName = "VariantAnalysis";

export default VariantAnalysis;