"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const QRScanner = dynamic(() => import("../components/QRScanner"), {
  ssr: false,
});

const UIctrl = dynamic(() => import("../components/UIctrl"), {
  ssr: false,
});

export default function Home() {
  useEffect(() => {
    // 백엔드 서버에 직접 연결을 확인하는 함수
    const checkBackendConnection = async () => {
      // 환경 변수에서 백엔드 주소를 가져옵니다. 올바른 커밋
      console.log("환경 변수:", process);
      console.log("백엔드 주소:", process.env);
      console.log(
        "NEXT_PUBLIC_API_BASE_URL:",
        process.env.NEXT_PUBLIC_API_BASE_URL
      );

      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      // 백엔드 주소가 설정되지 않았으면 아무것도 하지 않습니다.
      if (!backendUrl) {
        console.error(
          "백엔드 주소(NEXT_PUBLIC_API_BASE_URL)가 설정되지 않았습니다."
        );
        return;
      }

      try {
        // 백엔드 서버의 루트('/') 주소로 직접 fetch 요청을 보냅니다.
        const response = await fetch(backendUrl);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ 백엔드 연결 성공:", data.message);
        } else {
          // 백엔드 서버가 응답은 했지만, 정상(200 OK) 상태가 아닐 때
          console.error(
            `❌ 백엔드 연결 실패: 서버가 ${response.status} 코드로 응답했습니다.`
          );
          alert("백엔드 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
        }
      } catch (error) {
        // 네트워크 오류 등으로 백엔드 서버에 아예 연결하지 못했을 때
        console.error("❌ 백엔드 통신 오류:", error);
        alert(
          "백엔드 서버와 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요."
        );
      }
    };

    // 페이지가 로드될 때 백엔드 연결을 확인합니다.
    checkBackendConnection();
  }, []); // 이 useEffect는 페이지가 처음 로드될 때 한 번만 실행됩니다.

  return (
    <div className="container">
      <QRScanner />
      <UIctrl />
    </div>
  );
}
