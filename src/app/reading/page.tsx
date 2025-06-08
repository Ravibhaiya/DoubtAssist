
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Send as SendIcon, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

import { getNewsAndQuestions, type GetNewsAndQuestionsOutput } from '@/ai/flows/readingComprehensionFlow';
import { evaluateUserAnswer, type EvaluateUserAnswerInput, type EvaluateUserAnswerOutput } from '@/ai/flows/evaluateAnswerFlow';
import { answerArticleQuery, type AnswerArticleQueryInput, type AnswerArticleQueryOutput } from '@/ai/flows/answerArticleQueryFlow';
import { explainText, type ExplainTextInput, type ExplainTextOutput } from '@/ai/flows/explainTextFlow';


interface Message {
  id: string;
  text?: string; 
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  evaluationDetails?: EvaluateUserAnswerOutput;
  explanationDetails?: ExplainTextOutput;
  isArticle?: boolean; // To identify the main article message
}

type ReadingState = 'idle' | 'awaiting_answer' | 'evaluating' | 'error';

export default function ReadingPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const [currentArticle, setCurrentArticle] = useState<string | null>(null); // Stores the raw article text for evaluation/querying
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [readingState, setReadingState] = useState<ReadingState>('idle');
  const [isLoading, setIsLoading] = useState(false); 
  const [isAISpeaking, setIsAISpeaking] = useState(false); 

  const addMessage = (
    text: string | undefined,
    sender: 'user' | 'ai',
    isLoadingMsg: boolean = false,
    evaluationDetails?: EvaluateUserAnswerOutput,
    explanationDetails?: ExplainTextOutput,
    isArticle: boolean = false
  ) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
      isLoading: isLoadingMsg,
      evaluationDetails,
      explanationDetails,
      isArticle,
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

  const fetchNews = async () => {
    setIsLoading(true);
    setReadingState('idle');
    setCurrentArticle(null); 
    setCurrentQuestions([]);
    setCurrentQuestionIndex(0);
    addMessage("Fetching a news article and questions for you...", 'ai', true);
    setIsAISpeaking(true);
    try {
      const result: GetNewsAndQuestionsOutput = await getNewsAndQuestions({});

      setCurrentArticle(result.article); // Store the raw article for context
      setCurrentQuestions(result.questions);
      setCurrentQuestionIndex(0);
      
      // Remove loading message before adding new content
      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));

      let articleMetadata = "";
      if (result.articleSource) articleMetadata += `Source: ${result.articleSource}\n`;
      if (result.articleDate && result.articleDate !== "N/A") {
         articleMetadata += `Published on: ${result.articleDate}\n`;
      }
      if (result.articleUrl) articleMetadata += `URL: ${result.articleUrl}\n`;

      if (articleMetadata.length > 0) {
        addMessage(articleMetadata.trim(), 'ai');
      }
      
      addMessage(result.article, 'ai', false, undefined, undefined, true); // Add article content, marked as isArticle

      if (result.questions && result.questions.length > 0) {
        addMessage(result.questions[0], 'ai');
        setReadingState('awaiting_answer');
      } else {
        addMessage("I couldn't find any questions for this article. You can ask me to explain something or fetch another article.", 'ai');
        setReadingState('idle');
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
      addMessage("Sorry, I couldn't fetch news right now. Please try again later or ask me to explain something.", 'ai');
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

  const handleWordClick = async (word: string, fullArticleText: string) => {
    if (isLoading || isAISpeaking) return;

    const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
    if (!cleanedWord) return;

    addMessage(`Explain: "${cleanedWord}"`, 'user');
    setInputValue(''); // Clear input field after "sending" word explanation request
    setIsLoading(true);
    setIsAISpeaking(true);
    addMessage("Explaining...", 'ai', true);

    let contextSentenceFound: string | undefined = undefined;
    // Regex to split by sentences, might need refinement for complex cases
    const sentences = fullArticleText.split(/(?<=[.!?])\s+(?=[A-ZА-ЯЁ])/); // Split on sentence enders followed by space and capital letter
    for (const sentence of sentences) {
        const wordRegex = new RegExp(`\\b${cleanedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordRegex.test(sentence)) {
            contextSentenceFound = sentence.trim();
            break;
        }
    }

    try {
      const explainInput: ExplainTextInput = { textToExplain: cleanedWord, contextSentence: contextSentenceFound };
      const result = await explainText(explainInput);
      addMessage(
        undefined, 
        'ai',
        false,
        undefined,
        result
      );
      addMessage(currentArticle ? "Anything else about the article, another explanation, or a new article?" : "Anything else you'd like to explain, or would you like a news article?", 'ai');
      setReadingState('idle');
    } catch (e) {
      console.error("Error in handleWordClick:", e);
      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
      addMessage("Sorry, I couldn't explain that word right now.", "ai");
      setReadingState('error');
    } finally {
      setIsLoading(false);
      setIsAISpeaking(false);
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === '' || isLoading || isAISpeaking) return;

    const userText = inputValue.trim();
    addMessage(userText, 'user');
    setInputValue('');

    setIsLoading(true);
    setIsAISpeaking(true);
    let loadingMessageText = "Thinking..."; 

    try {
      if (readingState === 'awaiting_answer' && currentArticle && currentQuestions.length > 0) {
        setReadingState('evaluating');
        loadingMessageText = "Evaluating your answer...";
        addMessage(loadingMessageText, 'ai', true);

        const evaluationInput: EvaluateUserAnswerInput = {
          article: currentArticle,
          question: currentQuestions[currentQuestionIndex],
          userAnswer: userText,
        };
        const evaluationResult = await evaluateUserAnswer(evaluationInput);
        addMessage(
          "Here's the evaluation of your answer:",
          'ai',
          false,
          evaluationResult
        );

        const nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex < currentQuestions.length) {
          setCurrentQuestionIndex(nextQuestionIndex);
          addMessage(currentQuestions[nextQuestionIndex], 'ai');
          setReadingState('awaiting_answer');
        } else {
          addMessage("You've answered all questions for this article! Ask about the article, explain something, or request a 'new article'.", 'ai');
          setReadingState('idle');
        }
      } else { 
        const lowerUserText = userText.toLowerCase();
        const newArticleKeywords = ["new article", "another article", "fetch news", "next one", "try another", "get news", "new news", "next article", "fetch article"];
        let isRequestingNew = newArticleKeywords.some(keyword => lowerUserText.includes(keyword));

        if (!isRequestingNew && messages.length > 0) {
          const lastAiMessage = messages.slice().reverse().find(m => m.sender === 'ai' && !m.isLoading && !m.evaluationDetails && !m.explanationDetails && !m.isArticle);
          if (lastAiMessage && (lastAiMessage.text?.toLowerCase().includes("another one") || lastAiMessage.text?.toLowerCase().includes("new one") || lastAiMessage.text?.toLowerCase().includes("new article")) && (lowerUserText === "yes" || lowerUserText === "ok" || lowerUserText === "sure" || lowerUserText === "yeah") ) {
            isRequestingNew = true;
          }
        }
        
        if (isRequestingNew) {
          await fetchNews(); 
          return; 
        } else if (currentArticle && (lowerUserText.includes("?") || lowerUserText.split(" ").length > 3 || ["what", "who", "why", "when", "where", "how", "tell me about", "explain about"].some(kw => lowerUserText.startsWith(kw)))) {
          loadingMessageText = "Thinking about your question on the article...";
          addMessage(loadingMessageText, 'ai', true);
          const queryInput: AnswerArticleQueryInput = { article: currentArticle, userQuery: userText };
          const queryResult = await answerArticleQuery(queryInput);
          addMessage(queryResult.answer, 'ai');
          addMessage("Anything else about this article, explain something, or request a 'new article'?", 'ai');
          setReadingState('idle');
        } else {
          loadingMessageText = "Explaining...";
          addMessage(loadingMessageText, 'ai', true);
          const explainInput: ExplainTextInput = { textToExplain: userText };
          const result = await explainText(explainInput);
          addMessage(
            undefined, 
            'ai',
            false,
            undefined,
            result
          );
          addMessage(currentArticle ? "Anything else about the article, another explanation, or a new article?" : "Anything else you'd like to explain, or would you like a news article?", 'ai');
          setReadingState('idle');
        }
      }
    } catch (e) {
        console.error("Error in handleSend:", e);
        setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
        addMessage("An unexpected error occurred. Please try again.", "ai");
        setReadingState('error');
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
    if (readingState === 'awaiting_answer') return "Type your answer...";
    if (currentArticle) return "Ask about article, explain text, or 'new article'...";
    return "Explain a word/phrase or type 'new article'";
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
                ) : message.isArticle && message.sender === 'ai' && message.text ? (
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {message.text.split(/(\s+)/).map((segment, index) => {
                      const isWordSegment = segment.trim().length > 0;
                      if (isWordSegment) {
                        return (
                          <span
                            key={`${message.id}-word-${index}`}
                            className="cursor-pointer hover:underline text-accent"
                            onClick={() => handleWordClick(segment, message.text!)}
                          >
                            {segment}
                          </span>
                        );
                      }
                      return <span key={`${message.id}-space-${index}`}>{segment}</span>;
                    })}
                  </p>
                ) : message.evaluationDetails ? (
                  <div className="space-y-2 text-sm">
                    {message.text && <p className="break-words whitespace-pre-wrap font-medium">{message.text}</p>}
                    <div className={cn(
                      "p-2.5 rounded-lg shadow",
                      message.evaluationDetails.isCorrect 
                        ? "bg-green-100 text-green-900 dark:bg-green-700 dark:text-green-100" 
                        : "bg-yellow-100 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100"
                    )}>
                      <strong className="font-semibold block mb-1">Evaluation:</strong> 
                      <span className="whitespace-pre-wrap">{message.evaluationDetails.isCorrect ? 'Correct!' : 'Needs review.'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg shadow bg-blue-100 text-blue-900 dark:bg-blue-700 dark:text-blue-100">
                      <strong className="font-semibold block mb-1">Feedback:</strong> 
                      <span className="whitespace-pre-wrap">{message.evaluationDetails.feedback}</span>
                    </div>
                    <div className="p-2.5 rounded-lg shadow bg-indigo-100 text-indigo-900 dark:bg-indigo-700 dark:text-indigo-100">
                      <strong className="font-semibold block mb-1">Grammar:</strong> 
                      <span className="whitespace-pre-wrap">{message.evaluationDetails.grammarFeedback}</span>
                    </div>
                  </div>
                ) : message.explanationDetails ? (
                   <Card className="bg-transparent border-0 shadow-none p-0">
                    <CardContent className="p-0 text-sm space-y-3">
                      {message.text && <p className="whitespace-pre-wrap break-words font-medium mb-2">{message.text}</p>}
                      {message.explanationDetails.explanation && <p className="whitespace-pre-wrap break-words">{message.explanationDetails.explanation}</p>}
                      {message.explanationDetails.originalContextUsed && (
                        <div className="mt-2 p-2.5 rounded-lg shadow bg-sky-100 dark:bg-sky-700 text-sky-900 dark:text-sky-100">
                          <strong className="font-semibold block mb-1 text-xs uppercase tracking-wider">Meaning in Context:</strong>
                          <p className="whitespace-pre-wrap break-words italic">"{message.explanationDetails.originalContextUsed}"</p>
                        </div>
                      )}
                      {message.explanationDetails.exampleSentences && message.explanationDetails.exampleSentences.length > 0 && (
                        <div className="mt-2 p-2.5 rounded-lg shadow bg-teal-100 dark:bg-teal-700 text-teal-900 dark:text-teal-100">
                          <strong className="font-semibold block mb-1 text-xs uppercase tracking-wider">Example Sentences:</strong>
                          <ul className="list-disc list-inside space-y-1 pl-1">
                            {message.explanationDetails.exampleSentences.map((ex, idx) => (
                              <li key={idx} className="whitespace-pre-wrap break-words">{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!message.explanationDetails.explanation && !message.explanationDetails.originalContextUsed && (!message.explanationDetails.exampleSentences || message.explanationDetails.exampleSentences.length === 0) && message.text && (
                         <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
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

    