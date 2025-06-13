
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Send as SendIcon, Loader2, NotebookText } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleAnalysisOverlay } from "@/components/feature/article-analysis-overlay";

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
  articleFullText?: string; // To pass full article text for context
}

type ReadingState = 'idle' | 'awaiting_answer' | 'evaluating' | 'error';

export default function ReadingPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const initialFetchDoneRef = useRef(false); 

  const [currentArticle, setCurrentArticle] = useState<string | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [readingState, setReadingState] = useState<ReadingState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  // State for Article Analysis Overlay
  const [isAnalysisOverlayOpen, setIsAnalysisOverlayOpen] = useState(false);
  const [analysisArticleId, setAnalysisArticleId] = useState<string | null>(null);
  const [analysisArticleContent, setAnalysisArticleContent] = useState<string | null>(null);


  const addMessage = (
    sender: 'user' | 'ai',
    content: Partial<Omit<Message, 'id' | 'sender' | 'timestamp'>>
  ) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      sender,
      timestamp: new Date(),
      text: content.text,
      isLoading: content.isLoading,
      evaluationDetails: content.evaluationDetails,
      explanationDetails: content.explanationDetails,
      isArticle: content.isArticle,
      articleFullText: content.articleFullText,
    };
    setMessages(prevMessages => {
      if (content.isLoading && sender === 'ai') {
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
    addMessage('ai', { text: "Fetching a news article and questions for you...", isLoading: true });
    setIsAISpeaking(true);
    try {
      const result: GetNewsAndQuestionsOutput = await getNewsAndQuestions({});

      setCurrentArticle(result.article);
      setCurrentQuestions(result.questions);
      setCurrentQuestionIndex(0);

      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));

      let articleMetadata = "";
      if (result.articleSource) articleMetadata += `Source: ${result.articleSource}\n`;
      if (result.articleDate && result.articleDate !== "N/A") {
         articleMetadata += `Published on: ${result.articleDate}\n`;
      }
      if (result.articleUrl) articleMetadata += `URL: ${result.articleUrl}\n`;

      if (articleMetadata.length > 0) {
        addMessage('ai', {text: articleMetadata.trim()});
      }

      addMessage('ai', {text: result.article, isArticle: true, articleFullText: result.article });

      if (result.questions && result.questions.length > 0) {
        addMessage('ai', { text: result.questions[0] });
        setReadingState('awaiting_answer');
      } else {
        addMessage('ai', { text: "I couldn't find any questions for this article. You can ask me to explain something or fetch another article."});
        setReadingState('idle');
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
      addMessage('ai', {text: "Sorry, I couldn't fetch news right now. Please try again later or ask me to explain something."});
      setReadingState('error');
    } finally {
      setIsLoading(false);
      setIsAISpeaking(false);
    }
  };

  useEffect(() => {
    if (!initialFetchDoneRef.current) { 
      fetchNews();
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

  const handleWordClick = async (word: string, fullArticleText?: string) => {
    if (isLoading || isAISpeaking || !fullArticleText) return;

    const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
    if (!cleanedWord) return;

    addMessage('user', { text: `Explain: "${cleanedWord}"` });
    setInputValue('');
    setIsLoading(true);
    setIsAISpeaking(true);
    addMessage('ai', { text: "Explaining...", isLoading: true });

    let contextSentenceFound: string | undefined = undefined;
    const sentences = fullArticleText.split(/(?<=[.!?])\s+(?=[A-ZА-ЯЁ])/);
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
        'ai',
        {
          explanationDetails: result
        }
      );
      addMessage('ai', { text: currentArticle ? "Anything else about the article, another explanation, or a new article?" : "Anything else you'd like to explain, or would you like a news article?" });
      setReadingState('idle');
    } catch (e) {
      console.error("Error in handleWordClick:", e);
      setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
      addMessage('ai', { text: "Sorry, I couldn't explain that word right now."});
      setReadingState('error');
    } finally {
      setIsLoading(false);
      setIsAISpeaking(false);
    }
  };
  
  const isSendButtonDisabled = isLoading || isAISpeaking;

  const handleSend = async () => {
    if (inputValue.trim() === '' || isSendButtonDisabled) return;

    const userText = inputValue.trim();
    addMessage('user', { text: userText });
    setInputValue('');

    setIsLoading(true);
    setIsAISpeaking(true);
    let loadingMessageText = "Thinking...";

    try {
      if (readingState === 'awaiting_answer' && currentArticle && currentQuestions.length > 0) {
        setReadingState('evaluating');
        loadingMessageText = "Evaluating your answer...";
        addMessage('ai', { text: loadingMessageText, isLoading: true });

        const evaluationInput: EvaluateUserAnswerInput = {
          article: currentArticle,
          question: currentQuestions[currentQuestionIndex],
          userAnswer: userText,
        };
        const evaluationResult = await evaluateUserAnswer(evaluationInput);
        addMessage(
          'ai',
          {
            evaluationDetails: evaluationResult
          }
        );

        const nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex < currentQuestions.length) {
          setCurrentQuestionIndex(nextQuestionIndex);
          addMessage('ai', { text: currentQuestions[nextQuestionIndex] });
          setReadingState('awaiting_answer');
        } else {
          addMessage('ai', { text: "You've answered all questions for this article! Ask about the article, explain something, or request a 'new article'."});
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
          addMessage('ai', { text: loadingMessageText, isLoading: true });
          const queryInput: AnswerArticleQueryInput = { article: currentArticle, userQuery: userText };
          const queryResult = await answerArticleQuery(queryInput);
          addMessage('ai', { text: queryResult.answer });
          addMessage('ai', { text: "Anything else about this article, explain something, or request a 'new article'?" });
          setReadingState('idle');
        } else {
          loadingMessageText = "Explaining...";
          addMessage('ai', { text: loadingMessageText, isLoading: true });
          const explainInput: ExplainTextInput = { textToExplain: userText };
          const result = await explainText(explainInput);
          addMessage(
            'ai',
            {
              explanationDetails: result
            }
          );
          addMessage('ai', { text: currentArticle ? "Anything else about the article, another explanation, or a new article?" : "Anything else you'd like to explain, or would you like a news article?"});
          setReadingState('idle');
        }
      }
    } catch (e) {
        console.error("Error in handleSend:", e);
        setMessages(prev => prev.filter(m => !(m.isLoading && m.sender === 'ai')));
        addMessage('ai', { text: "An unexpected error occurred. Please try again."});
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
    if (isSendButtonDisabled) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <SendIcon className="h-5 w-5" />;
  };

  const inputPlaceholder = () => {
    if (isSendButtonDisabled) return "AI is working...";
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
                  <div>
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {message.text.split(/(\s+)/).map((segment, index) => {
                        const isWordSegment = segment.trim().length > 0;
                        if (isWordSegment) {
                          return (
                            <span
                              key={`${message.id}-word-${index}`}
                              className="cursor-pointer hover:underline text-accent transition-colors duration-150 ease-in-out"
                              onClick={() => handleWordClick(segment, message.articleFullText)}
                            >
                              {segment}
                            </span>
                          );
                        }
                        return <span key={`${message.id}-space-${index}`}>{segment}</span>;
                      })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      onClick={() => {
                        setAnalysisArticleId(message.id);
                        setAnalysisArticleContent(message.articleFullText || message.text || null);
                        setIsAnalysisOverlayOpen(true);
                      }}
                    >
                      <NotebookText className="mr-2 h-4 w-4" />
                      Article Analysis
                    </Button>
                  </div>
                ) : message.evaluationDetails ? (
                  <Card className="bg-transparent border-0 shadow-none p-0">
                    <CardContent className="p-0 text-sm space-y-3">
                      <p className="whitespace-pre-wrap break-words font-medium mb-2">Here's the evaluation of your answer:</p>
                      <div className={cn(
                        "p-3 rounded-lg shadow-sm border",
                        message.evaluationDetails.isCorrect
                          ? "bg-success text-success-foreground border-success-foreground/30"
                          : "bg-warning text-warning-foreground border-warning-foreground/30"
                      )}>
                        <strong className="font-semibold block mb-1">Evaluation:</strong>
                        <span className="whitespace-pre-wrap">{message.evaluationDetails.isCorrect ? 'Correct!' : 'Needs review.'}</span>
                      </div>
                      <div className="p-3 rounded-lg shadow-sm bg-info text-info-foreground border border-info-foreground/30">
                        <strong className="font-semibold block mb-1">Feedback:</strong>
                        <span className="whitespace-pre-wrap">{message.evaluationDetails.feedback}</span>
                      </div>
                      <div className="p-3 rounded-lg shadow-sm bg-secondary text-secondary-foreground border border-border">
                        <strong className="font-semibold block mb-1">Grammar:</strong>
                        <span className="whitespace-pre-wrap">{message.evaluationDetails.grammarFeedback}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : message.explanationDetails ? (
                   <Card className="bg-transparent border-0 shadow-none p-0">
                    <CardContent className="p-0 text-sm space-y-3">
                      {message.text && <p className="whitespace-pre-wrap break-words font-medium mb-2">{message.text}</p>}
                      {message.explanationDetails.explanation && <p className="whitespace-pre-wrap break-words">{message.explanationDetails.explanation}</p>}
                      {message.explanationDetails.originalContextUsed && (
                        <div className="mt-2 p-3 rounded-lg shadow-sm bg-info text-info-foreground border border-info-foreground/30">
                          <strong className="font-semibold block mb-1 text-xs uppercase tracking-wider">Meaning in Context:</strong>
                          <p className="whitespace-pre-wrap break-words italic">"{message.explanationDetails.originalContextUsed}"</p>
                        </div>
                      )}
                      {message.explanationDetails.exampleSentences && message.explanationDetails.exampleSentences.length > 0 && (
                        <div className="mt-2 p-3 rounded-lg shadow-sm bg-success text-success-foreground border border-success-foreground/30">
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
        <div className="relative max-w-sm mx-auto">
          <div className={cn(
            "absolute left-0 right-0 bottom-0 h-[calc(100%_-_1px)] bg-primary-darker rounded-xl transition-opacity duration-150 ease-in-out",
             isSendButtonDisabled ? "opacity-50" : "opacity-100"
           )} style={{ transform: 'translateY(5px)'}} />
          <div className="flex items-center gap-2 bg-card border-2 border-primary rounded-xl shadow-lg p-1.5 focus-within:border-primary/70 transition-colors duration-300 ease-in-out relative z-10">
            <Input
              type="text"
              placeholder={inputPlaceholder()}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 text-base h-auto placeholder:text-muted-foreground"
              disabled={isSendButtonDisabled}
            />
            <Button
              onClick={handleSend}
              disabled={isSendButtonDisabled && inputValue.trim() === ''}
              className={cn(
                "h-10 w-12 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-150 ease-in-out flex items-center justify-center relative",
                !isSendButtonDisabled ? "active:translate-y-[5px]" : "opacity-50 translate-y-0"
              )}
              aria-label="Send message"
            >
              {sendButtonContent()}
            </Button>
          </div>
        </div>
      </div>
      <ArticleAnalysisOverlay
        isOpen={isAnalysisOverlayOpen}
        onClose={() => {
          setIsAnalysisOverlayOpen(false);
          setAnalysisArticleId(null);
          setAnalysisArticleContent(null);
        }}
        articleId={analysisArticleId}
        articleContent={analysisArticleContent}
      />
    </div>
  );
}

    