import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/uplocket/admin";
import { encryptApiKey } from "@/lib/uplocket/credentials";

export const runtime = "nodejs";

async function getCtvUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "ctv") {
    return { response: NextResponse.json({ error: "Chức năng này chỉ dành cho CTV." }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const auth = await getCtvUser();
  if ("response" in auth) return auth.response;
  try {
    const admin = createServiceClient();
    const { data, error } = await admin.from("ctv_api_credentials")
      .select("user_id").eq("user_id", auth.user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ configured: Boolean(data) });
  } catch {
    return NextResponse.json({ error: "Chưa thể kiểm tra cấu hình API key. Admin cần chạy migration và cấu hình máy chủ." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await getCtvUser();
  if ("response" in auth) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON không hợp lệ." }, { status: 400 });
  }
  const apiKey = body && typeof body === "object" && "apiKey" in body
    ? (body as { apiKey?: unknown }).apiKey : undefined;
  if (typeof apiKey !== "string" || apiKey.trim().length < 12 || apiKey.length > 512) {
    return NextResponse.json({ error: "API key không hợp lệ." }, { status: 400 });
  }
  try {
    const admin = createServiceClient();
    const { error } = await admin.from("ctv_api_credentials").upsert({
      user_id: auth.user.id,
      encrypted_key: encryptApiKey(apiKey.trim()),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw error;
    return NextResponse.json({ success: true, configured: true });
  } catch {
    return NextResponse.json({ error: "Không thể lưu API key. Kiểm tra cấu hình mã hóa và migration." }, { status: 503 });
  }
}
