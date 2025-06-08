
"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReadingPage() {
  return (
    // This div takes up the available height within the main layout
    <div className="flex flex-col h-full relative">
      {/* Scrollable content area */}
      <div className="flex-grow container mx-auto p-4 overflow-y-auto pb-[4.5rem] sm:pb-[5.5rem]">
        {/*
          Padding Bottom Explanation:
          The padding-bottom ensures that content in this scrollable area
          is not obscured by the fixed input bar at the bottom.
          - On mobile (smaller than sm): 4.5rem = 3.5rem (input height) + 0.5rem (top padding of fixed bar) + 0.5rem (bottom padding of fixed bar)
          - On sm and larger screens: 5.5rem = 3.5rem (input height) + 1rem (top padding of fixed bar) + 1rem (bottom padding of fixed bar)
        */}
        <p className="text-center text-muted-foreground">
          Paste or type your text in the input field below. Your conversation or the content analysis will appear here.
        </p>
        {/* Example content to demonstrate scrolling:
        <div className="space-y-4 mt-4">
          {Array.from({ length: 30 }).map((_, i) => (
            <p key={i} className="bg-muted p-2 rounded">Scrollable content item {i + 1}</p>
          ))}
        </div>
        */}
      </div>

      {/* Fixed input bar */}
      <div className="fixed left-0 right-0 bg-background border-t border-border z-10 p-2 sm:p-4 bottom-16 sm:bottom-0">
        {/* Input group, centered with max-width */}
        <div className="w-full max-w-xs mx-auto flex items-center bg-card border border-primary rounded-full p-1 pr-1.5 pl-5 shadow-lg">
            <Textarea
              placeholder="Paste or type your text here..."
              className="flex-grow bg-transparent border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none resize-none h-14 py-3.5 text-base placeholder:text-muted-foreground no-scrollbar"
              rows={1}
            />
            <Button
              className="h-14 w-[100px] bg-primary text-primary-foreground uppercase rounded-full hover:bg-primary/90 transition-colors duration-150 ease-in-out flex-shrink-0 text-sm font-bold tracking-[1.5px]"
            >
              Send
            </Button>
          </div>
      </div>
    </div>
  );
}
