
"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReadingPage() {
  return (
    <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-theme(spacing.16))]"> {/* Adjust height for potential header/footer */}
      <div className="flex-grow flex flex-col">
        <Textarea
          placeholder="Paste or type your text here for comprehension analysis..."
          className="w-full flex-grow rounded-xl border shadow-sm resize-none text-base p-4" 
        />
      </div>
      <Button
        className="mt-4 px-6 py-3 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_4px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[4px] w-full sm:w-auto sm:self-end hover:bg-primary/90 transition-all duration-150 ease-in-out"
      >
        Send Text
      </Button>
    </div>
  );
}
