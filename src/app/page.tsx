
"use client";

import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]"> {/* Adjust min-height if header/footer height changes */}
      {/* Removed welcome text and icon as per previous requests */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Link href="/reading">
          <Button
            className="px-8 py-7 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] w-full sm:w-auto hover:bg-primary/90 transition-colors duration-150 ease-in-out"
          >
            Reading and comprehension
          </Button>
        </Link>
        <Button
          className="px-8 py-7 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] w-full sm:w-auto hover:bg-primary/90 transition-colors duration-150 ease-in-out"
        >
          Cloze test
        </Button>
        <Button
          className="px-8 py-7 uppercase tracking-[1.5px] font-bold rounded-xl bg-primary text-primary-foreground shadow-[0_6px_0_hsl(var(--primary-darker))] active:shadow-none active:translate-y-[6px] w-full sm:w-auto hover:bg-primary/90 transition-colors duration-150 ease-in-out"
        >
          Grammar
        </Button>
      </div>
    </div>
  );
}
