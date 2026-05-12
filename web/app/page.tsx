import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">실시간 대시보드</h1>
        <p className="mt-2 text-gray-600">진행 중인 작업의 상태를 모니터링하세요</p>
      </div>
      <Dashboard />
    </div>
  );
}
