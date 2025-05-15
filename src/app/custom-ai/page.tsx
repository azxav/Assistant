"use client";

import React, { useEffect, useState } from "react";
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
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest fast and versatile model.' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', description: 'A lighter version of Gemini 2.0 Flash.' },
  // Add other models here if needed, e.g., a general purpose one if the above are too specific
  // For example, if there's a general Gemini 2.0 Pro or similar available and desired:
  // { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', description: 'Most capable Gemini 2.0 model.' }, 
];

export default function CustomAIPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<{id: string, name: string, documentCount: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Fetch real knowledge base data
    fetch('/api/kb/knowledgebase')
      .then(res => res.json())
      .then(data => {
        const kbOptions = data.documents.map((d: any) => ({
          id: d.file_path,
          name: d.file_path.split(/[/\\]/).pop(),
          documentCount: d.chunks || 0
        }));
        setKnowledgeBases(kbOptions);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch knowledge bases:', err);
        setIsLoading(false);
      });
  }, []);

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
    
    // Store in localStorage for easy retrieval in Playground
    localStorage.setItem('customAssistant', JSON.stringify({
      name: data.assistantName,
      model: data.selectedModelId,
      knowledgeBases: data.selectedKnowledgeBaseIds
    }));
    
    alert("Custom Assistant configuration saved! You can now test it in the Playground.");
    // Here you would typically send data to a server / use Server Action
  };

  const selectedModelInfo = geminiModels.find(m => m.id === form.watch("selectedModelId"));
  const selectedKBsInfo = knowledgeBases.filter(kb => form.watch("selectedKnowledgeBaseIds")?.includes(kb.id));

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
                    {isLoading ? (
                      <div className="py-4 text-center text-muted-foreground">
                        Loading knowledge bases...
                      </div>
                    ) : knowledgeBases.length === 0 ? (
                      <div className="py-4 text-center text-muted-foreground">
                        No knowledge bases found. Please add documents to your knowledge base first.
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="selectedKnowledgeBaseIds"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-3 pt-2">
                              {knowledgeBases.map((kb) => (
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
                                    {kb.name} <span className="text-xs text-muted-foreground">({kb.documentCount} chunks)</span>
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                            <FormMessage className="pt-2" />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
                <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isLoading || knowledgeBases.length === 0}>
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
