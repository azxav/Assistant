import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Activity, Bot, LayoutDashboard, PlusCircle, ArrowRight } from "lucide-react"; // Updated LayoutDashboard import
import Link from "next/link";
import { Settings2, BookOpenText, PlayCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Dashboard"
        description="Welcome back to ZEKA! Here's an overview of your assistants."
        icon={LayoutDashboard}
      />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assistants</CardTitle>
              <Bot className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Currently deployed and interacting
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              <Activity className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +150 since last week
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Satisfaction</CardTitle>
              <Bot className="h-5 w-5 text-green-500" /> {/* Changed icon to Bot as BarChart3 was causing error */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">
                Based on recent feedback
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>My Assistants</CardTitle>
              <CardDescription>Manage your existing AI assistants or create a new one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <h3 className="font-semibold">Customer Support Bot</h3>
                  <p className="text-sm text-muted-foreground">Handles FAQs and basic troubleshooting.</p>
                </div>
                <Button variant="outline" size="sm">Manage <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <h3 className="font-semibold">Lead Generation Bot</h3>
                  <p className="text-sm text-muted-foreground">Qualifies leads from website chat.</p>
                </div>
                <Button variant="outline" size="sm">Manage <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
              <Link href="/configure" passHref>
                <Button className="w-full mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Assistant
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions and system updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-sm font-medium">New interaction with "Customer Support Bot"</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <p className="text-sm font-medium">"Lead Generation Bot" successfully configured</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpenText className="h-5 w-5 text-accent mt-1" />
                <div>
                  <p className="text-sm font-medium">New document "pricing_update.pdf" added to knowledge base</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with key features of ZEKA.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Link href="/configure">
              <div className="p-4 border rounded-lg hover:bg-accent/10 hover:shadow-sm transition-all cursor-pointer">
                <Settings2 className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Configure Assistant</h3>
                <p className="text-sm text-muted-foreground">Define your AI's personality and goals.</p>
              </div>
            </Link>
            <Link href="/knowledge">
              <div className="p-4 border rounded-lg hover:bg-accent/10 hover:shadow-sm transition-all cursor-pointer">
                <BookOpenText className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Upload Knowledge</h3>
                <p className="text-sm text-muted-foreground">Provide documents for your AI to learn.</p>
              </div>
            </Link>
            <Link href="/playground">
              <div className="p-4 border rounded-lg hover:bg-accent/10 hover:shadow-sm transition-all cursor-pointer">
                <PlayCircle className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Test Playground</h3>
                <p className="text-sm text-muted-foreground">Interact with your assistant before going live.</p>
              </div>
            </Link>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
