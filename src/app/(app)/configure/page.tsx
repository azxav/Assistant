
"use client"; // This page involves client-side interactivity for forms and tabs

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { Settings2, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import React from "react";

const assistantConfigSchema = z.object({
  assistantName: z.string().min(3, "Assistant name must be at least 3 characters"),
  useCase: z.string().min(1, "Please select a use case"),
  description: z.string().optional(),
  businessName: z.string().min(2, "Business name is required"),
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  tone: z.string().min(1, "Please select a tone"),
  // Add more fields for pre-made questions, etc.
});

type AssistantConfigFormData = z.infer<typeof assistantConfigSchema>;

export default function ConfigurePage() {
  const [activeTab, setActiveTab] = React.useState("basic");
  const form = useForm<AssistantConfigFormData>({
    resolver: zodResolver(assistantConfigSchema),
    defaultValues: {
      assistantName: "",
      useCase: "",
      description: "",
      businessName: "",
      industry: "",
      targetAudience: "",
      tone: "",
    },
  });

  const onSubmit = (data: AssistantConfigFormData) => {
    console.log("Assistant Configuration Data:", data);
    // Here you would typically send data to a server / use Server Action
    alert("Configuration submitted! Check console for data.");
    // Potentially move to next step or show success
  };

  const tabs = [
    { id: "basic", label: "1. Basic Info" },
    { id: "business", label: "2. Business Details" },
    { id: "behavior", label: "3. Behavior" },
    { id: "review", label: "4. Review & Save" },
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleNext = async () => {
    let isValid = false;
    if (activeTab === "basic") {
      isValid = await form.trigger(["assistantName", "useCase"]);
    } else if (activeTab === "business") {
      isValid = await form.trigger(["businessName"]);
    } else if (activeTab === "behavior") {
       isValid = await form.trigger(["tone"]);
    } else {
      isValid = true; // Review tab, no validation needed before proceeding to submit
    }

    if (isValid && currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    } else if (isValid && activeTab === "review") {
      form.handleSubmit(onSubmit)();
    }
  };

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Configure New Assistant"
        description="Define your AI assistant's behavior, knowledge, and personality."
        icon={Settings2}
        actionButton={
          <Button onClick={form.handleSubmit(onSubmit)} disabled={activeTab !== 'review'}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        }
      />
      <main className="flex-1 p-4 md:p-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Give your assistant a name and define its primary purpose.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="assistantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assistant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Support Pro, Sales Bot" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="useCase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Use Case</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a use case" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="customer_support">Customer Support</SelectItem>
                              <SelectItem value="lead_generation">Lead Generation</SelectItem>
                              <SelectItem value="faq_automation">FAQ Automation</SelectItem>
                              <SelectItem value="technical_assistance">Technical Assistance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Briefly describe what this assistant will do." {...field} />
                          </FormControl>
                           <FormDescription>This helps you identify the assistant later.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="business">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Details</CardTitle>
                    <CardDescription>Provide context about your business for the assistant.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry (Optional)</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="ecommerce">E-commerce</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="e.g., Small business owners, developers, general consumers" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="behavior">
                <Card>
                  <CardHeader>
                    <CardTitle>Assistant Behavior</CardTitle>
                    <CardDescription>Define how your assistant should interact and respond.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Communication Tone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="formal">Formal & Professional</SelectItem>
                              <SelectItem value="friendly">Friendly & Casual</SelectItem>
                              <SelectItem value="empathetic">Empathetic & Understanding</SelectItem>
                              <SelectItem value="direct">Direct & Concise</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Placeholder for pre-made questions/rules */}
                    <div>
                        <FormLabel>Response Guidelines (Example)</FormLabel>
                        <Textarea placeholder="e.g., Always greet the user by name if known. Offer solutions before escalating issues." className="mt-2"/>
                        <FormDescription className="mt-1">Define specific instructions for your assistant.</FormDescription>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review">
                <Card>
                  <CardHeader>
                    <CardTitle>Review & Save Configuration</CardTitle>
                    <CardDescription>Please review all the details before saving.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h3 className="font-semibold text-lg">Summary:</h3>
                    <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                      <p><strong>Assistant Name:</strong> {form.watch("assistantName") || "Not set"}</p>
                      <p><strong>Use Case:</strong> {form.watch("useCase") || "Not set"}</p>
                      <p><strong>Business Name:</strong> {form.watch("businessName") || "Not set"}</p>
                      <p><strong>Tone:</strong> {form.watch("tone") || "Not set"}</p>
                       <p className="text-sm text-muted-foreground">More details would be listed here...</p>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        Ensure all configurations are correct. This information will be used to power your AI assistant. You can edit this configuration later.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-8 flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentTabIndex === 0}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              {activeTab !== 'review' ? (
                <Button type="button" onClick={handleNext}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                 <Button type="submit">
                  <CheckCircle className="mr-2 h-4 w-4" /> Save Configuration
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  );
}
