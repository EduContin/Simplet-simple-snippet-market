"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import customEmojis from "@/models/custom-emojis";
import SessionProviderClient from "./SessionProviderClient";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import { FaTrashAlt } from "react-icons/fa";
import { Prism, mapCategoryToLanguage } from "@/lib/prism";
import SnippetFilesViewer from "@/components/SnippetFilesViewer";
import AddToCartClient from "@/components/AddToCartClient";
import { ThreadPropThread, UserThread } from "@/app/interfaces/interfaces";
type SnippetFile = { id: number; filename: string; language: string | null; is_entry: boolean; size: number };

const Thread: React.FC<ThreadPropThread> = ({ thread, posts: initialPosts }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [, setUserSignature] = useState("");
  const [users, setUsers] = useState<{ [key: string]: UserThread }>({});
  const [content, setContent] = useState("");
  const [, setContentHistory] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedFontSize, setSelectedFontSize] = useState("medium");
  const [selectionRange, setSelectionRange] = useState<[number, number] | null>(
    null,
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(Boolean((thread as any).is_verified));
  const [files, setFiles] = useState<SnippetFile[]>([]);
  // Determine ownership (prefer session data for immediacy)
  const meId = Number((session?.user as any)?.id || 0);
  const meName = (session?.user as any)?.name as string | undefined;
  const ownerId = Number((thread as any).user_id || 0);
  const isOwner = (meName && meName === thread.username) || (meId > 0 && ownerId > 0 && meId === ownerId);


  const MAX_CHARACTERS = 5000; // Set the maximum character limit
  const CHARACTERS_PER_LINE = 1000; // Set the number of characters per line

  useEffect(() => {
    if (!thread || !thread.title) {
      router.push("/");
    }
  }, [thread, router]);

  const toggleVerification = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/v1/threads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread.id, verify: !isVerified }),
      });
      if (!res.ok) throw new Error("verify failed");
      const data = await res.json();
      setIsVerified(Boolean(data.is_verified));
    } catch (e) {
      console.error(e);
      alert("Failed to toggle verification");
    }
  };

  const handleDeletePost = async (postId: number, postUsername: string) => {
    // Owner-only delete
    if (!(currentUsername && currentUsername === postUsername)) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?",
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/v1/posts?postId=${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const deleted = await response.json();
        setPosts((prev) => prev.filter((p) => p.id !== deleted.id));
      } else {
        console.error("Failed to delete post");
        alert("Failed to delete post. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("An error occurred while deleting the post. Please try again.");
    }
  };

  useEffect(() => {
    // Load snippet files (if any)
    (async () => {
      try {
        const res = await fetch(`/api/v1/threads/${thread.id}/files`, { cache: 'no-store' });
        if (!res.ok) return;
        const list: SnippetFile[] = await res.json();
  setFiles(list);
      } catch {}
    })();
  }, [thread.id]);
  useEffect(() => {
    if (session?.user?.name) {
      fetch(`/api/v1/users/${session.user.name}`)
        .then((response) => response.json())
        .then((user) => {
          setIsAdmin(user.user_group === "Admin");
          setCurrentUsername(user.username);
        })
        .catch((error) => console.error("Error fetching user data:", error));
    }
  }, [session, setIsAdmin, setCurrentUsername]);

  const handleDeleteThread = async () => {
  // Owner-only delete for thread
  if (!(currentUsername && currentUsername === thread.username)) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to remove this snippet?",
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/v1/threads/${thread.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Snippet removed successfully");
        router.push("/"); // Redirect to home page or thread list
      } else {
        console.error("Failed to remove snippet");
        alert("Failed to remove snippet. Please try again.");
      }
    } catch (error) {
      console.error("Error removing snippet:", error);
      alert("An error occurred while removing the snippet. Please try again.");
    }
  };

  const updateContent = useCallback(
    (newContent: string) => {
      if (newContent.length <= MAX_CHARACTERS) {
        // Apply auto line break
        const lines = newContent.split("\n");
        const formattedLines = lines.map((line) => {
          if (line.length > CHARACTERS_PER_LINE) {
            const chunks = [];
            for (let i = 0; i < line.length; i += CHARACTERS_PER_LINE) {
              chunks.push(line.slice(i, i + CHARACTERS_PER_LINE));
            }
            return chunks.join("\n");
          }
          return line;
        });
        const formattedContent = formattedLines.join("\n");

        setContent(formattedContent);
        setContentHistory((prev) => [
          ...prev.slice(0, historyIndex + 1),
          formattedContent,
        ]);
        setHistoryIndex((prev) => prev + 1);
      }
    },
    [historyIndex],
  );

  const insertTextStyle = useCallback(
    (openTag: string, closeTag: string) => {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const newContent =
          content.substring(0, start) +
          openTag +
          selectedText +
          closeTag +
          content.substring(end);
        updateContent(newContent);
        textarea.focus();
        textarea.setSelectionRange(
          start + openTag.length,
          end + openTag.length,
        );
      }
    },
    [content, updateContent],
  );

  const insertColorTag = useCallback(
    (color: string) => {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = selectionRange
          ? selectionRange[0]
          : textarea.selectionStart;
        const end = selectionRange ? selectionRange[1] : textarea.selectionEnd;
        let selectedText = content.substring(start, end);

        // Remove existing color tags if any
        selectedText = selectedText.replace(
          /\[color=[^\]]+\]|\[\/color\]/g,
          "",
        );

        // Add new color tag
        const newContent =
          content.substring(0, start) +
          `[color=${color}]${selectedText}[/color]` +
          content.substring(end);

        updateContent(newContent);
        textarea.focus();
        const newStart = start;
        const newEnd = start + `[color=${color}]${selectedText}[/color]`.length;
        textarea.setSelectionRange(newStart, newEnd);
        setSelectionRange([newStart, newEnd]);
      }
    },
    [content, updateContent, selectionRange],
  );

  const handleColorChange = debounce((color: string) => {
    setSelectedColor(color);
    insertColorTag(color);
  }, 200);

  const insertImage = useCallback(() => {
    const url = prompt("Enter image URL:");
    if (url) {
      insertTextStyle(`[img]${url}[/img]`, "");
    }
  }, [insertTextStyle]);

  const insertLink = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const url = prompt("Enter URL:");
      const text = selectedText || prompt("Enter link text:");
      if (url && text) {
        const newContent =
          content.substring(0, start) +
          `[url=${url}]${text}[/url]` +
          content.substring(end);
        updateContent(newContent);
      }
    }
  }, [content, updateContent]);

  const formatContent = (content: string) => {
    return content
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
  };

  useEffect(() => {
    const fetchLikes = async () => {
      if (session?.user?.id) {
        const postIds = initialPosts.map((post) => post.id).join(",");
        try {
      const response = await fetch(`/api/v1/likes?postIds=${postIds}`);
          if (response.ok) {
            const likedPosts = await response.json();
            setPosts((prevPosts) =>
              prevPosts.map((post) => ({
        ...post,
        is_liked_by_user: !!likedPosts?.[post.id]?.liked,
              })),
            );
          }
        } catch (error) {
          console.error("Error fetching likes:", error);
        }
      }
    };

    const fetchUsers = async () => {
      const usernames = Array.from(new Set(posts.map((post) => post.username)));
      for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        try {
          const response = await fetch(`/api/v1/users/${username}`);
          if (response.ok) {
            const user = await response.json();
            setUsers((prevUsers) => ({ ...prevUsers, [username]: user }));
          }
        } catch (error) {
          console.error(`Error fetching user ${username}:`, error);
        }
      }
    };

    fetchLikes();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchSignature = async () => {
      if (session?.user?.name) {
        try {
          const response = await fetch(`/api/v1/users/${session.user.name}`);
          if (response.ok) {
            const user = await response.json();
            setUserSignature(user.signature);
          }
        } catch (error) {
          console.error("Error fetching signature:", error);
        }
      }
    };

    fetchSignature();
  });

  const renderUserProfile = (username: string) => {
    const user = users[username];
    if (!user) return null;

    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden max-w-xs mx-auto">
        {/* Cover image and profile picture */}
        <div className="relative">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-purple-700 flex items-end justify-center pb-2">
            <h3 className="text-xl font-bold text-white mb-12">
              <a
                href={`/users/${user.username}`}
                className={`font-semibold ${user.banned ? "line-through text-gray-400" : ""}`}
              >
                {user.username}
              </a>
            </h3>
          </div>
          <Image
            src={user.avatar_url || `/prof-pic.png`}
            alt="Profile Picture"
            width={10}
            height={10}
            className="absolute left-1/2 transform -translate-x-1/2 -bottom-12 w-24 h-24 rounded-full border-4 border-gray-800 object-cover"
          />
        </div>

        <div className="pt-16 px-4 pb-6">
          {/* Reputation and Likes */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <p
                className={`text-2xl font-bold ${
                  user.reputation >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {user.reputation}
              </p>
              <p className="text-xs text-gray-400">Reputation</p>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-green-500">
                {user.likes_received}
              </p>
              <p className="text-xs text-gray-400">Likes</p>
            </div>
          </div>

          {/* User group */}
          <p
            className={`text-gray-300 font-bold text-sm mb-4 text-center ${user.banned ? "text-red-500" : ""}`}
          >
            {user.banned ? "Banned" : user.user_group}
          </p>

          {/* User details */}
          <div className="text-xs text-gray-300 space-y-2">
            <p>
              <span className="font-semibold">POSTS:</span> {user.posts_count}
            </p>
            <p>
              <span className="font-semibold">THREADS:</span>{" "}
              {user.threads_count}
            </p>
            <p>
              <span className="font-semibold">JOINED:</span>{" "}
              {new Date(user.created_at).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">VOUCHES:</span> {user.vouches}
            </p>
            <p>
              <span className="font-semibold">CREDITS:</span>{" "}
              {user.credits || 0}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderContentWithEmojisAndBBCode = (content: string) => {
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
        /\[spoiler\](.*?)\[\/spoiler\]/g,
        "<span class='spoiler-content'>$1</span>",
      )
      .replace(/\[hidden\](.*?)\[\/hidden\]/g, (match, content) => {
        const firstPost = posts[0];
        return firstPost.is_liked_by_user
          ? "<span style='color:#ff0000'>" + content + "</span>"
          : "<span class='hidden-content'>Like this post to see the content</span>";
      })
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

  const handleEmojiClick = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      setShowEmojiPicker(false);

      // Set the cursor position after the inserted emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const handleFontSizeChange = (size: string) => {
    setSelectedFontSize(size);
    insertTextStyle(`[size=${size}]`, "[/size]");
  };

  const handleLike = async (postId: number) => {
    if (!session || !session.user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch(`/api/v1/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Prefer postId for replies; server infers user from session
          postId,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        // Support both shapes: { likes_count, is_liked_by_user } or { count, liked }
        const patch = (p: typeof updated) => (
          'likes_count' in p || 'is_liked_by_user' in p
            ? { likes_count: p.likes_count, is_liked_by_user: !!p.is_liked_by_user }
            : { likes_count: Number(p.count ?? 0), is_liked_by_user: !!p.liked }
        );
        setPosts(posts.map((post) => post.id === postId ? { ...post, ...patch(updated) } : post));
      } else {
        console.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !session.user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const response = await fetch(`/api/v1/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content,
          threadId: thread.id,
          userId: session.user.id,
        }),
      });

      if (response.ok) {
        // Refresh the page or update the posts list
        window.location.reload();
      } else {
        console.error("Failed to submit reply");
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
    }
  };

  // Toggle like on the thread's first post so it contributes to "Liked snippets"
  const handleToggleThreadLike = async () => {
    try {
      const res = await fetch(`/api/v1/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: thread.id })
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) throw new Error('like failed');
      const data = await res.json();
      // Update first post like state
      setPosts(prev => prev.map((p, i) => i === 0 ? { ...p, likes_count: data.count, is_liked_by_user: data.liked } : p));
      // Notify others (e.g., My Snippets) to refresh
      try { window.dispatchEvent(new CustomEvent('likes:changed', { detail: { threadId: thread.id, liked: data.liked } })); } catch {}
    } catch (e) {
      // attempt to refresh first post like state
      try {
        const q = await fetch(`/api/v1/likes?threadId=${thread.id}`, { cache: 'no-store' });
        if (q.ok) {
          const d = await q.json();
          setPosts(prev => prev.map((p, i) => i === 0 ? { ...p, likes_count: d.count ?? 0, is_liked_by_user: !!d.liked } : p));
        }
      } catch {}
    }
  };

  // Pinned functionality removed from UI per request

  // Extract first [code]...[/code] block for IDE-like preview
  const extractFirstCodeBlock = (text: string): string | null => {
    const match = text.match(/\[code\]([\s\S]*?)\[\/code\]/i);
    if (match && match[1]) return match[1].trim();
    return null;
  };

  // Re-run Prism highlighting after posts or files render
  useEffect(() => {
    try { Prism.highlightAll(); } catch {}
  }, [posts, files]);

  return (
    <SessionProviderClient session={session}>
      {thread && thread.title ? (
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 mb-2">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{thread.title}</h2>
              {isVerified && (
                <span className="inline-flex items-center text-xs text-green-400 border border-green-500/50 rounded px-2 py-0.5">Verified</span>
              )}
            </div>
      <div className="flex flex-row align-right space-x-3 sm:space-x-4">
            {/* Add to Cart available for non-owners regardless of verification */}
            {!isOwner && (
              <AddToCartClient threadId={Number(thread.id)} />
            )}
            {currentUsername === thread.username && (
              <button
                onClick={handleDeleteThread}
                className="px-4 py-2 bg-red-600 text-white rounded-md
                hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400
                transition-all duration-800 ease-in-out
                active:scale-105 transform"
              >
        Remove Snippet
              </button>
            )}
            {isAdmin && (
              <button
                onClick={toggleVerification}
                className={`px-4 py-2 rounded-md transition-all duration-200 active:scale-105 transform border ${isVerified ? "bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600" : "bg-green-700 text-white border-green-600 hover:bg-green-800"}`}
                title={isVerified ? "Remove verification" : "Grant verification"}
              >
                {isVerified ? "Unverify" : "Verify"}
              </button>
            )}
            </div>

          </div>
          <p className="text-sm text-gray-400 mb-4">
            Posted by
            <a href={`/users/${thread.username}`}> {thread.username} </a>
            in {thread.category_name} on{" "}
            {new Date(thread.created_at).toLocaleString()}
          </p>
          <div className="space-y-4">
            {/* Multi-file viewer (if exists) */}
            {files.length > 0 && (
              <SnippetFilesViewer files={files} threadId={thread.id} />
            )}
            {posts.map((post, idx) => (
              <div key={post.id} className="">
                <div className="rounded-lg p-4 bg-gray-700/50 overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={users[post.username]?.avatar_url || "/prof-pic.png"}
                        alt={`${post.username} avatar`}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <a href={`/users/${post.username}`} className="text-sm font-medium hover:underline">{post.username}</a>
                      <span className="text-xs text-gray-400">• {new Date(post.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
            {currentUsername === post.username && !post.is_deleted && (
                      <button
              onClick={() => handleDeletePost(post.id, post.username)}
                        className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        Delete Post
                      </button>
                    )}
                    </div>
                  </div>
                  {(() => {
                      if (post.is_deleted) {
                        return (
                          <div className="whitespace-pre-wrap overflow-wrap-break-word word-break-break-word max-w-full">
                            <div className="flex items-center space-x-2 text-gray-500 italic">
                              <FaTrashAlt className="text-red-500" />
                              <span>This content was deleted by a moderator</span>
                            </div>
                          </div>
                        );
                      }
                      // For the first post, try to render as framed code snippet (IDE-like)
                      const primaryCode = idx === 0 ? extractFirstCodeBlock(post.content) : null;
                      if (idx === 0 && primaryCode) {
                        const lines = primaryCode.split('\n');
                        return (
                          <div className="snippet-ide-shadow rounded-md bg-gray-900/80 border border-gray-700 overflow-hidden">
                            <div className="px-3 py-2 bg-gray-800 flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-red-500" />
                              <span className="h-3 w-3 rounded-full bg-green-500" />
                              <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-400">{thread.category_name}</span>
                            </div>
                            <div className="bg-gray-900/80 grid grid-cols-[40px_1fr]">
                              <div className="select-none text-right pr-2 py-3 text-gray-500 text-xs bg-gray-900/80 border-r border-gray-800">
                                {lines.map((_, i) => (
                                  <div key={i} className="leading-5">{i + 1}</div>
                                ))}
                              </div>
                              <div className="p-3">
                                <pre className="font-mono text-[13px] leading-5 text-gray-200 whitespace-pre-wrap break-words">
                                  <code className={`language-${mapCategoryToLanguage(thread.category_name)}`}>
                                    {primaryCode}
                                  </code>
                                </pre>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      // Fallback to existing rendering
                      return (
                        <div className="whitespace-pre-wrap overflow-wrap-break-word word-break-break-word max-w-full">
                          {renderContentWithEmojisAndBBCode(post.content)}
                        </div>
                      );
                  })()}
                  {!post.is_deleted && (
                    <div className="mt-2 flex items-center">
                      <button
                        onClick={() => (idx === 0 ? handleToggleThreadLike() : handleLike(post.id))}
                        className={`flex items-center space-x-1 ${
                          post.is_liked_by_user
                            ? "text-blue-500"
                            : "text-gray-400"
                        } hover:text-blue-500 transition-colors`}
                        disabled={!session || !session.user}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span>{post.likes_count}</span>
                      </button>
                    </div>
                  )}
                </div>
                {!post.is_deleted && users[post.username]?.signature && (
                  <div className="mt-2 bg-gray-900/70 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="text-xs text-gray-400 mb-1">Signature</div>
                    <div className="text-sm overflow-wrap-break-word word-break-break-word max-w-full">
                      {renderContentWithEmojisAndBBCode(
                        users[post.username].signature,
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {session && session.user ? (
            <form onSubmit={handleReplySubmit} className="mt-4">
              <div className="rounded-md border border-gray-700 overflow-hidden snippet-ide-shadow">
                <div className="px-3 py-2 bg-gray-800 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-[11px] uppercase tracking-wider text-gray-400">Reply</span>
                </div>
                <div className="bg-gray-900/80 grid grid-cols-[40px_1fr]">
                  <div className="select-none text-right pr-2 py-3 text-gray-500 text-xs bg-gray-900/80 border-r border-gray-800">
                    {Array.from({ length: Math.max(1, content.split('\n').length) }).map((_, i) => (
                      <div key={i} className="leading-5">{i + 1}</div>
                    ))}
                  </div>
                  <div className="p-3">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => updateContent(e.target.value)}
                      onSelect={() => {
                        if (textareaRef.current) {
                          setSelectionRange([
                            textareaRef.current.selectionStart,
                            textareaRef.current.selectionEnd,
                          ]);
                        }
                      }}
                      className="w-full bg-transparent text-gray-100 font-mono text-sm leading-5 outline-none resize-y min-h-[180px]"
                      rows={10}
                      required
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {content.length}/{MAX_CHARACTERS} characters
              </div>
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Submit Reply
              </button>
            </form>
          ) : (
            <p className="mt-4 text-gray-400">
              Please log in to reply to this thread.
            </p>
          )}
        </div>
      ) : null}
    </SessionProviderClient>
  );
};

export default Thread;