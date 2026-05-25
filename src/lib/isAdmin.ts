import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// Accepts either ADMIN_EMAIL (server-only) or NEXT_PUBLIC_ADMIN_EMAIL (also visible to client).
// Set one of them in Railway env vars. ADMIN_EMAIL takes precedence.
function getAdminEmail(): string | undefined {
  return process.env["ADMIN_EMAIL"] || process.env["NEXT_PUBLIC_ADMIN_EMAIL"];
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmail = getAdminEmail();
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return null;
  }
  return session;
}

export { getAdminEmail };
