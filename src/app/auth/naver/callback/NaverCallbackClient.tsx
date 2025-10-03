"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function NaverCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        if (error) {
          console.error("네이버 OAuth 에러:", error);
          try {
            if (window.opener && !window.opener.closed) {
              const targetOrigin = window.location.origin;
              window.opener.postMessage(
                {
                  type: "auth_error",
                  success: false,
                  error: `카카오 인증 실패: ${error}`,
                },
                targetOrigin
              );
            } else {
              console.warn(
                "Cannot postMessage: opener not available or already closed"
              );
            }
          } catch (e) {
            console.warn("postMessage failed:", e);
          }

          window.close();
          return;
        }

        if (!code) {
          console.error("인증 코드가 없습니다");
          try {
            if (window.opener && !window.opener.closed) {
              const targetOrigin = window.location.origin;
              window.opener.postMessage(
                {
                  type: "auth_error",
                  success: false,
                  error: "인증 코드가 없습니다",
                },
                targetOrigin
              );
            } else {
              console.warn(
                "Cannot postMessage: opener not available or already closed"
              );
            }
          } catch (e) {
            console.warn("postMessage failed:", e);
          }
          window.close();
          return;
        }

        console.log("네이버 콜백 처리:", { code, state });

        // 백엔드 콜백 엔드포인트 호출
        const response = await fetch(
          `/api/auth/naver/callback?code=${code}&state=${state || ""}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("백엔드 콜백 요청 실패:", response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("백엔드 콜백 응답:", data);

        if (data.success) {
          // 부모 창에 성공 메시지 전송
          try {
            if (window.opener && !window.opener.closed) {
              const targetOrigin = window.location.origin;
              window.opener.postMessage(
                {
                  type: "auth_success",
                  success: true,
                  user: data.user,
                  access_token: data.access_token,
                },
                targetOrigin
              );
            } else {
              console.warn(
                "Cannot postMessage: opener not available or already closed"
              );
            }
          } catch (e) {
            console.warn("postMessage failed:", e);
          }

          // 쿠키에 토큰 저장
          document.cookie = `access_token=${
            data.access_token
          }; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        } else {
          throw new Error(data.message || "네이버 로그인 실패");
        }

        window.close();
      } catch (error) {
        console.error("네이버 콜백 처리 에러:", error);
        try {
          if (window.opener && !window.opener.closed) {
            const targetOrigin = window.location.origin;
            window.opener.postMessage(
              {
                type: "auth_error",
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "카카오 로그인 중 오류가 발생했습니다",
              },
              targetOrigin
            );
          } else {
            console.warn(
              "Cannot postMessage: opener not available or already closed"
            );
          }
        } catch (e) {
          console.warn("postMessage failed:", e);
        }
        window.close();
      }
    };

    handleCallback();
  }, [searchParams]);

  return null;
}
