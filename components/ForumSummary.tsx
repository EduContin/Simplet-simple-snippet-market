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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sections]);

  const LoadingSkeleton = () => (
    <div className="border border-border-default rounded-md bg-canvas mb-4">
      <div className="border-b border-border-default px-4 py-3 bg-canvas-subtle">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-canvas-subtle rounded animate-pulse" />
          <div className="h-4 w-20 bg-canvas-subtle rounded animate-pulse" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border-default last:border-b-0">
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-canvas-subtle rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-canvas-subtle rounded animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-8 bg-canvas-subtle rounded animate-pulse" />
              <div className="h-3 w-8 bg-canvas-subtle rounded animate-pulse" />
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
      <div className="border border-border-default rounded-md bg-canvas mb-4">
        <div className="border-b border-border-default px-4 py-3 bg-canvas-subtle">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-default)' }}>
            Forum Categories
          </h3>
        </div>
        <div className="px-4 py-8 text-center">
          <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" style={{ color: 'var(--fg-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>No forum sections available yet.</p>
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
    <div className="border border-border-default rounded-md bg-canvas mb-4">
      {/* Header */}
      <div className="border-b border-border-default px-4 py-3 bg-canvas-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-default)' }}>
            <Folder className="h-4 w-4 inline mr-2" style={{ color: 'var(--fg-muted)' }} />
            Forum Categories
          </h3>
          <div className="flex gap-4 text-xs" style={{ color: 'var(--fg-muted)' }}>
            <span>{totalThreads.toLocaleString()} threads</span>
            <span>{totalPosts.toLocaleString()} posts</span>
          </div>
        </div>
      </div>
      
      {/* Categories List */}
      <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
        {allCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-canvas-subtle transition-colors"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/category/${slugify(category.name)}`}
                className="text-sm font-medium hover:underline transition-colors block truncate"
                style={{ color: 'var(--fg-default)' }}
                title={category.name}
              >
                {category.name}
              </Link>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--fg-muted)' }}>
                {category.description}
              </p>
            </div>
            <div className="flex gap-4 text-xs ml-4 flex-shrink-0" style={{ color: 'var(--fg-muted)' }}>
              <span>{category.thread_count}</span>
              <span>{category.post_count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForumSummary;
