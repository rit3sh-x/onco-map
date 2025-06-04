import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HomePageSkeleton() {
    return (
        <div className="min-h-screen bg-[#e9eeea]">
            <header className="border-b border-[#3c4f3d]/10 bg-white">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <h1 className="text-xl font-light tracking-wide text-[#3c4f3d]">
                                <span className="font-normal">ONCO</span>
                            </h1>
                            <div className="absolute -bottom-1 left-0 h-[2px] w-14 bg-[#de8246]"></div>
                        </div>
                        <span className="text-sm font-light text-[#3c4f3d]/70">
                            Variant Analysis
                        </span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-6">
                <Card className="mb-6 gap-0 border-none bg-white py-0 shadow-sm">
                    <CardHeader className="pt-4 pb-2">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-32 animate-pulse bg-gray-200 rounded"></div>
                            <div className="h-3 w-24 animate-pulse bg-gray-200 rounded"></div>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="h-9 w-full animate-pulse bg-gray-200 rounded border"></div>
                        <div className="mt-2 h-3 w-60 animate-pulse bg-gray-200 rounded"></div>
                    </CardContent>
                </Card>
                <Card className="mt-6 gap-0 border-none bg-white py-0 shadow-sm">
                    <CardHeader className="pt-4 pb-2">
                        <div className="h-4 w-16 animate-pulse bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <Tabs value="search">
                            <TabsList className="mb-4 bg-[#e9eeea]">
                                <TabsTrigger
                                    className="data-[state=active]:bg-white data-[state=active]:text-[#3c4f3d]"
                                    value="search"
                                >
                                    Search Genes
                                </TabsTrigger>
                                <TabsTrigger
                                    className="data-[state=active]:bg-white data-[state=active]:text-[#3c4f3d]"
                                    value="browse"
                                >
                                    Browse Chromosomes
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="search" className="mt-0">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <div className="relative flex-1">
                                            <div className="h-9 w-full animate-pulse bg-gray-200 rounded border"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 w-28 animate-pulse bg-gray-200 rounded"></div>
                                </div>
                            </TabsContent>
                        </Tabs>
                        <div className="flex h-48 flex-col items-center justify-center text-center">
                            <div className="mb-4 h-10 w-10 animate-pulse bg-gray-200 rounded-full"></div>
                            <div className="h-4 w-64 animate-pulse bg-gray-200 rounded"></div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}