import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.search; // includes ?code=...&state=...

    const backendUrl = `http://127.0.0.1:8000/auth/naver/callback${search}`;

    const backendResp = await fetch(backendUrl, {
      method: "GET",
      // server-side fetch; no credentials forwarded
    });

    const text = await backendResp.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      // not JSON
      return NextResponse.json(
        { success: false, message: text },
        { status: backendResp.status }
      );
    }

    return NextResponse.json(data, { status: backendResp.status });
  } catch (error) {
    console.error("/api/auth/naver/callback proxy error:", error);
    return NextResponse.json(
      { success: false, message: "프록시 요청 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
