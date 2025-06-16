
"use client";

import { useState, type ChangeEvent, useCallback, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Loader2, AlertTriangle, UploadCloud, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MessageSquareText, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
// Use the version of pdfjs-dist specified in package.json (currently 3.11.174)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;


export default function PdfFeaturePage() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [scale, setScale] = useState<number>(1.0);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
        setCurrentPage(1);
        setNumPages(null);
        setSelectedText("");
        setScale(1.0);
      } else {
        setError("Invalid file type. Please select a PDF file.");
        setFile(null);
      }
    }
  };

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (loadError: Error) => {
    console.error("Error loading PDF:", loadError);
    setError(`Failed to load PDF: ${loadError.message}. Please ensure it's a valid PDF file and try again.`);
    setIsLoading(false);
  };
  
  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      setSelectedText(selection.trim());
    } else {
      setSelectedText(""); // Clear selection if nothing is selected
    }
  };

  // Clear selectedText when file changes or is removed
  useEffect(() => {
    if (!file) {
      setSelectedText("");
    }
  }, [file]);


  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(numPages || 1, prev + 1));

  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  return (
    <div className="flex flex-col h-full w-full items-center p-4 pt-6 space-y-4">
      {!file ? (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-md space-y-6 p-8 border rounded-lg shadow-lg bg-card">
          <h1 className="text-2xl font-semibold text-center">Open PDF Document</h1>
          <p className="text-muted-foreground text-center">
            Upload a PDF file from your computer to view its content and interact with the text.
          </p>
          <div className="flex flex-col items-center space-y-4 w-full">
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="w-full"
              aria-label="Upload PDF file"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer w-full">
              <Button variant="outline" asChild className="w-full">
                <span>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Select PDF File
                </span>
              </Button>
            </label>
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive rounded-md flex items-center justify-center text-sm w-full">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-5xl flex flex-col items-center space-y-3">
           {selectedText && (
            <div className="w-full flex justify-center items-center gap-3 p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-md border z-10 sticky top-2">
              <Button variant="outline" size="sm" onClick={() => console.log("Word Meaning clicked for:", selectedText)}>
                <Search className="mr-2 h-4 w-4" /> Word Meaning
              </Button>
              <Button variant="outline" size="sm" onClick={() => console.log("Analyse clicked for:", selectedText)}>
                <MessageSquareText className="mr-2 h-4 w-4" /> Analyse
              </Button>
            </div>
          )}
          <div className="w-full flex items-center justify-center space-x-2 p-2 bg-card rounded-md shadow border sticky top-16 md:top-2 z-10">
            <Button onClick={zoomOut} variant="outline" size="icon" disabled={scale <= 0.5} aria-label="Zoom out">
              <ZoomOut />
            </Button>
            <Button onClick={zoomIn} variant="outline" size="icon" disabled={scale >= 3} aria-label="Zoom in">
              <ZoomIn />
            </Button>
            {numPages && (
              <>
                <Button onClick={goToPrevPage} variant="outline" size="icon" disabled={currentPage <= 1} aria-label="Previous page">
                  <ChevronLeft />
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Page {currentPage} of {numPages}
                </span>
                <Button onClick={goToNextPage} variant="outline" size="icon" disabled={currentPage >= numPages} aria-label="Next page">
                  <ChevronRight />
                </Button>
              </>
            )}
             <Button variant="ghost" size="sm" onClick={() => { setFile(null); setError(null); setNumPages(null); setSelectedText(""); }} className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10">
                Close PDF
            </Button>
          </div>

          {error && !isLoading && (
            <div className="p-4 bg-destructive/10 text-destructive border border-destructive rounded-md flex items-center justify-center w-full">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          <div 
            className="pdf-container w-full h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] overflow-auto border rounded-md bg-background shadow-inner custom-scrollbar"
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection} // For touch devices
          >
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              onLoadProgress={() => setIsLoading(true)}
              loading={
                <div className="flex flex-col items-center justify-center p-10 h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground">Loading PDF...</p>
                </div>
              }
              error={ // This error component is for react-pdf internal errors during document render
                !error && // Only show this if no general file load error is set
                <div className="flex flex-col items-center justify-center p-10 h-64">
                  <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
                   <p className="text-destructive">Error rendering PDF document.</p>
                   <p className="text-sm text-muted-foreground mt-1">Please try a different file.</p>
                </div>
              }
              className="flex justify-center"
            >
              {numPages && !error && ( // Don't try to render Page if there's a file load error
                <Page 
                  pageNumber={currentPage} 
                  scale={scale}
                  renderTextLayer={true} 
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                />
              )}
            </Document>
          </div>

          {selectedText && (
            <div className="w-full max-w-5xl mt-4 p-3 border rounded-lg bg-card shadow-md sticky bottom-2 z-10">
              <h3 className="text-sm font-semibold mb-1 text-primary">Selected Text:</h3>
              <pre className="text-xs p-2 bg-muted/50 rounded-md whitespace-pre-wrap break-words max-h-24 overflow-auto custom-scrollbar">
                {selectedText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
