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
    <nav className="sticky top-0 z-50 w-full border-b border-default bg-canvas">
      <div className="mx-auto flex h-12 max-w-screen-xl items-center px-4">
        <div className="mr-6 hidden md:flex">
          <Link className="mr-8 flex items-center" href="/">
            <span className="text-base font-semibold text-foreground">
              SIMPLET
            </span>
          </Link>
          <nav className="flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center space-x-4">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-7 w-7 rounded-full p-0 hover:bg-canvas-subtle border border-border hover:border-muted-foreground/30"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={avatarUrl || "/prof-pic.png"}
                        alt={session.user.name || "User"}
                      />
                      <AvatarFallback className="text-xs bg-canvas-subtle">
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 bg-canvas border-border mt-1"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal px-3 py-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/users/${session.user.name}`}
                      className="flex items-center px-3 py-2 text-sm hover:bg-canvas-subtle cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center px-3 py-2 text-sm hover:bg-canvas-subtle cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    className="flex items-center px-3 py-2 text-sm hover:bg-canvas-subtle cursor-pointer"
                    onClick={() => signOut()}
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
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary text-sm px-3 py-1.5"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
