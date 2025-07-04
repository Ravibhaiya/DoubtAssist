'use client';

import React, { useState, useEffect, useRef } from 'react';
import { continueConversation } from '@/ai/flows/continueConversationFlow';
import { checkGrammar } from '@/ai/flows/checkGrammarFlow';
import { explainWord } from '@/ai/flows/explainWordFlow';
import { Check, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

// Define types for our data structures
interface Message {
  id: number;
  text: string;
  type: 'sent' | 'received';
  time: string;
  correctionData?: GrammarCorrection;
  context?: string;
}

interface GrammarCorrection {
  correctedSentence: string;
  explanation: string;
  errorType: 'none' | 'minor' | 'major';
}

interface WordDetails {
    word: string;
    definition: string;
    contextualMeaning: string;
    synonyms: string[];
    antonyms: string[];
    examples: string[];
}

// Helper to get current time as a string
function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Word Explainer Overlay Component
function WordExplainerOverlay({ word, details, isLoading, onClose }: { word: string | null; details: WordDetails | null; isLoading: boolean; onClose: () => void; }) {
    if (!word) return null;

    return (
        <div className={`word-overlay ${word ? 'show' : ''}`} onClick={onClose}>
            <div className="word-details-panel" onClick={(e) => e.stopPropagation()}>
                {isLoading ? (
                    <div className="overlay-loader">Analyzing word...</div>
                ) : details ? (
                    <>
                        <div className="word-details-header">
                            <h2>{details.word}</h2>
                            <button className="close-overlay-btn" onClick={onClose}>&times;</button>
                        </div>
                        <div id="detailMeaning" className="detail-box">
                            <h4>Definition</h4>
                            <p dangerouslySetInnerHTML={{ __html: details.definition }}></p>
                        </div>
                        <div id="detailContextualMeaning" className="detail-box">
                            <h4>Meaning in Context</h4>
                            <p dangerouslySetInnerHTML={{ __html: details.contextualMeaning }}></p>
                        </div>
                        <div id="detailSynonyms" className="detail-box">
                            <h4>Synonyms</h4>
                            <div className="tag-container" dangerouslySetInnerHTML={{ __html: details.synonyms.length > 0 ? details.synonyms.map(s => `<span class="tag">${s}</span>`).join('') : '<p>No synonyms found.</p>' }}>
                            </div>
                        </div>
                        <div id="detailAntonyms" className="detail-box">
                            <h4>Antonyms</h4>
                            <div className="tag-container" dangerouslySetInnerHTML={{ __html: details.antonyms.length > 0 ? details.antonyms.map(a => `<span class="tag">${a}</span>`).join('') : '<p>No antonyms found.</p>'}}>
                            </div>
                        </div>
                        <div id="detailExamples" className="detail-box">
                            <h4>Example Sentences</h4>
                            <ul dangerouslySetInnerHTML={{ __html: details.examples.length > 0 ? details.examples.map(e => `<li>${e}</li>`).join('') : '<p>No examples found.</p>'}}></ul>
                        </div>
                    </>
                ) : (
                     <>
                        <div className="word-details-header">
                            <h2>Error</h2>
                            <button className="close-overlay-btn" onClick={onClose}>&times;</button>
                        </div>
                        <div className="detail-box">
                          <p>Sorry, I couldn't fetch the details for "{word}". Please try another word.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Grammar Correction Overlay Component
function GrammarCorrectionOverlay({ correction, onClose }: { correction: GrammarCorrection | null; onClose: () => void; }) {
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
        <div className="word-overlay show" onClick={onClose}>
            <div className="word-details-panel" onClick={(e) => e.stopPropagation()}>
                <div className="word-details-header">
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
    
    // State for Word Explainer
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [selectedWordContext, setSelectedWordContext] = useState<string | null>(null);
    const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
    const [isOverlayLoading, setIsOverlayLoading] = useState(false);

    // State for Grammar Correction
    const [selectedCorrection, setSelectedCorrection] = useState<GrammarCorrection | null>(null);

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
            text: "Hello! I'm John. Feel free to chat with me. If I notice a grammar mistake in your message, I'll offer a helpful tip. You can also click on any word I say to get more details about it.",
            type: 'received',
            time: getCurrentTime(),
            context: "Hello! I'm John. Feel free to chat with me. If I notice a grammar mistake in your message, I'll offer a helpful tip. You can also click on any word I say to get more details about it."
        }]);
        inputRef.current?.focus();
    }, []);

    // Effect to fetch word details when a word is selected
    useEffect(() => {
        if (selectedWord && selectedWordContext) {
            const fetchDetails = async () => {
                setIsOverlayLoading(true);
                setWordDetails(null);
                try {
                    const details = await explainWord({ word: selectedWord, context: selectedWordContext });
                    setWordDetails(details);
                } catch (error) {
                    console.error("Failed to fetch word details:", error);
                    setWordDetails(null);
                } finally {
                    setIsOverlayLoading(false);
                }
            };
            fetchDetails();
        }
    }, [selectedWord, selectedWordContext]);

    // Adds a new message to the state and returns its ID
    const addMessage = (text: string, type: 'sent' | 'received', context?: string): number => {
        const newMessageId = Date.now();
        const newMessage: Message = {
            id: newMessageId,
            text,
            type,
            time: getCurrentTime(),
            context,
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
            // Check grammar in parallel
            const grammarPromise = checkGrammar({ userText: text });
            
            // Get conversational response
            const historyForFlow = messages
              .filter(msg => msg.type === 'sent' || msg.type === 'received')
              .map(msg => ({
                role: msg.type === 'sent' ? 'user' : 'model' as 'user' | 'model',
                text: msg.text,
              }));

            const conversationPromise = continueConversation({ userMessage: text, history: historyForFlow });

            // Await both promises
            const [grammarResult, conversationResult] = await Promise.all([grammarPromise, conversationPromise]);

            // Handle conversation result
            if (conversationResult && conversationResult.aiReply) {
                addMessage(conversationResult.aiReply, 'received', conversationResult.aiReply);
            }

            // Handle grammar result - update the sent message
            if (grammarResult) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === sentMessageId
                            ? { ...msg, correctionData: grammarResult }
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
    
    const handleWordClick = (word: string, context: string) => {
        const cleanWord = word.replace(/[.,!?;"“'”]/g, '').trim();
        if (cleanWord && cleanWord.match(/[a-zA-Z]/)) {
            setSelectedWord(cleanWord);
            setSelectedWordContext(context);
        }
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.type === 'received' && msg.context) {
            return msg.text.split(/(\s+)/).map((part, index) => {
                 if (part.trim().length > 0) {
                    return <span key={index} className="ai-word" onClick={() => handleWordClick(part, msg.context!)}>{part}</span>;
                 }
                 return part;
            });
        }
        return msg.text;
    };

    const renderGrammarIcon = (correction: GrammarCorrection) => {
        switch (correction.errorType) {
            case 'none':
                return <Check width="16" height="16" strokeWidth="3" />;
            case 'minor':
                return <AlertTriangle width="14" height="14" strokeWidth="2.5" fill="white" stroke="var(--warning-color)" />;
            case 'major':
                 return <XCircle width="16" height="16" strokeWidth="2.5" />;
            default:
                return null;
        }
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
                            <div className="message-bubble" data-context={msg.context}>
                                <div className="message-text-wrapper">
                                    <div className="message-text">
                                      {renderMessageContent(msg)}
                                    </div>
                                    <div className="message-time">{msg.time}</div>
                                </div>
                                {msg.type === 'sent' && msg.correctionData && (
                                    <button className={`grammar-icon-btn ${msg.correctionData.errorType}`} onClick={() => setSelectedCorrection(msg.correctionData!)}>
                                        {renderGrammarIcon(msg.correctionData)}
                                    </button>
                                )}
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
        <WordExplainerOverlay
            word={selectedWord}
            details={wordDetails}
            isLoading={isOverlayLoading}
            onClose={() => setSelectedWord(null)}
        />
        <GrammarCorrectionOverlay 
            correction={selectedCorrection}
            onClose={() => setSelectedCorrection(null)}
        />
      </>
    );
}
