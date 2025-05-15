import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Share2, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import Image from "next/image";

interface IntegrationPlatform {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  imageUrl?: string; // For platform logos if not using component icons
  status: "connected" | "disconnected" | "coming_soon";
  actionText: string;
  docsLink?: string;
}

const platforms: IntegrationPlatform[] = [
  {
    id: "instagram",
    name: "Instagram Direct",
    description: "Connect to respond to DMs and manage customer interactions on Instagram.",
    icon: InstagramIcon,
    status: "disconnected",
    actionText: "Connect Instagram",
    docsLink: "#",
  },
  {
    id: "telegram",
    name: "Telegram Bot",
    description: "Integrate with Telegram to automate conversations and provide support.",
    icon: TelegramIcon,
    status: "connected",
    actionText: "Manage Connection",
    docsLink: "#",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Engage with customers on WhatsApp through your AI assistant. (Coming Soon)",
    icon: () => <Image src="https://placehold.co/24x24.png?text=W" alt="WhatsApp" width={24} height={24} data-ai-hint="whatsapp logo" />, // Placeholder, replace with actual or lucide
    status: "coming_soon",
    actionText: "Learn More",
  },
   {
    id: "slack",
    name: "Slack",
    description: "Bring your AI assistant into your Slack workspace for internal support or notifications.",
    icon: () => <Image src="https://placehold.co/24x24.png?text=S" alt="Slack" width={24} height={24} data-ai-hint="slack logo"/>, // Placeholder
    status: "disconnected",
    actionText: "Connect Slack",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Platform Integrations"
        description="Connect AssistAI with your favorite messaging platforms and tools."
        icon={Share2}
        actionButton={
          <Button><Zap className="mr-2 h-4 w-4" /> Request Integration</Button>
        }
      />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const IconComponent = platform.icon;
            return (
              <Card key={platform.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="p-2 bg-muted rounded-lg">
                    <IconComponent className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{platform.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">{platform.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm">
                      {platform.status === "connected" && (
                        <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                      )}
                      {platform.status === "disconnected" && (
                        <AlertCircle className="h-4 w-4 mr-1.5 text-yellow-500" />
                      )}
                      {platform.status === "coming_soon" && (
                        <Zap className="h-4 w-4 mr-1.5 text-blue-500" />
                      )}
                      <span className={
                        platform.status === "connected" ? "text-green-600" :
                        platform.status === "disconnected" ? "text-yellow-600" : "text-blue-600"
                      }>
                        {platform.status === "connected" ? "Connected" :
                         platform.status === "disconnected" ? "Not Connected" : "Coming Soon"}
                      </span>
                    </div>
                    <Button 
                      variant={platform.status === "connected" ? "outline" : "default"} 
                      size="sm"
                      disabled={platform.status === "coming_soon"}
                    >
                      {platform.actionText}
                    </Button>
                  </div>
                  {platform.docsLink && platform.status !== "coming_soon" && (
                     <a href={platform.docsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary mt-3 text-right">
                        View Documentation
                      </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
