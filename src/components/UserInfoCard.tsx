import React from "react";

// user 객체의 타입을 정의합니다.
interface User {
  provider: "naver" | "kakao" | "luckyqr" | string; // 로그인 제공자
  picture?: string; // 프로필 사진 URL (선택적)
  name: string;
  email: string;
  visit_count: number;
}

// UserInfoCard 컴포넌트가 받을 props의 타입을 정의합니다.
interface UserInfoCardProps {
  user: User | null; // user 객체는 로그인 전에는 null일 수 있습니다.
  onLogout: () => void; // 로그아웃 함수
}

// 각 로그인 제공자별 스타일 정보를 위한 타입
interface ProviderStyle {
  logo: string;
  bgColor: string;
}

// 로그인 제공자에 따라 로고와 배경색을 반환하는 함수
const getProviderStyle = (provider: string): ProviderStyle => {
  switch (provider) {
    case "naver":
      return {
        logo: "https://statics.goorm.io/images/social/logo/naver.svg",
        bgColor: "bg-[#03C75A]", // 네이버 녹색
      };
    case "kakao":
      return {
        logo: "https://statics.goorm.io/images/social/logo/kakao.svg",
        bgColor: "bg-[#FEE500]", // 카카오 노란색
      };
    default:
      return {
        logo: "/luckyqr-logo.svg", // public 폴더에 있는 직접 만드신 로고 경로
        bgColor: "bg-red-500", // 기본 색상
      };
  }
};

const UserInfoCard: React.FC<UserInfoCardProps> = ({ user, onLogout }) => {
  // user가 null이면 아무것도 렌더링하지 않습니다.
  if (!user) {
    return null;
  }

  const { logo, bgColor } = getProviderStyle(user.provider);

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
      {/* --- 카드 상단 헤더 --- */}
      <div className={`p-4 ${bgColor} relative`}>
        <h2 className="text-xl font-bold text-white text-center">
          환영합니다!
        </h2>
        {/* 로그인 제공자 로고 */}
        <img
          src={logo}
          alt={`${user.provider} logo`}
          className="w-8 h-8 absolute top-3 right-3 bg-white rounded-full p-1"
        />
      </div>

      {/* --- 프로필 정보 --- */}
      <div className="p-6">
        <div className="flex items-center space-x-4">
          {/* 프로필 이미지 */}
          <img
            className="w-20 h-20 rounded-full border-4 border-gray-200 object-cover"
            src={user.picture || "https://via.placeholder.com/150"} // picture가 없을 경우 기본 이미지
            alt="Profile"
          />
          {/* 이름 및 이메일 */}
          <div className="flex-1 min-w-0">
            {" "}
            {/* min-w-0는 자식 요소의 크기가 부모를 넘어가는 것을 방지합니다. */}
            <p className="text-2xl font-extrabold text-gray-800 truncate">
              {user.name}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* --- 방문 횟수 --- */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">총 방문 횟수</p>
          <p className="text-2xl font-bold text-indigo-600">
            {user.visit_count}회
          </p>
        </div>
      </div>

      {/* --- 로그아웃 버튼 --- */}
      <div className="px-6 pb-6">
        <button
          onClick={onLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default UserInfoCard;
