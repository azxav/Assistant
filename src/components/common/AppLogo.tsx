import { BotMessageSquare } from 'lucide-react';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 p-2 group" aria-label="AssistAI Home">
      <BotMessageSquare className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
      <h1 className="text-xl font-semibold text-foreground tracking-tight">
        AssistAI
      </h1>
    </Link>
  );
}
