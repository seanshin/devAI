import ChatInterface from '@/components/ChatInterface';

export default function OrchestratePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI 오케스트레이터</h1>
        <p className="mt-2 text-gray-600">자연어로 자동 워크플로우를 실행하세요</p>
      </div>
      <ChatInterface />
    </div>
  );
}
