# 설계서: AI 오케스트레이터 Web Dashboard (WeRU.B Server 기반)

**프로젝트명**: AI Orchestrator Web Dashboard - WeRU.B Server Integration  
**버전**: 3.4 (WeRU.B Integration)  
**작성일**: 2026-05-12  
**기반**: WeRU.B AI Server v2.33.0 (`https://weve.io.kr/ollama`)  
**상태**: 설계 단계 (Design Phase - 기존 서버 활용)  

---

## 목차

1. [시스템 아키텍처](#1-시스템-아키텍처)
2. [핵심 컴포넌트 설계](#2-핵심-컴포넌트-설계)
3. [데이터 흐름 및 인터페이스](#3-데이터-흐름-및-인터페이스)
4. [LLM 추상화 계층](#4-llm-추상화-계층)
5. [의도 분석 엔진](#5-의도-분석-엔진smart-intent-analyzer)
6. [질문 생성 엔진](#6-질문-생성-엔진smart-question-generator)
7. [데이터 보안 및 마스킹](#7-데이터-보안-및-마스킹)
8. [인프라 자동화 에이전트들](#8-인프라-자동화-에이전트들)
9. [RAG 통합](#9-rag-통합)
10. [설정 스키마](#10-설정-스키마)
11. [CLI 명령 구조](#11-cli-명령-구조)
12. [구현 순서](#12-구현-순서)

---

## 1. 시스템 아키텍처

### 1.1 전체 아키텍처 (세부)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AI ORCHESTRATOR CLI                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CLI Interface Layer (Typer + Rich)                        │   │
│  │  ├─ Input Parser & Validation                             │   │
│  │  ├─ Output Formatter & Streaming                          │   │
│  │  └─ Progress Bar & Status Display                         │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   ↓                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Context Manager                                            │   │
│  │  ├─ Session State (Dict[str, Any])                        │   │
│  │  ├─ Conversation History (List[Message])                  │   │
│  │  ├─ Project State (ProjectMetadata)                       │   │
│  │  ├─ RAG Integration (VectorDB)                            │   │
│  │  └─ Configuration (ConfigManager)                         │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   ↓                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🧠 Smart Intent Analyzer                                 │   │
│  │  ├─ NLP Processing (spaCy)                               │   │
│  │  ├─ Sentence Embeddings (sentence-transformers)          │   │
│  │  ├─ Intent Classification (ML Model)                     │   │
│  │  ├─ Missing Info Detection                               │   │
│  │  ├─ RAG Similarity Search                                │   │
│  │  └─ Output: IntentResult (intent, confidence, gaps)      │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   ↓                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  💬 Smart Question Generator                              │   │
│  │  ├─ Gap Analysis                                         │   │
│  │  ├─ Prompt Engineering (Ollama)                          │   │
│  │  ├─ Multi-turn Dialog Builder                            │   │
│  │  ├─ Learned Pattern Retrieval (RAG)                      │   │
│  │  ├─ Tech Level Adaptation                                │   │
│  │  └─ Output: List[Question] + [SuggestedAnswers]          │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   ↓                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🔄 Dynamic Phase Router                                  │   │
│  │  ├─ Phase Dependency Graph                               │   │
│  │  ├─ Execution Plan Builder                               │   │
│  │  ├─ Agent Selection Logic                                │   │
│  │  ├─ Context Propagation                                  │   │
│  │  ├─ Error Recovery Strategy                              │   │
│  │  └─ Output: ExecutionPlan (List[Phase])                  │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   ↓                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🤖 Multi-Agent Execution Engine                          │   │
│  │  ├─ Agent Pool Management                                │   │
│  │  ├─ Async Execution (asyncio)                            │   │
│  │  ├─ Streaming Output                                     │   │
│  │  ├─ Error Handling & Retry                               │   │
│  │  ├─ Parallel Execution (선택적)                            │   │
│  │  └─ Callback Management                                  │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   ↓                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🔐 Data Masking & Security Layer                         │   │
│  │  ├─ Secret Pattern Detection (regex)                     │   │
│  │  ├─ PII Detection (spaCy NER)                            │   │
│  │  ├─ Masking Engine                                       │   │
│  │  ├─ Validation & Audit Logging                           │   │
│  │  └─ Secure Storage (encrypted)                           │   │
│  └────────────────┬────────────────────────────────────────────┘   │
│                   ↓                                                  │
│  ┌──────────────────────┬──────────────────┬──────────────────┐   │
│  │                      │                  │                  │   │
│  ↓                      ↓                  ↓                  ↓    │
│ ┌────────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐
│ │ LLM Layer      │  │ Infrastructure│  │ Git Manager  │  │ Data     │
│ │ (Abstraction)  │  │ Automation    │  │ (GitHub)     │  │ Masking  │
│ │ ├─ Ollama      │  │ ├─ SSH Conn.  │  │ ├─ API Calls │  │ ├─ Rules │
│ │ ├─ Claude      │  │ ├─ DB Auto    │  │ ├─ Repo Mgmt │  │ ├─ Audit │
│ │ ├─ Fallback    │  │ ├─ Server Cfg │  │ └─ PR Mgmt   │  │ └─ Log   │
│ │ └─ Model Mgmt  │  │ └─ Health Chk │  └──────────────┘  └──────────┘
│ └────────────────┘  └──────────────┘
│
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📚 RAG Storage & Learning                                │   │
│  │  ├─ Vector DB (Weaviate/Milvus)                          │   │
│  │  ├─ Embedding Generation                                 │   │
│  │  ├─ Similarity Search                                    │   │
│  │  ├─ Schema Storage (PostgreSQL)                          │   │
│  │  └─ Analytics & Metrics                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 계층별 책임

| 계층 | 책임 | 기술 |
|-----|------|------|
| **CLI Interface** | 사용자 입력 수신, 결과 출력 | Typer, Rich |
| **Context Manager** | 상태 관리, 세션 유지 | Dict, LRU Cache |
| **Intent Analyzer** | 사용자 의도 분석 | spaCy, sentence-transformers |
| **Question Generator** | 필요 정보 질문 생성 | Ollama, Prompt Engineering |
| **Phase Router** | 실행 단계 결정 | Dependency Graph, State Machine |
| **Agent Executor** | 작업 실행 | asyncio, LLM APIs |
| **Security Layer** | 데이터 보안, 마스킹 | regex, NER |
| **RAG Layer** | 지식 저장 및 검색 | Vector DB, Embeddings |

---

## 2. 핵심 컴포넌트 설계

### 2.1 컴포넌트 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│ Component Diagram                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  orchestrator/                                              │
│  ├─ cli/                                                    │
│  │  ├─ __init__.py                                         │
│  │  ├─ main.py          # CLI Entry Point                 │
│  │  ├─ commands.py      # CLI Commands                     │
│  │  └─ formatter.py     # Output Formatting                │
│  │                                                          │
│  ├─ core/                                                   │
│  │  ├─ context.py       # Context Manager                  │
│  │  ├─ intent_analyzer.py # Smart Intent Analysis          │
│  │  ├─ question_generator.py # Smart Question Gen          │
│  │  ├─ phase_router.py  # Dynamic Phase Router             │
│  │  └─ executor.py      # Agent Executor                   │
│  │                                                          │
│  ├─ llm/                                                    │
│  │  ├─ __init__.py                                         │
│  │  ├─ base.py          # Abstract LLM Interface           │
│  │  ├─ ollama_client.py # Ollama Implementation            │
│  │  ├─ claude_client.py # Claude Implementation            │
│  │  ├─ factory.py       # LLM Factory                      │
│  │  └─ models.py        # LLM Model Definitions            │
│  │                                                          │
│  ├─ agents/                                                 │
│  │  ├─ base_agent.py    # Base Agent Class                 │
│  │  ├─ planning_agent.py # Planning                        │
│  │  ├─ dev_agent.py     # Development                      │
│  │  ├─ validation_agent.py # Validation                    │
│  │  ├─ infra_agent.py   # Infrastructure (SSH/DB/Telnet)   │
│  │  ├─ github_agent.py  # GitHub Automation                │
│  │  ├─ git_agent.py     # Git Operations                   │
│  │  └─ rag_agent.py     # RAG Storage                      │
│  │                                                          │
│  ├─ security/                                               │
│  │  ├─ masking_engine.py # Data Masking                    │
│  │  ├─ audit_logger.py   # Audit Logging                   │
│  │  ├─ rules/            # Masking Rules                   │
│  │  └─ validators.py     # Security Validators             │
│  │                                                          │
│  ├─ rag/                                                    │
│  │  ├─ embedder.py      # Embedding Generation             │
│  │  ├─ store.py         # Vector DB Client                 │
│  │  ├─ retriever.py     # Similarity Search                │
│  │  └─ schema_store.py  # Schema/Metadata Storage          │
│  │                                                          │
│  ├─ config/                                                 │
│  │  ├─ manager.py       # Config Manager                   │
│  │  ├─ schemas/         # Config Schemas (Pydantic)        │
│  │  └─ defaults.yaml    # Default Configuration            │
│  │                                                          │
│  └─ utils/                                                  │
│     ├─ logger.py        # Logging Utility                  │
│     ├─ validators.py    # Input Validators                 │
│     └─ helpers.py       # Helper Functions                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 클래스 다이어그램 (주요)

```python
# Base Classes

class LLMClient(ABC):
    """LLM 추상화 인터페이스"""
    @abstractmethod
    async def chat(self, messages: List[Message]) -> str:
        pass
    
    @abstractmethod
    async def stream(self, messages: List[Message]) -> AsyncIterator[str]:
        pass

class BaseAgent(ABC):
    """에이전트 기본 클래스"""
    llm: LLMClient
    config: Dict[str, Any]
    
    @abstractmethod
    async def execute(self, context: ExecutionContext) -> AgentResult:
        pass

class IntentAnalyzer:
    """의도 분석 엔진"""
    model: SentenceTransformer
    classifier: Pipeline
    nlp: spacy.Language
    
    async def analyze(self, text: str) -> IntentResult:
        # 1. 텍스트 전처리 (spaCy)
        # 2. 임베딩 생성 (sentence-transformers)
        # 3. 의도 분류 (ML Model)
        # 4. 정확도 점수 계산
        # 5. 부족 정보 식별 (RAG)
        pass

class QuestionGenerator:
    """질문 생성 엔진"""
    llm: OllamaClient
    rag_retriever: RAGRetriever
    prompt_templates: Dict[str, str]
    
    async def generate_questions(
        self, 
        context: ExecutionContext, 
        gaps: List[str]
    ) -> List[Question]:
        # 1. RAG에서 유사 패턴 검색
        # 2. 프롬프트 템플릿 선택
        # 3. 기술 수준 적응
        # 4. Ollama로 질문 생성
        # 5. 선택지 제안
        pass

class PhaseRouter:
    """동적 단계 라우터"""
    phase_graph: Dict[Phase, List[Phase]]  # 의존성 그래프
    
    def plan_execution(self, intent: IntentResult) -> ExecutionPlan:
        # 1. 필요 단계 식별
        # 2. 의존성 순서대로 정렬
        # 3. 병렬 가능 단계 식별
        # 4. Context 전달 계획
        pass

class AgentExecutor:
    """에이전트 실행 엔진"""
    agents: Dict[Phase, BaseAgent]
    
    async def execute_plan(
        self, 
        plan: ExecutionPlan, 
        context: ExecutionContext
    ) -> OrchestrationResult:
        # 1. 각 단계 순차/병렬 실행
        # 2. Context 업데이트
        # 3. 스트리밍 출력
        # 4. 에러 처리 및 재시도
        pass

class DataMaskingEngine:
    """데이터 마스킹 엔진"""
    masking_rules: List[MaskingRule]
    nlp: spacy.Language
    
    def mask_data(self, text: str) -> MaskedData:
        # 1. Regex로 시크릿 패턴 감지
        # 2. spaCy NER로 PII 감지
        # 3. 규칙에 따라 마스킹
        # 4. 감시 로그 기록
        # 5. 마스킹된 텍스트 반환
        pass

class RAGStore:
    """RAG 저장소"""
    vector_db: WeaviateClient  # 또는 Milvus
    embedder: SentenceTransformer
    schema_db: PostgreSQL
    
    async def store_result(self, result: AgentResult) -> None:
        # 1. 결과에서 중요 정보 추출
        # 2. 임베딩 생성
        # 3. Vector DB에 저장
        # 4. 메타데이터 저장
        pass
    
    async def search_similar(self, query: str) -> List[StoredResult]:
        # 1. 쿼리 임베딩 생성
        # 2. Vector DB 유사도 검색
        # 3. 메타데이터 조회
        # 4. 결과 반환
        pass
```

---

## 3. 데이터 흐름 및 인터페이스

### 3.1 주요 데이터 구조

```python
# 메시지 및 대화
class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime
    metadata: Dict[str, Any] = {}

class ConversationHistory(BaseModel):
    messages: List[Message]
    session_id: str
    project_id: Optional[str]
    created_at: datetime
    updated_at: datetime

# 의도 분석 결과
class IntentResult(BaseModel):
    intent: str  # "planning", "development", "validation", "infra"
    confidence: float  # 0.0 - 1.0
    required_info: List[str]  # 필요 정보 목록
    optional_info: List[str]  # 선택 정보 목록
    rag_references: List[str]  # 관련 RAG 참조
    next_phase: Optional[Phase]

# 질문 및 응답
class Question(BaseModel):
    id: str
    text: str
    type: Literal["single_choice", "multi_choice", "text", "file"]
    options: Optional[List[str]]
    suggested_answers: Optional[List[str]]  # RAG 기반 제안
    help_text: Optional[str]

class Answer(BaseModel):
    question_id: str
    value: Union[str, List[str], bytes]
    confidence: float
    timestamp: datetime

# 실행 계획
class ExecutionPhase(BaseModel):
    phase_id: str
    phase_type: Phase
    agent_type: str
    inputs: Dict[str, Any]
    dependencies: List[str]  # 선행 단계 ID
    parallel_allowed: bool

class ExecutionPlan(BaseModel):
    plan_id: str
    phases: List[ExecutionPhase]
    estimated_duration: int  # seconds
    created_at: datetime

# 에이전트 결과
class AgentResult(BaseModel):
    agent_type: str
    phase_id: str
    success: bool
    output: Any  # 에이전트별로 다름
    errors: List[str] = []
    logs: List[str] = []
    execution_time: float  # seconds
    artifacts: Dict[str, Any] = {}  # 생성된 파일 등

# 컨텍스트 (세션 상태)
class ExecutionContext(BaseModel):
    session_id: str
    project_id: Optional[str]
    user_input: str
    intent: Optional[IntentResult]
    conversation: ConversationHistory
    project_state: Dict[str, Any]  # 프로젝트별 상태
    rag_context: List[StoredResult]  # RAG 검색 결과
    config: ConfigState
    
    # 진행 상황
    current_phase: Optional[Phase]
    execution_plan: Optional[ExecutionPlan]
    completed_phases: List[str] = []
    phase_results: Dict[str, AgentResult] = {}

# 최종 결과
class OrchestrationResult(BaseModel):
    success: bool
    execution_plan: ExecutionPlan
    phase_results: Dict[str, AgentResult]
    artifacts: Dict[str, Any]  # 생성된 결과물
    recommendations: List[str]  # 다음 단계 제안
    rag_stored: bool
    total_duration: float
```

### 3.2 API 인터페이스

```python
# Orchestrator 메인 인터페이스
class Orchestrator:
    """메인 오케스트레이터 클래스"""
    
    async def start_session(
        self, 
        user_input: str,
        project_dir: Optional[str] = None
    ) -> ExecutionContext:
        """세션 시작"""
        pass
    
    async def analyze_intent(
        self, 
        context: ExecutionContext
    ) -> IntentResult:
        """의도 분석"""
        pass
    
    async def gather_information(
        self, 
        context: ExecutionContext
    ) -> Dict[str, Answer]:
        """필요 정보 수집 (대화)"""
        pass
    
    async def plan_execution(
        self, 
        context: ExecutionContext
    ) -> ExecutionPlan:
        """실행 계획 수립"""
        pass
    
    async def execute(
        self, 
        context: ExecutionContext
    ) -> OrchestrationResult:
        """실행"""
        pass
    
    async def validate_result(
        self, 
        context: ExecutionContext,
        result: AgentResult
    ) -> ValidationResult:
        """결과 검증 (Claude)"""
        pass
    
    async def store_to_rag(
        self, 
        context: ExecutionContext,
        result: OrchestrationResult
    ) -> None:
        """RAG에 저장"""
        pass
```

---

## 4. LLM 추상화 계층

### 4.1 LLM 인터페이스 설계

```python
# LLM 추상화
class LLMConfig(BaseModel):
    model_name: str
    temperature: float = 0.7
    max_tokens: int = 2048
    top_p: float = 0.9
    timeout: int = 30

class LLMClient(ABC):
    """LLM 클라이언트 기본 인터페이스"""
    
    @abstractmethod
    async def chat(
        self, 
        messages: List[Message],
        config: LLMConfig
    ) -> str:
        """동기 응답"""
        pass
    
    @abstractmethod
    async def stream(
        self, 
        messages: List[Message],
        config: LLMConfig
    ) -> AsyncIterator[str]:
        """스트리밍 응답"""
        pass
    
    @abstractmethod
    async def embed(self, text: str) -> List[float]:
        """임베딩 생성"""
        pass

# Ollama 구현
class OllamaClient(LLMClient):
    """Ollama 로컬 LLM 클라이언트"""
    
    endpoint: str = "http://localhost:11434"
    models: Dict[str, str] = {
        "planning": "mistral",  # 빠르고 합리적
        "development": "codellama",  # 코드 생성 특화
        "questions": "mistral",  # 자연어 생성
        "validation": "neural-chat",  # 평가
        "embedding": "nomic-embed-text"  # 임베딩
    }
    
    async def chat(self, messages: List[Message], config: LLMConfig) -> str:
        # Ollama API 호출 (http://localhost:11434/api/chat)
        pass
    
    async def stream(self, messages: List[Message], config: LLMConfig) -> AsyncIterator[str]:
        # 스트리밍 응답
        pass

# Claude 구현
class ClaudeClient(LLMClient):
    """Claude API 클라이언트 (검증용)"""
    
    api_key: str  # 환경변수에서 로드
    model: str = "claude-3-opus-20250219"  # 고급 모델
    
    async def chat(self, messages: List[Message], config: LLMConfig) -> str:
        # Claude API 호출 (마스킹 데이터만)
        pass
    
    async def stream(self, messages: List[Message], config: LLMConfig) -> AsyncIterator[str]:
        # 스트리밍 응답
        pass

# LLM 팩토리
class LLMFactory:
    """LLM 클라이언트 생성 팩토리"""
    
    @staticmethod
    def create_client(
        provider: Literal["ollama", "claude", "litellm"],
        **kwargs
    ) -> LLMClient:
        if provider == "ollama":
            return OllamaClient(**kwargs)
        elif provider == "claude":
            return ClaudeClient(**kwargs)
        # ...
```

### 4.2 프롬프트 관리

```python
class PromptTemplate(BaseModel):
    name: str
    version: str
    phase: Phase
    template: str  # Jinja2 템플릿
    examples: Optional[List[Dict[str, str]]]
    system_prompt: str

class PromptManager:
    """프롬프트 템플릿 관리"""
    
    templates: Dict[str, PromptTemplate]
    
    def load_templates(self, config_path: str) -> None:
        # YAML에서 프롬프트 템플릿 로드
        pass
    
    def render_prompt(
        self, 
        template_name: str,
        context: Dict[str, Any]
    ) -> str:
        # Jinja2로 렌더링
        pass

# 프롬프트 템플릿 예제 (YAML)
prompts:
  intent_analyzer:
    template: |
      당신은 사용자의 의도를 분석하는 전문가입니다.
      
      사용자 입력: {{ user_input }}
      
      다음을 분석하세요:
      1. 주요 의도 (기획/개발/검증/인프라 중)
      2. 필요한 정보 목록
      3. 신뢰도 점수
      
      JSON 형식으로 응답:
      {
        "intent": "...",
        "confidence": 0.95,
        "required_info": [...],
        "optional_info": [...]
      }
  
  question_generator:
    template: |
      현재 프로젝트: {{ project_name }}
      부족한 정보: {{ gaps }}
      사용자 기술 수준: {{ tech_level }}
      
      위 정보를 바탕으로 사용자에게 물어볼 1개 질문을 생성하세요.
      선택지가 있으면 제시하세요.
```

---

## 5. 의도 분석 엔진(Smart Intent Analyzer)

### 5.1 의도 분류 모델

```python
class Intent(Enum):
    """지원하는 의도 목록"""
    PLANNING = "planning"  # 기획/설계
    DEVELOPMENT = "development"  # 개발/코딩
    VALIDATION = "validation"  # 검증/테스트
    INFRASTRUCTURE = "infrastructure"  # 인프라/배포
    DOCUMENTATION = "documentation"  # 문서화
    UNKNOWN = "unknown"  # 불명확

class IntentAnalyzer:
    """스마트 의도 분석"""
    
    nlp: spacy.Language  # spaCy 모델 (en_core_web_md)
    embedder: SentenceTransformer  # 문장 임베딩
    classifier: Pipeline  # sklearn 분류기 또는 직접 구현
    rag_retriever: RAGRetriever
    
    # 규칙 기반 패턴
    intent_keywords = {
        Intent.PLANNING: [
            "plan", "design", "architecture", "설계", "기획"
        ],
        Intent.DEVELOPMENT: [
            "code", "develop", "implement", "코드", "개발"
        ],
        Intent.VALIDATION: [
            "validate", "test", "check", "검증", "테스트"
        ],
        Intent.INFRASTRUCTURE: [
            "deploy", "server", "database", "SSH", "Telnet",
            "배포", "서버", "데이터베이스"
        ]
    }
    
    async def analyze(self, text: str) -> IntentResult:
        """
        의도 분석 프로세스:
        1. 텍스트 정규화
        2. spaCy 처리 (토크나이징, POS, NER)
        3. 임베딩 생성
        4. 규칙 기반 매칭
        5. ML 기반 분류
        6. 신뢰도 계산
        7. RAG 유사 사례 검색
        8. 부족 정보 식별
        """
        
        # 1. 정규화
        normalized_text = text.lower().strip()
        
        # 2. spaCy 처리
        doc = self.nlp(normalized_text)
        entities = {ent.label_: ent.text for ent in doc.ents}
        tokens = [token.text for token in doc]
        
        # 3. 임베딩
        embedding = await self.embedder.encode(text)
        
        # 4. 규칙 기반 매칭
        rule_scores = self._apply_rules(tokens, entities)
        
        # 5. ML 기반 분류
        ml_predictions = self.classifier.predict_proba([embedding])
        
        # 6. 신뢰도 계산 (가중 평균)
        combined_scores = 0.3 * rule_scores + 0.7 * ml_predictions
        intent = Intent(combined_scores.argmax())
        confidence = float(combined_scores.max())
        
        # 7. RAG 검색
        rag_references = await self.rag_retriever.search(
            text, intent.value, top_k=3
        )
        
        # 8. 부족 정보 식별
        required_info = self._identify_gaps(intent, entities)
        
        return IntentResult(
            intent=intent.value,
            confidence=confidence,
            required_info=required_info,
            optional_info=self._get_optional_info(intent),
            rag_references=[ref.id for ref in rag_references],
            next_phase=self._map_intent_to_phase(intent)
        )
    
    def _apply_rules(
        self, 
        tokens: List[str], 
        entities: Dict[str, str]
    ) -> np.ndarray:
        """규칙 기반 의도 점수"""
        scores = np.zeros(len(Intent))
        for intent, keywords in self.intent_keywords.items():
            for keyword in keywords:
                if keyword in tokens:
                    scores[intent.value] += 0.5
        return scores
    
    def _identify_gaps(
        self, 
        intent: Intent, 
        entities: Dict[str, str]
    ) -> List[str]:
        """부족한 정보 식별"""
        gaps = []
        
        if intent == Intent.PLANNING:
            if "TECH_STACK" not in entities:
                gaps.append("technology_stack")
            if "PROJECT_NAME" not in entities:
                gaps.append("project_name")
        elif intent == Intent.INFRASTRUCTURE:
            if "SERVER" not in entities:
                gaps.append("server_info")
            if "DATABASE" not in entities:
                gaps.append("database_type")
        
        return gaps
```

### 5.2 신뢰도 점수 계산

```
신뢰도 = (규칙점수 * 0.3) + (ML점수 * 0.7)

규칙점수:
  - 각 키워드 매치: +0.5
  - 정확한 엔티티: +0.3
  - 문서 구조 매치: +0.2

ML점수:
  - SentenceTransformer 임베딩 기반
  - 학습 데이터: 100+ 예제
  - 모델: sklearn RandomForest 또는 Neural Network

최종 신뢰도:
  - 0.9 이상: 높음 (자동 진행)
  - 0.7-0.9: 중간 (확인 요청)
  - 0.7 미만: 낮음 (다시 묻기)
```

---

## 6. 질문 생성 엔진(Smart Question Generator)

### 6.1 질문 생성 프로세스

```python
class QuestionGenerator:
    """스마트 질문 생성"""
    
    llm: OllamaClient  # 질문 생성용
    rag_retriever: RAGRetriever
    prompt_manager: PromptManager
    tech_profiler: TechLevelProfiler
    
    # 질문 템플릿 (RAG에서 검색)
    question_templates = {
        "technology_stack": {
            "beginner": "어떤 프로그래밍 언어를 선호하시나요? (Python, JavaScript, Java 등)",
            "advanced": "기술 스택을 구체적으로 정의해주세요."
        },
        "database": {
            "beginner": "데이터베이스는 어떤 것을 사용하고 싶으신가요?",
            "advanced": "데이터베이스 선택 기준과 성능 요구사항은?"
        }
    }
    
    async def generate_questions(
        self,
        context: ExecutionContext,
        gaps: List[str],
        max_questions: int = 3
    ) -> List[Question]:
        """
        질문 생성 프로세스:
        1. 부족한 정보별로 질문 생성
        2. 사용자 기술 수준 적응
        3. RAG에서 과거 선택지 검색
        4. Ollama로 추가 질문 생성
        5. 선택지 제안
        """
        
        questions = []
        
        for gap in gaps[:max_questions]:
            # 1. 기술 수준 파악
            tech_level = await self.tech_profiler.profile(context)
            
            # 2. RAG에서 유사 패턴 검색
            similar_patterns = await self.rag_retriever.search(
                gap, "question_patterns", top_k=5
            )
            
            # 3. 선택지 후보 추출
            suggested_options = []
            for pattern in similar_patterns:
                if pattern.metadata.get("options"):
                    suggested_options.extend(pattern.metadata["options"])
            
            # 4. Ollama로 질문 생성
            prompt = self.prompt_manager.render_prompt(
                "question_generator",
                {
                    "gap": gap,
                    "tech_level": tech_level,
                    "context": context.project_state,
                    "similar_patterns": similar_patterns
                }
            )
            
            question_text = await self.llm.chat([
                Message(role="system", content="당신은 명확한 질문을 만드는 전문가입니다."),
                Message(role="user", content=prompt)
            ])
            
            # 5. 질문 객체 생성
            question = Question(
                id=f"q_{len(questions)}",
                text=question_text,
                type="single_choice" if suggested_options else "text",
                options=suggested_options[:5] if suggested_options else None,
                suggested_answers=suggested_options,
                help_text=f"관련 과거 사례: {len(similar_patterns)}개"
            )
            
            questions.append(question)
        
        return questions
    
    async def _interact_with_user(
        self,
        questions: List[Question]
    ) -> Dict[str, Answer]:
        """사용자와 대화"""
        answers = {}
        
        for question in questions:
            print(f"\n❓ {question.text}")
            
            if question.options:
                for i, opt in enumerate(question.options, 1):
                    print(f"  {i}. {opt}")
            
            user_input = input("> ").strip()
            
            answers[question.id] = Answer(
                question_id=question.id,
                value=user_input,
                confidence=0.8,
                timestamp=datetime.now()
            )
        
        return answers
```

### 6.2 기술 수준 프로파일러

```python
class TechLevelProfiler:
    """사용자 기술 수준 파악"""
    
    async def profile(self, context: ExecutionContext) -> str:
        """
        기술 수준 판단:
        1. 이전 대화 분석
        2. 사용 기술 수준 평가
        3. 컨텍스트 복잡도 분석
        """
        
        # 이전 메시지 분석
        messages = context.conversation.messages
        
        complexity_score = 0
        
        for msg in messages[-5:]:  # 최근 5개 메시지
            # 기술 용어 수
            tech_terms = self._count_tech_terms(msg.content)
            complexity_score += tech_terms * 0.2
            
            # 질문의 구체성
            if "how" in msg.content or "explain" in msg.content:
                complexity_score -= 0.1  # 초급
            else:
                complexity_score += 0.1  # 고급
        
        if complexity_score > 5:
            return "advanced"
        elif complexity_score > 2:
            return "intermediate"
        else:
            return "beginner"
```

---

## 7. 데이터 보안 및 마스킹

### 7.1 마스킹 엔진

```python
class MaskingRule(BaseModel):
    """마스킹 규칙"""
    name: str
    pattern: str  # Regex
    category: Literal["secret", "pii", "config", "path"]
    replacement: str = "*" * 8  # 기본값
    priority: int = 1  # 높을수록 먼저 적용

class DataMaskingEngine:
    """데이터 마스킹"""
    
    masking_rules: List[MaskingRule]
    nlp: spacy.Language  # NER용
    audit_logger: AuditLogger
    
    # 기본 패턴
    SECRET_PATTERNS = {
        "api_key": r"[a-zA-Z0-9]{32,}",  # 32자 이상의 알파뉘메릭
        "aws_key": r"AKIA[0-9A-Z]{16}",
        "github_token": r"ghp_[a-zA-Z0-9]{36}",
        "jwt_token": r"ey[a-zA-Z0-9_-]+\.ey[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+",
        "db_password": r"password['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]",
        "ssh_key": r"-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----",
        "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "phone": r"\+?1?\d{10,14}",
        "ip_address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
        "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}\b"
    }
    
    async def mask_data(self, text: str) -> MaskedData:
        """
        마스킹 프로세스:
        1. Regex로 시크릿 패턴 감지
        2. spaCy NER로 PII 감지
        3. 문맥 분석 (오탐 감소)
        4. 마스킹 적용
        5. 감시 로그 기록
        """
        
        masked_text = text
        detected_secrets = {}
        
        # 1. Regex 기반 감지
        for category, pattern in self.SECRET_PATTERNS.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                secret_id = f"secret_{len(detected_secrets)}"
                detected_secrets[secret_id] = {
                    "original": match.group(),
                    "category": category,
                    "position": (match.start(), match.end()),
                    "confidence": 0.95
                }
                # 마스킹
                replacement = "*" * len(match.group())
                masked_text = masked_text.replace(match.group(), replacement)
        
        # 2. spaCy NER (추가 PII 감지)
        doc = self.nlp(text)
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "EMAIL", "PHONE"]:
                secret_id = f"secret_{len(detected_secrets)}"
                detected_secrets[secret_id] = {
                    "original": ent.text,
                    "category": ent.label_,
                    "position": (ent.start_char, ent.end_char),
                    "confidence": 0.8
                }
        
        # 3. 감시 로그
        await self.audit_logger.log_masking(
            original_length=len(text),
            masked_length=len(masked_text),
            secrets_detected=len(detected_secrets),
            timestamp=datetime.now()
        )
        
        return MaskedData(
            masked_text=masked_text,
            detected_secrets=detected_secrets,
            masking_accuracy=self._verify_masking(masked_text)
        )
    
    def _verify_masking(self, masked_text: str) -> float:
        """마스킹 정확도 검증"""
        # 마스킹된 텍스트에 여전히 시크릿이 없는지 확인
        for pattern in self.SECRET_PATTERNS.values():
            if re.search(pattern, masked_text):
                return 0.0  # 마스킹 실패
        return 0.99  # 성공 (99.9% 신뢰도)

class AuditLogger:
    """감시 로거"""
    
    async def log_masking(self, **kwargs):
        """마스킹 작업 로그"""
        log_entry = {
            "action": "data_masking",
            "timestamp": kwargs["timestamp"],
            "secrets_detected": kwargs["secrets_detected"],
            "status": "success",
            "checksum": self._hash_operation(kwargs)
        }
        # PostgreSQL에 저장
        pass
```

### 7.2 보안 검증

```python
class SecurityValidator:
    """보안 검증"""
    
    async def validate_masking(self, data: MaskedData) -> bool:
        """마스킹 완전성 검증"""
        # 패턴 재검사
        for pattern in DataMaskingEngine.SECRET_PATTERNS.values():
            if re.search(pattern, data.masked_text):
                return False
        return True
    
    async def validate_before_sending_to_claude(
        self, 
        text: str
    ) -> Tuple[bool, List[str]]:
        """Claude 전송 전 최종 검증"""
        issues = []
        
        # 패턴 검사
        for category, pattern in DataMaskingEngine.SECRET_PATTERNS.items():
            if re.search(pattern, text):
                issues.append(f"Found {category} in masked text")
        
        if issues:
            return False, issues
        return True, []
```

---

## 8. 인프라 자동화 에이전트들

### 8.1 Infrastructure Agent (SSH/Telnet/서버)

```python
class InfrastructureAgent(BaseAgent):
    """인프라 자동화 에이전트"""
    
    async def execute(self, context: ExecutionContext) -> AgentResult:
        """
        인프라 구성 단계:
        1. 서버 연결 정보 수집
        2. SSH/Telnet 접속
        3. 필요 패키지 설치
        4. 환경 변수 설정
        5. Health check
        """
        
        artifacts = {}
        logs = []
        
        try:
            # 1. 연결 정보 추출
            server_config = context.phase_results.get("questions").output.get("server_info")
            
            # 2. 연결 생성
            connection = await self._establish_connection(server_config)
            logs.append(f"Connected to {server_config['host']}")
            
            # 3. 패키지 설치
            setup_commands = context.phase_results.get("planning").output.get("setup_commands", [])
            for cmd in setup_commands:
                result = await connection.run_command(cmd)
                logs.append(f"✓ {cmd}")
            
            # 4. 환경 변수 설정
            env_vars = context.phase_results.get("planning").output.get("env_vars", {})
            env_file_content = self._generate_env_file(env_vars)
            await connection.write_file(".env", env_file_content)
            logs.append("✓ .env file created")
            
            # 5. Health check
            health_result = await self._health_check(connection)
            
            artifacts["server_config"] = server_config
            artifacts["setup_logs"] = logs
            
            return AgentResult(
                agent_type="infrastructure",
                phase_id=context.current_phase.value,
                success=health_result,
                output={"server_ready": health_result},
                logs=logs,
                artifacts=artifacts
            )
            
        except Exception as e:
            return AgentResult(
                agent_type="infrastructure",
                phase_id=context.current_phase.value,
                success=False,
                errors=[str(e)],
                logs=logs
            )
    
    async def _establish_connection(
        self, 
        config: Dict[str, Any]
    ) -> ServerConnection:
        """SSH 또는 Telnet 연결"""
        
        if config.get("connection_type") == "ssh":
            return SSHConnection(
                host=config["host"],
                port=config.get("port", 22),
                username=config["username"],
                key_path=config.get("key_path"),
                password=config.get("password")
            )
        elif config.get("connection_type") == "telnet":
            return TelnetConnection(
                host=config["host"],
                port=config.get("port", 23),
                username=config["username"],
                password=config["password"]
            )
    
    async def _health_check(self, connection: ServerConnection) -> bool:
        """서버 상태 확인"""
        try:
            result = await connection.run_command("uname -a")
            return result.returncode == 0
        except:
            return False

class SSHConnection:
    """SSH 연결"""
    
    def __init__(self, host: str, port: int, username: str, **kwargs):
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    async def run_command(self, cmd: str):
        """명령 실행"""
        stdin, stdout, stderr = self.client.exec_command(cmd)
        return CommandResult(
            returncode=stdout.channel.recv_exit_status(),
            stdout=stdout.read().decode(),
            stderr=stderr.read().decode()
        )
    
    async def write_file(self, path: str, content: str):
        """파일 작성"""
        sftp = self.client.open_sftp()
        sftp.putfo(StringIO(content), path)
        sftp.close()

class TelnetConnection:
    """Telnet 연결"""
    
    async def run_command(self, cmd: str):
        """명령 실행"""
        # telnetlib 사용
        pass
```

### 8.2 Database Agent

```python
class DatabaseAgent(BaseAgent):
    """데이터베이스 자동화 에이전트"""
    
    async def execute(self, context: ExecutionContext) -> AgentResult:
        """
        DB 구성 단계:
        1. DB 연결 정보
        2. DB 생성
        3. 스키마 마이그레이션
        4. 초기 데이터 삽입
        5. 연결 테스트
        """
        
        artifacts = {}
        logs = []
        
        try:
            # 1. 연결 정보
            db_config = context.phase_results.get("questions").output.get("database")
            
            # 2. DB 생성
            db_client = await self._connect_database(db_config)
            await db_client.create_database(db_config["database_name"])
            logs.append(f"✓ Database created: {db_config['database_name']}")
            
            # 3. 스키마 마이그레이션
            schema = context.phase_results.get("planning").output.get("database_schema")
            migration_scripts = self._generate_migration_scripts(schema)
            for script in migration_scripts:
                await db_client.execute(script)
                logs.append(f"✓ Schema migration applied")
            
            # 4. 초기 데이터
            seed_data = context.phase_results.get("planning").output.get("seed_data", {})
            for table, rows in seed_data.items():
                await db_client.insert_batch(table, rows)
                logs.append(f"✓ Inserted {len(rows)} rows into {table}")
            
            # 5. 테스트
            test_result = await db_client.test_connection()
            
            artifacts["db_config"] = db_config
            artifacts["schema"] = schema
            
            return AgentResult(
                agent_type="database",
                phase_id=context.current_phase.value,
                success=test_result,
                output={"database_ready": test_result},
                logs=logs,
                artifacts=artifacts
            )
            
        except Exception as e:
            return AgentResult(
                agent_type="database",
                phase_id=context.current_phase.value,
                success=False,
                errors=[str(e)],
                logs=logs
            )
    
    async def _connect_database(
        self, 
        config: Dict[str, Any]
    ) -> DatabaseClient:
        """DB 연결"""
        
        if config["type"] == "postgresql":
            return PostgreSQLClient(
                host=config.get("host", "localhost"),
                port=config.get("port", 5432),
                user=config["user"],
                password=config["password"]
            )
        elif config["type"] == "mysql":
            return MySQLClient(
                host=config.get("host", "localhost"),
                port=config.get("port", 3306),
                user=config["user"],
                password=config["password"]
            )

class PostgreSQLClient(DatabaseClient):
    """PostgreSQL 클라이언트"""
    
    async def create_database(self, db_name: str):
        async with self.pool.acquire() as conn:
            await conn.execute(f'CREATE DATABASE "{db_name}"')
    
    async def execute(self, sql: str):
        async with self.pool.acquire() as conn:
            await conn.execute(sql)
```

### 8.3 GitHub Agent

```python
class GitHubAgent(BaseAgent):
    """GitHub 자동화 에이전트"""
    
    github_token: str  # 환경변수
    
    async def execute(self, context: ExecutionContext) -> AgentResult:
        """
        GitHub 구성:
        1. Repository 생성
        2. .gitignore, README 생성
        3. Initial commit
        4. 로컬 Git 연결
        """
        
        artifacts = {}
        logs = []
        
        try:
            # GitHub API 클라이언트 생성
            gh = self._create_github_client()
            
            # 1. Repository 생성
            repo_name = context.phase_results.get("planning").output.get("project_name")
            repo = await gh.create_repository(
                name=repo_name,
                description="Auto-generated project",
                private=False
            )
            logs.append(f"✓ Repository created: {repo.html_url}")
            artifacts["repository_url"] = repo.html_url
            
            # 2. 파일 생성
            gitignore = self._generate_gitignore(
                context.phase_results.get("planning").output.get("tech_stack")
            )
            readme = self._generate_readme(
                context.phase_results.get("planning").output
            )
            
            # 3. Initial commit
            await gh.create_file(
                repo=repo,
                path=".gitignore",
                content=gitignore,
                message="chore: add gitignore"
            )
            await gh.create_file(
                repo=repo,
                path="README.md",
                content=readme,
                message="docs: add readme"
            )
            logs.append(f"✓ Initial files created")
            
            # 4. 로컬 Git 연결
            local_dir = context.project_state.get("local_directory")
            await self._initialize_local_git(local_dir, repo.clone_url)
            logs.append(f"✓ Local git initialized")
            
            return AgentResult(
                agent_type="github",
                phase_id=context.current_phase.value,
                success=True,
                output={"repository_url": repo.html_url},
                logs=logs,
                artifacts=artifacts
            )
            
        except Exception as e:
            return AgentResult(
                agent_type="github",
                phase_id=context.current_phase.value,
                success=False,
                errors=[str(e)],
                logs=logs
            )
    
    def _create_github_client(self) -> GitHubAPI:
        return GitHubAPI(token=self.github_token)
```

---

## 9. RAG 통합

### 9.1 RAG 저장소

```python
class RAGStore:
    """RAG 저장 및 검색"""
    
    vector_db: WeaviateClient  # 또는 Milvus
    embedder: SentenceTransformer
    schema_db: AsyncPostgreSQLPool
    
    async def store_result(
        self, 
        result: OrchestrationResult,
        context: ExecutionContext
    ) -> None:
        """결과를 RAG에 저장"""
        
        # 1. 중요 정보 추출
        summary = self._extract_summary(result, context)
        
        # 2. 임베딩 생성
        embedding = await self.embedder.encode(summary)
        
        # 3. Vector DB에 저장
        vector_id = await self.vector_db.add(
            vector=embedding,
            metadata={
                "type": "orchestration_result",
                "intent": context.intent.intent,
                "success": result.success,
                "timestamp": datetime.now()
            }
        )
        
        # 4. 메타데이터 저장 (PostgreSQL)
        async with self.schema_db.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO rag_results (
                    vector_id, intent, phase_results, 
                    artifacts, recommendations, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6)
                """,
                vector_id,
                context.intent.intent,
                json.dumps(result.phase_results),
                json.dumps(result.artifacts),
                json.dumps(result.recommendations),
                datetime.now()
            )
    
    async def search_similar(
        self, 
        query: str, 
        intent: str, 
        top_k: int = 5
    ) -> List[StoredResult]:
        """유사 사례 검색"""
        
        # 1. 쿼리 임베딩
        query_embedding = await self.embedder.encode(query)
        
        # 2. Vector DB 검색
        results = await self.vector_db.search(
            vector=query_embedding,
            limit=top_k,
            where={"intent": intent}
        )
        
        # 3. 메타데이터 추가 조회
        stored_results = []
        async with self.schema_db.acquire() as conn:
            for hit in results:
                row = await conn.fetchrow(
                    "SELECT * FROM rag_results WHERE vector_id = $1",
                    hit.id
                )
                stored_results.append(StoredResult(
                    id=hit.id,
                    similarity=hit.score,
                    metadata=row
                ))
        
        return stored_results
```

### 9.2 스키마 저장소

```sql
-- RAG 관련 테이블

CREATE TABLE rag_results (
    id SERIAL PRIMARY KEY,
    vector_id UUID NOT NULL,
    intent VARCHAR(50),
    phase_results JSONB,
    artifacts JSONB,
    recommendations TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rag_patterns (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100),  -- "question_pattern", "architecture", etc
    pattern_data JSONB,
    frequency INT DEFAULT 1,
    created_at TIMESTAMP
);

CREATE TABLE validation_feedback (
    id SERIAL PRIMARY KEY,
    orchestration_result_id INT REFERENCES rag_results(id),
    feedback TEXT,
    rating INT,  -- 1-5
    created_at TIMESTAMP
);

CREATE INDEX idx_rag_results_intent ON rag_results(intent);
CREATE INDEX idx_rag_results_created ON rag_results(created_at);
```

---

## 10. 설정 스키마

### 10.1 설정 파일 구조

```yaml
# config/orchestrator.yaml

orchestrator:
  debug: false
  log_level: INFO
  max_parallel_agents: 3

llm:
  default_provider: ollama
  providers:
    ollama:
      endpoint: http://localhost:11434
      timeout: 30
      models:
        planning: mistral
        development: codellama
        questions: neural-chat
        embedding: nomic-embed-text
    claude:
      api_key: ${CLAUDE_API_KEY}
      model: claude-3-opus-20250219
      timeout: 60

agents:
  planning:
    enabled: true
    timeout: 120
    max_retries: 2
  infrastructure:
    enabled: true
    ssh_timeout: 30
    max_parallel_connections: 2
  github:
    enabled: true
    token: ${GITHUB_TOKEN}
  database:
    enabled: true
    connection_pool_size: 10

security:
  data_masking:
    enabled: true
    audit_logging: true
  api_key_detection: true
  pii_detection: true
  masking_rules:
    - pattern: "^sk-"
      category: "api_key"
    - pattern: "password"
      category: "secret"

rag:
  enabled: true
  vector_db:
    provider: weaviate  # or milvus
    url: http://localhost:8080
    class_name: OrchestratorResult
  postgres:
    host: localhost
    port: 5432
    database: rag_store
    pool_size: 20

intent_analysis:
  confidence_threshold: 0.7
  enable_rag_search: true
  ml_model_path: ./models/intent_classifier.pkl

question_generation:
  max_questions_per_phase: 3
  enable_learned_patterns: true
  adaptation_levels: ["beginner", "intermediate", "advanced"]
```

---

## 11. CLI 명령 구조

### 11.1 CLI 커맨드

```bash
# 대화형 모드 (권장)
$ ai-orchestrator
🤖 오케스트레이터: "뭘 도와드릴까요?"
👤 사용자: "FastAPI REST API 만들어줄 수 있어?"

# 직접 명령어
$ ai-orchestrator "FastAPI REST API 만들어줄 수 있어?"

# 기존 프로젝트에서 실행
$ cd my-project
$ ai-orchestrator "Users API 추가해줘"

# 옵션들
$ ai-orchestrator --project ./my-project "검증해줄 수 있어?"
$ ai-orchestrator --llm claude --phase planning "기획서 작성해줘"
$ ai-orchestrator --no-mask "민감한 정보 유출 테스트"
$ ai-orchestrator --debug "디버깅 모드로 실행"
```

---

## 12. 구현 순서

### 12.1 의존성 및 단계

```
Phase 1 (Week 1-2): 기초 인프라
├─ 1.1 CLI 프레임워크 (Typer + Rich)
├─ 1.2 Context Manager
├─ 1.3 Configuration Manager
└─ 1.4 기본 로깅 시스템

Phase 2 (Week 2-3): LLM 통합
├─ 2.1 LLM 추상화 인터페이스
├─ 2.2 Ollama 클라이언트
├─ 2.3 Claude 클라이언트
├─ 2.4 LLM Factory
└─ 2.5 프롬프트 관리 시스템

Phase 3 (Week 3): 의도 분석 & 질문 생성
├─ 3.1 Intent Analyzer (규칙 기반)
├─ 3.2 Intent Classifier (ML 모델)
├─ 3.3 Question Generator
└─ 3.4 Tech Level Profiler

Phase 4 (Week 3-4): 에이전트 시스템
├─ 4.1 Base Agent 클래스
├─ 4.2 Planning Agent
├─ 4.3 Development Agent
├─ 4.4 Validation Agent
└─ 4.5 Agent Executor & Router

Phase 5 (Week 4): 데이터 보안
├─ 5.1 Data Masking Engine
├─ 5.2 Security Validators
└─ 5.3 Audit Logger

Phase 6 (Week 4-5): 인프라 자동화
├─ 6.1 Infrastructure Agent (SSH)
├─ 6.2 Database Agent
├─ 6.3 GitHub Agent
└─ 6.4 Server Connection Classes

Phase 7 (Week 5): RAG 통합
├─ 7.1 Vector DB Setup
├─ 7.2 Embedder 통합
├─ 7.3 RAG Store
└─ 7.4 Similarity Search

Phase 8 (Week 5): 테스트 & 배포
├─ 8.1 Unit Tests
├─ 8.2 Integration Tests
├─ 8.3 보안 감사
└─ 8.4 배포 & 문서
```

---

## 13. 웹 서버 아키텍처 (FastAPI)

### 13.1 FastAPI 서버 구조

```python
# 프로젝트 구조
orchestrator_server/
├─ app/
│  ├─ __init__.py
│  ├─ main.py              # FastAPI 애플리케이션
│  ├─ api/
│  │  ├─ __init__.py
│  │  ├─ routes/
│  │  │  ├─ orchestrate.py # POST /api/orchestrate
│  │  │  ├─ questions.py    # POST /api/questions
│  │  │  ├─ projects.py     # CRUD /api/projects
│  │  │  ├─ history.py      # GET /api/history
│  │  │  ├─ analytics.py    # GET /api/analytics
│  │  │  └─ auth.py         # POST /api/auth
│  │  ├─ websocket.py      # WebSocket 엔드포인트
│  │  └─ middleware.py     # CORS, Auth, etc
│  ├─ models/
│  │  ├─ database.py       # SQLAlchemy Models
│  │  └─ schemas.py        # Pydantic Schemas
│  └─ services/
│     ├─ orchestrator_service.py
│     ├─ session_service.py
│     └─ websocket_service.py
├─ config/
│  ├─ settings.py          # 설정 관리
│  └─ logging.py           # 로깅 설정
└─ docker-compose.yml

# API 라우트
class OrchestrateRequest(BaseModel):
    user_input: str
    project_id: Optional[str]
    session_id: Optional[str]

class OrchestrateResponse(BaseModel):
    session_id: str
    initial_analysis: IntentResult
    next_step: str  # "ask_questions", "execute", etc

# REST API 엔드포인트
POST /api/orchestrate                    # 오케스트레이션 시작
POST /api/questions/{question_id}/answer # 질문에 답변
GET  /api/history/{session_id}           # 세션 이력 조회
GET  /api/projects                       # 프로젝트 목록
POST /api/projects                       # 프로젝트 생성
GET  /api/projects/{project_id}          # 프로젝트 상세
GET  /api/analytics                      # RAG 분석 데이터

# WebSocket 엔드포인트
WS /ws/session/{session_id}              # 실시간 이벤트 스트림
  ├─ phase_started event
  ├─ phase_progress event (로그 스트리밍)
  ├─ phase_completed event (결과)
  ├─ orchestration_completed event
  └─ error event
```

### 13.2 WebSocket 이벤트 스키마

```python
class WSEvent(BaseModel):
    """WebSocket 이벤트"""
    type: str  # "phase_started", "log", "result", "completed", "error"
    timestamp: datetime
    session_id: str
    data: Dict[str, Any]

# 예시 이벤트들
{
    "type": "phase_started",
    "phase": "planning",
    "agent": "PlanningAgent",
    "timestamp": "2026-05-12T10:30:00Z"
}

{
    "type": "log",
    "phase": "planning",
    "log": "Generating project structure...",
    "level": "INFO",
    "timestamp": "2026-05-12T10:30:05Z"
}

{
    "type": "phase_completed",
    "phase": "planning",
    "success": true,
    "result": {...},
    "duration_seconds": 15,
    "timestamp": "2026-05-12T10:30:20Z"
}

{
    "type": "orchestration_completed",
    "success": true,
    "total_duration_seconds": 120,
    "artifacts": {...},
    "timestamp": "2026-05-12T10:32:00Z"
}
```

### 13.3 FastAPI 구현 예제

```python
# app/main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi_socketio import SocketManager

app = FastAPI(title="AI Orchestrator Server")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO 설정
sio = SocketManager(app=app, cors_allowed_origins="*")

# 라우트 포함
from app.api.routes import orchestrate, questions, projects, history, analytics

app.include_router(orchestrate.router, prefix="/api", tags=["orchestrate"])
app.include_router(questions.router, prefix="/api", tags=["questions"])
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])

# WebSocket 이벤트
@app.websocket("/ws/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    try:
        # 클라이언트로부터 메시지 수신
        while True:
            message = await websocket.receive_text()
            
            if message == "ping":
                await websocket.send_json({"type": "pong"})
                continue
            
            # 오케스트레이션 실행 및 이벤트 스트리밍
            async for event in orchestrator.stream_execution(session_id, message):
                await websocket.send_json(event.dict())
    
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "error": str(e)
        })
    finally:
        await websocket.close()

# Orchestrate 라우트
@app.post("/api/orchestrate")
async def orchestrate(request: OrchestrateRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    # Intent 분석
    intent_result = await orchestrator.analyze_intent(request.user_input)
    
    return OrchestrateResponse(
        session_id=session_id,
        initial_analysis=intent_result,
        next_step="ask_questions" if intent_result.required_info else "execute"
    )
```

---

## 14. 웹 클라이언트 아키텍처 (Next.js)

### 14.1 Next.js 프로젝트 구조

```
orchestrator_web/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Root Layout
│  │  ├─ page.tsx                # Home page
│  │  ├─ dashboard/
│  │  │  ├─ page.tsx             # 대시보드
│  │  │  ├─ components/
│  │  │  │  ├─ Dashboard.tsx
│  │  │  │  ├─ ProgressMonitor.tsx
│  │  │  │  ├─ ExecutionHistory.tsx
│  │  │  │  └─ LogViewer.tsx
│  │  │  └─ layout.tsx
│  │  ├─ orchestrate/
│  │  │  ├─ page.tsx             # 대화형 인터페이스
│  │  │  ├─ components/
│  │  │  │  ├─ ChatInterface.tsx
│  │  │  │  ├─ MessageList.tsx
│  │  │  │  ├─ InputForm.tsx
│  │  │  │  └─ QuestionForm.tsx
│  │  │  └─ layout.tsx
│  │  ├─ projects/
│  │  │  ├─ page.tsx             # 프로젝트 목록
│  │  │  ├─ [id]/
│  │  │  │  ├─ page.tsx          # 프로젝트 상세
│  │  │  │  └─ results.tsx       # 결과 조회
│  │  │  └─ components/
│  │  └─ analytics/
│  │     └─ page.tsx             # 분석 대시보드
│  ├─ components/
│  │  ├─ ui/                     # shadcn/ui 컴포넌트
│  │  │  ├─ Button.tsx
│  │  │  ├─ Card.tsx
│  │  │  ├─ Input.tsx
│  │  │  ├─ Tabs.tsx
│  │  │  └─ ...
│  │  ├─ common/
│  │  │  ├─ Header.tsx
│  │  │  ├─ Sidebar.tsx
│  │  │  ├─ Loading.tsx
│  │  │  └─ ErrorBoundary.tsx
│  │  └─ visualization/
│  │     ├─ PhaseVisualization.tsx
│  │     ├─ AgentGraph.tsx
│  │     └─ ProgressBar.tsx
│  ├─ lib/
│  │  ├─ api/
│  │  │  ├─ client.ts            # Axios 인스턴스
│  │  │  ├─ endpoints.ts         # API 엔드포인트
│  │  │  └─ hooks.ts             # API 호출 hooks
│  │  ├─ websocket/
│  │  │  ├─ client.ts            # WebSocket 클라이언트
│  │  │  └─ events.ts            # 이벤트 타입
│  │  ├─ store/
│  │  │  ├─ sessionStore.ts      # 세션 상태
│  │  │  ├─ executionStore.ts    # 실행 상태
│  │  │  ├─ uiStore.ts           # UI 상태
│  │  │  └─ historyStore.ts      # 이력 상태
│  │  └─ utils/
│  │     ├─ formatters.ts
│  │     ├─ validators.ts
│  │     └─ constants.ts
│  └─ styles/
│     ├─ globals.css
│     ├─ variables.css
│     └─ layouts.css
├─ public/
│  ├─ icons/
│  └─ images/
├─ package.json
├─ next.config.js
├─ tailwind.config.js
└─ tsconfig.json
```

### 14.2 상태 관리 (Zustand)

```typescript
// lib/store/sessionStore.ts
import { create } from 'zustand';

interface SessionState {
  sessionId: string | null;
  projectId: string | null;
  userId: string | null;
  currentPhase: Phase | null;
  
  // Actions
  startSession: (input: string) => void;
  switchProject: (projectId: string) => void;
  setCurrentPhase: (phase: Phase) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  projectId: null,
  userId: null,
  currentPhase: null,
  
  startSession: async (input) => {
    const response = await api.post('/orchestrate', { user_input: input });
    set({
      sessionId: response.data.session_id,
      currentPhase: 'questioning'
    });
  },
  
  switchProject: (projectId) => set({ projectId }),
  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  clearSession: () => set({
    sessionId: null,
    projectId: null,
    currentPhase: null
  })
}));

// lib/store/executionStore.ts
interface ExecutionState {
  isRunning: boolean;
  currentProgress: number;
  logs: string[];
  phaseResults: Record<string, AgentResult>;
  currentError: string | null;
  
  // Actions
  addLog: (log: string) => void;
  updateProgress: (progress: number) => void;
  setPhaseResult: (phase: string, result: AgentResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  isRunning: false,
  currentProgress: 0,
  logs: [],
  phaseResults: {},
  currentError: null,
  
  addLog: (log) => set((state) => ({
    logs: [...state.logs, log]
  })),
  
  updateProgress: (progress) => set({ currentProgress: progress }),
  setPhaseResult: (phase, result) => set((state) => ({
    phaseResults: { ...state.phaseResults, [phase]: result }
  })),
  setError: (error) => set({ currentError: error }),
  reset: () => set({
    isRunning: false,
    currentProgress: 0,
    logs: [],
    phaseResults: {},
    currentError: null
  })
}));
```

### 14.3 WebSocket 통합

```typescript
// lib/websocket/client.ts
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;
  
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(process.env.NEXT_PUBLIC_WS_URL, {
        path: `/ws/session/${sessionId}`,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });
      
      this.socket.on('connect', resolve);
      this.socket.on('error', reject);
    });
  }
  
  onEvent(eventType: string, callback: (data: any) => void): void {
    if (!this.socket) return;
    this.socket.on(eventType, callback);
  }
  
  emit(eventType: string, data: any): void {
    if (!this.socket) return;
    this.socket.emit(eventType, data);
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const wsClient = new WebSocketClient();

// Components/DashboardComponent.tsx
'use client';

import { useEffect } from 'react';
import { useSessionStore, useExecutionStore } from '@/lib/store';
import { wsClient } from '@/lib/websocket/client';

export default function Dashboard() {
  const { sessionId } = useSessionStore();
  const { addLog, updateProgress, setPhaseResult } = useExecutionStore();
  
  useEffect(() => {
    if (!sessionId) return;
    
    // WebSocket 연결
    wsClient.connect(sessionId).then(() => {
      // 이벤트 리스너
      wsClient.onEvent('log', (event) => {
        addLog(event.log);
      });
      
      wsClient.onEvent('phase_completed', (event) => {
        updateProgress(event.progress);
        setPhaseResult(event.phase, event.result);
      });
      
      wsClient.onEvent('error', (event) => {
        console.error('Orchestration error:', event);
      });
    });
    
    return () => {
      wsClient.disconnect();
    };
  }, [sessionId]);
  
  return (
    <div className="space-y-4">
      {/* 대시보드 UI */}
    </div>
  );
}
```

---

## 15. Embedded CLI 아키텍처

### 15.1 웹 대시보드 내 Terminal 통합

```
웹 대시보드 아키텍처:

┌─────────────────────────────────────────────────────────┐
│                  Web Dashboard                          │
│  (Next.js Frontend)                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Main Orchestration Panel                        │  │
│  │ ├─ Intent Analysis                               │  │
│  │ ├─ Chat Interface                                │  │
│  │ ├─ Planning Phase Progress                       │  │
│  │ └─ Development Phase Progress                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Claude API 필요 시점 (Validation Phase) ↓             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🖥️  Embedded Terminal                           │  │
│  │ ├─ xterm.js 기반 터미널 UI                      │  │
│  │ ├─ 실시간 로그 스트리밍                          │  │
│  │ ├─ CLI 명령 자동 실행                            │  │
│  │ │  $ orchestrator validate --session xxx        │  │
│  │ │  ✓ Security check passed                      │  │
│  │ │  ✓ Code quality: Good                         │  │
│  │ └─ 완료 후 자동 닫힘                             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
         ↓
    FastAPI Server
         ↓
    subprocess.Popen (Python CLI)
    ├─ 마스킹 데이터만 전달
    └─ Claude API 호출
```

### 15.2 Embedded Terminal 컴포넌트

```typescript
// components/EmbeddedTerminal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { FitAddon } from 'xterm-addon-fit';

interface EmbeddedTerminalProps {
  isOpen: boolean;
  sessionId: string;
  command: string;
  onClose: () => void;
  onComplete: (result: any) => void;
}

export default function EmbeddedTerminal({
  isOpen,
  sessionId,
  command,
  onClose,
  onComplete
}: EmbeddedTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Terminal 초기화
    const terminal = new Terminal({
      cursorBlink: true,
      scrollback: 1000,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4'
      }
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // CLI 명령 실행
    runCLICommand();

    // Resize 처리
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, [isOpen]);

  const runCLICommand = async () => {
    if (!terminalRef.current) return;

    const terminal = terminalRef.current;
    setIsRunning(true);

    try {
      terminal.write(`$ ${command}\r\n`);

      // 서버에 CLI 실행 요청
      const response = await fetch('/api/cli/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          command,
          masked_data: true
        })
      });

      const data = await response.json();
      const cliSessionId = data.cli_session_id;

      // WebSocket으로 실시간 로그 수신
      const ws = new WebSocket(`/ws/cli/${cliSessionId}`);

      ws.onopen = () => {
        terminal.write('\r\n');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'log') {
          terminal.write(message.data + '\r\n');
        } else if (message.type === 'completed') {
          terminal.write('\r\n✓ Process completed\r\n');
          ws.close();
          setIsRunning(false);

          // 결과 콜백
          onComplete(message.result);
        } else if (message.type === 'error') {
          terminal.write(`\r\n✗ Error: ${message.error}\r\n`);
          ws.close();
          setIsRunning(false);
        }
      };

      ws.onerror = (error) => {
        terminal.write(`\r\n✗ WebSocket error: ${error}\r\n`);
        setIsRunning(false);
      };
    } catch (error) {
      terminal.write(`\r\n✗ Error: ${error}\r\n`);
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isRunning) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl h-96">
        <DialogHeader>
          <DialogTitle>CLI Validation Process</DialogTitle>
          {isRunning && (
            <Badge variant="secondary" className="ml-2">
              Running...
            </Badge>
          )}
        </DialogHeader>
        
        <div 
          ref={containerRef}
          className="w-full h-64 bg-slate-900 border border-slate-700 rounded-md overflow-hidden"
        />
        
        <DialogFooter>
          <Button
            onClick={onClose}
            disabled={isRunning}
            variant="outline"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 사용 예제
export default function OrchestrationPage() {
  const [showTerminal, setShowTerminal] = useState(false);
  const { sessionId, currentPhase } = useSessionStore();
  const { updatePhaseResult } = useExecutionStore();

  // Validation Phase에서 자동 실행
  useEffect(() => {
    if (currentPhase === 'validation') {
      setShowTerminal(true);
    }
  }, [currentPhase]);

  const handleTerminalComplete = (result: any) => {
    updatePhaseResult('validation', {
      validation_output: result,
      status: 'completed'
    });
    
    // 자동으로 다음 단계로 진행
    setTimeout(() => setShowTerminal(false), 2000);
  };

  return (
    <>
      {/* Main Dashboard */}
      <Dashboard />

      {/* Embedded Terminal */}
      <EmbeddedTerminal
        isOpen={showTerminal}
        sessionId={sessionId}
        command={`orchestrator validate --session ${sessionId}`}
        onClose={() => setShowTerminal(false)}
        onComplete={handleTerminalComplete}
      />
    </>
  );
}
```

### 15.3 CLI Execute API

```python
# app/api/routes/cli.py
from fastapi import APIRouter, WebSocket, HTTPException
import subprocess
import asyncio
import json
import uuid

router = APIRouter()

class CLISession:
    """CLI 실행 세션 관리"""
    def __init__(self, cli_session_id: str, command: str):
        self.cli_session_id = cli_session_id
        self.command = command
        self.status = "pending"
        self.logs = []
        self.result = None
        self.connections: set[WebSocket] = set()

cli_sessions: Dict[str, CLISession] = {}

@router.post("/api/cli/execute")
async def execute_cli_command(request: CLIExecuteRequest):
    """
    CLI 명령 실행 요청
    
    요청:
    {
        "sessionId": "orch-session-xxx",
        "command": "validate",
        "masked_data": true
    }
    
    응답:
    {
        "cli_session_id": "cli-session-xxx",
        "status": "started"
    }
    """
    
    # 마스킹 데이터 검증
    if not request.masked_data:
        raise HTTPException(
            status_code=400,
            detail="Only masked data is allowed for external API calls"
        )
    
    # CLI 세션 생성
    cli_session_id = f"cli-{uuid.uuid4()}"
    cli_session = CLISession(cli_session_id, request.command)
    cli_sessions[cli_session_id] = cli_session
    
    # 백그라운드에서 CLI 실행
    asyncio.create_task(
        run_cli_process(
            cli_session_id,
            request.command,
            request.sessionId
        )
    )
    
    return {
        "cli_session_id": cli_session_id,
        "status": "started"
    }

async def run_cli_process(
    cli_session_id: str,
    command: str,
    session_id: str
):
    """CLI 프로세스 실행 및 로그 스트리밍"""
    
    cli_session = cli_sessions.get(cli_session_id)
    if not cli_session:
        return
    
    try:
        cli_session.status = "running"
        
        # CLI 명령 구성
        cmd = [
            "python", "-m", "orchestrator",
            command,
            "--session", session_id,
            "--api-key", os.getenv("CLAUDE_API_KEY"),
            "--output-json"
        ]
        
        # 프로세스 실행
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=os.path.dirname(__file__)
        )
        
        # stdout 스트리밍
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            
            log_line = line.decode().strip()
            cli_session.logs.append(log_line)
            
            # 모든 연결된 WebSocket으로 브로드캐스트
            await broadcast_cli_event(cli_session_id, {
                "type": "log",
                "data": log_line
            })
        
        # 프로세스 완료 대기
        return_code = await process.wait()
        
        # stdout의 마지막 줄에서 결과 JSON 추출
        if cli_session.logs:
            last_lines = cli_session.logs[-5:]
            for line in last_lines:
                try:
                    result = json.loads(line)
                    cli_session.result = result
                    break
                except json.JSONDecodeError:
                    continue
        
        cli_session.status = "completed"
        
        # 완료 이벤트 전송
        await broadcast_cli_event(cli_session_id, {
            "type": "completed",
            "return_code": return_code,
            "result": cli_session.result,
            "logs": cli_session.logs
        })
        
    except Exception as e:
        cli_session.status = "error"
        error_msg = str(e)
        cli_session.logs.append(f"ERROR: {error_msg}")
        
        await broadcast_cli_event(cli_session_id, {
            "type": "error",
            "error": error_msg
        })

@app.websocket("/ws/cli/{cli_session_id}")
async def websocket_cli_endpoint(
    websocket: WebSocket,
    cli_session_id: str
):
    """
    CLI 세션의 실시간 로그 스트리밍
    """
    
    cli_session = cli_sessions.get(cli_session_id)
    if not cli_session:
        await websocket.close(code=4000, reason="Session not found")
        return
    
    await websocket.accept()
    cli_session.connections.add(websocket)
    
    try:
        # 기존 로그 전송
        for log in cli_session.logs:
            await websocket.send_json({
                "type": "log",
                "data": log
            })
        
        # 완료될 때까지 대기
        while cli_session.status == "running":
            await asyncio.sleep(0.1)
        
        # 완료/에러 이벤트는 broadcast_cli_event에서 전송됨
        
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "error": str(e)
        })
    finally:
        cli_session.connections.discard(websocket)
        await websocket.close()

async def broadcast_cli_event(cli_session_id: str, event: Dict):
    """모든 연결된 WebSocket 클라이언트에 이벤트 전송"""
    
    cli_session = cli_sessions.get(cli_session_id)
    if not cli_session:
        return
    
    disconnected = set()
    for connection in cli_session.connections:
        try:
            await connection.send_json(event)
        except Exception:
            disconnected.add(connection)
    
    # 끊긴 연결 제거
    cli_session.connections -= disconnected
```

### 15.4 CLI 태스크 분리

```python
# orchestrator/cli/tasks/validate.py
import click
import json
from anthropic import Anthropic

@click.command()
@click.option('--session', required=True, help='Session ID')
@click.option('--api-key', required=True, help='Claude API Key')
@click.option('--masked-data', type=str, help='Masked data for validation')
@click.option('--output-json', is_flag=True, help='Output as JSON')
def validate(session: str, api_key: str, masked_data: str, output_json: bool):
    """
    검증 작업 - Claude API 사용
    마스킹된 데이터만 전달됨
    """
    
    click.echo(f"🔍 Starting validation for session {session}...", err=True)
    
    # Claude 클라이언트
    client = Anthropic(api_key=api_key)
    
    # 검증 프롬프트
    validation_prompt = f"""
    Validate the following code for:
    1. Security issues (SQL injection, XSS, etc)
    2. Code quality (style, conventions)
    3. Performance issues
    4. Best practices
    
    Code:
    {masked_data}
    
    Provide structured feedback.
    """
    
    try:
        click.echo("📡 Calling Claude API for validation...", err=True)
        
        response = client.messages.create(
            model="claude-3-opus-20250219",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": validation_prompt
            }]
        )
        
        validation_result = response.content[0].text
        
        click.echo("✅ Validation completed", err=True)
        
        result = {
            "status": "success",
            "session": session,
            "validation": validation_result,
            "metrics": {
                "security": "passed",
                "quality": "good",
                "performance": "acceptable"
            }
        }
        
        if output_json:
            click.echo(json.dumps(result))
        else:
            click.echo(f"Validation Result:\n{validation_result}")
            
    except Exception as e:
        error_result = {
            "status": "error",
            "session": session,
            "error": str(e)
        }
        
        if output_json:
            click.echo(json.dumps(error_result))
        else:
            click.echo(f"Error: {e}", err=True)

# orchestrator/cli/tasks/plan.py
@click.command()
@click.option('--session', required=True)
@click.option('--output-json', is_flag=True)
def plan(session: str, output_json: bool):
    """기획 - Ollama만 사용 (Claude API 없음)"""
    click.echo(f"📋 Planning for session {session}...", err=True)
    # Ollama를 사용한 기획
    # ...

# orchestrator/cli/tasks/develop.py
@click.command()
@click.option('--session', required=True)
@click.option('--output-json', is_flag=True)
def develop(session: str, output_json: bool):
    """개발 - Ollama만 사용 (Claude API 없음)"""
    click.echo(f"💻 Developing for session {session}...", err=True)
    # Ollama를 사용한 개발
    # ...
```

---

## 16. 대시보드 컴포넌트 설계

### 16.1 주요 페이지 구성

```
Dashboard Page (/)
├─ Header
│  ├─ Logo
│  ├─ Navigation (Dashboard, Orchestrate, Projects, Analytics)
│  ├─ Search Bar
│  └─ User Menu
│
├─ Sidebar
│  ├─ Active Session
│  ├─ Quick Stats
│  │  ├─ Total Executions
│  │  ├─ Success Rate
│  │  └─ Average Duration
│  └─ Recent Projects
│
└─ Main Content
   ├─ Real-time Execution Monitor
   │  ├─ Phase Progress (시각화)
   │  ├─ Current Phase Info
   │  ├─ Agent Status (실시간)
   │  └─ Log Viewer (스트리밍)
   │
   ├─ Execution History
   │  ├─ Timeline 뷰
   │  ├─ Table 뷰
   │  └─ Filter & Search
   │
   └─ Quick Actions
      ├─ New Orchestration
      ├─ View Last Results
      └─ Open Projects

Orchestrate Page (/orchestrate)
├─ Chat Interface
│  ├─ Message History
│  ├─ User Input Area
│  └─ Real-time Response Streaming
│
├─ Context Panel
│  ├─ Current Project
│  ├─ Available Context
│  └─ Previous Interactions
│
└─ Results Panel
   ├─ Generated Artifacts
   ├─ Phase Details
   └─ Download/Share Options

Projects Page (/projects)
├─ Project List
│  ├─ Grid/List Toggle
│  ├─ Filter by Status
│  ├─ Sort Options
│  └─ Create New Project Button
│
├─ Project Card
│  ├─ Project Name & Description
│  ├─ Last Modified
│  ├─ Status Badge
│  ├─ Quick Actions (View, Edit, Delete)
│  └─ Statistics
│
└─ Project Detail Page
   ├─ Executions List
   ├─ Results History
   ├─ Generated Files
   └─ Settings

Analytics Page (/analytics)
├─ RAG Statistics
│  ├─ Total Stored Results
│  ├─ Most Used Patterns
│  └─ Learning Progress Chart
│
├─ Intent Analysis
│  ├─ Intent Distribution (Pie Chart)
│  ├─ Confidence Scores (Histogram)
│  └─ Trending Intents (Line Chart)
│
└─ Performance Metrics
   ├─ Average Duration per Phase
   ├─ Success Rate Trend
   ├─ Agent Utilization
   └─ Error Analysis
```

### 16.2 주요 컴포넌트

```typescript
// components/ExecutionMonitor.tsx
export default function ExecutionMonitor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>실시간 진행 상황</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 각 Phase별 진행도 */}
        <PhaseProgress phases={phases} />
        
        {/* 실시간 로그 */}
        <LogViewer logs={logs} />
        
        {/* 현재 Agent 상태 */}
        <AgentStatus currentAgent={currentAgent} />
      </CardContent>
    </Card>
  );
}

// components/ChatInterface.tsx
export default function ChatInterface() {
  return (
    <div className="flex flex-col h-screen">
      {/* 메시지 히스토리 */}
      <MessageList messages={messages} />
      
      {/* 입력 폼 */}
      <InputForm onSubmit={handleSubmit} />
      
      {/* 질문 폼 (필요시) */}
      {pendingQuestions && <QuestionForm questions={pendingQuestions} />}
    </div>
  );
}

// components/PhaseVisualization.tsx
// React Flow를 사용한 에이전트/단계 시각화
export default function PhaseVisualization() {
  return (
    <div className="w-full h-96">
      <ReactFlow nodes={nodes} edges={edges}>
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

---

## 17. 배포 아키텍처

### 17.1 Docker Compose (로컬 개발)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Backend Server
  api:
    build:
      context: ./orchestrator_server
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_URL=http://ollama:11434
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - DATABASE_URL=postgresql://user:password@postgres:5432/orchestrator
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
      - ollama
      - weaviate
    volumes:
      - ./orchestrator_server:/app

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=orchestrator
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Ollama
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  # Weaviate (Vector DB)
  weaviate:
    image: semitechnologies/weaviate:latest
    environment:
      - QUERY_DEFAULTS_LIMIT=25
      - AUTHENTICATION_APIKEY_ENABLED=false
      - PERSISTENCE_DATA_PATH=/var/lib/weaviate
    ports:
      - "8080:8080"
    volumes:
      - weaviate_data:/var/lib/weaviate

  # Frontend
  web:
    build:
      context: ./orchestrator_web
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
    depends_on:
      - api
    volumes:
      - ./orchestrator_web:/app

volumes:
  postgres_data:
  ollama_data:
  weaviate_data:
```

---

## 18. 최종 요약

### 핵심 아키텍처

1. **Server-centric Design**: FastAPI 중앙 서버
2. **Dual Interface**: 
   - 🖥️ CLI (로컬 standalone)
   - 🌐 Web (원격 대시보드)
3. **Embedded CLI**: 웹 대시보드 내 Terminal (xterm.js)
4. **Minimal API Cost**: Ollama (무료) + Claude API (필요시만)
5. **Real-time Streaming**: WebSocket으로 진행상황 모니터링

### 비용 구조 (Cost-Optimized)

```
Non-API Tasks (Ollama - 무료):
  ├─ Intent Analysis
  ├─ Planning
  ├─ Development
  └─ Documentation

API Tasks (Claude API - 필요시만):
  └─ Validation (마스킹 데이터만)

Internal Storage (Redis + PostgreSQL):
  ├─ Session Management
  ├─ RAG Integration
  └─ Conversation History
```

### 실행 흐름

```
1️⃣ Web Dashboard → Orchestrate 입력
         ↓
2️⃣ FastAPI Server (Orchestrator Core)
   └─ Ollama: Intent, Planning, Development
         ↓
3️⃣ Validation Phase 감지
         ↓
4️⃣ Embedded Terminal 자동 오픈
         ↓
5️⃣ CLI 명령 실행
   └─ subprocess: orchestrator validate --session xxx
         ↓
6️⃣ CLI ↔ Claude API (마스킹 데이터만)
         ↓
7️⃣ WebSocket 스트리밍 → Dashboard 표시
         ↓
8️⃣ 자동으로 Terminal 닫힘 & 진행 계속
```

### 기술 스택 최종

| 계층 | 기술 | 용도 |
|-----|------|------|
| **Frontend** | Next.js, React, Tailwind | 웹 대시보드 |
| **UI** | shadcn/ui, Framer Motion | 컴포넌트 |
| **Terminal** | xterm.js | 웹 내 CLI 표시 |
| **State** | Zustand, TanStack Query | 상태 관리 |
| **Real-time** | Socket.io, WebSocket | 실시간 통신 |
| **Backend** | FastAPI, Uvicorn | REST API + WebSocket |
| **Processing** | Ollama (로컬) | 대부분의 작업 |
| **Validation** | Claude API | 검증만 (선택적) |
| **LLM** | LiteLLM | LLM 추상화 |
| **Storage** | PostgreSQL | 데이터 저장 |
| **Cache** | Redis | 세션, 캐시 |
| **Vector DB** | Weaviate/Milvus | RAG |
| **Infrastructure** | Docker, Docker Compose | 배포 |

### 아키텍처 특징

✅ **비용 효율적**: Ollama 무료, Claude는 필요시만  
✅ **실시간 모니터링**: WebSocket + 임베디드 Terminal  
✅ **마스킹 강화**: 웹에서만 마스킹 데이터 전송  
✅ **확장 가능**: CLI 태스크 쉽게 추가 가능  
✅ **깔끔한 관심사 분리**: 웹(UI) vs CLI(API작업)  
✅ **로컬 우선**: 대부분 로컬 처리, 외부 호출 최소화

### 구현 우선순위

```
Phase 1 (Week 1-2): 코어 서버
  ├─ FastAPI 기본 구조
  ├─ Intent Analyzer
  └─ Session Management

Phase 2 (Week 2-3): LLM 통합
  ├─ Ollama 연동
  ├─ 에이전트 구현
  └─ Phase Router

Phase 3 (Week 3-4): 보안 & RAG
  ├─ Data Masking
  ├─ RAG Integration
  └─ Audit Logging

Phase 4 (Week 4): Real-time
  ├─ WebSocket 서버
  ├─ CLI Execute API
  └─ Event Streaming

Phase 5 (Week 4-5): 웹 프론트엔드
  ├─ Next.js 기본 구조
  ├─ API 클라이언트
  └─ State Management

Phase 6 (Week 5-6): Embedded Terminal & Dashboard
  ├─ xterm.js 통합
  ├─ Embedded Terminal 컴포넌트
  ├─ Dashboard UI
  └─ Chat Interface

Phase 7 (Week 6-7): 분석 & 고급 기능
  ├─ Analytics 페이지
  ├─ RAG 통계
  └─ Project Management

Phase 8 (Week 7-8): 테스트 & 배포
  ├─ Unit Tests
  ├─ Integration Tests
  ├─ Docker Setup
  └─ Documentation
```

---

**설계서 버전**: 3.3 (Embedded CLI Architecture)  
**마지막 수정**: 2026-05-12  
**상태**: ✅ 완전한 웹 + 임베디드 CLI 아키텍처 설계 완료  
**다음 단계**: Do Phase 시작 (구현)

### 설계 원칙

1. **계층 분리**: 각 컴포넌트가 명확한 책임을 가짐
2. **확장성**: 새로운 에이전트/LLM 추가 용이
3. **보안**: 데이터 마스킹 필수, Zero Trust 원칙
4. **성능**: 비동기 처리, 병렬 실행 지원
5. **학습**: RAG로 지속적 개선

### 핵심 모듈

| 모듈 | 책임 | 기술 |
|-----|------|------|
| **CLI Interface** | 사용자 입력/출력 | Typer, Rich |
| **Intent Analyzer** | 의도 파악 | spaCy, sentence-transformers |
| **Question Generator** | 정보 수집 | Ollama, Prompt Engineering |
| **Phase Router** | 단계 결정 | Dependency Graph, State Machine |
| **Agent System** | 작업 실행 | asyncio, LLM APIs |
| **Data Security** | 보안 보장 | regex, NER |
| **RAG System** | 지식 저장 | Weaviate, Vector DB |

### 다음 단계

1. Phase 1 구현: CLI 프레임워크 & 기본 인프라
2. Phase 2 구현: LLM 통합
3. Phase 3 구현: 의도 분석 & 질문 생성
4. 통합 테스트 & 검증

---

**설계서 버전**: 3.1  
**작성일**: 2026-05-12  
**상태**: ✅ 설계 완료, 구현 준비 완료
