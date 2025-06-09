
"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Send, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { cn } from "@/lib/utils";

import { generateHindiParagraph, type GenerateHindiParagraphOutput } from '@/ai/flows/generateHindiParagraphFlow';
import { evaluateHindiTranslation, type EvaluateTranslationInput, type EvaluateTranslationOutput, type DetailedFeedbackItem } from '@/ai/flows/evaluateHindiTranslationFlow';

export default function TranslationPage() {
  const [hindiParagraph, setHindiParagraph] = useState<string | null>(null);
  const [userTranslation, setUserTranslation] = useState<string>('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluateTranslationOutput | null>(null);
  const [isLoadingParagraph, setIsLoadingParagraph] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const initialFetchDoneRef = useRef(false);

  const fetchNewParagraph = async () => {
    setIsLoadingParagraph(true);
    setEvaluationResult(null);
    setUserTranslation('');
    setError(null);
    try {
      const result: GenerateHindiParagraphOutput = await generateHindiParagraph({});
      setHindiParagraph(result.hindiParagraph);
    } catch (err) {
      console.error("Error fetching Hindi paragraph:", err);
      setError("Failed to fetch a new paragraph. Please try again.");
      setHindiParagraph("Failed to load paragraph.");
    } finally {
      setIsLoadingParagraph(false);
    }
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      fetchNewParagraph();
      initialFetchDoneRef.current = true;
    }
  }, []);

  const handleSubmitTranslation = async () => {
    if (!userTranslation.trim() || !hindiParagraph) {
      setError("Please enter your translation.");
      return;
    }
    setIsEvaluating(true);
    setEvaluationResult(null);
    setError(null);
    try {
      const input: EvaluateTranslationInput = {
        originalHindiParagraph: hindiParagraph,
        userEnglishTranslation: userTranslation,
      };
      const result: EvaluateTranslationOutput = await evaluateHindiTranslation(input);
      setEvaluationResult(result);
    } catch (err) {
      console.error("Error evaluating translation:", err);
      setError("Failed to evaluate your translation. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center space-y-6 pb-20">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">Hindi to English Translation</CardTitle>
          <CardDescription className="text-center">
            Translate the Hindi paragraph below into English. Focus on accuracy and natural phrasing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingParagraph ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading Hindi paragraph...</p>
            </div>
          ) : error && !hindiParagraph ? (
             <div className="text-center text-destructive p-4 border border-destructive rounded-md">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                <p>{error}</p>
             </div>
          ): (
            <Card className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="text-lg">Hindi Paragraph:</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed font-hindi" lang="hi" dir="ltr">{hindiParagraph}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <label htmlFor="translation-input" className="block text-sm font-medium text-foreground">
              Your English Translation:
            </label>
            <Textarea
              id="translation-input"
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              placeholder="Enter your English translation here..."
              rows={5}
              className="focus:border-primary focus:ring-primary"
              disabled={isLoadingParagraph || isEvaluating}
            />
          </div>

          {error && !evaluationResult && (
            <p className="text-sm text-destructive flex items-center gap-1.5"><AlertTriangle size={16}/> {error}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={fetchNewParagraph}
              disabled={isLoadingParagraph || isEvaluating}
              className="w-full sm:w-auto"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              New Paragraph
            </Button>
            <Button
              onClick={handleSubmitTranslation}
              disabled={isLoadingParagraph || isEvaluating || !userTranslation.trim() || !hindiParagraph}
              className="w-full sm:flex-grow bg-primary hover:bg-primary/90"
            >
              {isEvaluating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit Translation
            </Button>
          </div>
        </CardContent>
      </Card>

      {isEvaluating && (
         <div className="flex justify-center items-center h-24 w-full max-w-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Evaluating your translation...</p>
        </div>
      )}

      {evaluationResult && (
        <Card className="w-full max-w-2xl shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              {evaluationResult.isTranslationAccurate ? <CheckCircle className="text-success-foreground h-6 w-6" /> : <AlertTriangle className="text-warning-foreground h-6 w-6" />}
              Evaluation Result
            </CardTitle>
            <CardDescription>{evaluationResult.feedbackSummary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!evaluationResult.isTranslationAccurate && (!evaluationResult.detailedFeedbackItems || evaluationResult.detailedFeedbackItems.length === 0) && (
              <p className="text-sm text-info-foreground p-3 bg-info rounded-md border border-info-foreground/30">
                While the translation wasn't marked as fully accurate, no specific error points were highlighted. Try to review it for general meaning and flow.
              </p>
            )}
            {evaluationResult.detailedFeedbackItems && evaluationResult.detailedFeedbackItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-foreground">Detailed Feedback:</h3>
                {evaluationResult.detailedFeedbackItems.map((item, index) => (
                  <Card key={index} className={cn(
                    "border-l-4 p-4 shadow",
                    item.errorType === 'grammar' ? "border-error bg-error/10" :
                    item.errorType === 'vocabulary' ? "border-warning bg-warning/10" :
                    item.errorType === 'sentence_structure' ? "border-info bg-info/10" :
                    item.errorType === 'meaning_accuracy' ? "border-destructive bg-destructive/10" :
                    "border-muted bg-muted/10"
                  )}>
                    <CardContent className="p-0 space-y-1.5 text-sm">
                      {item.originalHindiSegment && (
                        <p><strong className="font-medium">Original Hindi:</strong> <span className="font-hindi" lang="hi" dir="ltr">"{item.originalHindiSegment}"</span></p>
                      )}
                      {item.userTranslationSegment && (
                        <p><strong className="font-medium">Your Translation:</strong> <span className="line-through text-muted-foreground">"{item.userTranslationSegment}"</span></p>
                      )}
                      <p><strong className="font-medium text-success-foreground">Suggestion:</strong> "{item.suggestedCorrection}"</p>
                      <p><Lightbulb size={14} className="inline mr-1 text-primary"/><strong>Explanation:</strong> {item.explanation}</p>
                      {item.errorType && (
                        <p className="text-xs capitalize"><strong className="font-medium">Area:</strong> {item.errorType.replace('_', ' ')}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {evaluationResult.isTranslationAccurate && (!evaluationResult.detailedFeedbackItems || evaluationResult.detailedFeedbackItems.length === 0) && (
                <p className="text-lg text-success-foreground p-3 bg-success rounded-md border border-success-foreground/30 flex items-center gap-2">
                    <CheckCircle size={20}/> Great job! Your translation seems accurate.
                </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
