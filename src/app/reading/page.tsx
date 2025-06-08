
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Send as SendIcon } from 'lucide-react';

export default function ReadingPage() {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim() === '') return;
    console.log("Sending:", inputValue);
    // TODO: Implement actual send logic (e.g., call an AI flow)
    setInputValue('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
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

      {/* Fixed input bar at the bottom */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 w-full bg-background/80 py-2 px-2 z-[60] border-t border-border">
        <div className="flex items-center gap-2 max-w-xs mx-auto bg-card border-2 border-primary rounded-xl shadow-lg p-1.5 focus-within:border-primary/70 transition-colors duration-300 ease-in-out">
          <Input
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
            className="h-10 w-10 bg-primary text-primary-foreground rounded-xl shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-colors duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center"
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
