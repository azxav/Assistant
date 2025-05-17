
"use client";

import { AppWindowIcon } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import React from 'react';

export function AppLogo() {
  const { state, isMobile } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // To prevent hydration mismatch, and ensure SSR/initial client render is consistent.
    // Render a version that is consistent before full client-side hydration.
    // The logo always links to home.
    return (
      <Link
        href="/" // Links to the landing page
        className={cn("flex items-center group gap-2.5 p-2")}
        aria-label="ZEKA Home"
      >
        <AppWindowIcon className="h-7 w-7 text-primary transition-transform group-hover:scale-110 shrink-0" />
        {/* Show ZEKA text by default on SSR / initial render */}
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
            ZEKA
        </h1>
      </Link>
    );
  }

  // After mounting, we can use client-side state (isMobile, sidebar state)
  // If the sidebar is collapsed on desktop and not on mobile, the AppLogo is hidden
  // because the SidebarTrigger is shown and centered in its place.
  if (!isMobile && state === 'collapsed') {
    return null;
  }

  return (
    <Link
      href="/" // Links to the landing page
      className={cn(
        "flex items-center group gap-2.5 p-2"
        // Internal alignment is handled by flex; centering of the container
        // when collapsed is handled by the parent div in the layout.
      )}
      aria-label="ZEKA Home"
    >
      <AppWindowIcon className="h-7 w-7 text-primary transition-transform group-hover:scale-110 shrink-0" />
      {/* Text "ZEKA" is shown if sidebar is expanded or if on mobile view */}
      {(isMobile || state === 'expanded') && (
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          ZEKA
        </h1>
      )}
    </Link>
  );
}
