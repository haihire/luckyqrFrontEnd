import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("네이버 소셜 로그인 시도");

    // 백엔드 서버에 네이버 로그인 요청
    const backendResponse = await fetch("http://127.0.0.1:8000/auth/naver", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // dvmm 003
    if (backendResponse.ok) {
      const data = await backendResponse.json();
      console.log("네이버 로그인 성공", data);
      return NextResponse.json({
        success: true,
        user: data.user,
        token: data.token,
        authorization_url: data.authorization_url, // OAuth 리다이렉트 URL
      });
    } else {
      const errorData = await backendResponse.json();
      console.log("네이버 로그인 실패", errorData);
      return NextResponse.json(
        {
          success: false,
          message: errorData || "네이버 로그인 실패",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("네이버 로그인 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
