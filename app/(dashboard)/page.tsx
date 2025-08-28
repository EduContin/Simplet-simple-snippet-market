"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import ForumSummary from "@/components/ForumSummary";
import StickyTopics from "@/components/AnnouncementsTopics";
import RecentTopics from "@/components/RecentTopics";
import Shoutbox from "@/components/Shoutbox";

export default function ForumDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <CircularProgress />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s what&apos;s happening in your forum today
          </p>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <ForumSummary />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <StickyTopics />
            <RecentTopics />
          </div>
        </div>
        
        {/* Shoutbox Section */}
        <div className="mt-6">
          <Shoutbox />
        </div>
      </div>
    </div>
  );
}
