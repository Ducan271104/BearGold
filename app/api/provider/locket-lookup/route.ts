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

  if (!profile || !["ADMIN", "CTV"].includes(String(profile.role).toUpperCase())) {
    return NextResponse.json({ success: false, error: "Bạn không có quyền truy cập." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Dữ liệu yêu cầu không đúng định dạng JSON." }, { status: 400 });
  }

  const username = body && typeof body === "object" && "username" in body
    ? String((body as { username?: unknown }).username ?? "").trim()
    : "";
  if (!username || username.length > 200) {
    return NextResponse.json({
      success: false,
      error: "Vui lòng nhập Username hoặc Link cá nhân Locket",
    }, { status: 400 });
  }

  const result = await uplocketRequest("/api/locket/lookup", {
    method: "POST",
    body: JSON.stringify({ username }),
  });

  return NextResponse.json(result.data, {
    status: result.ok ? 200 : result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
