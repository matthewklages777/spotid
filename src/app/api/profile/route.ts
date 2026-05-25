import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      coverImage: true,
      bio: true,
      location: true,
      occupation: true,
      website: true,
      phone: true,
      username: true,
      instagram: true,
      tiktok: true,
      twitter: true,
      profileViews: true,
      openToContact: true,
      isPremium: true,
      browseAnonymously: true,
      createdAt: true,
      profilePhotos: { orderBy: { createdAt: "desc" } },
      dailyProfiles: {
        orderBy: { date: "desc" },
        take: 7,
        include: { hashtags: { include: { hashtag: true } } },
      },
      closetItems: {
        orderBy: [{ sold: "asc" }, { createdAt: "desc" }],
        include: { hashtags: { include: { hashtag: true } } },
        take: 50,
      },
      workItems: {
        orderBy: { createdAt: "desc" },
        include: { hashtags: { include: { hashtag: true } } },
        take: 50,
      },
      interestTags: {
        orderBy: { createdAt: "asc" },
        include: { hashtag: { select: { name: true } } },
      },
    },
  });

  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const savedByCount = await prisma.savedProfile.count({ where: { savedUserId: userId } });

  // Compute daily streak and total days tagged
  const allDates = await prisma.dailyProfile.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  const totalDays = allDates.length;
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  const dayMs = 86_400_000;
  for (let i = 0; i < allDates.length; i++) {
    const expected = new Date(Date.now() - i * dayMs).toISOString().slice(0, 10);
    if (allDates[i].date === expected) { streak++; }
    else break;
  }
  // If today not tagged yet, check if yesterday starts a streak
  if (streak === 0 && allDates.length > 0 && allDates[0].date !== today) {
    const yesterday = new Date(Date.now() - dayMs).toISOString().slice(0, 10);
    if (allDates[0].date === yesterday) {
      for (let i = 0; i < allDates.length; i++) {
        const expected = new Date(Date.now() - (i + 1) * dayMs).toISOString().slice(0, 10);
        if (allDates[i].date === expected) { streak++; }
        else break;
      }
    }
  }

  // Compute profile completeness score (0–100)
  // Each step has a point value; helps users know what to fill in
  const completenessSteps = [
    { key: "photo", done: !!user.image, points: 20, label: "Add a profile photo" },
    { key: "bio", done: !!user.bio, points: 15, label: "Write a bio" },
    { key: "occupation", done: !!user.occupation, points: 15, label: "Add your occupation" },
    { key: "location", done: !!user.location, points: 10, label: "Add your location" },
    { key: "username", done: !!user.username, points: 10, label: "Set a username (@handle)" },
    { key: "daily", done: totalDays > 0, points: 20, label: "Tag your first day" },
    { key: "closet_or_work", done: user.closetItems.length > 0 || user.workItems.length > 0, points: 10, label: "Add a listing or service" },
  ];
  const completenessScore = completenessSteps.reduce((sum, s) => sum + (s.done ? s.points : 0), 0);
  const completenessItems = completenessSteps.filter((s) => !s.done).map((s) => ({ key: s.key, label: s.label, points: s.points }));

  return Response.json({ ...user, savedByCount, streak, totalDays, completenessScore, completenessItems });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  const body = await req.json();
  const { name, bio, location, occupation, website, phone, username, coverImage, image, onboardingComplete, openToContact, instagram, tiktok, twitter, browseAnonymously } = body;

  if (name !== undefined && (typeof name !== "string" || name.length > 100)) {
    return Response.json({ error: "Name must be under 100 characters" }, { status: 400 });
  }
  if (bio !== undefined && (typeof bio !== "string" || bio.length > 2000)) {
    return Response.json({ error: "Bio must be under 2000 characters" }, { status: 400 });
  }
  if (location !== undefined && (typeof location !== "string" || location.length > 100)) {
    return Response.json({ error: "Location must be under 100 characters" }, { status: 400 });
  }
  if (occupation !== undefined && (typeof occupation !== "string" || occupation.length > 100)) {
    return Response.json({ error: "Occupation must be under 100 characters" }, { status: 400 });
  }
  if (website !== undefined && website && (typeof website !== "string" || website.length > 200)) {
    return Response.json({ error: "Website URL must be under 200 characters" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (bio !== undefined) data.bio = bio;
  if (location !== undefined) data.location = location;
  if (occupation !== undefined) data.occupation = occupation;
  if (website !== undefined) data.website = website;
  if (phone !== undefined) data.phone = phone;
  if (coverImage !== undefined) data.coverImage = coverImage;
  if (image !== undefined) data.image = image;
  if (onboardingComplete !== undefined) data.onboardingComplete = onboardingComplete;
  if (openToContact !== undefined) data.openToContact = openToContact;
  if (browseAnonymously !== undefined) data.browseAnonymously = browseAnonymously;
  if (username !== undefined) data.username = username || null;
  if (instagram !== undefined) data.instagram = instagram ? instagram.replace(/^@/, "").slice(0, 50) : null;
  if (tiktok !== undefined) data.tiktok = tiktok ? tiktok.replace(/^@/, "").slice(0, 50) : null;
  if (twitter !== undefined) data.twitter = twitter ? twitter.replace(/^@/, "").slice(0, 50) : null;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return Response.json({ success: true, user });
  } catch (err: unknown) {
    // Unique constraint violation on username
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint failed") &&
      err.message.includes("username")
    ) {
      return Response.json({ error: "That username is already taken. Please choose a different one." }, { status: 409 });
    }
    console.error("[profile PUT]", err);
    return Response.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
