import { notFound } from "next/navigation";
import MountainBackground from "@/components/MountainBackground";
import { getServerSession } from "next-auth/next";
import { headers } from "next/headers";
import UserProfile from "@/components/UserProfile";
import BanUserButtonWrapper from "@/components/BanUserButtonWrapper";

function getBaseUrlFromHeaders() {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function fetchUserProfile(username: string) {
  try {
    const h = headers();
    const cookie = h.get('cookie') || '';
    const baseUrl = getBaseUrlFromHeaders();
    const res = await fetch(
      `${baseUrl}/api/v1/users/${encodeURIComponent(username)}`,
      { headers: { cookie }, cache: 'no-store' }
    );
    if (!res.ok) return res.status === 404 ? null : null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return res.json();
  } catch (_) {
    return null;
  }
}

// reputation data no longer needed on profile page

export default async function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const user = await fetchUserProfile(params.username.toLowerCase());
  const session = await getServerSession();
  const currentUser = session?.user?.name || null;
  let currentUserGroup: string | null = null;
  if (currentUser) {
    const h = headers();
    const cookie = h.get('cookie') || '';
    try {
      const baseUrl = getBaseUrlFromHeaders();
      const currentUserRes = await fetch(
        `${baseUrl}/api/v1/users/${encodeURIComponent(currentUser)}`,
        { headers: { cookie }, cache: 'no-store' }
      );
      if (currentUserRes.ok) {
        const ct = currentUserRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const currentUserData = await currentUserRes.json();
          currentUserGroup = currentUserData.user_group || null;
        }
      }
    } catch (_) {
      // ignore; non-fatal
    }
  }

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen text-white">
      <MountainBackground isLoading={false} isSuccess={false} />
      {currentUserGroup === "Admin" && (
        <BanUserButtonWrapper username={user.username} />
      )}
      <UserProfile
        user={user}
        currentUser={currentUser || undefined}
      />
    </div>
  );
}
