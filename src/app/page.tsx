
"use client";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto p-4 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full sm:w-auto transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-95"
        >
          Reading and comprehension
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full sm:w-auto transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-95"
        >
          Cloze test
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full sm:w-auto transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-95"
        >
          Grammar
        </Button>
      </div>
    </div>
  );
}
