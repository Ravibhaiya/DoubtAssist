
"use client";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto p-4 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button
          className="px-6 py-5 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] w-full sm:w-auto hover:bg-primary/90 transition-transform duration-100 ease-in-out transition-shadow duration-100 ease-in-out"
        >
          Reading and comprehension
        </Button>
        <Button
          className="px-6 py-5 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] w-full sm:w-auto hover:bg-primary/90 transition-transform duration-100 ease-in-out transition-shadow duration-100 ease-in-out"
        >
          Cloze test
        </Button>
        <Button
          className="px-6 py-5 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[5px] w-full sm:w-auto hover:bg-primary/90 transition-transform duration-100 ease-in-out transition-shadow duration-100 ease-in-out"
        >
          Grammar
        </Button>
      </div>
    </div>
  );
}
