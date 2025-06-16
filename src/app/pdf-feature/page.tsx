
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PdfFeaturePage() {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center pt-8">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">PDF Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            This page is a placeholder for the PDF related functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
