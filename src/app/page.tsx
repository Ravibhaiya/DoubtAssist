
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { startConversation } from '@/ai/flows/startConversationFlow';
import { continueConversation } from '@/ai/flows/continueConversationFlow';
import { explainText, type ExplainTextOutput } from '@/ai/flows/explainTextFlow';
import { TextExplainerOverlay } from '@/components/feature/text-explainer-overlay';

interface Message {
    text: string;
    isSent: boolean;
    time: string;
}

interface ExplainerState {
  isOpen: boolean;
  word: string | null;
  sentence: string | null;
  data: ExplainTextOutput | null;
  isLoading: boolean;
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function SuccessFeedback() {
    return <div className="message-sent-feedback">Message Sent</div>;
}

export default function TwilightMessengerPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [explainerState, setExplainerState] = useState<ExplainerState>({
      isOpen: false,
      word: null,
      sentence: null,
      data: null,
      isLoading: false,
    });
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping]);

    useEffect(() => {
        const fetchOpeningMessage = async () => {
            setIsTyping(true);
            try {
                const response = await startConversation({});
                if (response.openingMessage) {
                    addMessage(response.openingMessage, false);
                }
            } catch (error) {
                console.error("Error starting conversation:", error);
                addMessage("I'm having some trouble starting up. Please try again later.", false);
            } finally {
                setIsTyping(false);
                messageInputRef.current?.focus();
            }
        };

        if (messages.length === 0) {
            fetchOpeningMessage();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    useEffect(() => {
        if (explainerState.isOpen && explainerState.word && explainerState.sentence && explainerState.isLoading) {
            const getExplanation = async () => {
                try {
                    const result = await explainText({
                        textToExplain: explainerState.word!,
                        contextSentence: explainerState.sentence!,
                    });
                    setExplainerState(prev => ({ ...prev, data: result, isLoading: false }));
                } catch (error) {
                    console.error("Error explaining text:", error);
                    setExplainerState(prev => ({ ...prev, isLoading: false })); // Consider showing an error toast
                }
            };
            getExplanation();
        }
    }, [explainerState.isOpen, explainerState.word, explainerState.sentence, explainerState.isLoading]);


    const addMessage = (text: string, isSent: boolean) => {
        setMessages(prev => [...prev, { text, isSent, time: getCurrentTime() }]);
    };

    const getAIResponse = async (userMessage: string) => {
        setIsTyping(true);
        
        const historyForFlow = messages.map(msg => ({
            role: msg.isSent ? 'user' : 'model' as 'user' | 'model',
            text: msg.text,
        }));

        try {
            const response = await continueConversation({ 
                userMessage: userMessage,
                history: historyForFlow,
            });
            if(response.aiReply) {
                addMessage(response.aiReply, false);
            } else {
                addMessage("I'm not sure what to say to that.", false);
            }
        } catch (error) {
            console.error("Error getting AI response:", error);
            addMessage("Sorry, I'm having a little trouble right now. Please try again later.", false);
        } finally {
            setIsTyping(false);
            messageInputRef.current?.focus();
        }
    };

    const sendMessage = () => {
        const text = inputValue.trim();
        if (text && !isSending && !isTyping) {
            setIsSending(true);
            setShowSuccess(true);
            
            addMessage(text, true);
            setInputValue('');
            
            setTimeout(() => {
                setIsSending(false);
                getAIResponse(text);
            }, 200);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleWordClick = (word: string, sentence: string) => {
        // Only trigger for actual words that contain letters.
        if (!word || !/[a-zA-Z]/.test(word)) return;
    
        // Clean the word for the AI flow.
        const cleanedWordForAI = word.replace(/[.,!?"“”;:]/g, '').trim();
    
        if (!cleanedWordForAI) return;
    
        setExplainerState({
            isOpen: true,
            word: cleanedWordForAI,
            sentence: sentence,
            data: null,
            isLoading: true,
        });
    };

    const renderInteractiveText = (text: string, sentence: string) => {
        // This regex splits the string by any sequence of characters that are NOT letters or apostrophes.
        // The capturing group ( ... ) ensures the delimiters (like spaces, punctuation) are also included in the resulting array.
        const parts = text.split(/([^a-zA-Z']+)/);
    
        return parts.filter(part => part && part.length > 0).map((part, index) => {
            // Check if the part is a "word" (contains only letters and apostrophes).
            if (/^[a-zA-Z']+$/.test(part)) {
                return (
                    <span
                        key={index}
                        className="cursor-pointer hover:bg-accent-color-1/30 rounded-[3px] transition-colors duration-200"
                        onClick={() => handleWordClick(part, sentence)}
                    >
                        {part}
                    </span>
                );
            } else {
                // This part is punctuation, whitespace, or other symbols, so it's not clickable.
                return <React.Fragment key={index}>{part}</React.Fragment>;
            }
        });
    };

    return (
        <>
            {showSuccess && <SuccessFeedback />}
            <div className="phone-container">
                <div className="screen">
                    <div className="status-bar"></div>
                    <div className="header">
                        <div className="profile-info">
                            <div className="avatar">J</div>
                            <div className="contact-info">
                                <h3>John</h3>
                                <div className="online-status">
                                    <div className="online-dot"></div>
                                    Online
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="chat-container" ref={chatContainerRef}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.isSent ? 'sent' : 'received'}`}>
                                <div className="message-bubble">
                                    <p style={{ margin: 0, padding: 0 }}>
                                      {msg.isSent 
                                        ? msg.text 
                                        : renderInteractiveText(msg.text, msg.text)
                                      }
                                    </p>
                                    <div className="message-time">{msg.time}</div>
                                </div>
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="typing-indicator show">
                                <div className="typing-dots">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="input-area">
                        <div className="input-container">
                            <input
                                type="text"
                                className="message-input"
                                ref={messageInputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                disabled={isTyping || isSending}
                            />
                        </div>
                        <button className={`send-btn ${isSending ? 'sending' : ''}`} onClick={sendMessage} disabled={isSending || isTyping}>
                            <svg className="send-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <TextExplainerOverlay
                isOpen={explainerState.isOpen}
                onClose={() => setExplainerState(prev => ({ ...prev, isOpen: false, word: null, sentence: null, data: null }))}
                word={explainerState.word}
                sentence={explainerState.sentence}
                isLoading={explainerState.isLoading}
                explanationData={explainerState.data}
            />
        </>
    );
}
