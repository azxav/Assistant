
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/common/PageHeader";
import { BrainCircuit, Save } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

const customAssistantSchema = z.object({
  assistantName: z.string().min(3, "Assistant name must be at least 3 characters"),
  selectedModelId: z.string().min(1, "Please select an AI model"),
  selectedKnowledgeBaseIds: z.array(z.string()).min(1, "Please select at least one knowledge base").max(3, "You can select up to 3 knowledge bases"),
});

type CustomAssistantFormData = z.infer<typeof customAssistantSchema>;

const geminiModels = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and versatile model for various tasks.' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable model for complex reasoning.' },
  { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Balanced model for general purpose use.' },
];

const mockKnowledgeBases = [
  { id: "kb1", name: "Product Manuals Q2 2024", documentCount: 5 },
  { id: "kb2", name: "Customer FAQs - General", documentCount: 120 },
  { id: "kb3", name: "API Developer Docs", documentCount: 35 },
  { id: "kb4", name: "Marketing Swipe Files", documentCount: 25 },
];

export default function CustomAIPage() {
  const form = useForm<CustomAssistantFormData>({
    resolver: zodResolver(customAssistantSchema),
    defaultValues: {
      assistantName: "",
      selectedModelId: "",
      selectedKnowledgeBaseIds: [],
    },
  });

  const onSubmit = (data: CustomAssistantFormData) => {
    console.log("Custom Assistant Configuration Data:", data);
    alert("Custom Assistant configuration submitted! Check console for data.");
    // Here you would typically send data to a server / use Server Action
  };

  const selectedModelInfo = geminiModels.find(m => m.id === form.watch("selectedModelId"));
  const selectedKBsInfo = mockKnowledgeBases.filter(kb => form.watch("selectedKnowledgeBaseIds")?.includes(kb.id));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Create Custom Assistant"
        description="Combine AI models with your knowledge to build specialized assistants."
        icon={BrainCircuit}
      />
      <main className="flex-1 p-4 md:p-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assistant Details</CardTitle>
                    <CardDescription>Name your custom assistant.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="assistantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assistant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Tech Support Expert, Onboarding Guide" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Model Configuration</CardTitle>
                    <CardDescription>Choose the core AI model for your assistant.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="selectedModelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Gemini Model</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a Gemini model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {geminiModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name} - <span className="text-xs text-muted-foreground">{model.description}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Link Knowledge Bases</CardTitle>
                    <CardDescription>Select the knowledge bases this assistant can access (up to 3).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="selectedKnowledgeBaseIds"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3 pt-2">
                            {mockKnowledgeBases.map((kb) => (
                              <FormItem key={kb.id} className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:shadow-md transition-shadow">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(kb.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      if (checked) {
                                        field.onChange([...currentValues, kb.id]);
                                      } else {
                                        field.onChange(currentValues.filter((id) => id !== kb.id));
                                      }
                                    }}
                                    disabled={!field.value?.includes(kb.id) && field.value?.length >= 3}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm leading-none w-full cursor-pointer">
                                  {kb.name} <span className="text-xs text-muted-foreground">({kb.documentCount} documents)</span>
                                </FormLabel>
                              </FormItem>
                            ))}
                          </div>
                          <FormMessage className="pt-2" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                <Button type="submit" size="lg" className="w-full md:w-auto">
                  <Save className="mr-2 h-4 w-4" /> Create Custom Assistant
                </Button>
              </div>

              <div className="md:col-span-1 space-y-6">
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle>Assistant Summary</CardTitle>
                    <CardDescription>Review your custom assistant configuration.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Assistant Name</Label>
                      <p className="font-medium">{form.watch("assistantName") || "Not set"}</p>
                    </div>
                     <div>
                      <Label className="text-xs text-muted-foreground">Selected AI Model</Label>
                      <p className="font-medium">{selectedModelInfo?.name || "Not selected"}</p>
                      {selectedModelInfo && <p className="text-xs text-muted-foreground">{selectedModelInfo.description}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Linked Knowledge Bases</Label>
                      {selectedKBsInfo.length > 0 ? (
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {selectedKBsInfo.map(kb => (
                            <li key={kb.id} className="text-sm font-medium">{kb.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-medium">None selected</p>
                      )}
                    </div>
                     <p className="text-xs text-muted-foreground pt-4">
                        This summary updates as you fill out the form. Once created, you can test this assistant in the Playground.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  );
}
