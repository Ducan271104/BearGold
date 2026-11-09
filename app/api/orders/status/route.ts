import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowed = new Set(["pending_review", "contacted", "cancelled", "completed"]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id : "";
  const status = typeof input.status === "string" ? input.status : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !allowed.has(status)) {
    return NextResponse.json({ error: "Mã yêu cầu hoặc trạng thái không hợp lệ." }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "ctv"].includes(profile.role)) {
    return NextResponse.json({ error: "Bạn không có quyền cập nhật yêu cầu." }, { status: 403 });
  }

  const { data, error } = await supabase.from("order_requests").update({ status }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Không thể cập nhật trạng thái. Kiểm tra quyền Supabase và migration." }, { status: 400 });
  return NextResponse.json({ success: true });
}
