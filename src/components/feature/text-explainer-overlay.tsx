
'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ExplainTextOutput } from '@/ai/flows/explainTextFlow';
import { Badge } from '@/components/ui/badge';

interface TextExplainerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  word: string | null;
  sentence: string | null;
  isLoading: boolean;
  explanationData: ExplainTextOutput | null;
}

const cardStyles = [
  'bg-blue-950/50 border-blue-800/70',
  'bg-purple-950/50 border-purple-800/70',
  'bg-green-950/50 border-green-800/70',
  'bg-rose-950/50 border-rose-800/70',
  'bg-teal-950/50 border-teal-800/70',
];

const LoadingState = () => (
  <div className="space-y-4 p-1">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className={'bg-surface-secondary/50 border-surface-secondary'}>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 bg-surface-secondary" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full bg-surface-secondary" />
          <Skeleton className="h-4 w-4/5 bg-surface-secondary" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const DataDisplay = ({ data }: { data: ExplainTextOutput }) => (
  <div className="space-y-4">
    <Card className={cardStyles[0]}>
      <CardHeader><CardTitle>General Meaning</CardTitle></CardHeader>
      <CardContent><p className="text-text-secondary">{data.generalExplanation}</p></CardContent>
    </Card>
    
    <Card className={cardStyles[1]}>
      <CardHeader><CardTitle>Meaning in Context</CardTitle></CardHeader>
      <CardContent><p className="text-text-secondary">{data.contextualExplanation}</p></CardContent>
    </Card>

    {data.synonyms?.length > 0 && (
      <Card className={cardStyles[2]}>
        <CardHeader><CardTitle>Synonyms</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.synonyms.map((s) => <Badge className="bg-green-400/10 text-green-300 border-green-400/20" variant="outline" key={s}>{s}</Badge>)}
        </CardContent>
      </Card>
    )}

    {data.antonyms?.length > 0 && (
      <Card className={cardStyles[3]}>
        <CardHeader><CardTitle>Antonyms</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.antonyms.map((a) => <Badge className="bg-rose-400/10 text-rose-300 border-rose-400/20" variant="outline" key={a}>{a}</Badge>)}
        </CardContent>
      </Card>
    )}

    {data.exampleSentences?.length > 0 && (
      <Card className={cardStyles[4]}>
        <CardHeader><CardTitle>Example Sentences</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3 list-decimal list-inside text-text-secondary">
            {data.exampleSentences.map((ex, i) => <li key={i}>{ex}</li>)}
          </ul>
        </CardContent>
      </Card>
    )}
  </div>
);

export function TextExplainerOverlay({ isOpen, onClose, word, sentence, isLoading, explanationData }: TextExplainerOverlayProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90dvh] max-h-[600px] rounded-t-2xl bg-surface-primary border-t border-surface-secondary/50 text-text-primary flex flex-col">
        <SheetHeader className="mb-2 text-left">
          <SheetTitle className="text-2xl text-accent-color-1 capitalize">{word}</SheetTitle>
          {sentence && (
            <SheetDescription className="text-text-tertiary italic text-xs">
              From: "{sentence}"
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="overflow-y-auto flex-grow pr-4 -mr-6">
          {isLoading 
            ? <LoadingState /> 
            : explanationData 
              ? <DataDisplay data={explanationData} /> 
              : !isLoading && <p className="text-center text-text-tertiary p-8">Could not load explanation.</p>
          }
        </div>
      </SheetContent>
    </Sheet>
  );
}
