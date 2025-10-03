import React, { useState, useEffect } from "react";
import SocialLogin from "./SocialLogin";
import "./UIctrl.css";
import useUserStore from "../store/userStore";

const UIctrl: React.FC = () => {
  const {
    currentUser,
    isLoggedIn,
    isLoginPopupOpen,
    login,
    logout,
    openLoginPopup,
    closeLoginPopup,
  } = useUserStore();
  // 이메일 인증 상태
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  // 로그인 입력값 상태
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // 회원가입 입력값 상태
  const [signUp, setSignUp] = useState(false);
  //email 인증하면 회원가입 버튼 활성화
  //email verification 추가
  const [signupData, setSignupData] = useState({
    signupName: "",
    signupUsername: "",
    signupPassword: "",
    signupEmail: "",
    signupMobile: "",
  });
  const [mobileError, setMobileError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  // ---------------------------------

  // 회원가입 입력값 변경 핸들러 및 유효성 검사
  const [idError, setIdError] = useState("");
  const [idMessage, setIdMessage] = useState("");
  const [pwError, setPwError] = useState("");
  const [lastCheckedEmail, setLastCheckedEmail] = useState("");
  const [lastCheckedEmailAt, setLastCheckedEmailAt] = useState<number | null>(
    null
  );
  const [lastCheckedEmailResult, setLastCheckedEmailResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [lastCheckedUsername, setLastCheckedUsername] = useState("");
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [lastCheckedResult, setLastCheckedResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const CACHE_MS = 30_000; // 같은 아이디에 대해 재요청 금지 기간 (ms)
  // 아이디 유효성 플래그
  const isUsernameValid = /^[a-zA-Z0-9]{4,20}$/.test(signupData.signupUsername);
  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 아이디 유효성 검사: 4~20자, 영문/숫자
    if (name === "signupUsername") {
      // 입력한 아이디가 이전에 검사한 아이디와 다르면 이전 검사 결과를 무효화
      if (value.trim() !== lastCheckedUsername) {
        setLastCheckedResult(null);
        setLastCheckedUsername("");
        setLastCheckedAt(null);
        setIdMessage("");
      }

      const idRegex = /^[a-zA-Z0-9]{4,20}$/;
      if (!idRegex.test(value)) {
        setIdError("아이디는 4~20자 영문/숫자만 가능합니다.");
        setIdMessage("");
      } else {
        setIdError("");
        setIdMessage("");
      }
    }
    // 비밀번호 유효성 검사: 8~20자, 영문/숫자/특수문자, 2종류 이상
    if (name === "signupPassword") {
      const pwRegex =
        /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=]).{8,20}$/;
      if (!pwRegex.test(value)) {
        setPwError("비밀번호는 8~20자, 영문/숫자/특수문자 포함");
      } else {
        setPwError("");
      }
    }
    // 휴대폰 유효성 검사
    if (name === "signupMobile") {
      // 숫자만 남기기 (전화번호는 선행 0 허용 위해 type=tel 권장)
      const digits = value.replace(/[^0-9+]/g, "");
      // 간단길이체크: 9~13자리 허용 (환경에 맞게 조정)
      const plain = digits.replace(/\D/g, "");
      if (!plain || plain.length < 9 || plain.length > 13) {
        setMobileError("유효한 휴대폰 번호를 입력하세요");
      } else {
        setMobileError("");
      }
    }
  };

  // 현재 입력한 아이디가 최근에 검사된 아이디와 같고 사용 가능한지 여부
  const isIdCheckedAndAvailable = !!(
    lastCheckedResult?.success &&
    lastCheckedUsername === signupData.signupUsername.trim()
  );
  // 이메일 유효성 및 최근 발송 캐시 여부
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const isEmailValid = emailRegex.test(signupData.signupEmail);
  const isEmailCachedBlocked =
    lastCheckedEmail === signupData.signupEmail.trim() &&
    lastCheckedEmailAt !== null &&
    Date.now() - lastCheckedEmailAt < CACHE_MS;
  //아이디 중복 검사 핸들러
  const handleCheckId = async () => {
    const username = signupData.signupUsername.trim();

    if (!username) {
      setIdError("아이디를 입력하세요.");
      setIdMessage("");
      return;
    }
    if (!isUsernameValid) {
      setIdError("아이디 형식이 올바르지 않습니다.");
      setIdMessage("");
      return;
    }

    setIdError("");
    setIdMessage("");

    // 캐시 검사: 최근에 같은 아이디를 검사했고 캐시 유효기간 이내면 재요청 금지
    if (
      lastCheckedUsername === username &&
      lastCheckedAt &&
      Date.now() - lastCheckedAt < CACHE_MS
    ) {
      if (lastCheckedResult) {
        if (lastCheckedResult.success) {
          setIdMessage(lastCheckedResult.message);
          setIdError("");
        } else {
          setIdError(lastCheckedResult.message);
          setIdMessage("");
        }
      }
      return;
    }

    try {
      const resp = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL
        }/check_id?username=${encodeURIComponent(username)}`
      );

      const text = await resp.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.warn("check_id: invalid JSON response", e);
        data = {};
      }

      if (resp.ok) {
        if (data.success === false || data.available === false) {
          const msg = data.message || "이미 사용 중인 아이디입니다.";
          setIdError(msg);
          setIdMessage("");
          setLastCheckedResult({ success: false, message: msg });
        } else if (data.success === true || data.available === true) {
          const msg = data.message || "사용 가능한 아이디입니다.";
          setIdMessage(msg);
          setIdError("");
          setLastCheckedResult({ success: true, message: msg });
        } else if (data.message) {
          // fallback
          if (data.message.includes("이미") || data.message.includes("중")) {
            setIdError(data.message);
            setLastCheckedResult({ success: false, message: data.message });
          } else {
            setIdMessage(data.message);
            setLastCheckedResult({ success: true, message: data.message });
          }
        } else {
          const msg = "서버 응답을 처리할 수 없습니다.";
          setIdError(msg);
          setLastCheckedResult({ success: false, message: msg });
        }
        // 캐시에 결과 저장
        setLastCheckedUsername(username);
        setLastCheckedAt(Date.now());
      } else {
        const msg = data.message || "아이디 중복 검사에 실패했습니다.";
        setIdError(msg);
        setLastCheckedResult({ success: false, message: msg });
        setLastCheckedUsername(username);
        setLastCheckedAt(Date.now());
      }
    } catch (err: any) {
      console.error("아이디 중복 검사 오류:", err);
      setIdError("아이디 중복 검사 중 오류가 발생했습니다.");
      setIdMessage("");
    } finally {
    }
  };
  // 이메일 인증 코드 발송
  const handleSendVerificationCode = async () => {
    const email = signupData.signupEmail.trim();
    setError("");
    setMessage("인증코드를 발송하고 있습니다...");
    setIsSendingCode(true);

    // 캐시 검사: 같은 이메일에 대해 최근에 검사했으면 재요청 금지
    if (
      lastCheckedEmail === email &&
      lastCheckedEmailAt &&
      Date.now() - lastCheckedEmailAt < CACHE_MS
    ) {
      if (lastCheckedEmailResult) {
        if (lastCheckedEmailResult.success) {
          setMessage(
            lastCheckedEmailResult.message || "인증코드가 발송되었습니다."
          );
          setIsCodeSent(true);
        } else {
          setError(
            lastCheckedEmailResult.message || "이미 존재하는 이메일입니다."
          );
        }
      }
      setIsSendingCode(false);
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/send_verification_email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      const success = response.ok && data.success;
      // 캐시에 결과 저장
      setLastCheckedEmail(email);
      setLastCheckedEmailAt(Date.now());
      setLastCheckedEmailResult({
        success,
        message:
          data.message ||
          (success
            ? "인증코드가 발송되었습니다."
            : "인증코드 발송에 실패했습니다."),
      });

      if (success) {
        setMessage("인증코드가 발송되었습니다.");
        setIsCodeSent(true);
      } else {
        setError(data.message || "인증코드 발송에 실패했습니다.");
        setMessage("");
      }
    } catch (err: any) {
      setError("인증코드 발송 중 오류가 발생했습니다.");
      setMessage("");
    } finally {
      setIsSendingCode(false);
    }
  };

  // 이메일 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError("인증코드를 입력해주세요.");
      return;
    }
    setError("");
    setMessage("인증코드를 확인하고 있습니다...");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/verify_email_code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: signupData.signupEmail,
            code: verificationCode,
          }),
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("");
        setIsVerified(true);
        setIsEmailVerified(true);
        setError("");
      } else {
        // 백엔드에서 detail.message가 올 수 있으므로 우선적으로 표시
        setError(
          data.detail?.message || data.message || "인증에 실패했습니다."
        );
        setMessage("");
      }
    } catch (err: any) {
      setError("인증 확인 중 오류가 발생했습니다.");
      setMessage("");
    }
  };

  // 회원가입 처리 핸들러
  const handleSignup = async () => {
    try {
      console.log("일반 회원가입:", signupData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: signupData.signupName,
            username: signupData.signupUsername,
            password: signupData.signupPassword,
            email: signupData.signupEmail,
            mobile: signupData.signupMobile,
          }),
        }
      );
      if (response.ok) {
        alert("회원가입 성공!");
        setSignupData({
          signupName: "",
          signupUsername: "",
          signupPassword: "",
          signupEmail: "",
          signupMobile: "",
        });
        setIsCodeSent(false);
        setIsVerified(false);
        setVerificationCode("");
        setMessage("");
        setError("");
        setSignUp(false); // 회원가입 폼 닫고 로그인 폼으로 이동
      } else {
        alert("회원가입 실패");
      }
    } catch (error) {
      alert("회원가입 에러");
    }
  };

  const handleLogout = () => {
    logout(); // 스토어의 logout 액션 호출
    console.log("로그아웃");
  };

  const handleOpenLogin = () => {
    openLoginPopup(); // 스토어의 openLoginPopup 액션 호출
  };

  const handleCloseLogin = () => {
    closeLoginPopup(); // 스토어의 closeLoginPopup 액션 호출
    setSignUp(false);
    setLoginData({
      username: "",
      password: "",
    });
    setSignupData({
      signupName: "",
      signupUsername: "",
      signupPassword: "",
      signupEmail: "",
      signupMobile: "",
    });
    setIsEmailVerified(false);
    setIsVerified(false);
    setIsCodeSent(false);
    setVerificationCode("");
    setMessage("");
    setError("");
    setIdError("");
    setPwError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        // 로그인 성공 시 사용자 정보 표시
        if (result.success && result.user) {
          login(result.user);
        }
        closeLoginPopup(); // 팝업 닫기
      } else {
        const errorData = await response.json();
        alert(errorData.message);
      }
    } catch (error) {
      console.error("로그인 에러:", error);
    }
  };

  const handleSocialSuccess = (user: any, token?: string) => {
    // 팝업에서 전달된 사용자 정보로 클라이언트 상태를 갱신합니다.
    console.log("social login success", user, token);

    // token이 undefined일 경우 fallback 검사: 쿠키 또는 localStorage에 저장된 access_token 확인
    let finalToken = token;
    try {
      if (!finalToken) {
        // 쿠키에서 access_token 찾기
        const cookieMatch = document.cookie.match(
          /(?:^|; )access_token=([^;]+)/
        );
        if (cookieMatch) {
          finalToken = decodeURIComponent(cookieMatch[1]);
          console.debug("handleSocialSuccess: token recovered from cookie");
        }
      }
    } catch (e) {
      console.warn("handleSocialSuccess: cookie read failed", e);
    }

    try {
      if (!finalToken) {
        // localStorage에 저장된 토큰 확인 (다른 로직에서 저장했을 수 있음)
        const stored =
          localStorage.getItem("auth_token") ||
          localStorage.getItem("access_token");
        if (stored) {
          finalToken = stored;
          console.debug(
            "handleSocialSuccess: token recovered from localStorage"
          );
        }
      }
    } catch (e) {
      console.warn("handleSocialSuccess: localStorage read failed", e);
    }

    if (finalToken) {
      try {
        localStorage.setItem("auth_token", finalToken);
      } catch (e) {
        /* ignore */
      }
    } else {
      console.debug("handleSocialSuccess: no token available after fallbacks");
    }
    if (user) {
      login(user); // 6. 소셜 로그인 성공 시 스토어의 login 액션 호출
      closeLoginPopup();
    }
  };

  return (
    <div className="ui-control">
      {isLoggedIn && currentUser ? (
        // 로그인된 상태
        <div className="user-info-card">
          <div className="user-info-header">
            <h2 className="user-info-welcome">환영합니다!</h2>
          </div>
          <div className="user-info-body">
            <div className="user-info-profile">
              <img
                src={currentUser.picture || "https://via.placeholder.com/150"}
                alt={currentUser.name}
                className="user-info-avatar"
              />
              <div className="user-info-details">
                <h3 className="user-info-name">{currentUser.name}</h3>
                <p className="user-info-email">{currentUser.email}</p>
              </div>
            </div>
            {/* visit_count가 있다면 방문 횟수 표시 */}
            {currentUser.visit_count && (
              <div className="user-info-visit">
                <p className="user-info-visit-label">총 방문 횟수</p>
                <p className="user-info-visit-count">
                  {currentUser.visit_count}회
                </p>
              </div>
            )}
          </div>
          <div className="user-info-footer">
            <button className="user-info-logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      ) : (
        // 로그인되지 않은 상태 (빈 Fragment를 넣어 space-between 레이아웃 유지)
        <></>
      )}

      {/* 로그인 버튼은 항상 UI 컨트롤 영역 하단에 위치 */}
      {!isLoggedIn && (
        <div className="login">
          <button className="btn login-btn" onClick={handleOpenLogin}>
            {/* SVG 아이콘 추가 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            로그인 / 회원가입
          </button>
        </div>
      )}

      {isLoginPopupOpen && (
        <div className="login-popup-overlay" onClick={handleCloseLogin}>
          <div className="login-popup" onClick={(e) => e.stopPropagation()}>
            <div className="login-popup-header">
              <h2>{signUp ? "회원가입" : "로그인"}</h2>
              <button className="close-btn" onClick={handleCloseLogin}>
                ✕
              </button>
            </div>
            {!signUp ? (
              <div className="login-form">
                <div className="input-group">
                  <label>아이디</label>
                  <input
                    type="text"
                    name="username"
                    value={loginData.username}
                    onChange={handleInputChange}
                    placeholder="아이디를 입력하세요"
                  />
                </div>

                <div className="input-group">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>

                <button className="login-submit-btn" onClick={handleLogin}>
                  로그인
                </button>
                <button
                  className="login-submit-btn"
                  onClick={() => setSignUp(!signUp)}
                >
                  회원가입
                </button>

                <div className="divider">
                  <span></span>
                </div>

                <SocialLogin onSuccess={handleSocialSuccess} />
              </div>
            ) : (
              <div className="login-form">
                <div className="input-group">
                  <label>이름</label>
                  <input
                    type="text"
                    name="signupName"
                    value={signupData.signupName}
                    onChange={handleSignupInputChange}
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div className="input-group">
                  <label>아이디</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      name="signupUsername"
                      value={signupData.signupUsername}
                      onChange={handleSignupInputChange}
                      placeholder="아이디를 입력하세요"
                    />
                    <button
                      onClick={handleCheckId}
                      disabled={!isUsernameValid}
                      style={{
                        backgroundColor: !isUsernameValid ? "#ccc" : "#007bff",
                        color: !isUsernameValid ? "#888" : "#fff",
                        cursor: !isUsernameValid ? "not-allowed" : "pointer",
                      }}
                    >
                      중복검사
                    </button>
                  </div>
                  {idError && <p className="id-error-message">{idError}</p>}
                  {idMessage && (
                    <p className="id-success-message">{idMessage}</p>
                  )}
                </div>

                <div className="input-group">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    name="signupPassword"
                    value={signupData.signupPassword}
                    onChange={handleSignupInputChange}
                    placeholder="비밀번호를 입력하세요"
                  />
                  {pwError && <p className="pw-error-message">{pwError}</p>}
                </div>

                <div className="input-group">
                  <label>휴대폰번호</label>
                  <input
                    type="tel"
                    name="signupMobile"
                    value={signupData.signupMobile}
                    onChange={handleSignupInputChange}
                    placeholder="휴대폰번호를 입력하세요"
                  />
                  {mobileError && (
                    <p className="mobile-error-message">{mobileError}</p>
                  )}
                </div>

                <div className="input-group">
                  <label>e-mail</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      name="signupEmail"
                      value={signupData.signupEmail}
                      onChange={handleSignupInputChange}
                      placeholder="이메일을 입력하세요"
                    />
                    <button
                      onClick={handleSendVerificationCode}
                      disabled={
                        isVerified ||
                        isSendingCode ||
                        !isEmailValid ||
                        isEmailCachedBlocked
                      }
                      style={{
                        backgroundColor:
                          isVerified || isSendingCode || isEmailCachedBlocked
                            ? "#ccc"
                            : isEmailValid
                            ? "#007bff"
                            : "#ccc",
                        color:
                          isVerified || isSendingCode || isEmailCachedBlocked
                            ? "#888"
                            : isEmailValid
                            ? "#fff"
                            : "#888",
                        cursor:
                          isVerified || isSendingCode || isEmailCachedBlocked
                            ? "not-allowed"
                            : isEmailValid
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      {isSendingCode
                        ? "발송중..."
                        : isCodeSent
                        ? "재전송"
                        : "인증요청"}
                    </button>
                  </div>
                </div>
                {isCodeSent && !isVerified && (
                  <div className="input-group">
                    <label>인증코드</label>
                    <div className="input-with-button">
                      <input
                        type="text"
                        placeholder="코드를 입력하세요"
                        value={verificationCode}
                        maxLength={6}
                        onChange={(e) => {
                          // 숫자만 허용
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setVerificationCode(val);
                        }}
                      />
                      <button
                        onClick={handleVerifyCode}
                        disabled={!/^\d{6}$/.test(verificationCode)}
                        style={{
                          backgroundColor: /^\d{6}$/.test(verificationCode)
                            ? "#007bff"
                            : "#ccc",
                          color: /^\d{6}$/.test(verificationCode)
                            ? "#fff"
                            : "#888",
                          cursor: /^\d{6}$/.test(verificationCode)
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        인증확인
                      </button>
                    </div>
                  </div>
                )}
                {message && (
                  <p className="message responsive-message">{message}</p>
                )}
                {error && <p className="error">{error}</p>}
                {isVerified && (
                  <div className="verification-success">
                    ✔ 이메일 인증이 완료되었습니다.
                  </div>
                )}
                <div className="button-group">
                  <button
                    className="login-submit-btn"
                    onClick={handleSignup}
                    disabled={
                      !(
                        isEmailVerified &&
                        signupData.signupName.trim() &&
                        signupData.signupUsername.trim() &&
                        signupData.signupPassword.trim() &&
                        signupData.signupMobile.trim() &&
                        !idError &&
                        !pwError &&
                        !mobileError
                      )
                    }
                    style={{
                      backgroundColor:
                        isEmailVerified &&
                        signupData.signupName.trim() &&
                        signupData.signupUsername.trim() &&
                        signupData.signupPassword.trim() &&
                        !idError &&
                        !pwError &&
                        !mobileError
                          ? "#007bff"
                          : "#ccc",
                      color:
                        isEmailVerified &&
                        signupData.signupName.trim() &&
                        signupData.signupUsername.trim() &&
                        signupData.signupPassword.trim() &&
                        !idError &&
                        !pwError &&
                        !mobileError
                          ? "#fff"
                          : "#888",
                      cursor:
                        isEmailVerified &&
                        signupData.signupName.trim() &&
                        signupData.signupUsername.trim() &&
                        signupData.signupPassword.trim() &&
                        !idError &&
                        !pwError &&
                        !mobileError
                          ? "pointer"
                          : "not-allowed",
                      marginTop: "8px",
                    }}
                  >
                    회원가입
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="Guide">
        <div className="guide-card">
          <div className="guide-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="guide-icon"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <h5 className="guide-title">PC 사용법</h5>
          </div>
          <p className="guide-description">
            오른쪽에 위치한 파일 업로드 버튼을 누르고 로또 QR코드가 포함된
            사진을 업로드 해주세요.
          </p>
        </div>
        <div className="guide-card">
          <div className="guide-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="guide-icon"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <h5 className="guide-title">모바일 사용법</h5>
          </div>
          <p className="guide-description">
            QR 코드를 카메라에 인식시키면 당첨결과가 나옵니다. 또한 당첨시간에
            맞추어 알람을 카카오톡으로 발송해드립니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UIctrl;
