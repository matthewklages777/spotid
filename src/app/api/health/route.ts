// Lightweight health check used by Railway (and any uptime monitor).
// Only checks that the Node.js server is responding — DB health is at /api/db-status.
// Keeping this DB-free ensures Railway healthcheck passes as long as the server starts.
export async function GET() {
  return Response.json({ status: "ok" });
}
