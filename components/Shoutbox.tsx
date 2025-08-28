"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import Image from "next/image";
import customEmojis from "@/models/custom-emojis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card className="mb-8 border border-gray-300 rounded-lg">
      <CardHeader className="border-b border-gray-200 bg-gray-50 py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-gray-600" />
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Live Shoutbox</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Real-time conversations
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <Badge variant="outline" className="text-xs border-gray-300">
                {onlineUsers.length} active
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages Area */}
        <ScrollArea
          className={`px-4 ${isExpanded ? 'h-96' : 'h-48'}`}
        >
          <div className="space-y-0 py-4">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="group relative"
                >
                  <div className="flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={msg.avatar_url || "/prof-pic.png"}
                        alt={msg.username}
                      />
                      <AvatarFallback className="text-xs font-medium bg-gray-200 text-gray-700">
                        {msg.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {msg.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          now
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed break-words">
                        {renderMessageWithEmojis(msg.message)}
                      </div>
                    </div>
                    
                    {session && session.user.name === msg.username && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 hover:bg-gray-100"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto" />
                </div>
                <p className="text-gray-500">No messages yet.</p>
                <p className="text-gray-400 text-sm mt-1">Be the first to start a conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          {editingMessageId && (
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
              <Edit className="h-3 w-3" />
              <span>Editing message</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="ml-auto h-6 px-2 text-xs hover:bg-yellow-100"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="pr-12 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder={
                  editingMessageId ? "Edit your message..." : "Type your message..."
                }
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {inputMessage.length}/{MAX_MESSAGE_LENGTH}
              </div>
            </div>
            
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-gray-300 hover:bg-gray-100">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 border-gray-300" align="end">
                <div className="grid grid-cols-8 gap-1">
                  {Object.entries(customEmojis).map(([emoji, url]) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmojiClick(emoji)}
                      className="h-8 w-8 p-0 hover:bg-gray-100 rounded"
                    >
                      <Image
                        src={url}
                        alt={emoji}
                        className="w-5 h-5"
                        width={20}
                        height={20}
                        unoptimized
                      />
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              onClick={editingMessageId ? handleUpdateMessage : handleSendMessage}
              disabled={!inputMessage.trim() || inputMessage.length > MAX_MESSAGE_LENGTH}
              className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white border-0"
            >
              {editingMessageId ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {editingMessageId ? "Update" : "Send"}
            </Button>
          </div>
          
          {errorMessage && (
            <div className="mt-2 p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              {errorMessage}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Shoutbox;
