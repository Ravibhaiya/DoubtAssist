"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent } from 'react';

export default function ReadingPage() {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim() === '') return; // Don't send empty messages
    console.log("Sending:", inputValue);
    // TODO: Implement actual send logic (e.g., call an AI flow)
    setInputValue(''); // Clear input after send
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevents newline if it were a textarea
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Scrollable content area - adjust padding-bottom to make space for the fixed input bar + bottom nav */}
      <div className="flex-grow container mx-auto p-4 overflow-y-auto pb-28 sm:pb-24">
        {/* Page content will appear here. For example, conversation history or analysis results. */}
      </div>

      {/* Fixed input bar at the bottom */}
      {/* Outer container for positioning, background, blur, and top border */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm py-2 px-2 z-10 border-t border-border">
        {/* Inner container for styling the input group (border, shadow, rounded corners) */}
        {/* max-w-sm is 384px, similar to example's 400px */}
        <div className="flex items-center gap-2 max-w-sm mx-auto bg-card border-2 border-primary rounded-xl shadow-lg p-1.5 focus-within:border-primary/70 transition-colors duration-300 ease-in-out">
          <Input
            type="text"
            placeholder="Enter your message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 text-base h-auto placeholder:text-muted-foreground"
            // py-2.5 (10px vertical padding) makes internal height of input match button's h-9 (36px)
          />
          <Button
            onClick={handleSend}
            disabled={inputValue.trim() === ''}
            className="h-9 w-[75px] text-sm font-semibold bg-primary text-primary-foreground rounded-lg shadow-md shadow-primary/30 transition-all duration-300 ease-in-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/35 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 disabled:shadow-md"
            // h-9 (36px) with px-4 (16px horizontal padding) fits "Send" nicely and matches example's button style
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
