import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/uplocket/admin";
import { decryptApiKey } from "@/lib/uplocket/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ path: string[] }> };

const allowed: Record<string, string[]> = {
  "dns/export": ["POST"], "dns/activations": ["GET"], "credits": ["GET"], "dns/lookup": ["GET", "POST"],
};
function isAllowed(path: string, method: string) {
  if (allowed[path]?.includes(method)) return true;
  return Boolean(path.match(/^dns\/activations\/([0-9]+)\/(renew|toggle)$/) && method === "POST");
}
async function getAuthenticatedCtv() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "ctv") return { response: NextResponse.json({ error: "Bạn không có quyền sử dụng API DNS." }, { status: 403 }) };
  return { user };
}
async function proxy(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedCtv();
  if ("response" in auth) return auth.response;
  const { path: segments } = await context.params;
  if (!Array.isArray(segments) || segments.some(part => !/^[a-zA-Z0-9_-]+$/.test(part))) return NextResponse.json({ error: "Endpoint không hợp lệ." }, { status: 400 });
  const endpoint = segments.join("/");
  if (!isAllowed(endpoint, request.method)) return NextResponse.json({ error: "Endpoint hoặc phương thức chưa được hỗ trợ." }, { status: 405 });
  try {
    const admin = createServiceClient();
    const { data: credential, error } = await admin.from("ctv_api_credentials").select("encrypted_key").eq("user_id", auth.user.id).maybeSingle();
    if (error) throw error;
    if (!credential?.encrypted_key) return NextResponse.json({ error: "Bạn chưa cấu hình API key Uplocket." }, { status: 409 });
    const base = (process.env.UPLOCKET_BASE_URL || "https://uplocket.io.vn").replace(/\/$/, "");
    const target = new URL(`${base}/api/v1/${endpoint}`);
    new URL(request.url).searchParams.forEach((value, key) => target.searchParams.append(key, value));
    const headers = new Headers({ Authorization: `Bearer ${decryptApiKey(credential.encrypted_key)}` });
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const init: RequestInit = { method: request.method, headers, cache: "no-store", signal: AbortSignal.timeout(20000) };
    if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.text();
    const upstream = await fetch(target, init);
    const responseText = await upstream.text();
    return new NextResponse(responseText, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Không kết nối được Uplocket hoặc máy chủ chưa cấu hình đầy đủ." }, { status: 502 });
  }
}
export const GET = proxy;
export const POST = proxy;
