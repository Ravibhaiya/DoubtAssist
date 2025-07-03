'use client';

import React, { useState, useEffect, useRef } from 'react';

const responses = [
    "That sounds interesting! Tell me more.",
    "I completely understand what you mean.",
    "Haha, that's so funny! 😄",
    "Really? That's amazing!",
    "I've been thinking about that too.",
    "You're absolutely right about that.",
    "Thanks for sharing that with me!",
    "That's a great point!",
    "I hadn't thought of it that way.",
    "Wow, that's really cool!",
    "That's exactly what I was thinking!",
    "You always have the best ideas! 💡",
    "I'm so glad you told me that!",
    "That made my day! 😊",
    "You're the best! Thanks for sharing!"
];

interface Message {
    text: string;
    isSent: boolean;
    time: string;
}

const initialMessages: Message[] = [
    { text: "Hey! How are you doing today?", isSent: false, time: "10:30 AM" },
    { text: "I'm doing great, thanks for asking! How about you?", isSent: true, time: "10:32 AM" },
    { text: "Pretty good! Just working on some projects. What have you been up to?", isSent: false, time: "10:33 AM" },
];

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function SuccessFeedback() {
    return <div className="message-sent-feedback">Message Sent</div>;
}

export default function TwilightMessengerPage() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
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
        messageInputRef.current?.focus();
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

    const simulateJohnResponse = () => {
        setIsTyping(true);
        const typingDuration = 1200 + Math.random() * 2500;
        
        setTimeout(() => {
            setIsTyping(false);
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessage(randomResponse, false);
        }, typingDuration);
    };

    const sendMessage = () => {
        const text = inputValue.trim();
        if (text && !isSending) {
            setIsSending(true);
            setShowSuccess(true);
            
            setTimeout(() => {
                addMessage(text, true);
                setInputValue('');
                
                setIsSending(false);
                messageInputRef.current?.focus();
                
                setTimeout(simulateJohnResponse, 800 + Math.random() * 1500);
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
                            />
                        </div>
                        <button className={`send-btn ${isSending ? 'sending' : ''}`} onClick={sendMessage} disabled={isSending}>
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