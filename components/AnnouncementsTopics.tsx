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
      <div
        className="border rounded-md"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--canvas)'
        }}
      >
        {/* Header */}
        <div
          className="border-b px-4 py-3"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--canvas-subtle)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
            <div className="h-3 w-4 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
          </div>
        </div>
        
        {/* Loading items */}
        <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className="h-6 w-6 rounded-full animate-pulse flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--neutral-muted)' }} />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
                <div className="h-2.5 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
              </div>
              <div className="h-2.5 w-8 rounded animate-pulse mt-0.5" style={{ backgroundColor: 'var(--neutral-muted)' }} />
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
    <div
      className="border rounded-md"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--canvas)'
      }}
    >
      {/* Header - GitHub Sidebar Widget Style */}
      <div
        className="border-b px-4 py-3"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--canvas-subtle)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" style={{ color: 'var(--fg-muted)' }} />
            <h3 className="text-sm font-semibold leading-5" style={{ color: 'var(--fg-default)' }}>
              Announcements
            </h3>
          </div>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              color: 'var(--fg-muted)',
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--border-default)'
            }}
          >
            {announcements.length}
          </span>
        </div>
      </div>
      
      {/* List - GitHub Sidebar List Style */}
      <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
        {announcements.length > 0 ? (
          announcements.map((topic) => (
            <div
              key={topic.id}
              className="group px-3 py-2 transition-colors cursor-pointer"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="flex items-start gap-2">
                {/* Avatar */}
                <Avatar className="h-4 w-4 flex-shrink-0 mt-0.5">
                  <AvatarImage src={`/api/avatar/${topic.username}`} alt={topic.username} />
                  <AvatarFallback
                    className="text-xs"
                    style={{
                      backgroundColor: 'var(--canvas-subtle)',
                      color: 'var(--fg-muted)',
                      fontSize: '8px'
                    }}
                  >
                    {topic.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/thread/${slugify(topic.title)}-${topic.id}`}
                        className="text-xs font-medium hover:underline transition-colors leading-4 block"
                        style={{ color: 'var(--accent)' }}
                        title={topic.title}
                      >
                        {limitTitle(topic.title, 40)}
                      </Link>
                      <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: 'var(--fg-muted)' }}>
                        <Link
                          href={`/users/${topic.username}`}
                          className="hover:underline transition-colors text-xs"
                          style={{ color: 'var(--fg-muted)' }}
                        >
                          {topic.username}
                        </Link>
                        <span>•</span>
                        <span className="text-xs">{timeSinceLastActivity(topic.last_post_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                      <span className="font-medium">{topic.post_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-3 py-6 text-center">
            <div style={{ color: 'var(--fg-muted)' }}>
              <Megaphone className="h-6 w-6 mx-auto mb-1 opacity-40" />
              <p className="text-xs">No announcements</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsTopics;
