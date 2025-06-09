
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Send as SendIcon, Loader2, MessageSquareText, CheckCircle, XCircle, BookOpen, Lightbulb, Smile, TextSelect } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { startConversation, type StartConversationOutput } from '@/ai/flows/startConversationFlow';
import { continueConversation, type ContinueConversationOutput, type ContinueConversationInput, type ComprehensiveFeedback } from '@/ai/flows/continueConversationFlow';


interface Message {
  id: string;
  text?: string; 
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  feedback?: ComprehensiveFeedback; 
}

export default function ConversationPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const addMessage = (
    text: string | undefined,
    sender: 'user' | 'ai',
    isLoadingMsg: boolean = false,
    feedback?: ComprehensiveFeedback
  ) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
      isLoading: isLoadingMsg,
      feedback,
    };
    setMessages(prevMessages => {
      if (isLoadingMsg && sender === 'ai') {
        const existingLoadingIndex = prevMessages.findIndex(msg => msg.isLoading && msg.sender === 'ai');
        if (existingLoadingIndex !== -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[existingLoadingIndex] = newMessage;
          return updatedMessages;
        }
        return [...prevMessages, newMessage];
      }
      const filteredMessages = prevMessages.filter(msg => !(msg.isLoading && msg.sender === 'ai'));
      return [...filteredMessages, newMessage];
    });
  };

  const fetchOpeningMessage = async () => {
    setIsLoading(true);
    setIsAISpeaking(true);
    addMessage("Let's start a conversation...", 'ai', true);
    try {
      const result: StartConversationOutput = await startConversation({});
      addMessage(result.openingMessage, 'ai');
    } catch (error) {
      console.error("Error starting conversation:", error);
      addMessage("Hello! I had a bit of trouble starting our chat. How are you today?", 'ai');
    } finally {
      setIsLoading(false);
      setIsAISpeaking(false);
    }
  };

  useEffect(() => {
    fetchOpeningMessage();
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

  const handleSend = async () => {
    if (inputValue.trim() === '' || isLoading || isAISpeaking) return;

    const userText = inputValue.trim();
    addMessage(userText, 'user');
    setInputValue('');

    setIsLoading(true);
    setIsAISpeaking(true);
    addMessage("Thinking and checking your English...", 'ai', true);

    try {
      const input: ContinueConversationInput = { userMessage: userText };
      const result: ContinueConversationOutput = await continueConversation(input);
      addMessage(result.aiReply, 'ai', false, result.feedback);

    } catch (e) {
      console.error("Error in handleSend (conversation):", e);
      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
      addMessage("Sorry, I encountered an issue. Let's try that again or you can say something else!", "ai");
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
    if (isLoading || isAISpeaking) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <SendIcon className="h-5 w-5" />;
  };

  const inputPlaceholder = () => {
    if (isLoading || isAISpeaking) return "AI is working...";
    return "Type your message...";
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-grow container mx-auto p-4 overflow-y-auto pb-28 sm:pb-24">
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
                ) : (
                  <>
                    {message.text && <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>}
                    {message.feedback && (
                      <Card className="mt-3 bg-secondary/30 border-border/50 shadow-inner">
                        <CardHeader className="p-3 pb-2">
                           <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                            <MessageSquareText size={14} /> English Feedback
                          </CardTitle>
                          <CardDescription className="text-xs !mt-1">{message.feedback.overallComment}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 text-xs space-y-3">
                          {/* Grammar Suggestions */}
                          {message.feedback.grammarSuggestions && message.feedback.grammarSuggestions.length > 0 && (
                            <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-red-800 space-y-1.5 shadow-sm">
                              <h4 className="font-semibold text-xs flex items-center gap-1"><XCircle size={14} /> Grammar & Spelling</h4>
                              {message.feedback.grammarSuggestions.map((suggestion, idx) => (
                                <div key={`gram-${idx}`} className="border-t border-red-200/70 pt-1.5 mt-1.5 first:mt-0 first:border-t-0 first:pt-0">
                                  <p><strong className="font-medium">Original:</strong> <span className="line-through text-red-600">{suggestion.originalChunk}</span></p>
                                  <p><strong className="font-medium">Correction:</strong> <span className="text-green-600 font-medium">{suggestion.correctedChunk}</span></p>
                                  <p><strong className="font-medium">Explanation:</strong> {suggestion.explanation}</p>
                                </div>
                              ))}
                            </div>
                          )}
                           {message.feedback.isGrammaticallyPerfect && (!message.feedback.grammarSuggestions || message.feedback.grammarSuggestions.length === 0) && (
                             <div className="p-2.5 rounded-md bg-green-50 border border-green-200 text-green-800 space-y-1 shadow-sm">
                                <h4 className="font-semibold text-xs flex items-center gap-1"><CheckCircle size={14} /> Grammar & Spelling</h4>
                                <p>Your grammar and spelling look great in this message!</p>
                             </div>
                           )}


                          {/* Vocabulary Suggestions */}
                          {message.feedback.vocabularySuggestions && message.feedback.vocabularySuggestions.length > 0 && (
                            <div className="p-2.5 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 space-y-1.5 shadow-sm">
                              <h4 className="font-semibold text-xs flex items-center gap-1"><Lightbulb size={14} /> Vocabulary Tips</h4>
                              {message.feedback.vocabularySuggestions.map((suggestion, idx) => (
                                <div key={`vocab-${idx}`} className="border-t border-yellow-200/70 pt-1.5 mt-1.5 first:mt-0 first:border-t-0 first:pt-0">
                                  <p><strong className="font-medium">Your phrase:</strong> "{suggestion.originalWordOrPhrase}"</p>
                                  <p><strong className="font-medium">Suggestion:</strong> <span className="text-yellow-900 font-medium">"{suggestion.suggestedAlternative}"</span></p>
                                  <p><strong className="font-medium">Why:</strong> {suggestion.reasonOrBenefit}</p>
                                  {suggestion.exampleSentences && suggestion.exampleSentences.length > 0 && (
                                    <div>
                                      <strong className="font-medium">Examples:</strong>
                                      <ul className="list-disc list-inside pl-2">
                                        {suggestion.exampleSentences.map((ex, exIdx) => <li key={exIdx}>{ex}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Fluency Feedback */}
                          {message.feedback.fluencyFeedback && (
                            <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 space-y-1.5 shadow-sm">
                              <h4 className="font-semibold text-xs flex items-center gap-1"><Smile size={14} /> Fluency & Flow</h4>
                               <p>{message.feedback.fluencyFeedback.overallFluencyComment}</p>
                              {message.feedback.fluencyFeedback.clarityComment && <p><strong className="font-medium">Clarity:</strong> {message.feedback.fluencyFeedback.clarityComment}</p>}
                              {message.feedback.fluencyFeedback.expressionComment && <p><strong className="font-medium">Expression:</strong> {message.feedback.fluencyFeedback.expressionComment}</p>}
                              {message.feedback.fluencyFeedback.toneComment && <p><strong className="font-medium">Tone:</strong> {message.feedback.fluencyFeedback.toneComment}</p>}
                              {message.feedback.fluencyFeedback.alternativePhrasing && (
                                <div className="border-t border-blue-200/70 pt-1.5 mt-1.5">
                                    <p><strong className="font-medium">Alternative Phrasing Suggestion:</strong></p>
                                    <p className="italic">{message.feedback.fluencyFeedback.alternativePhrasing}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm py-2 px-2 z-[60] border-t border-border">
        <div className="flex items-center gap-2 max-w-xs mx-auto bg-card border-2 border-primary rounded-xl shadow-lg p-1.5 focus-within:border-primary/70 transition-colors duration-300 ease-in-out">
          <Input
            type="text"
            placeholder={inputPlaceholder()}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 text-base h-auto placeholder:text-muted-foreground"
            disabled={isLoading || isAISpeaking}
          />
          <Button
            onClick={handleSend}
            disabled={inputValue.trim() === '' || isLoading || isAISpeaking}
            className="h-10 w-12 bg-primary text-primary-foreground rounded-xl shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:translate-y-0 disabled:shadow-[0_6px_0_hsl(var(--primary-darker))] flex items-center justify-center"
            aria-label="Send message"
          >
            {sendButtonContent()}
          </Button>
        </div>
      </div>
    </div>
  );
}

    