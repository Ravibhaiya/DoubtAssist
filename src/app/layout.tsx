import type { Metadata } from 'next';
import './globals.css';
import { BottomNavigationBar } from '@/components/layout/bottom-navigation-bar';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'DoubtAssist & Conversation Practice',
  description: 'Your personal AI assistant for doubts and English conversation practice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden">
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow pb-16 sm:pb-0"> {/* pb-16 for bottom nav space on mobile, 0 on sm+ */}
            {children}
          </main>
          <BottomNavigationBar />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
