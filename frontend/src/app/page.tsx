import { getQueryClient, trpc } from "@/trpc/server";
import HomePage from "@/modules/ui/home-view";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { HomePageSkeleton } from "@/modules/ui/home-skeleton";

const Page = async () => {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.data.getAvailableGenomes.queryOptions());
  void queryClient.prefetchQuery(trpc.data.getGenomeChromosomes.queryOptions({ genomeId: "hg38" }));
  void queryClient.prefetchQuery(trpc.data.searchGenes.queryOptions({
    query: "BRCA1",
    genome: "hg38",
  }));
  void queryClient.prefetchQuery(trpc.data.searchGenes.queryOptions({
    query: "chr1",
    genome: "hg38",
  }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePage />
      </Suspense>
    </HydrationBoundary>
  );
}

export default Page;