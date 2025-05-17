
"use client"; // This layout handles client-side auth checks and redirects

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Settings2,
  BookOpenText,
  PlayCircle,
  Monitor,
  Share2,
  BrainCircuit,
  PanelLeft, // For SidebarTrigger
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tooltip: "Overview" },
  { href: "/configure", icon: Settings2, label: "Configuration", tooltip: "Set up Assistants" },
  { href: "/custom-ai", icon: BrainCircuit, label: "Custom AI", tooltip: "Create Custom Assistants" },
  { href: "/knowledge", icon: BookOpenText, label: "Knowledge Base", tooltip: "Manage Data" },
  { href: "/playground", icon: PlayCircle, label: "Playground", tooltip: "Test Assistants" },
  { href: "/monitoring", icon: Monitor, label: "Chat Monitoring", tooltip: "View Conversations" },
  { href: "/integrations", icon: Share2, label: "Integrations", tooltip: "Connect Platforms" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can render a more sophisticated loading skeleton here
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }

  return (
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
  );
}
