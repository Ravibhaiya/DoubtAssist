
"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReadingPage() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-theme(spacing.16))]">
      {/* Styled container for input and button */}
      <div className="w-full max-w-lg flex items-center bg-card border border-primary rounded-full p-1 pr-1.5 pl-5 shadow-lg">
        <Textarea
          placeholder="Paste or type your text here..."
          className="flex-grow bg-transparent border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none resize-none h-14 py-3.5 text-base placeholder:text-muted-foreground"
        />
        <Button
          className="h-14 w-[100px] bg-primary text-primary-foreground uppercase rounded-full hover:bg-primary/90 transition-colors duration-150 ease-in-out flex-shrink-0 text-sm font-bold tracking-[1.5px]"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
