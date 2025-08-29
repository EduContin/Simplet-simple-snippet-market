"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ForumSummary from "@/components/ForumSummary";
import StickyTopics from "@/components/AnnouncementsTopics";
import RecentTopics from "@/components/RecentTopics";
import Shoutbox from "@/components/Shoutbox";

// GitHub-style loading spinner
const GitHubSpinner = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--canvas)' }}>
    <div className="flex items-center gap-3" style={{ color: 'var(--fg-muted)' }}>
      <div className="relative">
        <svg
          className="animate-spin h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          style={{ color: 'var(--fg-muted)' }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <span className="text-sm font-medium">Loading dashboard...</span>
    </div>
  </div>
);

export default function ForumDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <GitHubSpinner />;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--canvas)' }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - GitHub Style */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight mb-2" style={{ color: 'var(--fg-default)' }}>
                Welcome back, {session?.user?.name}
              </h1>
              <p className="text-base leading-6" style={{ color: 'var(--fg-muted)' }}>
                Here&apos;s what&apos;s happening in your forum today
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content Grid - GitHub-inspired layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-3">
            <ForumSummary />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            <StickyTopics />
            <RecentTopics />
          </div>
        </div>
        
        {/* Shoutbox Section */}
        <div className="mt-8">
          <Shoutbox />
        </div>
      </div>
    </div>
  );
}
