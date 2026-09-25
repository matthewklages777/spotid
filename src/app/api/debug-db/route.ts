export async function GET() {
  const url = process.env["DATABASE_URL"] ?? "(not set)";
  const token = process.env["TURSO_AUTH_TOKEN"];
  const tursoUrl = process.env["TURSO_DATABASE_URL"] ?? "(not set)";
  return Response.json({
    DATABASE_URL: url,
    TURSO_DATABASE_URL: tursoUrl,
    TURSO_AUTH_TOKEN_SET: !!token,
    TURSO_AUTH_TOKEN_LENGTH: token?.length ?? 0,
    TURSO_AUTH_TOKEN_PREVIEW: token ? token.slice(0, 10) + "..." + token.slice(-5) : null,
  });
}
