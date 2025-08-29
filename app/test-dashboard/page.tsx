"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Folder,
  ExternalLink,
  Megaphone,
  Clock,
  User
} from "lucide-react";

export default function TestDashboard() {
  // Mock data for testing
  const mockSession = {
    user: {
      name: "Test User",
      email: "test@example.com"
    }
  };

  const mockCategories = [
    {
      id: 1,
      name: "General Discussion",
      description: "Talk about anything and everything",
      thread_count: 156,
      post_count: 2340,
      section: "Community"
    },
    {
      id: 2,
      name: "Programming",
      description: "Discuss coding, development, and programming languages",
      thread_count: 89,
      post_count: 1567,
      section: "Development"
    },
    {
      id: 3,
      name: "Help & Support",
      description: "Get help with technical issues and questions",
      thread_count: 73,
      post_count: 892,
      section: "Support"
    }
  ];

  const mockAnnouncements = [
    {
      id: 1,
      title: "Welcome to our redesigned forum! Check out the new GitHub-style interface",
      username: "admin",
      post_count: 15,
      last_post_at: "2024-01-28T10:30:00Z"
    },
    {
      id: 2,
      title: "New community guidelines and moderation policies",
      username: "moderator",
      post_count: 8,
      last_post_at: "2024-01-27T14:20:00Z"
    }
  ];

  const mockRecentTopics = [
    {
      id: 3,
      title: "How to implement dark mode in React applications",
      username: "developer123",
      category_name: "Programming",
      post_count: 12,
      last_post_at: "2024-01-28T16:45:00Z"
    },
    {
      id: 4,
      title: "Best practices for API design and documentation",
      username: "techguru",
      category_name: "Development",
      post_count: 7,
      last_post_at: "2024-01-28T15:30:00Z"
    },
    {
      id: 5,
      title: "Troubleshooting Docker deployment issues",
      username: "devops_ninja",
      category_name: "Help & Support",
      post_count: 5,
      last_post_at: "2024-01-28T13:15:00Z"
    }
  ];

  const mockShoutboxMessages = [
    {
      id: 1,
      username: "alice",
      message: "Great work on the new dashboard design! 🎉",
      created_at: "2024-01-28T17:30:00Z"
    },
    {
      id: 2,
      username: "bob",
      message: "The GitHub-style theme looks amazing",
      created_at: "2024-01-28T17:25:00Z"
    },
    {
      id: 3,
      username: "charlie",
      message: "Much cleaner and more professional",
      created_at: "2024-01-28T17:20:00Z"
    }
  ];

  const timeSinceLastActivity = (lastActivity: string): string => {
    const now = new Date();
    const lastActivityTime = new Date(lastActivity);
    const delta = now.getTime() - lastActivityTime.getTime();
    const minutes = Math.floor(delta / 60000);
    const hours = Math.floor(delta / 3600000);
    
    if (hours >= 1) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes >= 1) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return "just now";
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Welcome back, {mockSession?.user?.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s what&apos;s happening in your forum today
          </p>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area - Forum Summary */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="mb-8">
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                        <Folder className="h-6 w-6 text-primary" />
                      </div>
                      Forum Categories
                      <Badge variant="outline" className="ml-2 font-mono text-xs">
                        3 sections
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Explore different topics and discussions across various sections
                    </CardDescription>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg text-primary">318</div>
                      <div className="text-muted-foreground">Total Threads</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-green-600">4,799</div>
                      <div className="text-muted-foreground">Total Posts</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/10 overflow-hidden shadow-lg">
                  <div className="space-y-0">
                    {mockCategories.map((category) => (
                      <div
                        key={category.id}
                        className="group flex items-center justify-between p-6 border-b border-border/30 last:border-b-0 hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/10 transition-all duration-300"
                      >
                        <div className="space-y-2">
                          <div className="font-semibold text-lg text-foreground hover:text-primary transition-all duration-300 inline-flex items-center gap-2 group-hover:gap-3 group cursor-pointer">
                            <span className="bg-gradient-to-r from-primary/10 to-secondary/10 p-2 rounded-lg group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                              <Folder className="h-4 w-4 text-primary" />
                            </span>
                            {category.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed pl-10">
                            {category.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="secondary" 
                            className="font-mono text-sm px-3 py-1 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 border-blue-200/20"
                          >
                            {category.thread_count} threads
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="font-mono text-sm px-3 py-1 bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-600 border-green-200/20"
                          >
                            {category.post_count} posts
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Announcements */}
            <Card className="mb-8">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Announcements</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Important updates
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="font-mono whitespace-nowrap bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-600 border-orange-200/20"
                  >
                    <Megaphone className="h-3 w-3 mr-1.5" />
                    {mockAnnouncements.length} topics
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="space-y-1">
                  {mockAnnouncements.map((topic) => (
                    <div
                      key={topic.id}
                      className="group flex items-center gap-4 p-4 hover:bg-muted/30 transition-all duration-200 border-b border-border/30 last:border-b-0"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                        <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/20 to-secondary/20">
                          {topic.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-semibold text-foreground hover:text-primary transition-colors duration-200 line-clamp-2 group-hover:underline cursor-pointer">
                          {topic.title.length > 70 ? topic.title.slice(0, 67) + "..." : topic.title}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="font-medium hover:text-primary transition-colors cursor-pointer">
                            {topic.username}
                          </span>
                          <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeSinceLastActivity(topic.last_post_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="secondary" className="font-mono">
                          <Megaphone className="h-3 w-3 mr-1" />
                          {topic.post_count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Topics */}
            <Card className="mb-8">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Recent Topics</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Latest discussions
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="font-mono whitespace-nowrap bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 border-blue-200/20"
                  >
                    <MessageSquare className="h-3 w-3 mr-1.5" />
                    {mockRecentTopics.length} topics
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="space-y-1">
                  {mockRecentTopics.map((thread) => (
                    <div
                      key={thread.id}
                      className="group flex items-center gap-4 p-4 hover:bg-muted/30 transition-all duration-200 border-b border-border/30 last:border-b-0"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                        <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/20 to-secondary/20">
                          {thread.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-semibold text-foreground hover:text-primary transition-colors duration-200 line-clamp-2 group-hover:underline cursor-pointer">
                          {thread.title.length > 70 ? thread.title.slice(0, 67) + "..." : thread.title}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="font-medium hover:text-primary transition-colors cursor-pointer">
                            {thread.username}
                          </span>
                          <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeSinceLastActivity(thread.last_post_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="secondary" className="font-mono">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {thread.post_count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Shoutbox Section */}
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Community Shoutbox</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Quick messages from the community
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {mockShoutboxMessages.length} messages
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {mockShoutboxMessages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-secondary/20">
                        {message.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{message.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {timeSinceLastActivity(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 input text-sm"
                    disabled
                  />
                  <button className="btn btn-primary px-4 py-2 text-sm" disabled>
                    Send
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}