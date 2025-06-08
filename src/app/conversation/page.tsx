
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Send as SendIcon, Loader2, MessageSquareText, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { startConversation, type StartConversationOutput } from '@/ai/flows/startConversationFlow';
import { continueConversation, type ContinueConversationOutput, type ContinueConversationInput } from '@/ai/flows/continueConversationFlow';

interface MessageFeedbackSuggestion {
  originalChunk: string;
  correctedChunk: string;
  explanation: string;
}
interface MessageFeedback {
  isPerfect: boolean;
  suggestions?: MessageFeedbackSuggestion[];
  overallComment: string;
}

interface Message {
  id: string;
  text?: string; // AI's conversational reply
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  feedback?: MessageFeedback; // English feedback from AI
}

export default function ConversationPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false); // To disable input while AI is "typing"

  const addMessage = (
    text: string | undefined,
    sender: 'user' | 'ai',
    isLoadingMsg: boolean = false,
    feedback?: MessageFeedback
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
        // Replace existing loading message if one exists
        const existingLoadingIndex = prevMessages.findIndex(msg => msg.isLoading && msg.sender === 'ai');
        if (existingLoadingIndex !== -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[existingLoadingIndex] = newMessage;
          return updatedMessages;
        }
        return [...prevMessages, newMessage];
      }
      // Remove any old loading message before adding the final AI message or user message
      const filteredMessages = prevMessages.filter(msg => !(msg.isLoading && msg.sender === 'ai'));
      return [...filteredMessages, newMessage];
    });
  };

  const fetchOpeningMessage = async () => {
    setIsLoading(true);
    setIsAISpeaking(true);
    addMessage("Starting a conversation...", 'ai', true);
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
      // Remove loading message
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
                      <Card className="mt-3 bg-secondary/50 border-border shadow-inner">
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BookOpen size={16} className="text-primary" /> English Feedback
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 text-xs space-y-2">
                          <div className={cn(
                            "p-2 rounded-md shadow-sm flex items-start gap-2",
                            message.feedback.isPerfect 
                              ? "bg-green-100 text-green-800" 
                              : "bg-amber-100 text-amber-800"
                          )}>
                            {message.feedback.isPerfect ? <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" /> : <XCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />}
                            <p className="whitespace-pre-wrap break-words font-medium">{message.feedback.overallComment}</p>
                          </div>

                          {!message.feedback.isPerfect && message.feedback.suggestions && message.feedback.suggestions.length > 0 && (
                            <div className="space-y-2 pt-1">
                              {message.feedback.suggestions.map((suggestion, idx) => (
                                <div key={idx} className="p-2 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 space-y-1">
                                  <p><strong className="font-medium">Original:</strong> <span className="line-through text-red-500">{suggestion.originalChunk}</span></p>
                                  <p><strong className="font-medium">Suggestion:</strong> <span className="text-green-600">{suggestion.correctedChunk}</span></p>
                                  <p><strong className="font-medium">Explanation:</strong> {suggestion.explanation}</p>
                                </div>
                              ))}
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
