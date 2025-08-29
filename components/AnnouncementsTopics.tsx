"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Megaphone } from "lucide-react";
import { slugify } from "@/models/slugify";

interface Thread {
  id: number;
  title: string;
  username: string;
  category_name?: string;
  post_count: number;
  last_post_at: string;
  anounts: boolean;
}

async function getAnnouncements() {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL;
  const response = await fetch(
    `${apiUrl}/api/v1/threads?announcements=true&page=1&pageSize=10`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch announcements");
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

const AnnouncementsTopics: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch announcements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);



  if (isLoading) {
    return (
      <div className="border border-border rounded-lg bg-background mb-6">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
        
        {/* Loading items */}
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
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
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="border border-border-default rounded-md bg-canvas mb-4">
      {/* Header */}
      <div className="border-b border-border-default px-4 py-2 bg-canvas-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-default)' }}>
            Announcements
          </h3>
          <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            {announcements.length} {announcements.length === 1 ? "topic" : "topics"}
          </span>
        </div>
      </div>
      
      {/* List */}
      <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
        {announcements.length > 0 ? (
          announcements.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center gap-3 px-4 py-2 hover:bg-canvas-subtle transition-colors cursor-pointer"
            >
              {/* Avatar */}
              <Avatar className="h-4 w-4 flex-shrink-0">
                <AvatarImage src={`/api/avatar/${topic.username}`} alt={topic.username} />
                <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--canvas-subtle)', color: 'var(--fg-muted)' }}>
                  {topic.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/thread/${slugify(topic.title)}-${topic.id}`}
                      className="text-sm font-medium hover:underline transition-colors leading-tight block truncate"
                      style={{ color: 'var(--fg-default)' }}
                      title={topic.title}
                    >
                      {limitTitle(topic.title, 50)}
                    </Link>
                    <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: 'var(--fg-muted)' }}>
                      <Link
                        href={`/users/${topic.username}`}
                        className="hover:underline transition-colors"
                        style={{ color: 'var(--fg-muted)' }}
                      >
                        {topic.username}
                      </Link>
                      <span>•</span>
                      <span>{timeSinceLastActivity(topic.last_post_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--fg-muted)' }}>
                    <span>{topic.post_count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center">
            <div style={{ color: 'var(--fg-muted)' }}>
              <Megaphone className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No announcements at this time</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsTopics;
