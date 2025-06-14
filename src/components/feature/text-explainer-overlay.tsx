
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { analyzeArticleSentences, type AnalyzeArticleSentencesOutput, type AnalyzeArticleSentencesInput } from "@/ai/flows/analyzeArticleSentencesFlow";
import { explainText, type ExplainTextInput, type ExplainTextOutput } from '@/ai/flows/explainTextFlow';

interface TextExplainerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'sentenceAnalysis' | 'wordExplanation' | null;
  articleContentForAnalysis: string | null;
  wordToExplain: string | null;
  wordContextSentence: string | null;
  articleId: string | null; 
}

export function TextExplainerOverlay({
  isOpen,
  onClose,
  mode,
  articleContentForAnalysis,
  wordToExplain,
  wordContextSentence,
  articleId,
}: TextExplainerOverlayProps) {
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const [internalScrollTop, setInternalScrollTop] = useState(0);

  const [sentenceAnalysisResult, setSentenceAnalysisResult] = useState<AnalyzeArticleSentencesOutput | null>(null);
  const [isLoadingSentenceAnalysis, setIsLoadingSentenceAnalysis] = useState(false);
  const [sentenceAnalysisError, setSentenceAnalysisError] = useState<string | null>(null);

  const [wordExplanationResult, setWordExplanationResult] = useState<ExplainTextOutput | null>(null);
  const [isLoadingWordExplanation, setIsLoadingWordExplanation] = useState(false);
  const [wordExplanationError, setWordExplanationError] = useState<string | null>(null);

  const analysisTriggeredForArticleIdRef = useRef<string | null>(null);
  const explanationTriggeredForWordRef = useRef<string | null>(null);

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
      setSentenceAnalysisResult(null);
      setSentenceAnalysisError(null);
      setIsLoadingSentenceAnalysis(false);
      setWordExplanationResult(null);
      setWordExplanationError(null);
      setIsLoadingWordExplanation(false);
      analysisTriggeredForArticleIdRef.current = null;
      explanationTriggeredForWordRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scrollableContentRef.current) {
        scrollableContentRef.current.scrollTop = 0;
        setInternalScrollTop(0);
    }
  }, [articleId, wordToExplain, mode, isOpen]);


  useEffect(() => {
    if (isOpen && mode === 'sentenceAnalysis' && articleContentForAnalysis && articleId && analysisTriggeredForArticleIdRef.current !== articleId) {
      const fetchAnalysis = async () => {
        setIsLoadingSentenceAnalysis(true);
        setSentenceAnalysisResult(null);
        setSentenceAnalysisError(null);
        setWordExplanationResult(null); 
        analysisTriggeredForArticleIdRef.current = articleId;
        explanationTriggeredForWordRef.current = null;
        try {
          const input: AnalyzeArticleSentencesInput = { articleContent: articleContentForAnalysis };
          const result = await analyzeArticleSentences(input);
          setSentenceAnalysisResult(result);
        } catch (error) {
          console.error("Error analyzing article sentences:", error);
          setSentenceAnalysisError(error instanceof Error ? error.message : "Failed to analyze sentences.");
        } finally {
          setIsLoadingSentenceAnalysis(false);
        }
      };
      fetchAnalysis();
    }
  }, [isOpen, mode, articleContentForAnalysis, articleId]);

  useEffect(() => {
    const uniqueWordContextKey = wordToExplain ? `${wordToExplain}-${wordContextSentence || ''}-${articleId}` : null;
    if (isOpen && mode === 'wordExplanation' && wordToExplain && uniqueWordContextKey && explanationTriggeredForWordRef.current !== uniqueWordContextKey) {
      const fetchExplanation = async () => {
        setIsLoadingWordExplanation(true);
        setWordExplanationResult(null);
        setWordExplanationError(null);
        setSentenceAnalysisResult(null); 
        explanationTriggeredForWordRef.current = uniqueWordContextKey;
        analysisTriggeredForArticleIdRef.current = null;

        try {
          const input: ExplainTextInput = { textToExplain: wordToExplain, contextSentence: wordContextSentence || undefined };
          const result = await explainText(input);
          setWordExplanationResult(result);
        } catch (error) {
          console.error("Error explaining text:", error);
          setWordExplanationError(error instanceof Error ? error.message : "Failed to explain text.");
        } finally {
          setIsLoadingWordExplanation(false);
        }
      };
      fetchExplanation();
    }
  }, [isOpen, mode, wordToExplain, wordContextSentence, articleId]);

  const handleRetrySentenceAnalysis = () => {
    if (articleContentForAnalysis && articleId) {
      analysisTriggeredForArticleIdRef.current = null; 
      const fetchAnalysis = async () => {
          setIsLoadingSentenceAnalysis(true);
          setSentenceAnalysisResult(null);
          setSentenceAnalysisError(null);
          analysisTriggeredForArticleIdRef.current = articleId;
          try {
            const input: AnalyzeArticleSentencesInput = { articleContent: articleContentForAnalysis };
            const result = await analyzeArticleSentences(input);
            setSentenceAnalysisResult(result);
          } catch (error) {
            console.error("Error analyzing article sentences:", error);
            setSentenceAnalysisError(error instanceof Error ? error.message : "Failed to analyze sentences.");
          } finally {
            setIsLoadingSentenceAnalysis(false);
          }
        };
      fetchAnalysis();
    }
  }

  const handleRetryWordExplanation = () => {
    if (wordToExplain) {
      explanationTriggeredForWordRef.current = null; 
       const fetchExplanation = async () => {
        setIsLoadingWordExplanation(true);
        setWordExplanationResult(null);
        setWordExplanationError(null);
        explanationTriggeredForWordRef.current = wordToExplain ? `${wordToExplain}-${wordContextSentence || ''}-${articleId}` : null;
        try {
          const input: ExplainTextInput = { textToExplain: wordToExplain, contextSentence: wordContextSentence || undefined };
          const result = await explainText(input);
          setWordExplanationResult(result);
        } catch (error) {
          console.error("Error explaining text:", error);
          setWordExplanationError(error instanceof Error ? error.message : "Failed to explain text.");
        } finally {
          setIsLoadingWordExplanation(false);
        }
      };
      fetchExplanation();
    }
  }

  const renderContent = () => {
    if (isLoadingSentenceAnalysis || isLoadingWordExplanation) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            {isLoadingSentenceAnalysis ? "Analyzing article sentences..." : "Explaining..."}
          </p>
        </div>
      );
    }

    if (mode === 'sentenceAnalysis') {
      if (sentenceAnalysisError) {
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-semibold mb-2">Sentence Analysis Failed</p>
            <p className="text-sm text-destructive-foreground text-center mb-4">{sentenceAnalysisError}</p>
            <Button variant="destructive" onClick={handleRetrySentenceAnalysis}>Try Again</Button>
          </div>
        );
      }
      if (sentenceAnalysisResult) {
        return (
          <div className="space-y-6">
            {sentenceAnalysisResult.analyses.length > 0 ? (
              sentenceAnalysisResult.analyses.map((item, index) => (
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
        );
      }
    }

    if (mode === 'wordExplanation') {
      if (wordExplanationError) {
        return (
          <div className="flex flex-col items-center justify-center h-full p-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-semibold mb-2">Explanation Failed</p>
            <p className="text-sm text-destructive-foreground text-center mb-4">{wordExplanationError}</p>
            <Button variant="destructive" onClick={handleRetryWordExplanation}>Try Again</Button>
          </div>
        );
      }
      if (wordExplanationResult) {
        return (
          <Card className="bg-card shadow-lg border border-border/70">
            <CardHeader className="pb-3 pt-4 px-4">
               <div className="flex items-center gap-2 text-primary font-semibold">
                <Info size={20}/>
                <h3 className="text-lg">Explanation for: <span className="italic">"{wordToExplain}"</span></h3>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm space-y-3">
              {wordExplanationResult.generalExplanation && (
                <p className="whitespace-pre-wrap break-words">{wordExplanationResult.generalExplanation}</p>
              )}
              
              {wordExplanationResult.contextualExplanation && (
                <div className="mt-2 p-3 rounded-lg shadow-sm bg-info text-info-foreground border border-info-foreground/30">
                  <strong className="font-semibold block mb-1 text-xs uppercase tracking-wider">Meaning in Context:</strong>
                  {wordExplanationResult.originalContextSentence && (
                    <p className="whitespace-pre-wrap break-words italic text-xs mb-1 text-info-foreground/80">
                      (Regarding the sentence: "{wordExplanationResult.originalContextSentence}")
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{wordExplanationResult.contextualExplanation}</p>
                </div>
              )}

              {wordExplanationResult.exampleSentences && wordExplanationResult.exampleSentences.length > 0 && (
                <div className="mt-2 p-3 rounded-lg shadow-sm bg-success text-success-foreground border border-success-foreground/30">
                  <strong className="font-semibold block mb-1 text-xs uppercase tracking-wider">Example Sentences:</strong>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {wordExplanationResult.exampleSentences.map((ex, idx) => (
                      <li key={idx} className="whitespace-pre-wrap break-words">{ex}</li>
                    ))}
                  </ul>
                </div>
              )}
              
               {!wordExplanationResult.generalExplanation && !wordExplanationResult.contextualExplanation && (!wordExplanationResult.exampleSentences || wordExplanationResult.exampleSentences.length === 0) && (
                 <p className="text-muted-foreground text-center py-5">No specific explanation details found for this word/phrase.</p>
               )}
            </CardContent>
          </Card>
        );
      }
    }

    if (!articleContentForAnalysis && !wordToExplain && !isLoadingSentenceAnalysis && !isLoadingWordExplanation) {
       return <p className="text-muted-foreground text-center py-10">Select an article or word to see details.</p>;
    }
    return null; 
  };


  return (
    <Sheet open={isOpen} onOpenChange={(openState) => { if (!openState) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-screen flex flex-col p-4 sm:p-6"
        onOpenAutoFocus={(e) => e.preventDefault()} 
      >
        <SheetHeader className="text-left mb-3 flex-shrink-0 border-b pb-3 pt-2">
          <SheetTitle className="text-lg font-semibold">
            {mode === 'sentenceAnalysis' ? 'Article Sentence Analysis' :
             mode === 'wordExplanation' && wordToExplain ? `Explanation: "${wordToExplain}"` :
             'Text Details'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {mode === 'sentenceAnalysis' ? 'Sentence-by-sentence breakdown and simple explanation.' :
             mode === 'wordExplanation' ? 'Definition, context, and examples for the selected text.' :
             'Detailed information about the article content.'}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollableContentRef} className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {renderContent()}
          {/* Removed "Scroll to the bottom to close" text */}
        </div>
      </SheetContent>
    </Sheet>
  );
}
