
"use client"; // For chat interactions and state

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/PageHeader";
import { PlayCircle, Bot, User, Send, Settings, MessageSquareDashed } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const initialMessages: Message[] = [
  { id: "1", text: "Hello! How can I help you today?", sender: "bot", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: "2", text: "I have a question about my recent order.", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 3) },
  { id: "3", text: "Sure, I can help with that. What is your order number?", sender: "bot", timestamp: new Date(Date.now() - 1000 * 60 * 2) },
];

export default function PlaygroundPage() {
  const [selectedAssistant, setSelectedAssistant] = useState<string>("support_pro");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: String(Date.now() + 1),
        text: `I'm processing your message: "${inputValue}". This is a simulated response.`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
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
                Select Assistant
              </label>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger id="assistant-select">
                  <SelectValue placeholder="Choose an assistant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_pro">Support Pro</SelectItem>
                  <SelectItem value="sales_bot">Sales Bot</SelectItem>
                  <SelectItem value="faq_helper">FAQ Helper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Currently testing: <strong>{selectedAssistant.replace("_", " ")}</strong>
            </p>
            {/* More settings can be added here, e.g., persona override, context injection */}
            <Button variant="outline" className="w-full">Reset Conversation</Button>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="md:col-span-2 flex flex-col shadow-lg h-full overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle>Conversation with {selectedAssistant.replace("_", " ")}</CardTitle>
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
                      "flex items-end gap-2 mb-4",
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
                        "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow",
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
                ))
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
              />
              <Button onClick={handleSendMessage} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
