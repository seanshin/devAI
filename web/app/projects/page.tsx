import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로젝트 - AI Orchestrator',
};

export default function ProjectsPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">프로젝트</h1>
          <p className="mt-2 text-gray-600">모든 프로젝트를 관리하고 구성하세요</p>
        </div>
        <button className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          + 새 프로젝트
        </button>
      </div>

      {/* 프로젝트 그리드 */}
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition"
          >
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">프로젝트 {i}</h3>
              <p className="mt-1 text-sm text-gray-600">
                생성된 날짜: {new Date(2026, 4, 12 - i).toLocaleDateString('ko-KR')}
              </p>
            </div>

            <div className="mb-4 border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-medium">작업 수:</span> {5 + i}
                </p>
                <p>
                  <span className="font-medium">완료:</span> {3 + i}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                열기
              </button>
              <button className="flex-1 rounded-lg bg-blue-100 px-4 py-2 text-sm text-blue-700 hover:bg-blue-200">
                편집
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {false && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-lg text-gray-600">프로젝트가 없습니다</p>
          <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
            첫 프로젝트 생성
          </button>
        </div>
      )}
    </div>
  );
}
