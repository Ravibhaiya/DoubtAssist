import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center text-center">
      {/* The Welcome Card has been removed */}

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
