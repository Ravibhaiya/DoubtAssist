
"use client";

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { BookOpen, Edit3 } from 'lucide-react'; // Changed Reading to BookOpen

export default function Home() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-start pt-10 min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
        <Link href="/reading">
          <Button
            className="px-6 py-7 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] w-full sm:w-auto hover:bg-primary/90 transition-colors duration-150 ease-in-out flex items-center gap-2"
          >
            <BookOpen size={20} /> Reading & Comprehension
          </Button>
        </Link>
        <Link href="/conversation">
          <Button
            className="px-6 py-7 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] w-full sm:w-auto hover:bg-primary/90 transition-colors duration-150 ease-in-out flex items-center gap-2"
          >
            <Edit3 size={20} /> Conversation Practice
          </Button>
        </Link>
        <Button
          className="px-6 py-7 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] w-full sm:w-auto hover:bg-primary/90 transition-colors duration-150 ease-in-out"
        >
          Cloze test
        </Button>
        <Button
          className="px-6 py-7 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] w-full sm:w-auto hover:bg-primary/90 transition-colors duration-150 ease-in-out"
        >
          Grammar
        </Button>
      </div>
    </div>
  );
}
