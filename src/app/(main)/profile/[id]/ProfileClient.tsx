"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ReportModal } from "@/components/ReportModal";
import { HashtagInput } from "@/components/HashtagInput";

interface ProfilePhoto { id: string; url: string; caption?: string }
interface Hashtag { id: string; name: string }
interface DailyProfile {
  id: string; date: string; note?: string; image?: string;
  hashtags: { hashtag: Hashtag }[];
}
interface ClosetItem {
  id: string; title: string; description?: string; price?: number;
  image?: string; sold: boolean;
  hashtags: { hashtag: Hashtag }[];
}
interface WorkItem {
  id: string; title: string; description?: string; category?: string;
  contactInfo?: string; image?: string;
  hashtags: { hashtag: Hashtag }[];
}
interface UserProfile {
  id: string; name?: string; image?: string; coverImage?: string;
  bio?: string; location?: string; occupation?: string;
  website?: string; phone?: string; username?: string;
  instagram?: string; tiktok?: string; twitter?: string;
  profileViews: number; openToContact: boolean; createdAt: string;
  isPremium?: boolean;
  profilePhotos: ProfilePhoto[];
  dailyProfiles: DailyProfile[];
  closetItems: ClosetItem[];
  workItems: WorkItem[];
  savedByCount?: number;
  streak?: number;
  totalDays?: number;
  interestTags: { hashtag: { name: string } }[];
}

interface ViewerEntry {
  id: string;
  createdAt: string;
  viewer: { id: string; name?: string; image?: string; username?: string; occupation?: string };
}

type Tab = "about" | "photos" | "closet" | "work";

export default function ProfileClient({ forcedId }: { forcedId?: string } = {}) {
  const params = useParams<{ id?: string }>();
  const id = forcedId || params.id || "";
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id;
  const isOwn = myId === id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("about");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", location: "", occupation: "", website: "", phone: "", username: "", instagram: "", tiktok: "", twitter: "" });
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [viewStats, setViewStats] = useState<{ date: string; count: number }[]>([]);
  const [viewers, setViewers] = useState<{ isPremium: boolean; count: number; viewers?: ViewerEntry[]; teaser?: { createdAt: string }[] } | null>(null);
  const [tagStats, setTagStats] = useState<{ tags: { name: string; usageCount: number; avgViews: number | null; totalViews: number | null }[]; isPremium: boolean; totalDays: number } | null>(null);
  const [interestTagsEdit, setInterestTagsEdit] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [heatmap, setHeatmap] = useState<{ date: string; count: number }[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/profile?userId=${id}`);
    if (res.status === 404) { setNotFound(true); return; }
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setForm({
        name: data.name || "",
        bio: data.bio || "",
        location: data.location || "",
        occupation: data.occupation || "",
        website: data.website || "",
        phone: data.phone || "",
        username: data.username || "",
        instagram: data.instagram || "",
        tiktok: data.tiktok || "",
        twitter: data.twitter || "",
      });
      setInterestTagsEdit((data.interestTags || []).map((it: { hashtag: { name: string } }) => it.hashtag.name));
    }
  }, [id]);

  async function checkBlock() {
    if (!myId || isOwn) return;
    const res = await fetch(`/api/block?blockedId=${id}`);
    if (res.ok) { const d = await res.json(); setBlocked(d.blocked); }
  }

  async function checkSaved() {
    if (!myId || isOwn) return;
    const res = await fetch("/api/saved");
    if (res.ok) {
      const list = await res.json();
      setSaved(list.some((s: { savedUserId: string }) => s.savedUserId === id));
    }
  }

  async function toggleSave() {
    if (saved) {
      await fetch(`/api/saved?savedUserId=${id}`, { method: "DELETE" });
      setSaved(false);
    } else {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedUserId: id }),
      });
      setSaved(true);
    }
  }

  async function toggleBlock() {
    if (blocked) {
      await fetch(`/api/block?blockedId=${id}`, { method: "DELETE" });
      setBlocked(false);
    } else {
      if (!confirm("Block this user? They will not be notified but you won't see each other in search results.")) return;
      await fetch("/api/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: id }),
      });
      setBlocked(true);
    }
    setShowSafetyMenu(false);
  }

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    checkBlock(); checkSaved();
    if (id) {
      fetch(`/api/follow?followedId=${id}`).then((r) => r.json()).then((d) => {
        setFollowing(d.following ?? false);
        setFollowerCount(d.followerCount ?? 0);
      }).catch(() => {});
    }
  }, [id, myId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (profile && !isOwn) {
      const t = new Date().toISOString().split("T")[0];
      const todayProfile = profile.dailyProfiles.find((d) => d.date === t);
      if (todayProfile) {
        fetch(`/api/reactions?dailyProfileId=${todayProfile.id}`).then((r) => r.json()).then((d) => {
          setLiked(d.liked ?? false);
          setLikeCount(d.count ?? 0);
        }).catch(() => {});
      }
    }
  }, [profile, isOwn]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOwn && id) {
      fetch(`/api/profile/${id}/view`, { method: "POST" }).catch(() => {});
    }
  }, [id, isOwn]);
  useEffect(() => {
    if (isOwn) {
      fetch("/api/profile/stats").then((r) => r.json()).then((d) => {
        if (Array.isArray(d.stats)) setViewStats(d.stats);
        else if (Array.isArray(d)) setViewStats(d); // backwards compat
      }).catch(() => {});
      fetch("/api/premium/viewers").then((r) => r.json()).then((d) => {
        if (d && typeof d.count === "number") setViewers(d);
      }).catch(() => {});
      fetch("/api/profile/tag-stats").then((r) => r.json()).then((d) => {
        if (d && Array.isArray(d.tags)) setTagStats(d);
      }).catch(() => {});
    }
  }, [isOwn]);
  useEffect(() => {
    if (id) {
      fetch(`/api/profile/heatmap?userId=${id}`).then((r) => r.json()).then((d) => {
        if (Array.isArray(d.days)) setHeatmap(d.days);
      }).catch(() => {});
    }
  }, [id]);

  async function checkUsername(val: string) {
    const u = val.trim().toLowerCase();
    if (!u) { setUsernameStatus("idle"); setUsernameMsg(""); return; }
    setUsernameStatus("checking");
    const res = await fetch(`/api/username?username=${encodeURIComponent(u)}`);
    const data = await res.json();
    if (data.available) { setUsernameStatus("available"); setUsernameMsg(""); }
    else { setUsernameStatus(data.reason === "Already taken" ? "taken" : "invalid"); setUsernameMsg(data.reason || ""); }
  }

  async function toggleFollow() {
    if (!myId || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followedId: id }),
      });
      if (res.ok) {
        const d = await res.json();
        setFollowing(d.following);
        setFollowerCount(d.followerCount ?? 0);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  async function toggleLike() {
    if (!myId || !profile) return;
    const todayProfile = profile.dailyProfiles.find((d) => d.date === today);
    if (!todayProfile) return;
    setLiked((prev) => !prev);
    setLikeCount((prev) => liked ? prev - 1 : prev + 1);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyProfileId: todayProfile.id }),
      });
      if (res.ok) {
        const d = await res.json();
        setLiked(d.liked);
        setLikeCount(d.count);
      }
    } catch {
      setLiked((prev) => !prev);
      setLikeCount((prev) => liked ? prev + 1 : prev - 1);
    }
  }

  async function saveInterests() {
    setSavingInterests(true);
    await fetch("/api/interests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: interestTagsEdit }),
    });
    setSavingInterests(false);
    load();
  }

  async function saveProfile() {
    if (usernameStatus === "taken" || usernameStatus === "invalid") return;
    setSaving(true);
    const payload = { ...form, username: form.username.trim().toLowerCase() || null };
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setEditing(false);
    setUsernameStatus("idle");
    load();
  }

  async function uploadAndSave(
    file: File,
    field: "image" | "coverImage",
    setUploading: (v: boolean) => void
  ) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const upRes = await fetch("/api/upload", { method: "POST", body: fd });
    const { url } = await upRes.json();
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: url }),
    });
    setUploading(false);
    load();
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("file", file);
    const upRes = await fetch("/api/upload", { method: "POST", body: fd });
    const { url } = await upRes.json();
    const res = await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const data = await res.json();
      if (data.upgradeRequired) {
        if (confirm(`${data.error}\n\nGo to the upgrade page now?`)) {
          window.location.href = "/upgrade";
        }
      } else {
        alert(data.error || "Failed to save photo.");
      }
    }
    setUploadingPhoto(false);
    load();
  }

  async function deletePhoto(photoId: string) {
    await fetch(`/api/photos?id=${photoId}`, { method: "DELETE" });
    load();
  }

  async function copyLink() {
    const base = window.location.origin;
    const url = profile?.username ? `${base}/u/${profile.username}` : `${base}/profile/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name || "Profile"} on SpotId`,
          text: profile?.bio?.slice(0, 100) || `Find ${profile?.name || "this person"} on SpotId`,
          url,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center space-y-4">
        <p className="text-6xl">👻</p>
        <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
        <p className="text-gray-500">This account may have been deleted or the link is incorrect.</p>
        <Link href="/search" className="inline-block mt-2 text-sm text-indigo-600 hover:underline font-semibold">
          ← Back to Search
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  const daily = profile.dailyProfiles[0];
  const today = new Date().toISOString().split("T")[0];
  const hasTodayProfile = daily?.date === today;
  const activeCloset = profile.closetItems.filter((i) => !i.sold);
  const soldCloset = profile.closetItems.filter((i) => i.sold);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "about", label: "About" },
    { key: "photos", label: "Photos", count: profile.profilePhotos.length },
    { key: "closet", label: "Closet", count: activeCloset.length },
    { key: "work", label: "Work", count: profile.workItems.length },
  ];

  const primaryContact = profile.workItems.find((w) => w.contactInfo)?.contactInfo;

  return (
    <div className="max-w-3xl mx-auto space-y-0">

      {/* QR Code modal */}
      {showQr && (() => {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const profileUrl = profile?.username ? `${base}/u/${profile.username}` : `${base}/profile/${id}`;
        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(profileUrl)}`;
        return (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQr(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-bold text-gray-900 text-lg">Share Profile</h2>
              <img src={qrSrc} alt="QR code" className="rounded-xl w-[220px] h-[220px]" />
              <p className="text-xs text-gray-500 text-center break-all">{profileUrl}</p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { navigator.clipboard.writeText(profileUrl).catch(() => {}); setShowQr(false); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
                  className="flex-1 text-sm bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition font-semibold"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowQr(false)}
                  className="flex-1 text-sm bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition"
            onClick={() => setLightboxUrl(null)}
          >
            ×
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[90vh] max-w-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Cover banner — taller, more dramatic */}
      <div
        className={`h-56 rounded-t-2xl overflow-hidden relative group ${!profile.coverImage ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" : ""}`}
      >
        {profile.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
        {isOwn && (
          <>
            <button
              onClick={() => coverRef.current?.click()}
              disabled={uploadingCover}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition text-white text-sm font-semibold opacity-0 group-hover:opacity-100"
            >
              {uploadingCover ? "Uploading…" : "📷 Change Cover Photo"}
            </button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAndSave(e.target.files[0], "coverImage", setUploadingCover)}
            />
          </>
        )}
      </div>

      {/* Profile header card */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-100 px-6 pb-6">
        <div className="flex items-end justify-between -mt-14 mb-4">

          {/* Avatar — larger, more Facebook-like */}
          <div className="relative group flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-white ring-4 ring-white overflow-hidden flex items-center justify-center text-4xl font-bold text-indigo-600 bg-indigo-100">
              {profile.image
                ? <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                : (profile.name?.[0] ?? "?").toUpperCase()
              }
            </div>
            {isOwn && (
              <>
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition text-white text-xs font-semibold opacity-0 group-hover:opacity-100"
                >
                  {uploadingAvatar ? "…" : "📷"}
                </button>
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAndSave(e.target.files[0], "image", setUploadingAvatar)}
                />
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end pt-16">
            {/* Copy link */}
            <button
              onClick={copyLink}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition font-medium text-gray-600"
              title="Copy profile link"
            >
              {linkCopied ? "✓ Copied!" : "🔗 Share"}
            </button>

            {/* QR Code */}
            <button
              onClick={() => setShowQr(true)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition font-medium text-gray-600"
              title="Show QR code"
            >
              ▦ QR
            </button>

            {/* Save profile (non-owner, logged in) */}
            {!isOwn && myId && (
              <button
                onClick={toggleSave}
                className={`text-sm px-3 py-1.5 rounded-full transition font-medium ${saved ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title={saved ? "Remove from saved" : "Save this profile"}
              >
                {saved ? "★ Saved" : "☆ Save"}
              </button>
            )}

            {/* Follow (non-owner, logged in) */}
            {!isOwn && myId && (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`text-sm px-3 py-1.5 rounded-full transition font-medium ${following ? "bg-indigo-100 text-indigo-700 hover:bg-red-50 hover:text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title={following ? "Unfollow" : "Follow — get notified when they tag"}
              >
                {followLoading ? "…" : following ? "✓ Following" : "+ Follow"}
              </button>
            )}

            {/* Contact (non-owner) */}
            {!isOwn && myId && profile.openToContact && (
              <a
                href={`/messages?to=${id}&name=${encodeURIComponent(profile.name || "")}`}
                className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-1.5 rounded-full transition font-semibold"
              >
                Message
              </a>
            )}
            {!isOwn && !profile.openToContact && (
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                Not accepting messages
              </span>
            )}

            {isOwn && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full transition font-medium"
              >
                Edit Profile
              </button>
            )}

            {!isOwn && myId && (
              <div className="relative">
                <button
                  onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                  className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100 transition"
                  title="Safety options"
                >
                  ···
                </button>
                {showSafetyMenu && (
                  <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 z-10 w-48 overflow-hidden">
                    <button
                      onClick={() => { setShowReport(true); setShowSafetyMenu(false); }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      🚩 Report this user
                    </button>
                    <button
                      onClick={toggleBlock}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 flex items-center gap-2"
                    >
                      {blocked ? "✅ Unblock user" : "🚫 Block this user"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {blocked && (
          <div className="mb-4 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 flex items-center justify-between">
            <span>🚫 You have blocked this user. They won&apos;t appear in your search results.</span>
            <button onClick={toggleBlock} className="text-indigo-600 text-xs hover:underline ml-3">Unblock</button>
          </div>
        )}
        {showReport && profile && (
          <ReportModal
            reportedId={profile.id}
            reportedName={profile.name}
            onClose={() => setShowReport(false)}
          />
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name || "Anonymous"}</h1>
            {profile.isPremium && (
              <span title="SpotId Premium member" className="text-blue-500 text-lg" aria-label="Verified premium">✅</span>
            )}
          </div>
          {profile.username && (
            <p className="text-sm text-gray-400 font-medium">
              @{profile.username}
              {isOwn && (
                <span className="ml-2 text-xs text-indigo-400 font-normal">
                  · spotid.app/u/{profile.username}
                </span>
              )}
            </p>
          )}
          {profile.occupation && <p className="text-indigo-600 font-medium">{profile.occupation}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.phone && <span>📞 {profile.phone}</span>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                🌐 Website
              </a>
            )}
            {primaryContact && !profile.phone && (
              <span className="text-indigo-500">📬 {primaryContact}</span>
            )}
          </div>
          {profile.bio && <p className="text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>}

          {/* Social handles */}
          {(profile.instagram || profile.tiktok || profile.twitter) && (
            <div className="flex flex-wrap gap-3 mt-2">
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-pink-600 hover:underline font-medium">
                  <span>📸</span> @{profile.instagram}
                </a>
              )}
              {profile.tiktok && (
                <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-900 hover:underline font-medium">
                  <span>🎵</span> @{profile.tiktok}
                </a>
              )}
              {profile.twitter && (
                <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-sky-500 hover:underline font-medium">
                  <span>𝕏</span> @{profile.twitter}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Stats row — prominent, with pulsing active indicator and follower count always shown */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-center items-end">
          {/* Followers — always prominent */}
          {isOwn ? (
            <Link href="/followers" className="hover:opacity-75 transition">
              <p className="text-xl font-bold text-gray-900">{followerCount}</p>
              <p className="text-xs text-gray-500">Followers</p>
            </Link>
          ) : (
            <div>
              <p className="text-xl font-bold text-gray-900">{followerCount}</p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
          )}

          <div>
            <p className="text-xl font-bold text-gray-900">{profile.profilePhotos.length}</p>
            <p className="text-xs text-gray-500">Photos</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{activeCloset.length}</p>
            <p className="text-xs text-gray-500">For Sale</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{profile.workItems.length}</p>
            <p className="text-xs text-gray-500">Services</p>
          </div>

          {/* Active Today — pulsing green dot when active */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-7">
              {hasTodayProfile ? (
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500" />
                </span>
              ) : (
                <span className="inline-flex rounded-full h-4 w-4 bg-gray-200" />
              )}
            </div>
            <p className={`text-xs mt-0.5 font-medium ${hasTodayProfile ? "text-green-600" : "text-gray-400"}`}>
              {hasTodayProfile ? "Active" : "Not active"}
            </p>
          </div>

          {(profile.streak ?? 0) > 1 && (
            <div>
              <p className="text-xl font-bold text-orange-500">🔥 {profile.streak}</p>
              <p className="text-xs text-gray-500">Day Streak</p>
            </div>
          )}
          {(profile.totalDays ?? 0) > 0 && (
            <div>
              <p className="text-xl font-bold text-indigo-500">{profile.totalDays}</p>
              <p className="text-xs text-gray-500">Days Tagged</p>
            </div>
          )}
          {isOwn && (
            <div>
              <p className="text-xl font-bold text-gray-900">{profile.profileViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
          )}
          {isOwn && (profile.savedByCount ?? 0) > 0 && (
            <div>
              <p className="text-xl font-bold text-yellow-500">{profile.savedByCount}</p>
              <p className="text-xs text-gray-500">Saved By</p>
            </div>
          )}
        </div>

        {/* Badges */}
        {(() => {
          const streak = profile.streak ?? 0;
          const totalDays = profile.totalDays ?? 0;
          const earned: { emoji: string; label: string; title: string }[] = [];

          if (totalDays >= 1)   earned.push({ emoji: "🏷️", label: "First Tag", title: "Posted their first daily profile" });
          if (totalDays >= 10)  earned.push({ emoji: "📅", label: "10 Days", title: "Tagged on 10 different days" });
          if (totalDays >= 50)  earned.push({ emoji: "🗓️", label: "50 Days", title: "Tagged on 50 different days" });
          if (totalDays >= 100) earned.push({ emoji: "💯", label: "100 Days", title: "Tagged on 100 different days" });
          if (totalDays >= 365) earned.push({ emoji: "🎖️", label: "365 Days", title: "Tagged every year — a full year of days" });
          if (streak >= 7)   earned.push({ emoji: "🔥", label: "Week Streak", title: "7-day tagging streak" });
          if (streak >= 30)  earned.push({ emoji: "🔥🔥", label: "Month Streak", title: "30-day tagging streak" });
          if (streak >= 100) earned.push({ emoji: "🏆", label: "100 Streak", title: "100-day tagging streak — legendary" });
          if (followerCount >= 10)  earned.push({ emoji: "👥", label: "10 Followers", title: "Reached 10 followers" });
          if (followerCount >= 50)  earned.push({ emoji: "⭐", label: "50 Followers", title: "Reached 50 followers" });
          if (followerCount >= 100) earned.push({ emoji: "🌟", label: "100 Followers", title: "Reached 100 followers" });
          if (followerCount >= 500) earned.push({ emoji: "💫", label: "500 Followers", title: "Reached 500 followers" });
          if (profile.closetItems.length > 0) earned.push({ emoji: "🛍️", label: "Seller", title: "Listed items in their closet" });
          if (profile.workItems.length > 0)   earned.push({ emoji: "💼", label: "Pro", title: "Listed services on SpotId" });
          if (profile.image)                  earned.push({ emoji: "📸", label: "Photo", title: "Has a profile photo" });
          if (profile.instagram || profile.tiktok || profile.twitter) earned.push({ emoji: "🔗", label: "Linked", title: "Connected social media" });

          if (earned.length === 0) return null;
          return (
            <div className="pt-3 border-t border-gray-100 mt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Badges</p>
              <div className="flex flex-wrap gap-2">
                {earned.map((b) => (
                  <span
                    key={b.label}
                    title={b.title}
                    className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition cursor-default"
                  >
                    <span>{b.emoji}</span>
                    <span className="font-medium">{b.label}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Profile Completeness — owner only, shown when score < 100 */}
        {isOwn && (profile as UserProfile & { completenessScore?: number; completenessItems?: { key: string; label: string; points: number }[] }).completenessScore !== undefined &&
         (profile as UserProfile & { completenessScore?: number }).completenessScore! < 100 && (
          <div className="pt-4 mt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile Strength</p>
              <span className="text-xs font-bold text-indigo-600">
                {(profile as UserProfile & { completenessScore?: number }).completenessScore}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(profile as UserProfile & { completenessScore?: number }).completenessScore}%`,
                  background: (profile as UserProfile & { completenessScore?: number }).completenessScore! >= 80
                    ? "#22c55e" : (profile as UserProfile & { completenessScore?: number }).completenessScore! >= 50
                    ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            {/* Next steps */}
            <div className="space-y-1">
              {((profile as UserProfile & { completenessItems?: { key: string; label: string; points: number }[] }).completenessItems ?? []).slice(0, 3).map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0 text-[9px] text-gray-400">○</span>
                  <span>{item.label}</span>
                  <span className="text-gray-400 ml-auto">+{item.points}%</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-2.5 text-xs text-indigo-600 font-semibold hover:underline"
            >
              Complete your profile →
            </button>
          </div>
        )}

        {/* Who Viewed Me — owner only */}
        {isOwn && viewers && viewers.count > 0 && (
          <div className="pt-4 mt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-medium">
                👁️ {viewers.count} view{viewers.count !== 1 ? "s" : ""} in the last 30 days
              </p>
              {!viewers.isPremium && (
                <Link href="/upgrade" className="text-xs text-indigo-600 font-semibold hover:underline">
                  See who →
                </Link>
              )}
            </div>

            {viewers.isPremium && viewers.viewers && viewers.viewers.length > 0 ? (
              <div className="space-y-2">
                {viewers.viewers.slice(0, 5).map((v) => (
                  <Link
                    key={v.id}
                    href={`/profile/${v.viewer.id}`}
                    className="flex items-center gap-2.5 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
                      {v.viewer.image
                        ? <img src={v.viewer.image} alt={v.viewer.name} className="w-full h-full object-cover" />
                        : (v.viewer.name?.[0] ?? "?").toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{v.viewer.name || "Anonymous"}</p>
                      {v.viewer.occupation && <p className="text-xs text-gray-400 truncate">{v.viewer.occupation}</p>}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </Link>
                ))}
                {viewers.viewers.length > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{viewers.viewers.length - 5} more this month</p>
                )}
              </div>
            ) : !viewers.isPremium ? (
              <Link
                href="/upgrade"
                className="block bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 text-center hover:border-indigo-300 transition"
              >
                <div className="flex justify-center gap-2 mb-2">
                  {(viewers.teaser || []).map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-indigo-200 blur-sm" />
                  ))}
                  {viewers.count > 2 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 blur-sm flex items-center justify-center" />
                  )}
                </div>
                <p className="text-sm font-bold text-indigo-700">Try Free for 7 Days</p>
                <p className="text-xs text-gray-500 mt-0.5">See exactly who viewed your profile — no charge for 7 days</p>
              </Link>
            ) : null}
          </div>
        )}

        {/* View sparkline — owner only */}
        {isOwn && viewStats.length > 1 && (() => {
          const max = Math.max(...viewStats.map((s) => s.count), 1);
          const isPrem = profile?.isPremium;
          return (
            <div className="pt-4 mt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium">Profile views — last {viewStats.length} days</p>
                {!isPrem && (
                  <Link href="/upgrade" className="text-xs text-indigo-500 hover:underline">90-day history with Premium →</Link>
                )}
              </div>
              <div className="flex items-end gap-1 h-10">
                {viewStats.map((s) => {
                  const pct = Math.max((s.count / max) * 100, 4);
                  const label = new Date(s.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <div key={s.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      <div
                        className="w-full bg-indigo-200 rounded-t hover:bg-indigo-400 transition"
                        style={{ height: `${pct}%` }}
                        title={`${label}: ${s.count} view${s.count !== 1 ? "s" : ""}`}
                      />
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        {label}: {s.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Hashtag analytics — owner only, premium-gated */}
        {isOwn && tagStats && tagStats.tags.length > 0 && (() => {
          const isPrem = tagStats.isPremium;
          const maxTotal = Math.max(...tagStats.tags.map((t) => t.totalViews ?? t.usageCount), 1);
          return (
            <div className="pt-4 mt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Hashtag Breakdown
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isPrem
                      ? `Your top tags by total views — last 90 days`
                      : `Most-used tags — upgrade to see view performance`}
                  </p>
                </div>
                {!isPrem && (
                  <Link href="/upgrade" className="text-xs text-indigo-600 font-semibold hover:underline whitespace-nowrap">
                    Unlock →
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                {tagStats.tags.slice(0, isPrem ? 10 : 5).map((t) => {
                  const barPct = isPrem
                    ? Math.max(((t.totalViews ?? 0) / maxTotal) * 100, 3)
                    : Math.max((t.usageCount / (tagStats.tags[0]?.usageCount || 1)) * 100, 3);
                  return (
                    <div key={t.name} className="flex items-center gap-3">
                      <Link
                        href={`/tag/${t.name}`}
                        className="text-xs text-indigo-600 font-medium w-28 flex-shrink-0 truncate hover:underline"
                      >
                        #{t.name}
                      </Link>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all ${isPrem ? "bg-indigo-400" : "bg-gray-300"}`}
                          style={{ width: `${barPct}%` }}
                        />
                        {!isPrem && (
                          <div className="absolute inset-0 flex items-center justify-end pr-2">
                            <span className="text-[9px] text-gray-400">🔒</span>
                          </div>
                        )}
                      </div>
                      {isPrem ? (
                        <div className="flex items-center gap-2 flex-shrink-0 w-28 text-right justify-end">
                          <span className="text-xs text-gray-700 font-semibold">{t.totalViews ?? 0} views</span>
                          {t.avgViews !== null && t.avgViews > 0 && (
                            <span className="text-xs text-gray-400">~{t.avgViews}/day</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">
                          {t.usageCount}×
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isPrem && (
                <Link
                  href="/upgrade"
                  className="mt-4 flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl px-4 py-3 hover:border-indigo-300 transition group"
                >
                  <span className="text-xl">📊</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-900">See which tags drive your views</p>
                    <p className="text-xs text-gray-500">7-day free trial — see views per hashtag and know what's working</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:underline whitespace-nowrap">Free Trial →</span>
                </Link>
              )}
            </div>
          );
        })()}

        {/* Tag activity heatmap — shown to everyone */}
        {heatmap.length > 0 && (() => {
          const todayDate = new Date();
          const startDay = new Date(todayDate);
          startDay.setDate(startDay.getDate() - 363);
          startDay.setDate(startDay.getDate() - startDay.getDay());

          const dayMap = new Map(heatmap.map((d) => [d.date, d.count]));
          const cells: { date: string; count: number }[] = [];
          const cur = new Date(startDay);
          while (cur <= todayDate) {
            const ds = cur.toISOString().split("T")[0];
            cells.push({ date: ds, count: dayMap.get(ds) ?? 0 });
            cur.setDate(cur.getDate() + 1);
          }
          while (cells.length % 7 !== 0) {
            const last = new Date(cells[cells.length - 1].date + "T12:00:00Z");
            last.setDate(last.getDate() + 1);
            cells.push({ date: last.toISOString().split("T")[0], count: -1 });
          }

          const weeks: { date: string; count: number }[][] = [];
          for (let i = 0; i < cells.length; i += 7) {
            weeks.push(cells.slice(i, i + 7));
          }

          function cellColor(count: number) {
            if (count < 0) return "bg-transparent";
            if (count === 0) return "bg-gray-100";
            if (count <= 2) return "bg-indigo-200";
            if (count <= 5) return "bg-indigo-400";
            return "bg-indigo-600";
          }

          const totalTagDays = heatmap.length;
          return (
            <div className="pb-4 pt-2 border-t border-gray-100 mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">
                  Tagging activity — {totalTagDays} day{totalTagDays !== 1 ? "s" : ""} in the last year
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Less</span>
                  {["bg-gray-100","bg-indigo-200","bg-indigo-400","bg-indigo-600"].map((c) => (
                    <span key={c} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                  ))}
                  <span>More</span>
                </div>
              </div>
              <div className="flex gap-0.5 overflow-x-auto pb-1">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day) => (
                      <div
                        key={day.date}
                        className={`w-2.5 h-2.5 rounded-sm ${cellColor(day.count)} flex-shrink-0`}
                        title={day.count >= 0 ? `${day.date}: ${day.count === 0 ? "no tags" : `${day.count} tag${day.count !== 1 ? "s" : ""}`}` : ""}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                {(() => {
                  const labels: string[] = [];
                  const monthsSeen = new Set<string>();
                  weeks.forEach((week) => {
                    const d = week.find((c) => c.count >= 0);
                    if (!d) return;
                    const month = new Date(d.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short" });
                    if (!monthsSeen.has(month)) { monthsSeen.add(month); labels.push(month); }
                    else labels.push("");
                  });
                  return labels.map((l, i) => (
                    <span key={i} className="w-[calc(100%/52)]">{l}</span>
                  ));
                })()}
              </div>
            </div>
          );
        })()}

        {/* Profile completeness — owner only */}
        {isOwn && (() => {
          const checks = [
            { label: "Name", done: !!profile.name },
            { label: "Photo", done: !!profile.image },
            { label: "Bio", done: !!profile.bio },
            { label: "Location", done: !!profile.location },
            { label: "Occupation", done: !!profile.occupation },
            { label: "Username", done: !!profile.username },
            { label: "Closet item", done: profile.closetItems.length > 0 },
            { label: "Service", done: profile.workItems.length > 0 },
            { label: "Tagged today", done: hasTodayProfile },
            { label: "Open to messages", done: profile.openToContact },
            { label: "Social link", done: !!(profile.instagram || profile.tiktok || profile.twitter) },
            { label: "Interest tags", done: (profile.interestTags ?? []).length > 0 },
          ];
          const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
          if (pct === 100) return null;
          return (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-gray-500">Profile strength</p>
                <p className="text-xs font-bold text-indigo-600">{pct}%</p>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-indigo-500" : "bg-orange-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {checks.filter((c) => !c.done).map((c) => (
                  <span
                    key={c.label}
                    onClick={() => setEditing(true)}
                    className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition"
                    title={`Add ${c.label} to boost your profile`}
                  >
                    + {c.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Edit form */}
        {editing && (
          <div className="mt-6 border-t pt-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Edit Your Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["name", "occupation", "location", "phone", "website"] as const).map((f) => (
                <div key={f}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{f}</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={form[f]}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Username <span className="text-gray-300">(optional — sets spotid.app/u/yourname)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input
                    className={`w-full pl-7 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      usernameStatus === "available" ? "border-green-400" :
                      usernameStatus === "taken" || usernameStatus === "invalid" ? "border-red-400" :
                      "border-gray-300"
                    }`}
                    value={form.username}
                    placeholder="yourname"
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                      setForm({ ...form, username: val });
                      checkUsername(val);
                    }}
                  />
                  {usernameStatus === "checking" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">checking…</span>
                  )}
                  {usernameStatus === "available" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">✓ available</span>
                  )}
                  {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500">{usernameMsg}</span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell people who you are and what you're about…"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { field: "instagram" as const, icon: "📸", label: "Instagram", placeholder: "yourhandle" },
                { field: "tiktok" as const, icon: "🎵", label: "TikTok", placeholder: "yourhandle" },
                { field: "twitter" as const, icon: "𝕏", label: "X / Twitter", placeholder: "yourhandle" },
              ]).map(({ field, icon, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{icon} {label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={form[field]}
                      placeholder={placeholder}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value.replace(/^@/, "").replace(/\s/g, "") })}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 py-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  const next = !profile.openToContact;
                  fetch("/api/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ openToContact: next }),
                  }).then(() => load());
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${profile.openToContact ? "bg-indigo-600" : "bg-gray-200"}`}
                role="switch"
                aria-checked={profile.openToContact}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${profile.openToContact ? "translate-x-5" : "translate-x-0"}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-700">Open to Messages</p>
                <p className="text-xs text-gray-400">{profile.openToContact ? "Anyone can message you" : "Messages from strangers are blocked"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                disabled={saving || usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "checking"}
                className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)}
                className="text-sm text-gray-500 px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── TODAY CARD — Featured daily profile, between header and tabs ── */}
      {hasTodayProfile && daily ? (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-5 mt-4 relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-300/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 mb-3">
            {/* LIVE TODAY badge */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm font-bold text-green-700 uppercase tracking-wide">Live Today</span>
            </div>

            {/* Like button — non-owner only */}
            {!isOwn && myId && (
              <button
                onClick={toggleLike}
                className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full transition font-semibold flex-shrink-0 ${
                  liked
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-white/80 text-gray-500 hover:bg-red-50 hover:text-red-500 border border-gray-200"
                }`}
              >
                <span>{liked ? "❤️" : "🤍"}</span>
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
            )}
            {isOwn && likeCount > 0 && (
              <span className="text-sm text-gray-500 flex items-center gap-1">❤️ {likeCount}</span>
            )}
          </div>

          {/* Daily note */}
          {daily.note && (
            <p className="text-gray-700 mb-4 leading-relaxed text-base">{daily.note}</p>
          )}

          {/* Daily photo */}
          {daily.image && (
            <div
              className="mb-4 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setLightboxUrl(daily.image!)}
            >
              <img
                src={daily.image}
                alt="Today's photo"
                className="w-full max-h-80 object-cover hover:opacity-95 transition-opacity"
              />
            </div>
          )}

          {/* Hashtags — large, colorful pill buttons */}
          <div className="flex flex-wrap gap-2.5">
            {daily.hashtags.map(({ hashtag }) => (
              <Link
                key={hashtag.id}
                href={`/tag/${hashtag.name}`}
                className="bg-indigo-600 text-white text-base font-semibold px-5 py-2 rounded-full hover:bg-indigo-700 active:scale-95 transition-all shadow-sm hover:shadow-md"
              >
                #{hashtag.name}
              </Link>
            ))}
          </div>

          {isOwn && (
            <div className="mt-4 pt-3 border-t border-indigo-100">
              <Link
                href="/daily"
                className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline font-medium"
              >
                ✏️ Update today&apos;s tags
              </Link>
            </div>
          )}
        </div>
      ) : isOwn ? (
        /* Owner hasn't tagged today — show a subtle CTA */
        <div className="mt-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm font-medium mb-1">You haven&apos;t tagged today yet</p>
          <p className="text-gray-400 text-xs mb-3">Tag your location, outfit, plans — anything about your day — so people can find you.</p>
          <Link
            href="/daily"
            className="inline-block bg-indigo-600 text-white text-sm px-6 py-2 rounded-full hover:bg-indigo-700 transition font-semibold"
          >
            Tag Today
          </Link>
        </div>
      ) : null}

      {/* Tab bar */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mt-4 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition relative ${
                tab === t.key
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1.5 bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {/* ── ABOUT TAB ── */}
        {tab === "about" && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">About</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {profile.occupation && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-400">💼</span> {profile.occupation}
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-400">📍</span> {profile.location}
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-400">📞</span> {profile.phone}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-400">🌐</span>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <span>📅</span> Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
              </div>
              {profile.bio && (
                <p className="mt-4 text-gray-600 leading-relaxed border-l-4 border-indigo-100 pl-4">{profile.bio}</p>
              )}
              {!profile.bio && !profile.occupation && !profile.location && (
                <p className="text-gray-400 text-sm italic">No details added yet.</p>
              )}
            </div>

            {/* Interest tags — always-on permanent tags */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Interests</h2>
                {isOwn && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isOwn && editing ? (
                <div className="space-y-2">
                  <HashtagInput
                    value={interestTagsEdit}
                    onChange={setInterestTagsEdit}
                    placeholder="Add permanent interest tags…"
                  />
                  <button
                    onClick={saveInterests}
                    disabled={savingInterests}
                    className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {savingInterests ? "Saving…" : "Save Interests"}
                  </button>
                </div>
              ) : (profile.interestTags ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(profile.interestTags ?? []).map(({ hashtag }) => (
                    <Link
                      key={hashtag.name}
                      href={`/tag/${hashtag.name}`}
                      className="text-xs bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 px-2.5 py-1 rounded-full transition"
                    >
                      #{hashtag.name}
                    </Link>
                  ))}
                </div>
              ) : isOwn ? (
                <p className="text-sm text-gray-400 italic">
                  No interests added.{" "}
                  <button onClick={() => setEditing(true)} className="text-indigo-600 hover:underline">
                    Add some →
                  </button>
                </p>
              ) : null}
            </div>

            {/* Recent tag history */}
            {profile.dailyProfiles.filter((d) => d.date !== today).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Tag History</h3>
                <div className="space-y-2">
                  {profile.dailyProfiles.filter((d) => d.date !== today).map((d) => (
                    <div key={d.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap w-20 flex-shrink-0 mt-0.5">
                        {new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {d.hashtags.slice(0, 8).map(({ hashtag }) => (
                          <Link key={hashtag.id} href={`/tag/${hashtag.name}`}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition">
                            #{hashtag.name}
                          </Link>
                        ))}
                        {d.hashtags.length > 8 && (
                          <span className="text-xs text-gray-400">+{d.hashtags.length - 8}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PHOTOS TAB ── */}
        {tab === "photos" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Photos</h2>
                {isOwn && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {profile.profilePhotos.length}/{profile.isPremium ? "∞" : "10"}
                    {!profile.isPremium && profile.profilePhotos.length >= 10 && (
                      <Link href="/upgrade" className="ml-1.5 text-indigo-500 hover:underline font-medium">Upgrade for unlimited →</Link>
                    )}
                  </p>
                )}
              </div>
              {isOwn && (
                <>
                  <button onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}
                    className="text-sm text-indigo-600 hover:underline disabled:opacity-50">
                    {uploadingPhoto ? "Uploading…" : "+ Add Photo"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                </>
              )}
            </div>
            {profile.profilePhotos.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                <p className="text-3xl mb-2">📷</p>
                <p className="text-sm">{isOwn ? "Add photos to your permanent profile" : "No photos yet"}</p>
                {isOwn && (
                  <button onClick={() => fileRef.current?.click()}
                    className="mt-3 text-sm text-indigo-600 hover:underline">
                    Upload a photo
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {profile.profilePhotos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={photo.url}
                      alt={photo.caption || ""}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setLightboxUrl(photo.url)}
                    />
                    {isOwn && (
                      <button onClick={() => deletePhoto(photo.id)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {isOwn && (
                  <button onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition text-2xl">
                    +
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── CLOSET TAB ── */}
        {tab === "closet" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Closet {activeCloset.length > 0 && `· ${activeCloset.length} for sale`}
              </h2>
              {isOwn && (
                <Link href="/closet" className="text-sm text-indigo-600 hover:underline">
                  Manage Closet →
                </Link>
              )}
            </div>

            {activeCloset.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
                <p className="text-4xl mb-3">👗</p>
                <p className="font-medium text-gray-500">
                  {isOwn ? "Your closet is empty" : "Nothing for sale right now"}
                </p>
                <p className="text-sm mt-1">
                  {isOwn
                    ? "List clothes, furniture, antiques, electronics — anything — with hashtags so buyers find you."
                    : "Check back later."}
                </p>
                {isOwn && (
                  <Link href="/closet"
                    className="mt-4 inline-block bg-indigo-600 text-white text-sm px-6 py-2 rounded-full hover:bg-indigo-700 transition">
                    Add Items
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {activeCloset.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full aspect-square object-cover cursor-pointer"
                        onClick={() => item.image && setLightboxUrl(item.image)}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl">
                        🏷️
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
                      {item.price != null && (
                        <p className="text-indigo-600 font-bold mt-0.5">${item.price.toFixed(2)}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.hashtags.slice(0, 3).map(({ hashtag }) => (
                          <Link key={hashtag.id} href={`/tag/${hashtag.name}`}
                            className="text-xs text-indigo-400 hover:text-indigo-600">
                            #{hashtag.name}
                          </Link>
                        ))}
                      </div>
                      {!isOwn && myId && profile.openToContact && (
                        <Link
                          href={`/messages?to=${id}&name=${encodeURIComponent(profile.name || "")}`}
                          className="mt-2 block text-center text-xs text-indigo-600 hover:underline font-medium border border-indigo-200 rounded-lg py-1"
                        >
                          Message seller →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {soldCloset.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-gray-400 font-medium mb-3">SOLD ({soldCloset.length})</p>
                <div className="flex gap-2 flex-wrap">
                  {soldCloset.map((item) => (
                    <span key={item.id} className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full line-through">
                      {item.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WORK TAB ── */}
        {tab === "work" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Work & Services
              </h2>
              {isOwn && (
                <Link href="/work" className="text-sm text-indigo-600 hover:underline">
                  Manage Work →
                </Link>
              )}
            </div>

            {profile.workItems.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
                <p className="text-4xl mb-3">💼</p>
                <p className="font-medium text-gray-500">
                  {isOwn ? "No work listings yet" : "No services listed"}
                </p>
                <p className="text-sm mt-1">
                  {isOwn
                    ? "List your services, skills, or business so people searching related hashtags can find and hire you."
                    : "This person hasn't listed any services yet."}
                </p>
                {isOwn && (
                  <Link href="/work"
                    className="mt-4 inline-block bg-indigo-600 text-white text-sm px-6 py-2 rounded-full hover:bg-indigo-700 transition">
                    Add a Service
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {profile.workItems.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                    <div className="flex gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0 cursor-pointer"
                          onClick={() => item.image && setLightboxUrl(item.image)}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl flex-shrink-0">
                          💼
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900">{item.title}</h3>
                          {item.category && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.description}</p>
                        )}
                        {item.contactInfo && (
                          <p className="text-sm text-indigo-600 mt-2 font-medium">📬 {item.contactInfo}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.hashtags.map(({ hashtag }) => (
                            <Link key={hashtag.id} href={`/tag/${hashtag.name}`}
                              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full hover:bg-indigo-200 transition">
                              #{hashtag.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
