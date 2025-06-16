
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Loader2, NotebookText, AlertTriangle, FileText, DownloadCloud } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TextExplainerOverlay } from "@/components/feature/text-explainer-overlay";
import { processPdfNewspaper, type ProcessPdfNewspaperInput, type ProcessPdfNewspaperOutput, type TopicSection } from '@/ai/flows/processPdfNewspaperFlow';
import { useToast } from "@/hooks/use-toast";


export default function NewspaperPage() {
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [messages, setMessages] = useState<{ id: string; type: 'info' | 'error' | 'topic'; content: string | TopicSection[] }[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentTopics, setCurrentTopics] = useState<TopicSection[]>([]);

  const [isExplainerOverlayOpen, setIsExplainerOverlayOpen] = useState(false);
  const [explainerMode, setExplainerMode] = useState<'sentenceAnalysis' | 'wordExplanation' | null>(null);
  const [explainerArticleContent, setExplainerArticleContent] = useState<string | null>(null);
  const [explainerWord, setExplainerWord] = useState<string | null>(null);
  const [explainerContextSentence, setExplainerContextSentence] = useState<string | null>(null);
  const [explainerTriggerId, setExplainerTriggerId] = useState<string | null>(null); // For re-triggering overlay effects

  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTopics]);

  const handleUrlInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPdfUrlInput(e.target.value);
  };

  const addMessageEntry = (type: 'info' | 'error' | 'topic', content: string | TopicSection[]) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), type, content }]);
  };
  
  const isValidGoogleDrivePdfLink = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('drive.google.com') && (parsedUrl.pathname.includes('/file/d/') || parsedUrl.searchParams.get('id'));
      // Basic check, can be made more robust for specific PDF view/export links
    } catch (e) {
      return false;
    }
  };

  const handleFetchNewspaper = async () => {
    if (pdfUrlInput.trim() === '') {
      toast({ title: "Error", description: "Please enter a Google Drive PDF URL.", variant: "destructive" });
      return;
    }
    if (!isValidGoogleDrivePdfLink(pdfUrlInput)) {
       toast({ title: "Error", description: "Please enter a valid Google Drive link to a PDF file.", variant: "destructive" });
       return;
    }

    setIsLoading(true);
    setCurrentTopics([]); // Clear previous topics
    setMessages([]); // Clear previous messages
    addMessageEntry('info', "Processing your newspaper PDF link...");

    try {
      const input: ProcessPdfNewspaperInput = { pdfUrl: pdfUrlInput };
      const result: ProcessPdfNewspaperOutput = await processPdfNewspaper(input);
      
      if (result.topics && result.topics.length > 0) {
        setCurrentTopics(result.topics);
        addMessageEntry('topic', result.topics); // Add topics as a single message entry for rendering
      } else {
        addMessageEntry('info', result.message || "No topics found or the PDF content could not be processed as expected.");
      }
    } catch (error: any) {
      console.error("Error processing PDF newspaper:", error);
      addMessageEntry('error', error.message || "Failed to process the newspaper. The PDF might be inaccessible, not in a readable format, or an internal error occurred.");
      toast({ title: "Processing Error", description: error.message || "An unexpected error occurred while processing the PDF.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordClick = (word: string, fullText: string, topicId: string) => {
    const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
    if (!cleanedWord || isLoading) return;

    let contextSentenceFound: string | undefined = undefined;
    // Basic sentence splitting, can be improved
    const sentences = fullText.split(/(?<=[.!?])\s+(?=[A-ZА-ЯЁ])/); 
    for (const sentence of sentences) {
        const wordRegex = new RegExp(`\\b${cleanedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordRegex.test(sentence)) {
            contextSentenceFound = sentence.trim();
            break;
        }
    }
    setExplainerMode('wordExplanation');
    setExplainerWord(cleanedWord);
    setExplainerContextSentence(contextSentenceFound || null);
    setExplainerArticleContent(null); // Not needed for word explanation mode
    setExplainerTriggerId(`word-${topicId}-${cleanedWord}-${Date.now()}`); // Unique ID for effect trigger
    setIsExplainerOverlayOpen(true);
  };

  const handleOpenSentenceAnalysis = (articleText: string, topicId: string) => {
    if (isLoading) return;
    setExplainerMode('sentenceAnalysis');
    setExplainerArticleContent(articleText);
    setExplainerWord(null);
    setExplainerContextSentence(null);
    setExplainerTriggerId(`sentence-${topicId}-${Date.now()}`); // Unique ID for effect trigger
    setIsExplainerOverlayOpen(true);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFetchNewspaper();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-3 shadow-sm">
        <div className="container mx-auto flex items-center gap-3">
          <Input
            type="url"
            placeholder="Paste Google Drive PDF newspaper link here"
            value={pdfUrlInput}
            onChange={handleUrlInputChange}
            onKeyPress={handleKeyPress}
            className="flex-grow text-sm h-10"
            disabled={isLoading}
          />
          <Button
            onClick={handleFetchNewspaper}
            disabled={isLoading || !pdfUrlInput.trim()}
            className="h-10 px-4"
            size="sm"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <DownloadCloud className="h-5 w-5 mr-2" />}
            {isLoading ? "Processing..." : "Fetch News"}
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 overflow-y-auto pb-10">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.type === 'info' && typeof msg.content === 'string' && (
                <Card className="bg-blue-50 border-blue-200 shadow-md">
                  <CardContent className="p-4 text-sm text-blue-700">
                    <p>{msg.content}</p>
                  </CardContent>
                </Card>
              )}
              {msg.type === 'error' && typeof msg.content === 'string' && (
                <Card className="bg-red-50 border-red-300 shadow-md">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-base text-red-700 flex items-center gap-2">
                      <AlertTriangle size={18} /> Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-red-600">
                    <p>{msg.content}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}

          {currentTopics.length > 0 && messages.some(msg => msg.type === 'topic') && (
             <Card className="shadow-lg border-border/70">
                <CardHeader className="bg-secondary/30">
                    <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                        <FileText size={22}/> Newspaper Content
                    </CardTitle>
                    <CardDescription>Browse the topics extracted from your PDF.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                    {currentTopics.map((topic, index) => (
                    <Card key={`${topic.topicTitle}-${index}`} className="overflow-hidden shadow-md border-border/50">
                        <CardHeader className="bg-card p-4 border-b">
                        <CardTitle className="text-lg text-primary">{topic.topicTitle || `Topic ${index + 1}`}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 text-sm leading-relaxed">
                        <p className="whitespace-pre-wrap break-words">
                            {topic.content.split(/(\s+|(?<=[^\w\s])|(?=[^\w\s]))/).map((segment, segIdx) => {
                            const isWordSegment = /\w/.test(segment) && segment.trim().length > 0;
                            if (isWordSegment) {
                                return (
                                <span
                                    key={`topic-${index}-word-${segIdx}`}
                                    className="cursor-pointer hover:underline text-accent transition-colors duration-150 ease-in-out"
                                    onClick={() => handleWordClick(segment, topic.content, `topic-${index}`)}
                                >
                                    {segment}
                                </span>
                                );
                            }
                            return <span key={`topic-${index}-segment-${segIdx}`}>{segment}</span>;
                            })}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                            onClick={() => handleOpenSentenceAnalysis(topic.content, `topic-${index}`)}
                            disabled={isLoading}
                        >
                            <NotebookText className="mr-2 h-4 w-4" />
                            Analyze Sentences in this Topic
                        </Button>
                        </CardContent>
                    </Card>
                    ))}
                </CardContent>
             </Card>
          )}
          {isLoading && currentTopics.length === 0 && !messages.some(msg=> msg.type === 'error') && (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Fetching and processing newspaper...</p>
              <p className="text-xs text-muted-foreground mt-1">(This might take a moment depending on the PDF)</p>
            </div>
          )}
           {!isLoading && currentTopics.length === 0 && messages.length === 0 && (
             <div className="text-center py-10">
                <FileText size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Enter a Google Drive PDF link above to load a newspaper.</p>
                <p className="text-xs text-muted-foreground mt-1">The content will be displayed here by topics.</p>
            </div>
           )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <TextExplainerOverlay
        isOpen={isExplainerOverlayOpen}
        onClose={() => {
          setIsExplainerOverlayOpen(false);
          // Optional: Reset explainer states if desired upon close
          // setExplainerMode(null);
          // setExplainerArticleContent(null);
          // setExplainerWord(null);
          // setExplainerContextSentence(null);
        }}
        mode={explainerMode}
        articleContentForAnalysis={explainerArticleContent}
        wordToExplain={explainerWord}
        wordContextSentence={explainerContextSentence}
        articleId={explainerTriggerId} 
      />
    </div>
  );
}
