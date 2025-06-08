
"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto p-4 py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <MessageSquarePlus className="h-12 w-12 text-primary mb-4" />
      </div>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Reading and comprehension
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Cloze test
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Grammar
        </Button>
      </div>
    </div>
  );
}
