
"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    // Show a loading state or nothing while redirecting
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 text-center p-6">
      <div className="max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
          Welcome to <span className="text-primary">ZEKA</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10">
          Build, configure, and deploy intelligent AI assistants effortlessly.
          Transform your customer interactions and streamline your business processes.
        </p>
        <Link href="/auth/signup" passHref>
          <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-primary/30 transition-shadow">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
      <footer className="absolute bottom-8 text-center text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} ZEKA. All rights reserved.
      </footer>
    </div>
  );
}
