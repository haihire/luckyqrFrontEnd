import { Scanner, IScannerProps } from "@yudiel/react-qr-scanner";
import { useEffect, useState } from "react";
import "./QRScanner.css";
import useUserStore from "../store/userStore";

const scannerStyles: IScannerProps["styles"] = {
  container: {
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
};

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const transitionDuration = 5;

  const { isLoggedIn, openLoginPopup } = useUserStore();

  useEffect(() => {
    // 여기에 마운트 시 실행할 코드가 있으면 작성
  }, []);

  const handleSaveClick = () => {
    if (isLoggedIn) {
      console.log("로그인 되어있음");
      // 추후 여기에 번호를 서버에 저장하는 API 호출 로직을 추가할 수 있습니다.
    } else {
      openLoginPopup();
    }
  };

  const sendToBackend = async (qrValue: string) => {
    try {
      console.log("📡 QR 값을 서버로 전송 중:", qrValue);
      setScanResult("🔄 스캔 결과 확인 중...");
      setShowSaveButton(false);

      // qrValue를 쿼리 파라미터로 전달
      // const response = await fetch(`/api/scan?qr_code=${qrValue}`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scan?qr_code=${qrValue}`
      );
      if (response.ok) {
        const data = await response.json();

        // 당첨 결과에 따라 메시지 설정
        if (data.all_amount) {
          setScanResult(`🎉 당첨! ${data.all_amount}원`);
        } else if (data.result === "낙첨") {
          setScanResult(`${data.round}\n${data.date}\n결과: ${data.result}`);
          setTimeout(() => {
            setScanResult(null);
          }, transitionDuration * 1000); // 5초 후에 메시지 사라짐
        } else if (data.result === "미정") {
          setScanResult(
            "아직 결과가 발표되지 않았습니다. \n해당번호의 알림을 원하시면 저장 버튼을 눌러주세요"
          );
          setShowSaveButton(true);
        } else {
          setScanResult("✅ 스캔 완료");
        }
      } else {
        const errorData = await response.json();
        console.error("❌ 서버 에러:", errorData);
        setScanResult("❌ 스캔 실패: 서버 오류");
      }
    } catch (err) {
      console.error("❌ 네트워크 에러:", err);
      setScanResult("❌ 네트워크 연결 실패");
    }
  };

  return (
    <>
      {/* 라이브러리 기본 오버레이 숨기기 위한 전역 스타일 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* 라이브러리의 기본 스캔 가이드라인 숨기기 */
          [data-testid="scanner-overlay"],
          .qr-scanner-overlay,
          div[style*="border: 2px dashed"] {
            display: none !important;
          }
        `,
        }}
      />

      <div className="qr-scanner-container">
        {/* 스캔 결과 표시 영역 - 카메라 상단 */}

        {/* QR 스캐너 */}
        <Scanner
          allowMultiple={false}
          scanDelay={3}
          constraints={{
            facingMode: "environment",
            aspectRatio: 1,
          }}
          formats={["qr_code", "code_128", "code_39", "ean_13", "ean_8"]}
          onScan={(result) => {
            if (result && result[0]?.rawValue) {
              sendToBackend(result[0].rawValue);
            }
          }}
          onError={(error) => {
            console.error("❌ 스캐너 에러:", error);
            const errorObj = error as any;
            if (errorObj?.name === "NotAllowedError") {
              setScanResult("❌ 카메라 권한이 필요합니다.");
            } else {
              setScanResult(
                "모바일로 접속해주세요.\n 저장을 위해서 로그인을 진행해주세요."
              );
            }
          }}
          styles={scannerStyles}
        >
          {scanResult && (
            <div className="resultContainer">
              {scanResult}
              {showSaveButton && (
                <button className="save-button" onClick={handleSaveClick}>
                  저장
                </button>
              )}
            </div>
          )}
        </Scanner>
      </div>
    </>
  );
}
