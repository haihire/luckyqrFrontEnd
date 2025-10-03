import { Suspense } from "react";
import NaverCallbackClient from "./NaverCallbackClient";

// 이 페이지는 항상 동적으로 렌더링되어야 함을 명시합니다.
export const dynamic = "force-dynamic";

export default function NaverCallbackPage() {
  return (
    // Suspense로 감싸서 로딩 중임을 알려줍니다.
    <Suspense fallback={<LoadingSpinner />}>
      <NaverCallbackClient />
    </Suspense>
  );
}

// 로딩 중에 보여줄 UI 컴포넌트
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-gray-600">네이버 로그인 처리 중...</p>
        <p className="text-sm text-gray-400 mt-2">잠시만 기다려 주세요</p>
      </div>
    </div>
  );
}
