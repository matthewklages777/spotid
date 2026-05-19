"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const EXEMPT = ["/onboarding", "/terms", "/privacy", "/guidelines", "/dmca"];

export function OnboardingGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "authenticated") return;
    const user = session?.user as { onboardingComplete?: boolean } | undefined;
    if (!user?.onboardingComplete && !EXEMPT.some((p) => pathname.startsWith(p))) {
      router.replace("/onboarding");
    }
  }, [status, session, pathname, router]);

  return null;
}
