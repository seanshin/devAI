import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RAG 검색 - AI Orchestrator',
};

export default function RagPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">RAG 검색</h1>
        <p className="mt-2 text-gray-600">벡터 기반 문서 검색으로 관련 정보를 찾으세요</p>
      </div>

      {/* 검색 입력 */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              검색어
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="search"
                type="text"
                placeholder="검색할 내용을 입력하세요..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              />
              <button className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
                검색
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">결과 수</label>
            <select className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2">
              <option>5개</option>
              <option>10개</option>
              <option>20개</option>
              <option>50개</option>
            </select>
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">관련 문서 {i}</h3>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                스코어: {(95 - i * 5).toFixed(1)}%
              </span>
            </div>
            <p className="mb-3 text-gray-600">
              이 문서는 검색 쿼리와 관련된 내용을 포함하고 있습니다. FastAPI, 인증, 데이터베이스 등의
              내용이 포함되어 있으며 실제 구현에 도움이 될 수 있습니다.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">메타데이터: {i}</span>
              <button className="text-sm text-blue-600 hover:underline">상세보기</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
