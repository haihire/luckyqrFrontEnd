import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [results, setResults] = useState<string[]>([]);
  const [count, setCount] = useState(1);

  const handleGenerate = async () => {
    const res = await fetch(`http://localhost:8000/generate?count=${count}`);
    const data = await res.json();
    setResults(data.numbers);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎯 LuckyQR 메인 페이지</h1>

      {/* QR 코드 스캔하기 (추후 구현 예정) */}
      <button style={{ marginTop: "20px" }}>📷 QR 코드 스캔하기</button>

      {/* AI 번호 생성기 */}
      <div style={{ marginTop: "20px" }}>
        <h2>🎲 AI 번호 생성기</h2>
        <button onClick={() => setCount(count - 1)} disabled={count <= 1}>
          -
        </button>
        <span style={{ margin: "0 10px" }}>{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
        <br />
        <button onClick={handleGenerate}>번호 생성</button>

        <ul>
          {results.map((num, i) => (
            <li key={i}>{num}</li>
          ))}
        </ul>
      </div>

      {/* SEO용 설명 페이지 링크 */}
      <div style={{ marginTop: "40px" }}>
        <Link href="/how-to">👉 QR 확인 방법 보러가기</Link>
      </div>
    </div>
  );
}
