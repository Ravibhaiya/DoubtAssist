
"use client";

import { useState, type ChangeEvent, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Loader2, AlertTriangle, UploadCloud, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

// Configure PDF.js worker
// Use the version of pdfjs-dist specified in package.json (currently 4.4.168)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`;


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
      setSelectedText(selection);
    }
  };

  const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(numPages || 1, prev + 1));

  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  return (
    <div className="container mx-auto p-4 flex flex-col items-center pt-8 space-y-6">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Open and Select Text from PDF</CardTitle>
          <CardDescription className="text-center">
            Upload a PDF file from your computer to view its content and select text.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="max-w-md"
              aria-label="Upload PDF file"
            />
            {!file && (
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Select PDF File
                  </span>
                </Button>
              </label>
            )}
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive border border-destructive rounded-md flex items-center justify-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {file && !error && (
            <div className="border rounded-lg p-2 bg-muted/20 shadow-inner">
              <div className="flex items-center justify-center space-x-2 mb-4 p-2 bg-background rounded-md shadow">
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
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {numPages}
                    </span>
                    <Button onClick={goToNextPage} variant="outline" size="icon" disabled={currentPage >= numPages} aria-label="Next page">
                      <ChevronRight />
                    </Button>
                  </>
                )}
              </div>
              <div 
                className="pdf-container max-h-[70vh] overflow-auto border rounded-md bg-background custom-scrollbar"
                onMouseUp={handleTextSelection}
                onTouchEnd={handleTextSelection}
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
                  error={
                    <div className="flex flex-col items-center justify-center p-10 h-64">
                      <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
                       <p className="text-destructive">Error loading PDF document.</p>
                       <p className="text-sm text-muted-foreground mt-1">Please try a different file.</p>
                    </div>
                  }
                  className="flex justify-center"
                >
                  {numPages && (
                    <Page 
                      pageNumber={currentPage} 
                      scale={scale}
                      renderTextLayer={true} 
                      renderAnnotationLayer={true}
                    />
                  )}
                </Document>
              </div>
            </div>
          )}

          {selectedText && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Selected Text</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm p-3 bg-muted/50 rounded-md whitespace-pre-wrap break-words max-h-60 overflow-auto custom-scrollbar">
                  {selectedText}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
