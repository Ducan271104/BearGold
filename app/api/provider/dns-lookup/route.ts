import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uplocketRequest } from "@/lib/uplocket";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ success: false, error: "Bạn cần đăng nhập." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "ctv"].includes(profile.role)) {
    return NextResponse.json({ success: false, error: "Bạn không có quyền truy cập." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Dữ liệu JSON không hợp lệ." }, { status: 400 });
  }

  const username = body && typeof body === "object" && "username" in body
    ? String((body as { username?: unknown }).username ?? "").trim()
    : "";
  if (!username || username.length > 100) {
    return NextResponse.json({ success: false, error: "Vui lòng nhập username Locket hợp lệ." }, { status: 400 });
  }

  const result = await uplocketRequest(
    `/api/v1/dns/lookup?username=${encodeURIComponent(username)}`,
    { method: "GET" },
  );
  return NextResponse.json(result.data, {
    status: result.ok ? 200 : result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
