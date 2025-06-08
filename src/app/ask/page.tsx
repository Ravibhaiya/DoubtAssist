"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react"; // Keep this import if used elsewhere or for consistency, though not directly used in the blank page structure now.

export default function AskPage() {
  return (
    <div className="container mx-auto p-4 py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <MessageSquarePlus className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ask Your Doubt</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Select a category or type your question below.
        </p>
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
      {/* Intentionally blank below options for now */}
    </div>
  );
}
