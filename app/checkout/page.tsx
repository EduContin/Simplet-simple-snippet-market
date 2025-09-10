import { headers, cookies } from 'next/headers';
import React from 'react';
import CheckoutClient from './CheckoutClient';

async function getCart() {
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookieHeader = cookies().toString();
  const res = await fetch(`${base}/api/v1/cart`, { cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : undefined });
  if (!res.ok) return { items: [], total_cents: 0 };
  return res.json();
}

async function getWallet(meId: number | null) {
  if (!meId) return { balance_cents: 0, currency: 'USD' };
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/v1/wallet/balance?userId=${meId}`, { cache: 'no-store' });
  if (!res.ok) return { balance_cents: 0, currency: 'USD' };
  return res.json();
}

async function getSession() {
  const h = headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const cookieHeader = cookies().toString();
  const res = await fetch(`${base}/api/auth/session`, { cache: 'no-store', headers: cookieHeader ? { cookie: cookieHeader } : undefined });
  if (!res.ok) return null;
  return res.json();
}

export default async function CheckoutPage() {
  const session = await getSession();
  const meId = session?.user?.id ? Number(session.user.id) : null;
  const cart = await getCart();
  const wallet = await getWallet(meId);
  const total = Number(cart.total_cents || 0);
  const balance = Number(wallet.balance_cents || 0);
  const canAfford = balance >= total;

  return <CheckoutClient initialCart={cart} initialWallet={wallet} />;
}
