
"use client";

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { BookOpen, Edit3, MessageCircleQuestion, Construction } from 'lucide-react'; 

export default function Home() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-start pt-10 min-h-[calc(100vh-8rem)]">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary mb-2 tracking-tight">
          Welcome to Your AI Learning Hub!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Practice English conversation, test your reading comprehension, get doubts cleared, and improve your grammar with our AI-powered tools.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/reading">
          <Button
            className="w-full px-6 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          >
            <BookOpen size={22} /> Reading & Comprehension
          </Button>
        </Link>
        <Link href="/conversation">
          <Button
            className="w-full px-6 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] hover:bg-primary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          >
            <Edit3 size={22} /> Conversation Practice
          </Button>
        </Link>
        <Button
          className="w-full px-6 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-secondary text-secondary-foreground shadow-[0_6px_0_hsl(var(--muted))] active:shadow-none active:translate-y-[6px] hover:bg-secondary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          disabled 
        >
          <MessageCircleQuestion size={22} /> Cloze Test <span className="text-xs normal-case opacity-70">(Coming Soon)</span>
        </Button>
        <Button
          className="w-full px-6 py-6 uppercase tracking-[1.5px] font-bold rounded-xl bg-secondary text-secondary-foreground shadow-[0_6px_0_hsl(var(--muted))] active:shadow-none active:translate-y-[6px] hover:bg-secondary/90 transition-all duration-150 ease-in-out hover:scale-105 flex items-center justify-center gap-3 text-base"
          disabled
        >
          <Construction size={22} /> Grammar Exercises <span className="text-xs normal-case opacity-70">(Coming Soon)</span>
        </Button>
      </div>
    </div>
  );
}
