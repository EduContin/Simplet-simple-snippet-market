"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import customEmojis from "@/models/custom-emojis";
import Image from "next/image";

type UserProfileProps = {
  user: any;
  currentUser: string | null | undefined;
};

export default function UserProfile({
  user,
  currentUser,
}: UserProfileProps) {
  const [recentThreads, setRecentThreads] = useState([]);
  const [userLikes, setUserLikes] = useState(0);
  // Remove explicit Threads and Vouches from UI; keep counts for internal metrics only
  const [likesOnSnippets, setLikesOnSnippets] = useState(0);
  const [earningsCents, setEarningsCents] = useState(0);
  const isOwner = !!currentUser && currentUser.toLowerCase() === String(user.username).toLowerCase();
  const [uploading, setUploading] = useState(false);

  const onUpload = async (kind: "avatar" | "banner", file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);
      const res = await fetch("/api/v1/users/upload", { method: "POST", body: fd });
      if (res.ok) {
        window.location.reload();
      } else {
        console.error("Upload failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  // Simple engagement-based awards (up to 8) with clear names for tooltips
  const computeAwards = () => {
    const arr: Array<{ name: string; title: string }> = [];
    const lr = Number(userLikes || 0); // likes received
    const pc = Number(user.posts_count || 0); // comments/posts made
    const sc = Number(user.threads_count || 0); // snippets created

    // Likes milestones
    if (lr >= 1) arr.push({ name: "LikeBronze.svg", title: "First Like Received" });
    if (lr >= 10) arr.push({ name: "LikeSilver.svg", title: "10 Likes Received" });
    if (lr >= 50) arr.push({ name: "LikeGold.svg", title: "50 Likes Received" });

    // Comments milestones
    if (pc >= 1) arr.push({ name: "CommentBronze.svg", title: "First Comment Posted" });
    if (pc >= 20) arr.push({ name: "CommentSilver.svg", title: "20 Comments Posted" });
    if (pc >= 100) arr.push({ name: "CommentGold.svg", title: "100 Comments Posted" });

    // Snippets milestones
    if (sc >= 1) arr.push({ name: "SnippetBronze.svg", title: "First Snippet Published" });
    if (sc >= 10) arr.push({ name: "SnippetSilver.svg", title: "10 Snippets Published" });

    // High-tier recognition
    if (lr >= 200) arr.push({ name: "Diamond.svg", title: "Community Diamond (200+ Likes Received)" });

    return arr.slice(0, 8);
  };
  const awards = computeAwards();

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

  // reputation UI removed

  useEffect(() => {
    const fetchRecentThreads = async () => {
      try {
        const res = await fetch(`/api/v1/threads?userId=${user.id}&pageSize=5`);
        if (res.ok) {
          const threads = await res.json();
          setRecentThreads(threads);
        } else {
          console.error("Failed to fetch recent threads");
        }
      } catch (error) {
        console.error("Error fetching recent threads:", error);
      }
    };

    fetchRecentThreads();
  }, [user.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/v1/users/${user.username}`);
        if (res.ok) {
          const data = await res.json();
          setUserLikes(data.likes_received);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchMetrics = async () => {
      try {
        const m = await fetch(`/api/v1/users/${user.username}/metrics`);
        if (m.ok) {
          const d = await m.json();
          setLikesOnSnippets(d.likes_on_snippets || 0);
          setEarningsCents(d.earnings_cents || 0);
        }
      } catch (e) {
        console.error("metrics fetch error", e);
      }
    };

    fetchData();
    fetchMetrics();
  }, [user.username]);

  const renderContentWithEmojisAndBBCode = (content: string) => {
    if (!content) {
      return null;
    }

    const parsedContent = content
      .replace(/\[b\](.*?)\[\/b\]/g, "<b>$1</b>")
      .replace(/\[i\](.*?)\[\/i\]/g, "<i>$1</i>")
      .replace(/\[u\](.*?)\[\/u\]/g, "<u>$1</u>")
      .replace(/\[s\](.*?)\[\/s\]/g, "<s>$1</s>")
      .replace(
        /\[color=(\w+|#[0-9a-fA-F]{6})\](.*?)\[\/color\]/g,
        "<span style='color:$1'>$2</span>",
      )
      .replace(
        /\[size=(\w+)\](.*?)\[\/size\]/g,
        "<span style='font-size:$1'>$2</span>",
      )
      .replace(
        /\[align=(\w+)\](.*?)\[\/align\]/g,
        "<div style='text-align:$1'>$2</div>",
      )
      .replace(
        /\[quote\](.*?)\[\/quote\]/g,
        "<blockquote class='border-l-4 border-gray-500 pl-4 my-2 italic'>$1</blockquote>",
      )
      .replace(/\[code\](.*?)\[\/code\]/g, "<pre><code>$1</code></pre>")
      .replace(
        /\[img\](.*?)\[\/img\]/g,
        "<img src='$1' alt='User uploaded image' />",
      )
      .replace(
        /\[url=([^\]]+)\](.*?)\[\/url\]/g,
        "<a href='$1' target='_blank' rel='noopener noreferrer'>$2</a>",
      )
      .replace(
        /\[hidden\](.*?)\[\/hidden\]/g,
        "<span class='hidden-content'>Like this post to see the content</span>",
      )
      .replace(
        /\[spoiler\](.*?)\[\/spoiler\]/g,
        "<span class='spoiler-content'>$1</span>",
      )
      .replace(/\n/g, "<br>");

    const parts = parsedContent.split(/(:[a-zA-Z0-9_+-]+:)/g);

    return parts.map((part, index) => {
      const emojiUrl = customEmojis[part as keyof typeof customEmojis];
      if (emojiUrl) {
        return (
          <Image
            key={index}
            src={emojiUrl}
            alt={part}
            width={20}
            height={20}
            className="inline-block h-7 w-7"
          />
        );
      }
      return (
        <span key={index} dangerouslySetInnerHTML={{ __html: part }}></span>
      );
    });
  };

  // reputation handlers removed

  return (
    <div className="min-h-screen text-white relative z-1">
      {/* Banner area with embedded avatar and controls */}
      <div className="w-full bg-transparent">
        <div className="relative w-full h-44 md:h-56 border-b border-gray-700">
          {user.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.banner_url} alt="Profile banner" className="absolute inset-0 w-full h-full object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute inset-x-4 bottom-[-28px] flex items-end justify-between">
            <div className="flex items-end gap-3">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar_url || "/prof-pic.png"} alt={user.username} className="w-full h-full object-cover" />
              </div>
              <div className="mb-2">
                <h1 className={`text-2xl md:text-3xl font-bold ${user.banned ? "line-through text-gray-400" : "text-white"}`}>{user.username}</h1>
                <p className="text-sm md:text-base text-blue-200">{user.banned ? "Banned" : user.user_group}</p>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2 mb-2">
                <label className="px-3 py-1.5 text-xs md:text-sm rounded-md bg-gray-900/70 border border-gray-700 hover:bg-gray-800 cursor-pointer">
                  {uploading ? "Uploading…" : "Change Avatar"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onUpload("avatar", e.target.files[0])} />
                </label>
                <label className="px-3 py-1.5 text-xs md:text-sm rounded-md bg-gray-900/70 border border-gray-700 hover:bg-gray-800 cursor-pointer">
                  {uploading ? "Uploading…" : "Change Banner"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onUpload("banner", e.target.files[0])} />
                </label>
              </div>
            )}
          </div>
        </div>
        <div className="h-10" />
      </div>
      <main className="container mx-auto px-2 py-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-3">
            {/* Likes summary */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-lg border border-gray-700 bg-gray-800/70 backdrop-blur-sm p-3"
            >
              <div className="text-center p-2 bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-green-500">{userLikes}</p>
                <p className="text-xs text-gray-400">Likes received</p>
              </div>
            </motion.section>

            {/* Information */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-lg border border-gray-700 bg-gray-800/70 backdrop-blur-sm p-3"
            >
              <h2 className="text-base font-semibold mb-2 text-blue-400">
                Information
              </h2>
              <div className="space-y-1 text-xs">
                {[
                  { label: "UID", value: user.id },
                  { label: "Status", value: user.status || "Offline" },
                  {
                    label: "Registration Date",
                    value: timeSinceLastActivity(user.created_at),
                  },
                  { label: "Last Visit", value: user.last_visit || "-" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-400">{item.label}:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Blank space for future usergroup banners */}
            <div className="h-32"></div>
          </div>

          {/* Center Column */}
          <div className="md:col-span-3 space-y-3">
            {/* Stats + Success */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="rounded-lg border border-gray-700 bg-gray-800/70 backdrop-blur-sm p-3"
            >
              <h2 className="text-base font-semibold mb-2 text-blue-400">
                Stats & Success
              </h2>
              <div className="flex justify-between px-10">
                {[
                  { label: "Posts", value: user.posts_count },
                  { label: "Likes on Snippets", value: likesOnSnippets },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-bold text-xm">{stat.value}</p>
                    <p className="text-gray-400 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
              {isOwner && (
                <div className="mt-4 text-center text-sm text-gray-300">
                  <span className="text-gray-400 mr-2">Profitability (all-time incoming)</span>
                  <span className="font-semibold">${(earningsCents / 100).toFixed(2)}</span>
                </div>
              )}
            </motion.section>

            {/* Signature (Ad Banner) */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="rounded-lg border border-gray-700 bg-gray-800/70 backdrop-blur-sm p-3 mt-auto"
            >
              <h2 className="text-base font-semibold mb-2 text-blue-400">
                Signature
              </h2>
              <div className="bg-gray-700 rounded-lg p-2 text-xs whitespace-pre-wrap">
                {renderContentWithEmojisAndBBCode(user.signature) ||
                  "No signature set"}
              </div>
            </motion.section>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-3">
            {/* Awards */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="rounded-lg border border-gray-700 bg-gray-800/70 backdrop-blur-sm p-3"
            >
              <h2 className="text-base font-semibold mb-2 text-blue-400">
                Awards
              </h2>
              <div className="bg-gray-900/60 rounded-lg p-3 min-h-[200px] max-h-[400px] overflow-y-auto">
                {awards.length === 0 ? (
                  <div className="text-gray-300 text-sm">No Awards Yet. Code!!</div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-1 items-start content-start justify-start w-full">
                    {awards.map((award, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 flex-shrink-0 cursor-help"
                        title={award.title}
                        aria-label={award.title}
                      >
                        <Image
                          src={`/badges/${award.name}`}
                          alt={award.title}
                          height={16}
                          width={16}
                          className="w-full h-full object-contain hover:scale-105 transition-transform"
                          title={award.title}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Recent Snippets */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="rounded-lg border border-gray-700 bg-gray-800/70 backdrop-blur-sm p-3"
            >
              <h2 className="text-base font-semibold mb-2 text-blue-400">Recent Snippets</h2>
              <div className="space-y-2">
                {recentThreads.map((thread: any) => (
                  <div
                    key={thread.id}
                    className="bg-gray-900/60 border border-gray-700 rounded-lg p-2 text-xs"
                  >
                    <Link href={`/snippet/${thread.id}`}>
                      <span
                        className="text-blue-400 hover:underline font-semibold truncate block"
                        title={thread.title}
                      >
                        {limitTitle(thread.title)}
                      </span>
                    </Link>
                    <p className="text-gray-400 mt-1">
                      Posted in {thread.category_name} on{" "}
                      {new Date(thread.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-1">
                      {thread.post_count} replies • Last post:{" "}
                      {timeSinceLastActivity(thread.last_post_at)}
                    </p>
                  </div>
                ))}
                {recentThreads.length === 0 && (
                  <p className="text-gray-400">No recent snippets found.</p>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </main>
  {/* Reputation components removed as requested */}
    </div>
  );
}
