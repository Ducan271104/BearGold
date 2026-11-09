import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, error: "Dữ liệu JSON không hợp lệ." }, { status: 400 });
  }
  const username = body && typeof body === "object" && "username" in body
    ? (body as { username?: unknown }).username : undefined;
  if (typeof username !== "string" || !username.trim()) {
    return NextResponse.json({ success: false, error: "Thiếu trường username trong body" }, { status: 422 });
  }
  try {
    const base = (process.env.UPLOCKET_BASE_URL || "https://uplocket.io.vn").replace(/\/$/, "");
    const response = await fetch(`${base}/api/locket/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Không thể kết nối dịch vụ tra cứu." }, { status: 502 });
  }
}
