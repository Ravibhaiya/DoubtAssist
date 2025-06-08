
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Send as SendIcon, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { explainText, type ExplainTextInput, type ExplainTextOutput } from '@/ai/flows/explainTextFlow';
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  id: string;
  text?: string; 
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  explanationDetails?: ExplainTextOutput; 
}

export default function AskPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    addMessage(
      undefined, 
      'ai',
      false,
      {
        explanation: "Hello! Ask me to explain any word, phrase, or sentence. For words, you can include the sentence it's in for better context (e.g., 'explain X in the sentence Y' or 'what does X mean in Y?').",
        originalContextUsed: null,
        exampleSentences: null,
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const addMessage = (
    text: string | undefined,
    sender: 'user' | 'ai',
    isLoadingMsg: boolean = false,
    explanationDetails?: ExplainTextOutput
  ) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
      isLoading: isLoadingMsg,
      explanationDetails,
    };
    setMessages(prevMessages => {
      if (isLoadingMsg && sender === 'ai') {
        const filteredMessages = prevMessages.filter(msg => !msg.isLoading);
        return [...filteredMessages, newMessage];
      }
      const filteredMessages = prevMessages.filter(msg => !(msg.isLoading && msg.sender === 'ai'));
      return [...filteredMessages, newMessage];
    });
  };

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
    if (inputValue.trim() === '' || isLoading) return;

    const userText = inputValue.trim();
    addMessage(userText, 'user');
    setInputValue('');
    setIsLoading(true);
    addMessage("Thinking...", 'ai', true);

    try {
      const input: ExplainTextInput = {
        textToExplain: userText,
      };
      const result = await explainText(input);
      addMessage(undefined, 'ai', false, result);

    } catch (error) {
      console.error("Error explaining text:", error);
      addMessage(undefined, 'ai', false, {
        explanation: "Sorry, I encountered an error while trying to explain that. Please check your query or try again later.",
        originalContextUsed: null,
        exampleSentences: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendButtonContent = () => {
    if (isLoading) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <SendIcon className="h-5 w-5" />;
  };

  const inputPlaceholder = () => {
    if (isLoading) return "AI is working...";
    return "Explain a word, phrase, or sentence...";
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
                ) : message.explanationDetails ? (
                  <Card className="bg-transparent border-0 shadow-none p-0">
                    <CardContent className="p-0 text-sm space-y-3">
                      <p className="whitespace-pre-wrap break-words">{message.explanationDetails.explanation}</p>
                      {message.explanationDetails.originalContextUsed && (
                        <div className="mt-2 p-2.5 rounded-lg shadow bg-blue-100 dark:bg-blue-700 text-blue-900 dark:text-blue-100">
                          <strong className="font-semibold block mb-1 text-xs uppercase tracking-wider">Meaning in Context:</strong>
                          <p className="whitespace-pre-wrap break-words italic">"{message.explanationDetails.originalContextUsed}"</p>
                        </div>
                      )}
                      {message.explanationDetails.exampleSentences && message.explanationDetails.exampleSentences.length > 0 && (
                        <div className="mt-2 p-2.5 rounded-lg shadow bg-green-100 dark:bg-green-700 text-green-900 dark:text-green-100">
                          <strong className="font-semibold block mb-1 text-xs uppercase tracking-wider">Example Sentences:</strong>
                          <ul className="list-disc list-inside space-y-1 pl-1">
                            {message.explanationDetails.exampleSentences.map((ex, idx) => (
                              <li key={idx} className="whitespace-pre-wrap break-words">{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
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
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={inputValue.trim() === '' || isLoading}
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
