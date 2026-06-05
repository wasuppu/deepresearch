import { Activity, RefreshCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type HealthResponse = {
  service: string;
  implementation: string;
  status: string;
  version: string;
};

type HealthState =
  | { status: "idle" | "loading" }
  | { status: "online"; data: HealthResponse }
  | { status: "offline"; message: string };

type ClarifyingQuestionResponse = {
  question: string;
};

type ResearchBriefResponse = {
  brief: string;
};

function App() {
  const [topic, setTopic] = useState("");
  const [health, setHealth] = useState<HealthState>({ status: "idle" });
  const [clarifyingQuestion, setClarifyingQuestion] = useState("");
  const [clarifyingAnswer, setClarifyingAnswer] = useState("");
  const [researchBrief, setResearchBrief] = useState("");
  const [questionStatus, setQuestionStatus] = useState<"idle" | "loading" | "error">("idle");
  const [questionError, setQuestionError] = useState("");
  const [briefStatus, setBriefStatus] = useState<"idle" | "loading" | "error">("idle");
  const [briefError, setBriefError] = useState("");

  async function checkHealth() {
    setHealth({ status: "loading" });

    try {
      const response = await fetch(`${apiBaseUrl}/health`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as HealthResponse;
      setHealth({ status: "online", data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "无法连接服务";
      setHealth({ status: "offline", message });
    }
  }

  useEffect(() => {
    void checkHealth();
  }, []);

  async function createClarifyingQuestion() {
    const normalizedTopic = topic.trim();

    if (!normalizedTopic) {
      setQuestionStatus("error");
      setQuestionError("请先输入研究主题。");
      return;
    }

    setQuestionStatus("loading");
    setQuestionError("");
    setClarifyingQuestion("");
    setClarifyingAnswer("");
    setResearchBrief("");
    setBriefError("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/clarifying-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: normalizedTopic }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ClarifyingQuestionResponse;
      setClarifyingQuestion(data.question);
      setQuestionStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "澄清问题生成失败。";
      setQuestionStatus("error");
      setQuestionError(message);
    }
  }

  async function createResearchBrief() {
    const normalizedTopic = topic.trim();
    const normalizedQuestion = clarifyingQuestion.trim();
    const normalizedAnswer = clarifyingAnswer.trim();

    if (!normalizedTopic || !normalizedQuestion) {
      setBriefStatus("error");
      setBriefError("请先生成澄清问题。");
      return;
    }

    if (!normalizedAnswer) {
      setBriefStatus("error");
      setBriefError("请先回答澄清问题。");
      return;
    }

    setBriefStatus("loading");
    setBriefError("");
    setResearchBrief("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: normalizedTopic,
          clarifying_question: normalizedQuestion,
          clarifying_answer: normalizedAnswer,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ResearchBriefResponse;
      setResearchBrief(data.brief);
      setBriefStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "研究 brief 生成失败。";
      setBriefStatus("error");
      setBriefError(message);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Deep Research</p>
            <h1>研究工作台</h1>
          </div>
          <button className="icon-button" type="button" onClick={checkHealth}>
            <RefreshCcw size={18} aria-hidden="true" />
            <span>刷新状态</span>
          </button>
        </header>

        <section className="research-panel" aria-label="研究任务">
          <div className="field-group">
            <label htmlFor="topic">研究主题</label>
            <textarea
              id="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="例如：2026 年中国具身智能创业公司的商业化路径"
              rows={5}
            />
          </div>

          <button
            className="primary-action"
            type="button"
            disabled={questionStatus === "loading"}
            onClick={createClarifyingQuestion}
          >
            <Search size={18} aria-hidden="true" />
            <span>{questionStatus === "loading" ? "正在生成追问" : "生成澄清问题"}</span>
          </button>

          {(clarifyingQuestion || questionError) && (
            <section className="question-result" aria-label="澄清问题">
              {clarifyingQuestion && (
                <>
                  <h2>需要先确认的问题</h2>
                  <p>{clarifyingQuestion}</p>
                  <div className="field-group">
                    <label htmlFor="clarifying-answer">你的回答</label>
                    <textarea
                      id="clarifying-answer"
                      value={clarifyingAnswer}
                      onChange={(event) => setClarifyingAnswer(event.target.value)}
                      placeholder="例如：重点关注中国市场，面向投资人，时间范围为 2024-2026 年。"
                      rows={4}
                    />
                  </div>
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={briefStatus === "loading"}
                    onClick={createResearchBrief}
                  >
                    <span>{briefStatus === "loading" ? "正在生成 brief" : "生成研究 brief"}</span>
                  </button>
                </>
              )}
              {questionError && <p className="error-text">{questionError}</p>}
            </section>
          )}

          {(researchBrief || briefError) && (
            <section className="brief-result" aria-label="研究 brief">
              {researchBrief && (
                <>
                  <h2>研究 brief</h2>
                  <p>{researchBrief}</p>
                </>
              )}
              {briefError && <p className="error-text">{briefError}</p>}
            </section>
          )}
        </section>

        <section className="status-section" aria-label="服务状态">
          <div className="section-title">
            <Activity size={18} aria-hidden="true" />
            <h2>研究服务状态</h2>
          </div>

          <article className="status-card">
            <div>
              <h3>API 服务</h3>
              <p>用于追问生成、资料检索和报告生成。</p>
            </div>
            <HealthBadge state={health} />
          </article>
        </section>
      </section>
    </main>
  );
}

function HealthBadge({ state }: { state: HealthState }) {
  if (state.status === "loading") {
    return <span className="badge pending">检查中</span>;
  }

  if (state.status === "online") {
    return <span className="badge online">在线 v{state.data.version}</span>;
  }

  if (state.status === "offline") {
    return <span className="badge offline">离线</span>;
  }

  return <span className="badge pending">未检查</span>;
}

export default App;
