"use client"; // For state management of selected conversation and messages

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Monitor, User, Bot, MessageSquare, RefreshCw, Eye, MessageSquareDashed } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface MonitoredMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface Conversation {
  id: string;
  userId: string;
  userAvatar?: string;
  assistantName: string;
  lastMessage: string;
  lastMessageTimestamp: Date;
  unreadCount?: number;
  messages: MonitoredMessage[];
}

const mockConversations: Conversation[] = [
  {
    id: "conv1",
    userId: "User_Alpha",
    userAvatar: "https://placehold.co/40x40.png?text=UA",
    assistantName: "Support Pro",
    lastMessage: "Thanks for your help!",
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 15),
    unreadCount: 2,
    messages: [
      { id: "m1a", text: "I need help with billing.", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 20) },
      { id: "m1b", text: "Certainly, I can assist with that. What is your account ID?", sender: "bot", timestamp: new Date(Date.now() - 1000 * 60 * 19) },
      { id: "m1c", text: "It's ACC12345.", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 18) },
      { id: "m1d", text: "Thank you. I see the issue and have resolved it.", sender: "bot", timestamp: new Date(Date.now() - 1000 * 60 * 16) },
      { id: "m1e", text: "Thanks for your help!", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 15) },
    ],
  },
  {
    id: "conv2",
    userId: "User_Beta",
    assistantName: "Sales Bot",
    lastMessage: "Okay, I will think about it.",
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messages: [
      { id: "m2a", text: "Tell me more about your enterprise plan.", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 - 5000) },
      { id: "m2b", text: "Our enterprise plan offers advanced features and dedicated support. Would you like a demo?", sender: "bot", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 - 3000) },
      { id: "m2c", text: "Okay, I will think about it.", sender: "user", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    ],
  },
];

export default function MonitoringPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0] || null);
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [selectedConversation]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark as read if unreadCount exists
    setConversations(prev => prev.map(c => c.id === conversation.id ? {...c, unreadCount: 0} : c));
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Chat Monitoring"
        description="Oversee live and past conversations between customers and AI assistants."
        icon={Monitor}
        actionButton={
            <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
        }
      />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-0 md:gap-6 p-0 md:p-6 overflow-hidden">
        {/* Conversations List */}
        <Card className="md:col-span-1 lg:col-span-1 flex flex-col shadow-lg h-full overflow-hidden border-r md:border-none rounded-none md:rounded-lg">
          <CardHeader className="border-b">
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Select a conversation to view details.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageSquareDashed className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-md font-medium text-muted-foreground">No conversations found.</p>
                  <p className="text-sm text-muted-foreground">Interactions will appear here as they happen.</p>
                </div>
              ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-muted/50 focus:outline-none focus:bg-accent focus:text-accent-foreground transition-colors",
                      selectedConversation?.id === conv.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={conv.userAvatar} alt={conv.userId} data-ai-hint="user avatar" />
                          <AvatarFallback>{conv.userId.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold truncate">{conv.userId}</span>
                      </div>
                      {conv.unreadCount && conv.unreadCount > 0 && (
                        <Badge variant="destructive">{conv.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      Interacting with: <strong>{conv.assistantName}</strong>
                    </p>
                    <p className={cn("text-sm truncate", selectedConversation?.id === conv.id ? "text-accent-foreground/80" : "text-foreground/80")}>
                      {conv.lastMessage}
                    </p>
                    <p className={cn("text-xs mt-1", selectedConversation?.id === conv.id ? "text-accent-foreground/60" : "text-muted-foreground")}>
                      {conv.lastMessageTimestamp.toLocaleTimeString()} - {conv.lastMessageTimestamp.toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Selected Conversation Details */}
        <Card className="md:col-span-2 lg:col-span-3 flex flex-col shadow-lg h-full overflow-hidden rounded-none md:rounded-lg">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Chat with {selectedConversation.userId}</CardTitle>
                        <CardDescription>Assistant: {selectedConversation.assistantName}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/> View User Profile</Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4" ref={chatDisplayRef}>
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-end gap-2 mb-4",
                        message.sender === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.sender === "bot" && (
                        <Avatar className="h-8 w-8">
                           <AvatarImage src="https://placehold.co/32x32.png?text=B" alt="Bot" data-ai-hint="bot avatar" />
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
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedConversation.userAvatar} alt={selectedConversation.userId} data-ai-hint="user avatar" />
                          <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
              {/* Optional: Add a footer for actions like "Flag conversation" or "Take over chat" */}
               <div className="border-t p-3 bg-background text-right">
                <Button variant="ghost" size="sm">Flag Conversation</Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Conversation Selected</p>
              <p className="text-sm text-muted-foreground">Please select a conversation from the list to view its details.</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
