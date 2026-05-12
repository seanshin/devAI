import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '실행 이력 - AI Orchestrator',
};

export default function HistoryPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">실행 이력</h1>
        <p className="mt-2 text-gray-600">지난 작업들을 확인하고 재실행할 수 있습니다</p>
      </div>

      {/* 검색 필터 */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">상태</label>
            <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2">
              <option>전체</option>
              <option>완료</option>
              <option>실패</option>
              <option>진행 중</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">날짜</label>
            <input type="date" className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">검색</label>
            <input
              type="text"
              placeholder="입력 내용 검색..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* 이력 리스트 */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-medium text-gray-900">최근 작업</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${i % 2 === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900">FastAPI 인증 시스템</p>
                    <p className="mt-1 text-sm text-gray-600">2분 전 · 5분 소요</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    i % 2 === 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {i % 2 === 0 ? '완료' : '실패'}
                </span>
                <button className="rounded px-3 py-1 text-sm text-blue-600 hover:bg-blue-50">
                  상세보기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
