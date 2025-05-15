import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import {
  LayoutDashboard,
  Settings2,
  BookOpenText,
  PlayCircle,
  Monitor,
  Share2,
  BrainCircuit, // Added BrainCircuit
} from 'lucide-react';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/common/AppLogo';
import { UserNav } from '@/components/common/UserNav';
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ZEKA - Your Intelligent Assistant Platform',
  description: 'Configure, test, and monitor AI assistants for your business.',
};

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", tooltip: "Overview" },
  { href: "/configure", icon: Settings2, label: "Configuration", tooltip: "Set up Assistants" },
  { href: "/custom-ai", icon: BrainCircuit, label: "Custom AI", tooltip: "Create Custom Assistants" }, // New Item
  { href: "/knowledge", icon: BookOpenText, label: "Knowledge Base", tooltip: "Manage Data" },
  { href: "/playground", icon: PlayCircle, label: "Playground", tooltip: "Test Assistants" },
  { href: "/monitoring", icon: Monitor, label: "Chat Monitoring", tooltip: "View Conversations" },
  { href: "/integrations", icon: Share2, label: "Integrations", tooltip: "Connect Platforms" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(geistSans.variable, geistMono.variable, "antialiased")}>
        <SidebarProvider defaultOpen={true} collapsible="icon">
          <Sidebar variant="sidebar" collapsible="icon" className="border-r">
            <SidebarHeader className="p-0">
              <div className="flex h-16 items-center justify-between border-b px-4 group-data-[state=collapsed]:justify-center">
                 <AppLogo />
                 <SidebarTrigger />
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        asChild
                        tooltip={{ children: item.tooltip, side: "right", align: "center" }}
                      >
                        <a>
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-2 border-t">
               <UserNav />
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
