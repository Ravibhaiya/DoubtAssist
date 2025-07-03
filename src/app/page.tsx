'use client';

import React, { useState, useEffect, useRef } from 'react';
import { startConversation } from '@/ai/flows/startConversationFlow';
import { continueConversation } from '@/ai/flows/continueConversationFlow';

interface Message {
    text: string;
    isSent: boolean;
    time: string;
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

    const addMessage = (text: string, isSent: boolean) => {
        setMessages(prev => [...prev, { text, isSent, time: getCurrentTime() }]);
    };

    const getAIResponse = async (userMessage: string) => {
        setIsTyping(true);
        try {
            const response = await continueConversation({ userMessage });
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
            
            // Short delay to allow "sent" animation to be seen
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
                                    <p style={{ margin: 0, padding: 0 }}>{msg.text}</p>
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
        </>
    );
}
