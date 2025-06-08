
"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react"; // This import is unused now, but keeping it in case it's needed elsewhere or in future. Could be removed if strictly not needed.

export default function Home() {
  return (
    <div className="container mx-auto p-4 py-8 md:py-12">
      {/* Removed welcome text and icon */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button
          className="p-5 uppercase tracking-[1.5px] font-bold rounded-[17px] bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] w-full sm:w-auto hover:bg-primary/90"
        >
          Reading and comprehension
        </Button>
        <Button
          className="p-5 uppercase tracking-[1.5px] font-bold rounded-[17px] bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] w-full sm:w-auto hover:bg-primary/90"
        >
          Cloze test
        </Button>
        <Button
          className="p-5 uppercase tracking-[1.5px] font-bold rounded-[17px] bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] w-full sm:w-auto hover:bg-primary/90"
        >
          Grammar
        </Button>
      </div>
    </div>
  );
}
