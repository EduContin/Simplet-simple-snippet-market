"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { slugify } from "@/models/slugify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, RefreshCw } from "lucide-react";

interface Thread {
  id: number;
  title: string;
  username: string;
  category_name: string;
  post_count: number;
  last_post_at: string;
  announcements: boolean;
}

async function getLatestThreads() {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL;
  const response = await fetch(`${apiUrl}/api/v1/threads?page=1&pageSize=10`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch threads");
  }
  return response.json();
}

const limitTitle = (title: string, maxLength: number = 70): string => {
  if (title.length > maxLength) {
    return title.slice(0, maxLength - 3) + "...";
  }
  return title;
};

const timeSinceLastActivity = (lastActivity: string): string => {
  const now = new Date();
  const lastActivityTime = new Date(lastActivity);
  const delta = now.getTime() - lastActivityTime.getTime();

  const minutes = Math.floor(delta / 60000);
  const hours = Math.floor(delta / 3600000);
  const days = Math.floor(delta / 86400000);
  const months = Math.floor(days / 30);

  if (months >= 1) {
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else if (days >= 1) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours >= 1) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes >= 1) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "just now";
  }
};

const LoadingSkeleton = () => (
  <div className="border border-border rounded-lg bg-background mb-6">
    {/* Header */}
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
        </div>
      </div>
    </div>
    
    {/* Loading items */}
    <div className="divide-y divide-border">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-5 w-5 rounded-full bg-muted animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

function RecentTopics() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchThreads = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);

      const latestThreads = await getLatestThreads();
      const commonThreads = latestThreads.filter((thread: Thread) => !thread.announcements);
      setThreads(commonThreads);
      setError(null);
    } catch (err) {
      setError("Failed to fetch threads");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const intervalId = setInterval(() => fetchThreads(true), 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="border border-border rounded-lg bg-background mb-6">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Topics
            </h3>
            <span className="text-xs text-destructive">Error</span>
          </div>
        </div>
        
        {/* Error content */}
        <div className="px-4 py-8 text-center">
          <div className="text-muted-foreground">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-destructive">Failed to load recent topics</p>
            <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-background mb-6">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Recent Topics
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {threads.length} {threads.length === 1 ? "topic" : "topics"}
            </span>
            {isRefreshing && (
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>
      </div>
      
      {/* List */}
      <div className="divide-y divide-border">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <div
              key={thread.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              {/* Avatar */}
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarImage src={`/api/avatar/${thread.username}`} alt={thread.username} />
                <AvatarFallback className="text-xs bg-muted">
                  {thread.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/thread/${slugify(thread.title)}-${thread.id}`}
                      className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors leading-5"
                      title={thread.title}
                    >
                      {limitTitle(thread.title, 60)}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Link
                        href={`/users/${thread.username}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {thread.username}
                      </Link>
                      <span>•</span>
                      <span>{timeSinceLastActivity(thread.last_post_at)}</span>
                      {thread.category_name && (
                        <>
                          <span>•</span>
                          <span className="truncate">{thread.category_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{thread.post_count} posts</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent topics found</p>
              <p className="text-xs mt-1">Start a new discussion to get the conversation going!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentTopics;
