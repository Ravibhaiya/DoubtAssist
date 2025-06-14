
"use client";

import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center pt-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/reading">
          <Button
            className="w-full px-8 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          >
            Reading & Comprehension
          </Button>
        </Link>
        <Link href="/conversation">
          <Button
            className="w-full px-8 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          >
            Conversation Practice
          </Button>
        </Link>
        <Link href="/translation">
          <Button
            className="w-full px-8 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          >
            Translation Exercise
          </Button>
        </Link>
        <Button
          className="w-full px-8 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          
        >
          Cloze Test
        </Button>
        <Button
          className="w-full px-8 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          
        >
          Grammar Exercises
        </Button>
      </div>
    </div>
  );
}
