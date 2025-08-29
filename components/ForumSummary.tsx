// components/ForumSummary.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { slugify } from "@/models/slugify";
import { Folder } from "lucide-react";

interface Category {
  id: number;
  name: string;
  description: string;
  thread_count: number;
  post_count: number;
}

interface Section {
  id: number;
  name: string;
  categories: Category[];
}

const ForumSummary: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch("/api/v1/forum-structure");
        if (response.ok) {
          const data = await response.json();
          setSections(data);
        } else {
          console.error("Failed to fetch forum structure");
        }
      } catch (error) {
        console.error("Error fetching forum structure:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSections();
  }, []);

  const LoadingSkeleton = () => (
    <div
      className="border rounded-md"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--canvas)'
      }}
    >
      <div
        className="border-b px-4 py-3"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--canvas-subtle)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
          <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="flex-1">
              <div className="h-3.5 w-3/4 rounded animate-pulse mb-1.5" style={{ backgroundColor: 'var(--neutral-muted)' }} />
              <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
            </div>
            <div className="flex gap-6">
              <div className="h-3 w-8 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
              <div className="h-3 w-8 rounded animate-pulse" style={{ backgroundColor: 'var(--neutral-muted)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (sections.length === 0) {
    return (
      <div className="border rounded-md mb-6" style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--canvas)'
      }}>
        <div className="border-b px-4 py-3" style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--canvas-subtle)'
        }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--fg-default)' }}>
            Forum Categories
          </h2>
        </div>
        <div className="px-4 py-12 text-center">
          <Folder className="h-12 w-12 mx-auto mb-3 opacity-40" style={{ color: 'var(--fg-muted)' }} />
          <p className="text-sm mb-1" style={{ color: 'var(--fg-muted)' }}>No forum sections available yet.</p>
          <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>Categories will appear here once they are created.</p>
        </div>
      </div>
    );
  }

  const totalThreads = sections.reduce((acc, section) =>
    acc + section.categories.reduce((catAcc, cat) => catAcc + cat.thread_count, 0), 0
  );
  
  const totalPosts = sections.reduce((acc, section) =>
    acc + section.categories.reduce((catAcc, cat) => catAcc + cat.post_count, 0), 0
  );

  const allCategories = sections.flatMap(section => section.categories);

  return (
    <div
      className="border rounded-md"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--canvas)'
      }}
    >
      {/* Header - GitHub Repository Header Style */}
      <div
        className="border-b px-4 py-3"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--canvas-subtle)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4" style={{ color: 'var(--fg-muted)' }} />
            <h2 className="text-sm font-semibold leading-5" style={{ color: 'var(--fg-default)' }}>
              Forum Categories
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--fg-muted)' }}>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{totalThreads.toLocaleString()}</span>
              <span>threads</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">{totalPosts.toLocaleString()}</span>
              <span>posts</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Categories List - GitHub Repository List Style */}
      <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
        {allCategories.map((category) => (
          <div
            key={category.id}
            className="group flex items-center justify-between px-4 py-3 transition-colors cursor-pointer"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Folder className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--fg-muted)' }} />
                <Link
                  href={`/category/${slugify(category.name)}`}
                  className="text-sm font-semibold hover:underline transition-colors truncate leading-5"
                  style={{ color: 'var(--accent)' }}
                  title={category.name}
                >
                  {category.name}
                </Link>
              </div>
              <p className="text-xs leading-4 ml-6 truncate" style={{ color: 'var(--fg-muted)' }}>
                {category.description}
              </p>
            </div>
            <div className="flex items-center gap-8 ml-4 flex-shrink-0">
              <div className="text-xs text-center min-w-[48px]">
                <div className="font-semibold leading-4" style={{ color: 'var(--fg-default)' }}>
                  {category.thread_count}
                </div>
                <div className="leading-4" style={{ color: 'var(--fg-muted)' }}>threads</div>
              </div>
              <div className="text-xs text-center min-w-[48px]">
                <div className="font-semibold leading-4" style={{ color: 'var(--fg-default)' }}>
                  {category.post_count}
                </div>
                <div className="leading-4" style={{ color: 'var(--fg-muted)' }}>posts</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForumSummary;
