'use client';

import React, { useState, useEffect, useRef } from 'react';
import { continueConversation, type CheckGrammarOutput } from '@/ai/flows/continueConversationFlow';
import { explainMessage, type ExplainMessageOutput } from '@/ai/flows/explainMessageFlow';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

// Define types for our data structures
interface Message {
  id: number;
  text: string;
  type: 'sent' | 'received';
  time: string;
  correctionData?: CheckGrammarOutput;
}

// Helper to get current time as a string
function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Message Explainer Overlay Component
function MessageExplainerOverlay({ explainerData, isLoading, onClose }: { explainerData: ExplainMessageOutput | null; isLoading: boolean; onClose: () => void; }) {
    const show = isLoading || !!explainerData;

    return (
        <div className={`generic-overlay ${show ? 'show' : ''}`} onClick={onClose}>
            <div className="details-panel" onClick={(e) => e.stopPropagation()}>
                {isLoading ? (
                    <div className="overlay-loader">Analyzing message...</div>
                ) : explainerData ? (
                    <>
                        <div className="details-header message-explainer-header">
                            <h2>Message Explained</h2>
                            <button className="close-overlay-btn" onClick={onClose}>&times;</button>
                        </div>
                        {explainerData.explanations.map((item, index) => (
                            <div key={index} className="sentence-explanation-box">
                                <blockquote>{item.sentence}</blockquote>
                                <p>{item.explanation}</p>
                            </div>
                        ))}
                    </>
                ) : null}
            </div>
        </div>
    );
}

// Grammar Correction Overlay Component
function GrammarCorrectionOverlay({ correction, onClose }: { correction: CheckGrammarOutput | null; onClose: () => void; }) {
    if (!correction) return null;

    const isGood = correction.errorType === 'none';

    const headerIcon = () => {
        switch (correction.errorType) {
            case 'none': return <CheckCircle2 width="28" height="28" />;
            case 'minor': return <AlertTriangle width="28" height="28" />;
            case 'major': return <XCircle width="28" height="28" />;
        }
    };
    
    const headerText = () => {
        switch (correction.errorType) {
            case 'none': return "Looks Good!";
            case 'minor': return "Minor Tip";
            case 'major': return "Grammar Tip";
        }
    };

    return (
        <div className="generic-overlay show" onClick={onClose}>
            <div className="details-panel" onClick={(e) => e.stopPropagation()}>
                <div className="details-header">
                    <h2 className={`grammar-overlay-header ${correction.errorType}`}>
                        {headerIcon()}
                        <span>{headerText()}</span>
                    </h2>
                    <button className="close-overlay-btn" onClick={onClose}>&times;</button>
                </div>
                {isGood ? (
                    <div id="detailCorrected" className="detail-box">
                        <h4>All Clear</h4>
                        <p>No grammatical errors were found in your message. Keep it up!</p>
                    </div>
                ) : (
                    <>
                        <div id="detailCorrected" className="detail-box">
                            <h4>Corrected Sentence</h4>
                            <p className="corrected-text">{correction.correctedSentence}</p>
                        </div>
                        <div id="detailExplanation" className="detail-box">
                            <h4>Explanation</h4>
                            <p>{correction.explanation}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


export default function JohnPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // State for Message Explainer
    const [selectedMessageForExplainer, setSelectedMessageForExplainer] = useState<string | null>(null);
    const [explainerData, setExplainerData] = useState<ExplainMessageOutput | null>(null);
    const [isExplainerLoading, setIsExplainerLoading] = useState(false);

    // State for Grammar Correction
    const [selectedCorrection, setSelectedCorrection] = useState<CheckGrammarOutput | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Effect to scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping]);

    // Effect for the initial message
    useEffect(() => {
        setMessages([{
            id: 0,
            text: "Hello! I'm John. Feel free to chat with me. If I notice a grammar mistake in your message, I'll offer a helpful tip. You can also click on any message I say to get a simple explanation of it.",
            type: 'received',
            time: getCurrentTime(),
        }]);
        inputRef.current?.focus();
    }, []);

    // Effect to fetch message explanation when a message is selected
    useEffect(() => {
        if (selectedMessageForExplainer) {
            const fetchExplanation = async () => {
                setIsExplainerLoading(true);
                setExplainerData(null);
                try {
                    const details = await explainMessage({ message: selectedMessageForExplainer });
                    setExplainerData(details);
                } catch (error) {
                    console.error("Failed to fetch message explanation:", error);
                    // Optionally, set an error state to show in the overlay
                    setExplainerData(null); 
                } finally {
                    setIsExplainerLoading(false);
                }
            };
            fetchExplanation();
        }
    }, [selectedMessageForExplainer]);

    // Adds a new message to the state and returns its ID
    const addMessage = (text: string, type: 'sent' | 'received'): number => {
        const newMessageId = Date.now();
        const newMessage: Message = {
            id: newMessageId,
            text,
            type,
            time: getCurrentTime(),
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessageId;
    };

    const handleSendMessage = async () => {
        const text = inputValue.trim();
        if (!text || isTyping) return;

        const sentMessageId = addMessage(text, 'sent');
        setInputValue('');
        setIsTyping(true);

        try {
            // Get conversational response and grammar check in a single call
            const historyForFlow = messages
              .filter(msg => msg.type === 'sent' || msg.type === 'received')
              .map(msg => ({
                role: msg.type === 'sent' ? 'user' : 'model' as 'user' | 'model',
                text: msg.text,
              }));
            
            const result = await continueConversation({ userMessage: text, history: historyForFlow });

            // Handle conversation result
            if (result && result.aiReply) {
                addMessage(result.aiReply, 'received');
            }

            // Handle grammar result - update the sent message
            if (result && result.grammarCheck) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === sentMessageId
                            ? { ...msg, correctionData: result.grammarCheck }
                            : msg
                    )
                );
            }

        } catch (error) {
            console.error("Error during AI processing:", error);
            addMessage("Sorry, I'm having a little trouble connecting. Please try again later.", 'received');
        } finally {
            setIsTyping(false);
            inputRef.current?.focus();
        }
    };
    
    const handleMessageClick = (messageText: string) => {
        setSelectedMessageForExplainer(messageText);
    };

    return (
      <>
        <div className="phone-container">
            <div className="screen">
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
                    {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.type}`}>
                            <div 
                                className={`message-bubble ${
                                    msg.type === 'sent' && msg.correctionData
                                        ? `grammar-status-${msg.correctionData.errorType}`
                                        : ''
                                }`}
                                onClick={() => {
                                    if (msg.type === 'received') {
                                        handleMessageClick(msg.text);
                                    } else if (msg.type === 'sent' && msg.correctionData) {
                                        setSelectedCorrection(msg.correctionData);
                                    }
                                }}
                            >
                                <div className="message-text-wrapper">
                                    <div className="message-text">
                                      {msg.text}
                                    </div>
                                    <div className="message-time">{msg.time}</div>
                                </div>
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
                            ref={inputRef}
                            type="text"
                            className="message-input"
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isTyping}
                        />
                    </div>
                    <button className="send-btn" onClick={handleSendMessage} disabled={isTyping || !inputValue}>
                        <svg className="send-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <MessageExplainerOverlay
            explainerData={explainerData}
            isLoading={isExplainerLoading}
            onClose={() => {
                setSelectedMessageForExplainer(null);
                setExplainerData(null);
            }}
        />
        <GrammarCorrectionOverlay 
            correction={selectedCorrection}
            onClose={() => setSelectedCorrection(null)}
        />
      </>
    );
}
