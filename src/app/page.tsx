"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const QRScanner = dynamic(() => import("../components/QRScanner"), {
  ssr: false,
});

const UIctrl = dynamic(() => import("../components/UIctrl"), {
  ssr: false,
});
//reSTart
export default function Home() {
  useEffect(() => {
    const connectionCheck = async () => {
      try {
        const response = await fetch(`/api/connection`);
        if (response.ok) {
          const data = await response.json();
          console.log(data);
        } else {
          const errorData = await response.json();
          console.log(
            "⚠️ 백엔드 연결 실패. 상태 코드: " +
              response.status +
              "\n에러: " +
              JSON.stringify(errorData)
          );
        }
      } catch (err) {
        alert("❌ API route 연결 실패: " + err);
      }
    };

    connectionCheck();
  }, []);

  return (
    <div className="container">
      <QRScanner />
      <UIctrl />
    </div>
  );
}
