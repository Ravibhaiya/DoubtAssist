
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Changed from Textarea to Input based on previous iteration, but styles provided were for input. Reverting to Input to match placeholder.
import { useState, type ChangeEvent, type KeyboardEvent } from 'react';

export default function ReadingPage() {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => { // Changed from HTMLTextAreaElement
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim() === '') return; // Don't send empty messages
    console.log("Sending:", inputValue);
    // TODO: Implement actual send logic (e.g., call an AI flow)
    setInputValue(''); // Clear input after send
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => { // Changed from HTMLTextAreaElement
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-grow container mx-auto p-4 overflow-y-auto pb-28 sm:pb-24">
        {/* Page content will appear here. */}
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm py-2 px-2 z-10 border-t border-border">
        <div className="flex items-center gap-2 max-w-xs mx-auto bg-card border-2 border-primary rounded-xl shadow-lg p-1.5 focus-within:border-primary/70 transition-colors duration-300 ease-in-out">
          <Input // Using Input component as per the style example and typical chat interfaces
            type="text"
            placeholder="Enter your message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 text-base h-auto placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSend}
            disabled={inputValue.trim() === ''}
            className="h-9 w-[75px] text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out disabled:opacity-50"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
