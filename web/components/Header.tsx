'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="px-6 py-4">
        {/* 상단 타이틀 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Orchestrator</h1>
            <p className="mt-1 text-sm text-gray-600">WeRU.B 기반 자동 워크플로우 실행</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/orchestrate"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
              새 작업 시작
            </Link>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex gap-6">
          <Link
            href="/"
            className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
              isActive('/')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            대시보드
          </Link>
          <Link
            href="/orchestrate"
            className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
              isActive('/orchestrate')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            오케스트레이터
          </Link>
          <Link
            href="/history"
            className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
              isActive('/history')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            이력
          </Link>
          <Link
            href="/rag"
            className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
              isActive('/rag')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            RAG 검색
          </Link>
          <Link
            href="/projects"
            className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
              isActive('/projects')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            프로젝트
          </Link>
        </nav>
      </div>
    </header>
  );
}
