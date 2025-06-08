
"use client";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto p-4 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button 
          className="p-5 uppercase tracking-[1.5px] font-bold rounded-[17px] bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] transition-transform duration-150 w-full sm:w-auto hover:bg-primary"
        >
          Reading and comprehension
        </Button>
        <Button 
          className="p-5 uppercase tracking-[1.5px] font-bold rounded-[17px] bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] transition-transform duration-150 w-full sm:w-auto hover:bg-primary"
        >
          Cloze test
        </Button>
        <Button 
          className="p-5 uppercase tracking-[1.5px] font-bold rounded-[17px] bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] transition-transform duration-150 w-full sm:w-auto hover:bg-primary"
        >
          Grammar
        </Button>
      </div>
    </div>
  );
}
