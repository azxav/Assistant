'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-semibold mb-4">Oops! Something went wrong.</h1>
        <p className="text-muted-foreground mb-8">
          We encountered an unexpected issue. Please try again, or if the problem persists, contact support.
        </p>
        {error.message && (
           <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-6">Error details: {error.message}</p>
        )}
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          size="lg"
        >
          Try Again
        </Button>
         <Button
          variant="link"
          onClick={() => window.location.href = '/'}
          className="mt-4"
        >
          Go to Homepage
        </Button>
      </div>
    </div>
  );
}
