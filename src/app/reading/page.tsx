
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent, useEffect, useRef } from 'react';
import { Send as SendIcon, Loader2, NotebookText, Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TextExplainerOverlay } from "@/components/feature/text-explainer-overlay";

import { getNewsAndQuestions, type GetNewsAndQuestionsOutput } from '@/ai/flows/readingComprehensionFlow';
import { evaluateUserAnswer, type EvaluateUserAnswerInput, type EvaluateUserAnswerOutput } from '@/ai/flows/evaluateAnswerFlow';
import { answerArticleQuery, type AnswerArticleQueryInput, type AnswerArticleQueryOutput } from '@/ai/flows/answerArticleQueryFlow';

interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  evaluationDetails?: EvaluateUserAnswerOutput;
  isArticle?: boolean;
  articleFullText?: string;
  articleMessageId?: string;
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

  const [isExplainerOverlayOpen, setIsExplainerOverlayOpen] = useState(false);
  const [explainerMode, setExplainerMode] = useState<'sentenceAnalysis' | 'wordExplanation' | null>(null);
  const [explainerArticleContent, setExplainerArticleContent] = useState<string | null>(null);
  const [explainerWord, setExplainerWord] = useState<string | null>(null);
  const [explainerContextSentence, setExplainerContextSentence] = useState<string | null>(null);
  const [explainerTriggerId, setExplainerTriggerId] = useState<string | null>(null);


  const addMessage = (
    sender: 'user' | 'ai',
    content: Partial<Omit<Message, 'id' | 'sender' | 'timestamp'>>
  ) => {
    const newMessageId = Date.now().toString() + Math.random();
    const newMessage: Message = {
      id: newMessageId,
      sender,
      timestamp: new Date(),
      text: content.text,
      isLoading: content.isLoading,
      evaluationDetails: content.evaluationDetails,
      isArticle: content.isArticle,
      articleFullText: content.articleFullText,
      articleMessageId: content.isArticle ? newMessageId : undefined,
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

  const handleWordClick = (word: string, fullArticleText: string, articleMsgId: string) => {
    if (isLoading || isAISpeaking) return;

    const cleanedWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
    if (!cleanedWord) return;

    let contextSentenceFound: string | undefined = undefined;
    const sentences = fullArticleText.split(/(?<=[.!?])\s+(?=[A-ZА-ЯЁ])/);
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
    setExplainerArticleContent(null);
    setExplainerTriggerId(articleMsgId + '-' + cleanedWord);
    setIsExplainerOverlayOpen(true);
  };

  const handleOpenSentenceAnalysis = (articleText: string, articleMsgId: string) => {
    setExplainerMode('sentenceAnalysis');
    setExplainerArticleContent(articleText);
    setExplainerWord(null);
    setExplainerContextSentence(null);
    setExplainerTriggerId(articleMsgId);
    setIsExplainerOverlayOpen(true);
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
          addMessage('ai', { text: "You've answered all questions for this article! Ask about the article, trigger analysis/explanation, or request a 'new article'."});
          setReadingState('idle');
        }
      } else {
        const lowerUserText = userText.toLowerCase();
        const newArticleKeywords = ["new article", "another article", "fetch news", "next one", "try another", "get news", "new news", "next article", "fetch article"];
        let isRequestingNew = newArticleKeywords.some(keyword => lowerUserText.includes(keyword));

        if (!isRequestingNew && messages.length > 0) {
          const lastAiMessage = messages.slice().reverse().find(m => m.sender === 'ai' && !m.isLoading && !m.evaluationDetails && !m.isArticle);
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
          addMessage('ai', { text: "Anything else about this article, or request a 'new article'?" });
          setReadingState('idle');
        } else {
          addMessage('ai', { text: "I can help with questions about the article, explain words you click in the article, or fetch a 'new article'. What would you like to do?" });
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
    if (currentArticle) return "Ask about article, or 'new article'...";
    return "Type 'new article' to begin";
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
                ) : message.isArticle && message.sender === 'ai' && message.text && message.articleMessageId ? (
                  <div>
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {message.text.split(/(\s+|(?<=[^\w\s])|(?=[^\w\s]))/).map((segment, index) => {
                        const isWordSegment = /\w/.test(segment) && segment.trim().length > 0;
                        if (isWordSegment) {
                          return (
                            <span
                              key={`${message.id}-word-${index}`}
                              className="cursor-pointer hover:underline text-accent transition-colors duration-150 ease-in-out"
                              onClick={() => handleWordClick(segment, message.articleFullText || "", message.articleMessageId!)}
                            >
                              {segment}
                            </span>
                          );
                        }
                        return <span key={`${message.id}-segment-${index}`}>{segment}</span>;
                      })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      onClick={() => {
                        handleOpenSentenceAnalysis(message.articleFullText || message.text || "", message.articleMessageId!);
                      }}
                    >
                      <NotebookText className="mr-2 h-4 w-4" />
                      Sentence Analysis
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
                )
                : (
                  message.text && <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!isExplainerOverlayOpen && (
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
      )}
      <TextExplainerOverlay
        isOpen={isExplainerOverlayOpen}
        onClose={() => {
          setIsExplainerOverlayOpen(false);
          setExplainerMode(null);
          setExplainerArticleContent(null);
          setExplainerWord(null);
          setExplainerContextSentence(null);
          setExplainerTriggerId(null);
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
    