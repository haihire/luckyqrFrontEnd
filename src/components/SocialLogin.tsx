"use client";
import React, { useState } from "react";

type Props = {
  onSuccess?: (user: any, token?: string) => void;
};
//h
const SocialLogin: React.FC<Props> = ({ onSuccess }) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const startSocialLogin = async (provider: "naver" | "kakao") => {
    setLoadingProvider(provider);
    let popup: Window | null = null;
    try {
      popup = window.open(
        "about:blank",
        `${provider}Login`,
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );
      if (!popup) {
        alert("팝업이 차단되었습니다. 팝업 허용을 확인해주세요.");
        setLoadingProvider(null);
        return;
      }

      const resp = await fetch(`/api/auth/${provider}`, { method: "POST" });

      if (!resp.ok) {
        const err = await resp.text();
        console.error(`${provider} auth endpoint returned error:`, err);
        alert("로그인 처리에 실패했습니다. 잠시 후 다시 시도하세요.");
        try {
          popup && !popup.closed && popup.close();
        } catch (e) {}
        setLoadingProvider(null);
        return;
      }

      const data = await resp.json();
      console.log("Social login response data:", data);

      const authUrl = data.authorization_url || data.authorizationUrl;
      if (!authUrl) {
        console.error("OAuth URL not returned", data);
        alert("로그인 URL을 생성할 수 없습니다.");
        try {
          popup && !popup.closed && popup.close();
        } catch (e) {}
        setLoadingProvider(null);
        return;
      }

      // 팝업이 정상적으로 열렸으면 팝업에서 해당 URL로 이동, 아니라면 현재 창에서 리디렉트
      try {
        if (popup && !popup.closed) {
          popup.location.href = authUrl;
        } else {
          window.location.href = authUrl;
        }
      } catch (e) {
        // cross-origin 접근 예외 등으로 실패하면 현재 창으로 이동
        window.location.href = authUrl;
      }

      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const payload = event.data || {};
        if (payload.type === "auth_success") {
          const token =
            payload.token || payload.access_token || payload.accessToken;
          try {
            onSuccess?.(payload.user, token);
          } catch (e) {
            console.error("onSuccess callback error", e);
          }
          window.removeEventListener("message", messageListener);
          try {
            popup && !popup.closed && popup.close();
          } catch (e) {}
          setLoadingProvider(null);
        } else if (payload.type === "auth_error") {
          console.error("Social auth error:", payload.error);
          alert(payload.error || "로그인에 실패했습니다.");
          window.removeEventListener("message", messageListener);
          try {
            popup && !popup.closed && popup.close();
          } catch (e) {}

          setLoadingProvider(null);
        }
      };

      window.addEventListener("message", messageListener);

      // 팝업 닫힘 감지 및 타임아웃
      const checkClosed = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageListener);
            setLoadingProvider(null);
          }
        } catch (e) {
          // cross-origin access 발생할 수 있음
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageListener);
        if (popup && !popup.closed) {
          try {
            popup.close();
          } catch (e) {}
        }
        setLoadingProvider(null);
      }, 5 * 60 * 1000); // 5분 타임아웃
    } catch (err) {
      console.error("Social login request failed:", err);
      alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
      try {
        popup && !popup.closed && popup.close();
      } catch (e) {}
      setLoadingProvider(null);
    }
  };

  return (
    <div className="social-login-buttons">
      <button
        className="social-btn naver-btn"
        onClick={() => startSocialLogin("naver")}
        disabled={loadingProvider !== null}
      >
        <span className="social-icon">N</span>
        {loadingProvider === "naver" ? "로딩..." : "네이버로 로그인"}
      </button>

      <button
        className="social-btn kakao-btn"
        onClick={() => startSocialLogin("kakao")}
        disabled={loadingProvider !== null}
      >
        <span className="social-icon">K</span>
        {loadingProvider === "kakao" ? "로딩..." : "카카오톡으로 로그인"}
      </button>
    </div>
  );
};

export default SocialLogin;
