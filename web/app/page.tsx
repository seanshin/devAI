import Dashboard from '@/components/Dashboard';
import ChatInterface from '@/components/ChatInterface';

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Orchestrator</h1>
        <p className="mt-2 text-gray-600">자연어로 대화하듯 작업을 자동으로 실행하세요</p>
      </div>

      {/* Chat Interface */}
      <div className="mb-8">
        <ChatInterface />
      </div>

      {/* Live Dashboard */}
      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">실시간 모니터링</h2>
        <Dashboard />
      </div>
    </div>
  );
}
