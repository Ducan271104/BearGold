import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập lại." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "Bạn không có quyền Admin." }, { status: 403 });
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

  const input = body as { packageId?: unknown; creditsPrice?: unknown; active?: unknown };
  const packageId = typeof input.packageId === "string" ? input.packageId.trim() : "";
  const creditsPrice = typeof input.creditsPrice === "number" ? input.creditsPrice : Number.NaN;
  const active = input.active;

  if (!packageId || packageId.length > 100
      || !Number.isSafeInteger(creditsPrice)
      || creditsPrice < 1 || creditsPrice > 100000
      || typeof active !== "boolean") {
    return NextResponse.json({ error: "Mã gói, giá hoặc trạng thái không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("admin_update_service_package", {
    p_package_id: packageId,
    p_credits_price: creditsPrice,
    p_active: active,
  });

  if (error) {
    const message = error.message.includes("NOT_FOUND")
      ? "Không tìm thấy gói dịch vụ."
      : error.message.includes("FORBIDDEN")
        ? "Bạn không có quyền Admin."
        : "Không thể lưu cấu hình gói. Hãy kiểm tra migration Supabase đã được áp dụng.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ package: Array.isArray(data) ? data[0] : data });
}
