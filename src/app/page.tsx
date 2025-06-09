
"use client";

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { BookOpen, Edit3, MessageCircleQuestion, Construction } from 'lucide-react'; 

export default function Home() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center pt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/reading">
          <Button
            className="w-full px-6 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          >
            <BookOpen size={22} className="h-[22px] w-[22px]" /> Reading & Comprehension
          </Button>
        </Link>
        <Link href="/conversation">
          <Button
            className="w-full px-6 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          >
            <Edit3 size={22} className="h-[22px] w-[22px]" /> Conversation Practice
          </Button>
        </Link>
        <Button
          className="w-full px-6 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-secondary text-secondary-foreground shadow-[0_6px_0_hsl(var(--muted))] active:shadow-none active:translate-y-[6px] hover:bg-secondary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          disabled 
        >
          <MessageCircleQuestion size={22} className="h-[22px] w-[22px]" /> Cloze Test <span className="text-xs normal-case opacity-70">(Coming Soon)</span>
        </Button>
        <Button
          className="w-full px-6 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-secondary text-secondary-foreground shadow-[0_6px_0_hsl(var(--muted))] active:shadow-none active:translate-y-[6px] hover:bg-secondary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          disabled
        >
          <Construction size={22} className="h-[22px] w-[22px]" /> Grammar Exercises <span className="text-xs normal-case opacity-70">(Coming Soon)</span>
        </Button>
      </div>
    </div>
  );
}
