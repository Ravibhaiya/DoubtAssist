
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { analyzeArticleSentences, type AnalyzeArticleSentencesOutput, type AnalyzeArticleSentencesInput } from "@/ai/flows/analyzeArticleSentencesFlow";

interface ArticleAnalysisOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string | null;
  articleContent: string | null; 
}

export function ArticleAnalysisOverlay({ 
  isOpen, 
  onClose, 
  articleId,
  articleContent 
}: ArticleAnalysisOverlayProps) {
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const [internalScrollTop, setInternalScrollTop] = useState(0);

  const [analysisResult, setAnalysisResult] = useState<AnalyzeArticleSentencesOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const analysisTriggeredForArticleIdRef = useRef<string | null>(null);


  useEffect(() => {
    const contentElement = scrollableContentRef.current;
    if (isOpen && contentElement) {
      contentElement.scrollTop = internalScrollTop;

      const handleScroll = () => {
        const currentScrollTop = contentElement.scrollTop;
        setInternalScrollTop(currentScrollTop); 

        if (contentElement.scrollHeight - currentScrollTop <= contentElement.clientHeight + 5) {
          onClose();
        }
      };
      contentElement.addEventListener("scroll", handleScroll);
      return () => {
        contentElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [isOpen, onClose, internalScrollTop]);

  useEffect(() => {
    if (!isOpen) {
      setInternalScrollTop(0);
      // Optionally reset analysis when closed if you don't want to persist it
      // setAnalysisResult(null); 
      // setAnalysisError(null);
      // setIsLoadingAnalysis(false);
      // analysisTriggeredForArticleIdRef.current = null;
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen && scrollableContentRef.current) {
        scrollableContentRef.current.scrollTop = 0;
        setInternalScrollTop(0);
    }
  }, [articleId, isOpen])

  useEffect(() => {
    if (isOpen && articleContent && articleId && analysisTriggeredForArticleIdRef.current !== articleId) {
      const fetchAnalysis = async () => {
        setIsLoadingAnalysis(true);
        setAnalysisResult(null);
        setAnalysisError(null);
        analysisTriggeredForArticleIdRef.current = articleId;
        try {
          const input: AnalyzeArticleSentencesInput = { articleContent };
          const result = await analyzeArticleSentences(input);
          setAnalysisResult(result);
        } catch (error) {
          console.error("Error analyzing article:", error);
          setAnalysisError(error instanceof Error ? error.message : "Failed to analyze article. Please try again.");
        } finally {
          setIsLoadingAnalysis(false);
        }
      };
      fetchAnalysis();
    } else if (isOpen && articleContent && articleId && analysisTriggeredForArticleIdRef.current === articleId && !analysisResult && !isLoadingAnalysis && !analysisError) {
      // This case might happen if analysis was reset upon close, and we need to re-fetch
      // Or simply do nothing if we want to persist results across open/close for the same article.
      // For now, let's assume if it was triggered and no result, it might be an error or still loading.
      // If result is already there, it won't re-trigger.
    }
  }, [isOpen, articleContent, articleId, analysisResult, isLoadingAnalysis, analysisError]);


  return (
    <Sheet open={isOpen} onOpenChange={(openState) => { if (!openState) onClose(); }}>
      <SheetContent 
        side="bottom" 
        className="h-screen flex flex-col p-4 sm:p-6"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="text-left mb-3 flex-shrink-0 border-b pb-3 pt-2">
          <SheetTitle className="text-lg font-semibold">Article Analysis</SheetTitle>
          {articleId && (
            <SheetDescription className="text-xs text-muted-foreground">
              Sentence-by-sentence breakdown and simple explanation.
            </SheetDescription>
          )}
        </SheetHeader>
        
        <div ref={scrollableContentRef} className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {isLoadingAnalysis && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing article sentences...</p>
            </div>
          )}

          {analysisError && !isLoadingAnalysis && (
            <div className="flex flex-col items-center justify-center h-full p-4 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive font-semibold mb-2">Analysis Failed</p>
              <p className="text-sm text-destructive-foreground text-center mb-4">{analysisError}</p>
              <Button 
                variant="destructive" 
                onClick={() => {
                   if (articleContent && articleId) {
                    analysisTriggeredForArticleIdRef.current = null; // Allow re-trigger
                    // Manually trigger refetch logic
                    const fetchAnalysis = async () => {
                        setIsLoadingAnalysis(true);
                        setAnalysisResult(null);
                        setAnalysisError(null);
                        analysisTriggeredForArticleIdRef.current = articleId;
                        try {
                          const input: AnalyzeArticleSentencesInput = { articleContent };
                          const result = await analyzeArticleSentences(input);
                          setAnalysisResult(result);
                        } catch (error) {
                          console.error("Error analyzing article:", error);
                          setAnalysisError(error instanceof Error ? error.message : "Failed to analyze article. Please try again.");
                        } finally {
                          setIsLoadingAnalysis(false);
                        }
                      };
                    fetchAnalysis();
                   }
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {analysisResult && !isLoadingAnalysis && !analysisError && (
            <div className="space-y-6">
              {analysisResult.analyses.length > 0 ? (
                analysisResult.analyses.map((item, index) => (
                  <Card key={index} className="bg-card shadow-lg border border-border/70">
                    <CardHeader className="pb-3 pt-4 px-4">
                      <p className="text-sm text-muted-foreground italic leading-relaxed">
                        &ldquo;{item.originalSentence}&rdquo;
                      </p>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-sm text-primary font-semibold mb-1">Simple Explanation:</p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {item.simpleExplanation}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-10">No sentences were found or analyzed in this article.</p>
              )}
            </div>
          )}
          
          {/* Fallback for when no article content is provided, though should ideally not happen if button is shown only for articles */}
          {!articleContent && !isLoadingAnalysis && !analysisError && (
             <p className="text-muted-foreground text-center py-10">No article content to analyze.</p>
          )}

          {/* This ensures scrollability for the close-on-scroll-to-bottom feature even if content is short */}
          <div className="h-10"></div> 
          <p className="text-center text-xs text-muted-foreground py-4">Scroll to the bottom to close.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
