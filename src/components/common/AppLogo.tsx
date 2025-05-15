"use client"; // Make this a Client Component to use the useSidebar hook

import { AppWindowIcon } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar'; // Import useSidebar
import { cn } from '@/lib/utils'; // Import cn

export function AppLogo() {
  const { state, isMobile } = useSidebar(); // Get sidebar state.

  // On desktop, if the sidebar is collapsed, hide the logo.
  // On mobile, the logo is part of the sheet content, so this specific logic doesn't apply in the same way;
  // the sheet has its own open/close mechanism.
  if (!isMobile && state === 'collapsed') {
    return null;
  }

  // If expanded (or mobile view where state might be 'expanded' by default for sheet content)
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center group gap-2.5 p-2" // Always have gap and padding if rendered
      )}
      aria-label="ZEKA Home"
    >
      <AppWindowIcon className="h-7 w-7 text-primary transition-transform group-hover:scale-110 shrink-0" />
      {/* Text is shown if not collapsed (effectively, only if expanded on desktop, or on mobile) */}
      {(isMobile || state === 'expanded') && (
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          ZEKA
        </h1>
      )}
    </Link>
  );
}
