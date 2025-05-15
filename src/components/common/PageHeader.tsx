import type { LucideIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionButton?: React.ReactNode;
};

export function PageHeader({ title, description, icon: Icon, actionButton }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6 mb-6">
      <SidebarTrigger /> {/* Sidebar toggle button, now visible on all screen sizes */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
          <div>
            <h1 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
            {description && <p className="text-xs text-muted-foreground md:text-sm">{description}</p>}
          </div>
        </div>
      </div>
      {actionButton && <div className="ml-auto">{actionButton}</div>}
    </header>
  );
}
