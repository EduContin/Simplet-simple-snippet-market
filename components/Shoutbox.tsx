"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import Image from "next/image";
import customEmojis from "@/models/custom-emojis";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MessageCircle,
  Send,
  Smile,
  Edit,
  X,
  Check,
  Users,
  Maximize2,
  Minimize2
} from "lucide-react";

const MAX_MESSAGE_LENGTH = 300;

interface Message {
  id: number;
  username: string;
  message: string;
  avatar_url?: string;
}

interface User {
  avatar_url: string;
}

const Shoutbox = () => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newSocket = io(
      process.env.NEXT_PUBLIC_SHOUTBOX_SOCKET || "http://localhost:4000",
      { withCredentials: true },
    );
    setSocket(newSocket);

    newSocket.on("message", (message: Message) => {
      fetchUserAvatar(message.username).then((avatarUrl) => {
        setMessages((prevMessages) => [
          { ...message, avatar_url: avatarUrl },
          ...prevMessages,
        ]);
      });
    });

    newSocket.on("messageUpdated", (updatedMessage: Message) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === updatedMessage.id
            ? { ...updatedMessage, avatar_url: msg.avatar_url }
            : msg,
        ),
      );
    });

    newSocket.on("recentMessages", (recentMessages: Message[]) => {
      Promise.all(
        recentMessages.map(async (message) => {
          const avatarUrl = await fetchUserAvatar(message.username);
          return { ...message, avatar_url: avatarUrl };
        }),
      ).then(setMessages);
    });

    newSocket.on("message_error", (error: string) => {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(""), 5000);
    });

    fetch("/api/v1/shoutbox/history")
      .then((response) => response.json())
      .then((data) => {
        Promise.all(
          data.rows.map(async (message: Message) => {
            const avatarUrl = await fetchUserAvatar(message.username);
            return { ...message, avatar_url: avatarUrl };
          }),
        ).then(setMessages);
      })
      .catch((error) =>
        console.error("Error fetching shoutbox history:", error),
      );

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchUserAvatar = async (username: string): Promise<string> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/users/${username}`,
      );
      const userData: User = await response.json();
      return userData.avatar_url;
    } catch (error) {
      console.error("Error fetching user avatar:", error);
      return "/default-avatar.png";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const renderMessageWithEmojis = (message: string) => {
    const parts = message.split(/(:[a-zA-Z0-9_+-]+:)/g);
    return parts.map((part, index) => {
      const emojiUrl = customEmojis[part as keyof typeof customEmojis];
      if (emojiUrl) {
        return (
          <Image
            key={index}
            src={emojiUrl}
            alt={part}
            className="inline-block h-5 w-5 mx-0.5"
            width={20}
            height={20}
          />
        );
      }
      return part;
    });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "" && session) {
      if (inputMessage.length <= MAX_MESSAGE_LENGTH) {
        const newMessage = {
          id: Date.now(),
          username: session.user.name,
          message: inputMessage,
        };
        if (socket) {
          socket.emit("message", newMessage);
        }
        setInputMessage("");

        try {
          await fetch("/api/v1/shoutbox/history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: session.user.name,
              message: inputMessage,
            }),
          });
        } catch (error) {
          console.error("Error sending message:", error);
          setErrorMessage("Failed to send message. Please try again.");
        }
      } else {
        setErrorMessage("Message exceeds the maximum length");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editingMessageId) {
        handleUpdateMessage();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleEditMessage = (messageId: number) => {
    const messageToEdit = messages.find((msg) => msg.id === messageId);
    if (messageToEdit) {
      setEditingMessageId(messageId);
      setInputMessage(messageToEdit.message);
      inputRef.current?.focus();
    }
  };

  const handleUpdateMessage = () => {
    if (inputMessage.trim() !== "" && session && editingMessageId) {
      if (inputMessage.length <= MAX_MESSAGE_LENGTH) {
        const updatedMessage = {
          id: editingMessageId,
          username: session.user.name,
          message: inputMessage,
        };
        if (socket) {
          socket.emit("updateMessage", updatedMessage);
        }
        setInputMessage("");
        setEditingMessageId(null);
      } else {
        setErrorMessage("Message exceeds the maximum length");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setInputMessage("");
  };

  const handleEmojiClick = (emoji: string) => {
    setInputMessage((prevMessage) => prevMessage + emoji);
    setIsEmojiPickerOpen(false);
  };

  const onlineUsers = Array.from(new Set(messages.slice(0, 10).map(msg => msg.username)));

  return (
    <div
      className="border rounded-md"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--canvas)'
      }}
    >
      {/* Header - GitHub Comment Thread Style */}
      <div
        className="border-b px-4 py-3"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--canvas-subtle)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-4 w-4" style={{ color: 'var(--fg-muted)' }} />
            <div>
              <h3 className="text-sm font-semibold leading-5" style={{ color: 'var(--fg-default)' }}>
                Live Shoutbox
              </h3>
              <p className="text-xs leading-4" style={{ color: 'var(--fg-muted)' }}>
                Real-time conversations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" style={{ color: 'var(--fg-muted)' }} />
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  color: 'var(--fg-muted)',
                  backgroundColor: 'var(--canvas)',
                  border: '1px solid var(--border-default)'
                }}
              >
                {onlineUsers.length}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 p-0 rounded transition-colors"
              style={{
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--canvas)',
                color: 'var(--fg-muted)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--canvas)';
              }}
            >
              {isExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Messages Area - GitHub Comment Thread Style */}
      <div className="p-0">
        <ScrollArea className={`px-3 ${isExpanded ? 'h-96' : 'h-48'}`}>
          <div className="space-y-0 py-3">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className="group relative">
                  <div
                    className="flex items-start gap-2 py-2 border-b last:border-b-0 transition-colors"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage
                        src={msg.avatar_url || "/prof-pic.png"}
                        alt={msg.username}
                      />
                      <AvatarFallback
                        className="text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--canvas-subtle)',
                          color: 'var(--fg-muted)',
                          fontSize: '10px'
                        }}
                      >
                        {msg.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-medium text-xs" style={{ color: 'var(--fg-default)' }}>
                          {msg.username}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                          now
                        </span>
                      </div>
                      <div className="text-xs leading-4 break-words" style={{ color: 'var(--fg-default)' }}>
                        {renderMessageWithEmojis(msg.message)}
                      </div>
                    </div>
                    
                    {session && session.user.name === msg.username && (
                      <button
                        onClick={() => handleEditMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 rounded transition-all"
                        style={{ color: 'var(--fg-muted)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mb-3">
                  <MessageCircle className="h-8 w-8 mx-auto opacity-40" style={{ color: 'var(--fg-muted)' }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>No messages yet.</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--fg-subtle)' }}>Be the first to start a conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area - GitHub Comment Input Style */}
        <div
          className="border-t p-3"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--canvas)'
          }}
        >
          {editingMessageId && (
            <div
              className="mb-2 flex items-center gap-2 text-xs rounded p-2 border"
              style={{
                color: '#9a6700',
                backgroundColor: '#fff8c5',
                borderColor: '#d1cc00'
              }}
            >
              <Edit className="h-3 w-3" />
              <span>Editing message</span>
              <button
                onClick={handleCancelEdit}
                className="ml-auto h-5 px-1.5 text-xs rounded transition-colors"
                style={{ color: '#9a6700' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X className="h-2.5 w-2.5 mr-1 inline" />
                Cancel
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="w-full pr-10 px-3 py-1.5 text-sm rounded border transition-colors"
                style={{
                  backgroundColor: 'var(--canvas)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--fg-default)'
                }}
                placeholder={
                  editingMessageId ? "Edit your message..." : "Type your message..."
                }
                maxLength={MAX_MESSAGE_LENGTH}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.outline = '2px solid var(--focus-outlineColor)';
                  e.currentTarget.style.outlineOffset = '-2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.outline = 'none';
                }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--fg-muted)' }}>
                {inputMessage.length}/{MAX_MESSAGE_LENGTH}
              </div>
            </div>
            
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 p-0 rounded border transition-colors"
                  style={{
                    borderColor: 'var(--border-default)',
                    backgroundColor: 'var(--canvas)',
                    color: 'var(--fg-muted)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--canvas)';
                  }}
                >
                  <Smile className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-3 border"
                align="end"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--canvas)',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(1, 4, 9, 0.15)'
                }}
              >
                <div className="grid grid-cols-8 gap-1">
                  {Object.entries(customEmojis).map(([emoji, url]) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="h-7 w-7 p-0 rounded transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Image
                        src={url}
                        alt={emoji}
                        className="w-4 h-4"
                        width={16}
                        height={16}
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <button
              onClick={editingMessageId ? handleUpdateMessage : handleSendMessage}
              disabled={!inputMessage.trim() || inputMessage.length > MAX_MESSAGE_LENGTH}
              className="h-8 px-3 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                border: '1px solid var(--btn-primary-border)',
                color: 'var(--fg-on-emphasis)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)';
                }
              }}
            >
              <div className="flex items-center gap-1.5">
                {editingMessageId ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>
                  {editingMessageId ? "Update" : "Send"}
                </span>
              </div>
            </button>
          </div>
          
          {errorMessage && (
            <div
              className="mt-2 p-2 text-xs rounded border"
              style={{
                color: 'var(--destructive)',
                backgroundColor: 'rgba(248, 81, 73, 0.1)',
                borderColor: 'rgba(248, 81, 73, 0.4)'
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shoutbox;
