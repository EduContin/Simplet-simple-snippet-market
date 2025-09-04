"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  LogOut,
  Wallet
} from "lucide-react";
import { ShoppingCart } from "lucide-react";

const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarTs, setAvatarTs] = useState<number>(0);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const userId = useMemo(() => session?.user && (session.user as any).id, [session]);

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (session?.user?.name) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/users/${encodeURIComponent(session.user.name)}`,
            { cache: 'no-store' }
          );
          if (response.ok) {
            const userData = await response.json();
            setAvatarUrl(userData.avatar_url);
            setAvatarTs(Date.now());
          }
        } catch (error) {
          console.error("Error fetching avatar URL:", error);
        }
      }
    };

    fetchAvatarUrl();
  }, [session]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/v1/wallet/balance?userId=${userId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setBalanceCents(Number(data.balance_cents || 0));
        }
      } catch (e) {
        // ignore
      }
    };
    fetchBalance();
    // poll lightly to keep it fresh after deposits/transfers
    const id = setInterval(fetchBalance, 15000);
    return () => clearInterval(id);
  }, [userId]);

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/my-snippets", label: "My Snippets", icon: BookOpen },
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
            {session?.user && (
              <Link href="/wallet" className="relative flex items-center gap-1 px-2 py-1 rounded-md border"
                style={{ borderColor: 'var(--border-default)', color: 'var(--fg-default)', backgroundColor: 'var(--canvas)' }}
              >
                <Wallet className="h-4 w-4" />
                {balanceCents !== null && (
                  <span className="text-xs font-medium opacity-90">
                    R$ {(balanceCents / 100).toFixed(2)}
                  </span>
                )}
              </Link>
            )}
            {session?.user && (
              <Link href="/cart" className="relative flex items-center gap-2 px-2 py-1 rounded-md border"
                style={{ borderColor: 'var(--border-default)', color: 'var(--fg-default)', backgroundColor: 'var(--canvas)' }}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="text-xs font-medium opacity-90">Cart</span>
              </Link>
            )}
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
                        src={(avatarUrl ? `${avatarUrl}?t=${avatarTs}` : "/prof-pic.png")}
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
                      href="/wallet"
                      className="flex items-center px-3 py-2 text-sm cursor-pointer transition-colors"
                      style={{ color: 'var(--fg-default)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--canvas-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator
                    style={{ backgroundColor: 'var(--border-default)' }}
                  />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/users/${encodeURIComponent(session.user.name || '')}`}
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
