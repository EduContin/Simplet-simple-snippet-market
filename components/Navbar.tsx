"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  BookOpen,
  HelpCircle,
  User,
  Settings,
  LogOut
} from "lucide-react";

const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (session?.user?.name) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/users/${session.user.name}`,
          );
          const userData = await response.json();
          setAvatarUrl(userData.avatar_url);
        } catch (error) {
          console.error("Error fetching avatar URL:", error);
        }
      }
    };

    fetchAvatarUrl();
  }, [session]);

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/notebook", label: "Library", icon: BookOpen },
    { href: "/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--canvas)',
        backdropFilter: 'saturate(180%) blur(5px)'
      }}
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-8 hidden md:flex">
          <Link className="mr-8 flex items-center" href="/">
            <span
              className="text-base font-semibold"
              style={{ color: 'var(--fg-default)' }}
            >
              SIMPLET
            </span>
          </Link>
          <nav className="flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors py-2 px-2 rounded-md"
                style={{
                  color: 'var(--fg-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--fg-default)';
                  e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--fg-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center space-x-3">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0 border"
                    style={{
                      borderColor: 'var(--border-default)',
                      backgroundColor: 'var(--canvas)'
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={avatarUrl || "/prof-pic.png"}
                        alt={session.user.name || "User"}
                      />
                      <AvatarFallback
                        className="text-xs"
                        style={{
                          backgroundColor: 'var(--canvas-subtle)',
                          color: 'var(--fg-muted)'
                        }}
                      >
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 mt-2 border"
                  align="end"
                  forceMount
                  style={{
                    backgroundColor: 'var(--canvas)',
                    borderColor: 'var(--border-default)',
                    borderRadius: '6px',
                    boxShadow: '0 8px 24px rgba(1, 4, 9, 0.15)'
                  }}
                >
                  <DropdownMenuLabel className="font-normal px-3 py-2">
                    <div className="flex flex-col space-y-1">
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--fg-default)' }}
                      >
                        {session.user.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--fg-muted)' }}
                      >
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator
                    style={{ backgroundColor: 'var(--border-default)' }}
                  />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/users/${session.user.name}`}
                      className="flex items-center px-3 py-2 text-sm cursor-pointer transition-colors"
                      style={{ color: 'var(--fg-default)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center px-3 py-2 text-sm cursor-pointer transition-colors"
                      style={{ color: 'var(--fg-default)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator
                    style={{ backgroundColor: 'var(--border-default)' }}
                  />
                  <DropdownMenuItem
                    className="flex items-center px-3 py-2 text-sm cursor-pointer transition-colors"
                    onClick={() => signOut()}
                    style={{ color: 'var(--fg-default)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium transition-colors py-1.5 px-3 rounded-md"
                  style={{ color: 'var(--fg-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--fg-default)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--fg-muted)';
                  }}
                >
                  Sign in
                </Link>
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="text-sm"
                >
                  <Link href="/register">
                    Sign up
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
