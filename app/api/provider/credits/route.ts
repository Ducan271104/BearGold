import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uplocketRequest } from "@/lib/uplocket";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const result = await uplocketRequest("/api/v1/credits", { method: "GET" });
  return NextResponse.json(result.data, {
    status: result.ok ? 200 : result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
