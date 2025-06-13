
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect, useRef, useState } from "react";

interface ArticleAnalysisOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string | null;
  articleContent: string | null; 
}

export function ArticleAnalysisOverlay({ 
  isOpen, 
  onClose, 
  articleId,
  articleContent 
}: ArticleAnalysisOverlayProps) {
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  const [internalScrollTop, setInternalScrollTop] = useState(0);

  // Scroll-to-bottom-to-close logic & state retention for scroll
  useEffect(() => {
    const contentElement = scrollableContentRef.current;
    if (isOpen && contentElement) {
      // Restore scroll position
      contentElement.scrollTop = internalScrollTop;

      const handleScroll = () => {
        const currentScrollTop = contentElement.scrollTop;
        setInternalScrollTop(currentScrollTop); // Save scroll position

        // Check if scrolled to near bottom (within a small threshold)
        if (contentElement.scrollHeight - currentScrollTop <= contentElement.clientHeight + 5) {
          onClose();
        }
      };
      contentElement.addEventListener("scroll", handleScroll);
      return () => {
        contentElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [isOpen, onClose, internalScrollTop]);

  // Reset internal scroll state when the overlay is truly closed or articleId changes
  useEffect(() => {
    if (!isOpen) {
      setInternalScrollTop(0);
    }
  }, [isOpen]);
  
  // If a new article is selected while overlay is already open, reset scroll
  useEffect(() => {
    if (isOpen && scrollableContentRef.current) {
        scrollableContentRef.current.scrollTop = 0;
        setInternalScrollTop(0);
    }
  }, [articleId, isOpen])


  return (
    <Sheet open={isOpen} onOpenChange={(openState) => { if (!openState) onClose(); }}>
      <SheetContent 
        side="bottom" 
        className="h-screen flex flex-col p-4 sm:p-6" // Changed h-[85vh] to h-screen
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevents auto-focus on first element
      >
        {/* Visual Grabber Handle - REMOVED */}
        {/* <div 
          className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/40 mb-3"
        /> */}

        <SheetHeader className="text-left mb-3 flex-shrink-0 border-b pb-3 pt-2"> {/* Added pt-2 to give space now that handle is gone */}
          <SheetTitle className="text-lg font-semibold">Article Analysis</SheetTitle>
          {articleId && (
            <SheetDescription className="text-xs text-muted-foreground">
              Analysing article snippet.
            </SheetDescription>
          )}
        </SheetHeader>
        
        <div ref={scrollableContentRef} className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {/* Placeholder for future analysis content */}
          <p className="text-sm text-foreground leading-relaxed">
            This space will soon display a detailed analysis of the selected article. 
            For now, you can scroll down to the bottom of this panel to close it.
          </p>
          
          {articleContent && (
            <div className="p-3 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-sm mb-1.5 text-primary">Original Article Snippet:</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">{articleContent}</p>
            </div>
          )}

          {/* Dummy content to ensure scrollability for testing */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="py-3 border-b border-border/70 last:border-b-0">
              <h4 className="font-medium text-sm text-foreground">Placeholder Section {i + 1}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                This is some placeholder text for section {i + 1}. More detailed content related to article analysis will be added here later. 
                Keep scrolling to test the auto-close feature.
              </p>
            </div>
          ))}
           <p className="text-center text-xs text-muted-foreground py-4">You've reached the end. The panel should close.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
