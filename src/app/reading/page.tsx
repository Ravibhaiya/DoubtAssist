
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Send as SendIcon, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getNewsAndQuestions, type GetNewsAndQuestionsOutput } from '@/ai/flows/readingComprehensionFlow';
import { evaluateUserAnswer, type EvaluateUserAnswerInput } from '@/ai/flows/evaluateAnswerFlow';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
}

type ReadingState = 'idle' | 'awaiting_answer' | 'evaluating' | 'error';

export default function ReadingPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const [currentArticle, setCurrentArticle] = useState<string | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [readingState, setReadingState] = useState<ReadingState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const addMessage = (text: string, sender: 'user' | 'ai', isLoadingMsg: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(), 
      text,
      sender,
      timestamp: new Date(),
      isLoading: isLoadingMsg,
    };
    setMessages(prevMessages => {
      if (isLoadingMsg && sender === 'ai') { // Only AI messages should show as loading type
        const filteredMessages = prevMessages.filter(msg => !msg.isLoading);
        return [...filteredMessages, newMessage];
      }
      // For user messages or final AI messages, remove any existing loading message
      const filteredMessages = prevMessages.filter(msg => !(msg.isLoading && msg.sender === 'ai'));
      return [...filteredMessages, newMessage];
    });
  };

  const fetchNews = async () => {
    setIsLoading(true);
    setReadingState('idle'); 
    addMessage("Fetching a news article and questions for you...", 'ai', true);
    setIsAISpeaking(true);
    try {
      const result: GetNewsAndQuestionsOutput = await getNewsAndQuestions({}); 
      
      setCurrentArticle(result.article); 
      setCurrentQuestions(result.questions);
      setCurrentQuestionIndex(0);
      
      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai'))); 

      let articleDisplay = "";
      if (result.articleSource) articleDisplay += `Source: ${result.articleSource}\n`;
      if (result.articleDate && result.articleDate !== "N/A") {
         articleDisplay += `Published on: ${result.articleDate}\n`;
      }
      if (result.articleUrl) articleDisplay += `URL: ${result.articleUrl}\n`;
      
      if (articleDisplay.length > 0) articleDisplay += "\n";
      
      articleDisplay += result.article; 

      addMessage(articleDisplay.trim(), 'ai');

      if (result.questions && result.questions.length > 0) {
        addMessage(result.questions[0], 'ai');
        setReadingState('awaiting_answer');
      } else {
        addMessage("I couldn't find any questions for this article. Let's try another one?", 'ai');
        setReadingState('idle');
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
      addMessage("Sorry, I couldn't fetch news right now. Please try again later.", 'ai');
      setReadingState('error');
    } finally {
      setIsLoading(false);
      setIsAISpeaking(false);
    }
  };

  useEffect(() => {
    fetchNews();
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

    const userAnswerText = inputValue.trim();
    addMessage(userAnswerText, 'user');
    setInputValue('');
    
    // Set loading true for AI response part
    setIsLoading(true); 
    setIsAISpeaking(true);

    if (readingState === 'awaiting_answer' && currentArticle && currentQuestions.length > 0) {
      setReadingState('evaluating');
      addMessage("Evaluating your answer...", 'ai', true);
      
      const evaluationInput: EvaluateUserAnswerInput = {
        article: currentArticle, 
        question: currentQuestions[currentQuestionIndex],
        userAnswer: userAnswerText,
      };

      try {
        const evaluationResult = await evaluateUserAnswer(evaluationInput);
        setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));

        let feedbackText = `Evaluation: ${evaluationResult.isCorrect ? 'Correct!' : 'Needs review.'}\nFeedback: ${evaluationResult.feedback}\nGrammar: ${evaluationResult.grammarFeedback}`;
        addMessage(feedbackText, 'ai');

        const nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex < currentQuestions.length) {
          setCurrentQuestionIndex(nextQuestionIndex);
          addMessage(currentQuestions[nextQuestionIndex], 'ai');
          setReadingState('awaiting_answer');
        } else {
          addMessage("You've answered all questions for this article! Would you like to try another one?", 'ai');
          setReadingState('idle'); 
        }
      } catch (error) {
        console.error("Error evaluating answer:", error);
        setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
        addMessage("Sorry, I couldn't evaluate your answer right now.", 'ai');
        setReadingState('error');
      } finally {
        // Only set loading to false when AI processing is done
        setIsLoading(false);
        setIsAISpeaking(false);
      }
    } else if (readingState === 'idle' || readingState === 'error') {
        // User is prompting to fetch news again
        await fetchNews(); 
        // fetchNews handles its own setIsLoading/isAISpeaking internally for its messages
        // but we ensure the input bar is usable after this action sequence
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

  // Determine if the send button should show loader or icon
  const sendButtonContent = () => {
    // Show loader if:
    // 1. Overall isLoading is true (meaning an AI operation is in progress) AND
    // 2. EITHER it's not specifically 'awaiting_answer' state (i.e., initial load, or error recovery fetch)
    //    OR it is 'evaluating' (meaning user answered, now AI is working)
    if (isLoading && (readingState !== 'awaiting_answer' || readingState === 'evaluating')) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <SendIcon className="h-5 w-5" />;
  };
  
  const inputPlaceholder = () => {
    if (isLoading && isAISpeaking) return "AI is working...";
    if (readingState === 'awaiting_answer') return "Type your answer...";
    return "Type here or press send for news";
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
                  message.isLoading && message.sender === 'ai' && 'italic text-muted-foreground' // Apply only if AI is loading
                )}
              >
                {message.isLoading && message.sender === 'ai' ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{message.text}</span>
                  </div>
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
            disabled={isLoading || isAISpeaking}
          />
          <Button
            onClick={handleSend}
            disabled={(inputValue.trim() === '' && readingState === 'awaiting_answer') || isLoading || isAISpeaking}
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
