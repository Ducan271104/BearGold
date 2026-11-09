import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập lại." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const input = body as { memberId?: unknown; delta?: unknown; reason?: unknown };
  const memberId = typeof input.memberId === "string" ? input.memberId : "";
  const delta = typeof input.delta === "number" ? input.delta : Number.NaN;
  const reason = typeof input.reason === "string" ? input.reason.trim().slice(0, 200) : "";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberId)
      || !Number.isSafeInteger(delta)
      || delta === 0
      || Math.abs(delta) > 100000) {
    return NextResponse.json({ error: "Tài khoản hoặc số Credits không hợp lệ." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "Bạn không có quyền Admin." }, { status: 403 });
  }

  const { data, error } = await supabase.rpc("admin_adjust_ctv_credits", {
    p_target_id: memberId,
    p_delta: delta,
    p_reason: reason,
  });

  if (error) {
    const message = error.message.includes("INSUFFICIENT_CREDITS")
      ? "Số dư không đủ để trừ Credits."
      : error.message.includes("INVALID_TARGET")
        ? "Chỉ có thể điều chỉnh Credits cho tài khoản CTV."
        : error.message.includes("NOT_FOUND")
          ? "Không tìm thấy tài khoản thành viên."
          : error.message.includes("FORBIDDEN")
            ? "Bạn không có quyền thực hiện thao tác này."
            : "Không thể cập nhật Credits. Vui lòng thử lại.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ credits: data });
}
