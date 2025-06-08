import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center text-center">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <Image 
            src="https://placehold.co/600x300.png" 
            alt="DoubtAssist Hero" 
            width={600} 
            height={300} 
            className="rounded-t-lg object-cover"
            data-ai-hint="education learning" 
          />
          <CardTitle className="text-3xl font-headline mt-4">Welcome to DoubtAssist!</CardTitle>
          <CardDescription className="text-lg">
            Your friendly AI-powered assistant to help you with all your questions and doubts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-md">
            Stuck on a problem? Need a quick explanation? Or just curious about something?
            DoubtAssist is here to provide clear, concise, and helpful answers.
          </p>
          <Link href="/ask" passHref>
            <Button size="lg" className="w-full transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95">
              Ask Your First Doubt
            </Button>
          </Link>
        </CardContent>
      </Card>

      <section className="mt-12 w-full max-w-3xl">
        <h2 className="text-2xl font-headline mb-6">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline">1. Ask Anything</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Type your question in simple language. No need for complex phrasing.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline">2. Get AI Help</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Our advanced AI analyzes your doubt and provides a tailored explanation.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline">3. Learn & Grow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Understand concepts better and overcome your learning hurdles.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
