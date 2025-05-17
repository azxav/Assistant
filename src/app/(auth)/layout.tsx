
import React from 'react';
import Link from 'next/link';
import { AppWindowIcon } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-semibold text-primary">
        <AppWindowIcon className="h-8 w-8" />
        <span>ZEKA</span>
      </Link>
      {children}
    </div>
  );
}
