"use client"; // Make this a Client Component to use the useSidebar hook

import { AppWindowIcon } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar'; // Import useSidebar
import { cn } from '@/lib/utils'; // Import cn

export function AppLogo() {
  const { state } = useSidebar(); // Get sidebar state. Default state is "expanded".

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center group",
        state === 'expanded' ? "gap-2.5" : "", // Changed conditional styling
        "p-2" 
      )}
      aria-label="ZEKA Home"
    >
      <AppWindowIcon className="h-7 w-7 text-primary transition-transform group-hover:scale-110 shrink-0" />
      {state === 'expanded' && ( 
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          ZEKA
        </h1>
      )}
    </Link>
  );
}
