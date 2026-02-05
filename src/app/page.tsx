import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Trophy, MapPin } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            <span className="font-semibold text-lg">Startup Ambassadors</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/events">
              <Button variant="ghost">Events</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="flex flex-col items-center text-center gap-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Empowering Startup
            <br />
            <span className="text-primary">Ambassadors</span> Across Uzbekistan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Join a network of 200+ ambassadors running startup clubs across 14 regions.
            Organize events, track progress, and earn recognition for your impact.
          </p>
          <div className="flex gap-4">
            <Link href="/register">
              <Button size="lg">Become an Ambassador</Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline">Browse Events</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Startup Clubs</CardTitle>
              <CardDescription>
                Run your own startup club and build a community of entrepreneurs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Events & Sessions</CardTitle>
              <CardDescription>
                Organize workshops, meetups, and networking events
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Gamification</CardTitle>
              <CardDescription>
                Earn points, climb leaderboards, and unlock achievements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>14 Regions</CardTitle>
              <CardDescription>
                Connect with ambassadors across all regions of Uzbekistan
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-16">
        <div className="grid gap-8 md:grid-cols-4 text-center">
          <div>
            <div className="text-4xl font-bold">200+</div>
            <div className="text-muted-foreground">Ambassadors</div>
          </div>
          <div>
            <div className="text-4xl font-bold">14</div>
            <div className="text-muted-foreground">Regions</div>
          </div>
          <div>
            <div className="text-4xl font-bold">500+</div>
            <div className="text-muted-foreground">Events</div>
          </div>
          <div>
            <div className="text-4xl font-bold">10,000+</div>
            <div className="text-muted-foreground">Participants</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <span className="font-semibold">Startup Ambassadors</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Building the startup ecosystem in Uzbekistan
          </p>
        </div>
      </footer>
    </div>
  );
}
