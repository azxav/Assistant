
"use client"; // For chat interactions and state

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/PageHeader";
import { PlayCircle, Bot, User, Send, Settings, MessageSquareDashed, FileText, ExternalLink } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  sources?: any[];
}

interface CustomAssistant {
  name: string;
  model: string;
  knowledgeBases: string[];
}

// No initial messages in production
const initialMessages: Message[] = [];

export default function PlaygroundPage() {
  const [selectedAssistant, setSelectedAssistant] = useState<string>("gemini-2.0-flash");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [customAssistants, setCustomAssistants] = useState<CustomAssistant[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Load custom assistants from localStorage when component mounts
  useEffect(() => {
    setHasMounted(true);
    try {
      const assistantData = localStorage.getItem('customAssistant');
      if (assistantData) {
        const assistant = JSON.parse(assistantData);
        setCustomAssistants([assistant]);
        // Optionally select this assistant by default
        setSelectedAssistant(assistant.model);
      }
    } catch (error) {
      console.error('Failed to load custom assistants:', error);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "" || isTyping) return;

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    const currentInputValue = inputValue; // Capture before clearing
    setInputValue("");
    setIsTyping(true);

    let useKnowledgeBase = false; // Default to NOT using knowledge base
    let finalModelId = selectedAssistant;

    // Check if the selectedAssistant corresponds to the loaded custom assistant
    const activeCustomAssistant = customAssistants.length > 0 && customAssistants[0]?.name ? customAssistants[0] : null;

    if (activeCustomAssistant && selectedAssistant === activeCustomAssistant.model) {
      // A specific, named Custom Assistant is selected
      useKnowledgeBase = true; // Custom Assistants ARE MEANT to use their linked KBs
      finalModelId = activeCustomAssistant.model; // Use the model from the custom assistant config
      console.log(`Custom assistant '${activeCustomAssistant.name}' selected. Using its model (${finalModelId}) and knowledge base.`);
    } else {
      // A generic model was selected directly from the list, or no custom assistant is configured/selected
      useKnowledgeBase = false;
      finalModelId = selectedAssistant; // This is already the generic model ID
      console.log(`Generic model '${finalModelId}' selected. Bypassing knowledge base.`);
    }

    try {
      const requestBody: any = {
        question: currentInputValue,
        model_name: finalModelId, 
      };

      if (useKnowledgeBase) {
        requestBody.use_knowledge_base = true; // Explicitly true, though backend defaults to this
        requestBody.max_context = 5; 
      } else {
        requestBody.use_knowledge_base = false;
      }

      const response = await fetch("/api/kb/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorDetail = "Request failed.";
        try {
            const errData = await response.json();
            errorDetail = errData.detail || errData.error || `Error: ${response.status}`;
        } catch (e) {
            errorDetail = `Error: ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      
      const botResponse: Message = {
        id: String(Date.now() + 1),
        text: data.answer || "Sorry, I couldn't find an answer to your question.",
        sender: "bot",
        timestamp: new Date(),
        sources: useKnowledgeBase ? (data.sources || []) : [] 
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error: any) {
      console.error('Error fetching response:', error);
      
      const errorMessage: Message = {
        id: String(Date.now() + 1),
        text: error.message || "Sorry, I encountered an error processing your request. Please try again later.",
        sender: "bot",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetConversation = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Testing Playground"
        description="Interact with your configured AI assistants to test their behavior."
        icon={PlayCircle}
      />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-6 overflow-hidden">
        {/* Configuration Panel - Hidden on small screens, shown on medium+ */}
        <Card className="hidden md:flex md:flex-col shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Test Settings</CardTitle>
            <CardDescription>Select an assistant and configure test parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div>
              <label htmlFor="assistant-select" className="block text-sm font-medium text-foreground mb-1">
                Select Model
              </label>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger id="assistant-select">
                  <SelectValue placeholder="Choose an AI model" />
                </SelectTrigger>
                <SelectContent>
                  {customAssistants.length > 0 && customAssistants[0]?.name && (
                    <>
                      <SelectItem value={customAssistants[0].model}>{customAssistants[0].name} (Custom)</SelectItem>
                      <SelectItem disabled value="divider">────────────</SelectItem>
                    </>
                  )}
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Currently using: <strong>{selectedAssistant}</strong>
            </p>
            {customAssistants.length > 0 && selectedAssistant === customAssistants[0]?.model && (
              <div className="border rounded-md p-3 text-sm">
                <p className="font-medium mb-1">Knowledge bases connected:</p>
                <ul className="list-disc list-inside">
                  {customAssistants[0]?.knowledgeBases.map((kb, index) => (
                    <li key={index} className="text-xs text-muted-foreground ml-2">
                      {kb.split(/[/\\]/).pop()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={handleResetConversation}>Reset Conversation</Button>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="md:col-span-2 flex flex-col shadow-lg h-full overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle>Playground</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-[calc(100%-0px)] p-4" ref={scrollAreaRef}> {/* Adjust height calculation if needed */}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquareDashed className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No messages yet.</p>
                  <p className="text-sm text-muted-foreground">Start the conversation by typing a message below.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col mb-4",
                      message.sender === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div 
                      className={cn(
                        "flex items-end gap-2",
                        message.sender === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.sender === "bot" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm shadow",
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <p className={cn(
                            "text-xs mt-1",
                            message.sender === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70 text-left"
                          )}>
                          {hasMounted ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </p>
                      </div>
                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="https://placehold.co/32x32.png" alt="User" data-ai-hint="user avatar" />
                          <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    
                    {/* Sources display */}
                    {message.sender === "bot" && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 ml-10 space-y-2">
                        <Badge variant="outline" className="mb-1">Sources</Badge>
                        <div className="space-y-2">
                          {message.sources.slice(0, 3).map((source, idx) => (
                            <div key={idx} className="text-xs border rounded p-2 max-w-[90%] bg-background/50">
                              <div className="flex items-center gap-1 mb-1 text-primary">
                                <FileText className="h-3 w-3" />
                                <span className="font-medium">{source.file_path.split(/[/\\]/).pop()}</span>
                                <span className="text-muted-foreground ml-auto">Score: {(source.similarity_score * 100).toFixed(0)}%</span>
                              </div>
                              <p className="text-muted-foreground line-clamp-2">{source.content.substring(0, 150)}...</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {/* Loading indicator */}
              {isTyping && (
                <div className="flex items-end gap-2 mb-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2 shadow">
                    <Skeleton className="h-4 w-[150px] mb-2" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <div className="border-t p-4 bg-background">
            <div className="flex items-center gap-2">
              <Textarea
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 resize-none min-h-[40px]"
                rows={1}
                disabled={isTyping}
              />
              <Button 
                onClick={handleSendMessage} 
                aria-label="Send message"
                disabled={inputValue.trim() === "" || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
