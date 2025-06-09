
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Changed from Textarea to Input for consistency
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Send as SendIcon, Loader2, RefreshCw, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { cn } from "@/lib/utils";

import { generateHindiParagraph, type GenerateHindiParagraphOutput } from '@/ai/flows/generateHindiParagraphFlow';
import { evaluateHindiTranslation, type EvaluateTranslationInput, type EvaluateTranslationOutput, type DetailedFeedbackItem } from '@/ai/flows/evaluateHindiTranslationFlow';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  text?: string; 
  hindiParagraph?: string; 
  evaluationResult?: EvaluateTranslationOutput; 
}

type TranslationState = 'idle' | 'awaiting_translation' | 'evaluating' | 'error';

export default function TranslationPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const initialFetchDoneRef = useRef(false);

  const [currentHindiParagraph, setCurrentHindiParagraph] = useState<string | null>(null);
  const [translationState, setTranslationState] = useState<TranslationState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false); // Used to disable input during AI processing

  const addMessage = (
    sender: 'user' | 'ai',
    content: Partial<Pick<Message, 'text' | 'hindiParagraph' | 'evaluationResult' | 'isLoading'>>
  ) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      sender,
      timestamp: new Date(),
      ...content,
    };

    setMessages(prevMessages => {
      if (content.isLoading && sender === 'ai') {
        // Replace existing loading message if one exists
        const existingLoadingIndex = prevMessages.findIndex(msg => msg.isLoading && msg.sender === 'ai');
        if (existingLoadingIndex !== -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[existingLoadingIndex] = newMessage;
          return updatedMessages;
        }
        return [...prevMessages, newMessage];
      }
      // Remove any existing AI loading message before adding the new final AI message
      const filteredMessages = prevMessages.filter(msg => !(msg.isLoading && msg.sender === 'ai'));
      return [...filteredMessages, newMessage];
    });
  };

  const fetchNewParagraph = async () => {
    setIsLoading(true);
    setIsAISpeaking(true);
    setTranslationState('idle');
    setCurrentHindiParagraph(null);
    addMessage('ai', { text: "Fetching a new Hindi paragraph for you...", isLoading: true });
    
    try {
      const result: GenerateHindiParagraphOutput = await generateHindiParagraph({});
      setCurrentHindiParagraph(result.hindiParagraph);
      addMessage('ai', { hindiParagraph: result.hindiParagraph });
      addMessage('ai', { text: "Please translate the paragraph above into English."});
      setTranslationState('awaiting_translation');
    } catch (error) {
      console.error("Error fetching Hindi paragraph:", error);
      addMessage('ai', { text: "Sorry, I couldn't fetch a new paragraph right now. Please try again by typing 'new paragraph' or clicking the button." });
      setTranslationState('error');
    } finally {
      setIsLoading(false);
      setIsAISpeaking(false);
    }
  };
  
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      fetchNewParagraph();
      initialFetchDoneRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const isSendButtonDisabled = isLoading || isAISpeaking;

  const handleSend = async () => {
    if (inputValue.trim() === '' || isSendButtonDisabled) return;

    const userText = inputValue.trim();
    addMessage('user', { text: userText });
    setInputValue('');
    
    setIsLoading(true);
    setIsAISpeaking(true);

    try {
      if (translationState === 'awaiting_translation' && currentHindiParagraph) {
        setTranslationState('evaluating');
        addMessage('ai', { text: "Evaluating your translation...", isLoading: true });

        const evaluationInput: EvaluateTranslationInput = {
          originalHindiParagraph: currentHindiParagraph,
          userEnglishTranslation: userText,
        };
        const evaluationResult = await evaluateHindiTranslation(evaluationInput);
        addMessage('ai', { evaluationResult });
        addMessage('ai', { text: "Evaluation complete. Type 'new paragraph' for another exercise or try translating again if you wish."});
        setTranslationState('idle');

      } else if (userText.toLowerCase().includes("new paragraph") || userText.toLowerCase().includes("next")) {
        await fetchNewParagraph();
      } else {
        addMessage('ai', { text: "I'm ready for your translation of the current paragraph, or type 'new paragraph' for a new one."});
         // Keep current state or set to 'awaiting_translation' if paragraph exists
        if(currentHindiParagraph) setTranslationState('awaiting_translation'); else setTranslationState('idle');
      }
    } catch (e) {
      console.error("Error in handleSend (translation):", e);
      addMessage('ai', { text: "Sorry, an error occurred. Please try again."});
      setTranslationState('error');
    } finally {
      setIsLoading(false);
      setIsAISpeaking(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const sendButtonContent = () => {
    if (isSendButtonDisabled && !inputValue) { // Show loader only when truly processing
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <SendIcon className="h-5 w-5" />;
  };

  const inputPlaceholder = () => {
    if (isSendButtonDisabled && !inputValue) return "AI is working...";
    if (translationState === 'awaiting_translation') return "Type your English translation here...";
    return "Type 'new paragraph' or your translation";
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-grow container mx-auto p-4 overflow-y-auto pb-28 sm:pb-24">
        <Button
          onClick={fetchNewParagraph}
          disabled={isLoading || isAISpeaking}
          className="mb-4 bg-accent hover:bg-accent/90 text-accent-foreground"
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Get New Hindi Paragraph
        </Button>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex animate-in fade-in slide-in-from-bottom-5 duration-300 ease-out",
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg p-3 rounded-2xl shadow-md",
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card text-card-foreground rounded-bl-none',
                )}
              >
                {message.isLoading && message.sender === 'ai' ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{message.text || "Thinking..."}</span>
                  </div>
                ) : message.hindiParagraph ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Translate this Hindi paragraph:</p>
                    <p className="text-base leading-relaxed font-hindi" lang="hi" dir="ltr">
                      {message.hindiParagraph}
                    </p>
                  </div>
                ) : message.evaluationResult ? (
                  <Card className="bg-transparent border-0 shadow-none p-0">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {message.evaluationResult.isTranslationAccurate ? <CheckCircle className="text-success-foreground h-5 w-5" /> : <AlertTriangle className="text-warning-foreground h-5 w-5" />}
                        Evaluation
                      </CardTitle>
                      <CardDescription className="text-xs !mt-1">{message.evaluationResult.feedbackSummary}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 pt-2 text-xs space-y-3">
                      {message.evaluationResult.detailedFeedbackItems && message.evaluationResult.detailedFeedbackItems.length > 0 ? (
                        message.evaluationResult.detailedFeedbackItems.map((item, index) => (
                          <Card key={index} className={cn(
                            "border-l-4 p-3 shadow-sm",
                            item.errorType === 'grammar' ? "border-error bg-error/10 text-error-foreground" :
                            item.errorType === 'vocabulary' ? "border-warning bg-warning/10 text-warning-foreground" :
                            item.errorType === 'sentence_structure' ? "border-info bg-info/10 text-info-foreground" :
                            item.errorType === 'meaning_accuracy' ? "border-destructive bg-destructive/10 text-destructive-foreground" :
                            "border-muted bg-muted/20"
                          )}>
                            <CardContent className="p-0 space-y-1">
                              {item.originalHindiSegment && (
                                <p><strong className="font-medium">Original Hindi:</strong> <span className="font-hindi" lang="hi" dir="ltr">"{item.originalHindiSegment}"</span></p>
                              )}
                              {item.userTranslationSegment && (
                                <p><strong className="font-medium">Your Translation:</strong> <span className="line-through opacity-80">"{item.userTranslationSegment}"</span></p>
                              )}
                              <p><strong className="font-medium text-success-foreground">Suggestion:</strong> "{item.suggestedCorrection}"</p>
                              <p><Lightbulb size={14} className="inline mr-1 text-primary"/><strong>Explanation:</strong> {item.explanation}</p>
                              {item.errorType && (
                                <p className="text-xs capitalize"><strong className="font-medium">Area:</strong> {item.errorType.replace('_', ' ')}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : message.evaluationResult.isTranslationAccurate ? (
                        <p className="text-sm text-success-foreground p-2 bg-success/10 rounded-md border border-success-foreground/30 flex items-center gap-2">
                            <CheckCircle size={16}/> Your translation looks good!
                        </p>
                      ) : (
                         <p className="text-sm text-info-foreground p-2 bg-info/10 rounded-md border border-info-foreground/30">
                            No specific errors highlighted, but review for overall accuracy and flow.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  message.text && <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm py-2 px-2 z-[60] border-t border-border">
         <div className="relative max-w-sm mx-auto">
          <div className={cn(
            "absolute left-0 right-0 bottom-0 h-[calc(100%_-_1px)] bg-primary-darker rounded-xl transition-opacity duration-150 ease-in-out",
            (isSendButtonDisabled && !inputValue) ? "opacity-50" : "opacity-100" // Adjusted opacity logic
           )} style={{ transform: 'translateY(5px)'}} />
          <div className="flex items-center gap-2 bg-card border-2 border-primary rounded-xl shadow-lg p-1.5 focus-within:border-primary/70 transition-colors duration-300 ease-in-out relative z-10">
            <Input
              type="text"
              placeholder={inputPlaceholder()}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 text-base h-auto placeholder:text-muted-foreground"
              disabled={(isSendButtonDisabled && !inputValue)} // Adjusted disabled logic
            />
            <Button
              onClick={handleSend}
              disabled={(isSendButtonDisabled && !inputValue) && inputValue.trim() === ''} // Adjusted disabled logic
              className={cn(
                "h-10 w-12 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-150 ease-in-out flex items-center justify-center relative",
                !(isSendButtonDisabled && !inputValue) ? "active:translate-y-[5px]" : "opacity-50 translate-y-0"
              )}
              aria-label="Send message"
            >
              {sendButtonContent()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
