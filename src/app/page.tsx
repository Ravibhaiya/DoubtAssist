
"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react"; // This import might become unused, but let's keep it for now unless explicitly asked to remove.

export default function Home() {
  return (
    <div className="container mx-auto p-4 py-8 md:py-12">
      {/* The div below used to contain the MessageSquarePlus icon, it's now empty or can be removed if it serves no other purpose.
      For now, let's assume it might be used for other alignment/spacing, so we'll keep it but empty.
      If it was solely for the icon, it can be removed entirely.
      Looking at the PRD, it was part of a flex layout for centering.
      Let's remove the div as well as it was only for the icon.
       */}
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
