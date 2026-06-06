import { Activity, Check, PencilLine, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

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
  questions: string[];
};

type ResearchBriefResponse = {
  brief: string;
};

type SearchPlanResponse = {
  queries: string[];
};

type ResearchSource = {
  title: string;
  url: string;
  content: string;
  query: string;
};

type ResearchFinding = {
  query: string;
  finding: string;
  sources: ResearchSource[];
};

type ResearchFindingsResponse = {
  findings: ResearchFinding[];
};

function App() {
  const [topic, setTopic] = useState("");
  const [health, setHealth] = useState<HealthState>({ status: "idle" });
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [clarification, setClarification] = useState("");
  const [researchBrief, setResearchBrief] = useState("");
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [editingSearchQueryIndex, setEditingSearchQueryIndex] = useState<number | null>(null);
  const [researchFindings, setResearchFindings] = useState<ResearchFinding[]>([]);
  const [questionStatus, setQuestionStatus] = useState<"idle" | "loading" | "error">("idle");
  const [questionError, setQuestionError] = useState("");
  const [briefStatus, setBriefStatus] = useState<"idle" | "loading" | "error">("idle");
  const [briefError, setBriefError] = useState("");
  const [searchPlanStatus, setSearchPlanStatus] = useState<"idle" | "loading" | "error">("idle");
  const [searchPlanError, setSearchPlanError] = useState("");
  const [findingsStatus, setFindingsStatus] = useState<"idle" | "loading" | "error">("idle");
  const [findingsError, setFindingsError] = useState("");

  const briefTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const searchQueryTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    setClarifyingQuestions([]);
    setClarification("");
    setResearchBrief("");
    setIsEditingBrief(false);
    setBriefError("");
    setSearchQueries([]);
    setEditingSearchQueryIndex(null);
    setSearchPlanError("");
    setResearchFindings([]);
    setFindingsError("");

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
      setClarifyingQuestions(data.questions);
      setQuestionStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "澄清问题生成失败。";
      setQuestionStatus("error");
      setQuestionError(message);
    }
  }

  async function createResearchBrief() {
    const normalizedTopic = topic.trim();
    const normalizedQuestions = clarifyingQuestions.map((question) => question.trim()).filter(Boolean);
    const normalizedClarification = clarification.trim();

    if (!normalizedTopic || normalizedQuestions.length === 0) {
      setBriefStatus("error");
      setBriefError("请先生成澄清问题。");
      return;
    }

    if (!normalizedClarification) {
      setBriefStatus("error");
      setBriefError("请先回答澄清问题。");
      return;
    }

    setBriefStatus("loading");
    setBriefError("");
    setResearchBrief("");
    setIsEditingBrief(false);
    setSearchQueries([]);
    setEditingSearchQueryIndex(null);
    setSearchPlanError("");
    setResearchFindings([]);
    setFindingsError("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: normalizedTopic,
          clarifying_questions: normalizedQuestions,
          clarification: normalizedClarification,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ResearchBriefResponse;
      setResearchBrief(data.brief);
      setIsEditingBrief(false);
      setBriefStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "研究简报生成失败。";
      setBriefStatus("error");
      setBriefError(message);
    }
  }

  async function createSearchPlan() {
    const normalizedBrief = researchBrief.trim();

    if (!normalizedBrief) {
      setSearchPlanStatus("error");
      setSearchPlanError("请先生成研究简报。");
      return;
    }

    setSearchPlanStatus("loading");
    setSearchPlanError("");
    setSearchQueries([]);
    setEditingSearchQueryIndex(null);
    setResearchFindings([]);
    setFindingsError("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/search-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: normalizedBrief }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? `HTTP ${response.status}`);
      }

      const data = (await response.json()) as SearchPlanResponse;
      setSearchQueries(data.queries);
      setSearchPlanStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "检索计划生成失败。";
      setSearchPlanStatus("error");
      setSearchPlanError(message);
    }
  }

  async function createResearchFindings() {
    const normalizedQueries = searchQueries.map((query) => query.trim()).filter(Boolean);

    if (normalizedQueries.length === 0) {
      setFindingsStatus("error");
      setFindingsError("请先生成检索问题。");
      return;
    }

    setFindingsStatus("loading");
    setFindingsError("");
    setResearchFindings([]);

    try {
      const response = await fetch(`${apiBaseUrl}/research/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: normalizedQueries }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ResearchFindingsResponse;
      setResearchFindings(data.findings);
      setFindingsStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "研究发现生成失败。";
      setFindingsStatus("error");
      setFindingsError(message);
    }
  }

  function updateSearchQuery(index: number, value: string) {
    setSearchQueries((current) =>
      current.map((query, queryIndex) => (queryIndex === index ? value : query)),
    );
    setResearchFindings([]);
    setFindingsError("");
  }

  function addSearchQuery() {
    if (searchQueries.length >= 8) {
      setSearchPlanStatus("error");
      setSearchPlanError("最多保留 8 个检索问题。");
      return;
    }

    setSearchQueries((current) => [...current, ""]);
    setEditingSearchQueryIndex(searchQueries.length);
    setSearchPlanError("");
  }

  function removeSearchQuery(index: number) {
    setSearchQueries((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((_, queryIndex) => queryIndex !== index);
    });
    setEditingSearchQueryIndex((current) => {
      if (current === null) {
        return null;
      }

      if (current === index) {
        return null;
      }

      if (current > index) {
        return current - 1;
      }

      return current;
    });
    setResearchFindings([]);
    setFindingsError("");
  }

  useLayoutEffect(() => {
    if (!isEditingBrief || !briefTextareaRef.current) {
      return;
    }

    const textarea = briefTextareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [isEditingBrief, researchBrief]);

  useLayoutEffect(() => {
    if (editingSearchQueryIndex === null || !searchQueryTextareaRef.current) {
      return;
    }

    const textarea = searchQueryTextareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [editingSearchQueryIndex, searchQueries]);

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

          {(clarifyingQuestions.length > 0 || questionError) && (
            <section className="question-result" aria-label="澄清问题">
              {clarifyingQuestions.length > 0 && (
                <>
                  <h2>需要先确认的问题</h2>
                  <ol className="clarifying-list">
                    {clarifyingQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ol>
                  <div className="field-group">
                    <label htmlFor="clarification">你的综合回答</label>
                    <textarea
                      id="clarification"
                      value={clarification}
                      onChange={(event) => setClarification(event.target.value)}
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
                    <span>{briefStatus === "loading" ? "正在生成简报" : "生成研究简报"}</span>
                  </button>
                </>
              )}
              {questionError && <p className="error-text">{questionError}</p>}
            </section>
          )}

          {(researchBrief || briefError) && (
            <section className="brief-result" aria-label="研究简报">
              {researchBrief && (
                <>
                  <div className="module-header">
                    <h2>研究简报</h2>
                    <button
                      className="icon-only-button secondary-icon"
                      type="button"
                      onClick={() => setIsEditingBrief((current) => !current)}
                      aria-label={isEditingBrief ? "保存研究简报" : "编辑研究简报"}
                      title={isEditingBrief ? "保存研究简报" : "编辑研究简报"}
                    >
                      {isEditingBrief ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        <PencilLine size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {isEditingBrief ? (
                    <textarea
                      aria-label="编辑研究简报"
                      className="editable-text"
                      ref={briefTextareaRef}
                      value={researchBrief}
                      onChange={(event) => {
                        setResearchBrief(event.target.value);
                        setSearchQueries([]);
                        setEditingSearchQueryIndex(null);
                        setResearchFindings([]);
                        setSearchPlanError("");
                        setFindingsError("");
                      }}
                    />
                  ) : (
                    <div className="markdown-preview">
                      <ReactMarkdown>{researchBrief}</ReactMarkdown>
                    </div>
                  )}
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={searchPlanStatus === "loading"}
                    onClick={createSearchPlan}
                  >
                    <span>{searchPlanStatus === "loading" ? "正在生成检索问题" : "生成检索问题"}</span>
                  </button>
                </>
              )}
              {briefError && <p className="error-text">{briefError}</p>}
            </section>
          )}

          {(searchQueries.length > 0 || searchPlanError) && (
            <section className="search-plan-result" aria-label="检索问题">
              {searchQueries.length > 0 && (
                <>
                  <div className="module-header">
                    <h2>检索问题</h2>
                    <button
                      className="icon-only-button secondary-icon"
                      type="button"
                      onClick={addSearchQuery}
                      aria-label="添加检索问题"
                      title="添加检索问题"
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="query-list">
                    {searchQueries.map((query, index) => (
                      <article className="query-item" key={index}>
                        <span>{index + 1}</span>
                        {editingSearchQueryIndex === index ? (
                          <textarea
                            aria-label={`编辑检索问题 ${index + 1}`}
                            ref={searchQueryTextareaRef}
                            value={query}
                            onChange={(event) => updateSearchQuery(index, event.target.value)}
                            rows={2}
                          />
                        ) : (
                          <p className="query-preview">{query || "未填写检索问题"}</p>
                        )}
                        <div className="query-actions">
                          {editingSearchQueryIndex === index ? (
                            <button
                              className="icon-only-button secondary-icon"
                              type="button"
                              onClick={() => setEditingSearchQueryIndex(null)}
                              aria-label={`完成检索问题 ${index + 1} 编辑`}
                              title="完成编辑"
                            >
                              <Check size={16} aria-hidden="true" />
                            </button>
                          ) : (
                            <button
                              className="icon-only-button secondary-icon"
                              type="button"
                              onClick={() => setEditingSearchQueryIndex(index)}
                              aria-label={`编辑检索问题 ${index + 1}`}
                              title="编辑检索问题"
                            >
                              <PencilLine size={16} aria-hidden="true" />
                            </button>
                          )}
                          <button
                            className="icon-only-button"
                            type="button"
                            disabled={searchQueries.length <= 1}
                            onClick={() => removeSearchQuery(index)}
                            aria-label={`删除检索问题 ${index + 1}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={findingsStatus === "loading"}
                    onClick={createResearchFindings}
                  >
                    <span>{findingsStatus === "loading" ? "正在整理研究发现" : "整理研究发现"}</span>
                  </button>
                </>
              )}
              {searchPlanError && <p className="error-text">{searchPlanError}</p>}
            </section>
          )}

          {(researchFindings.length > 0 || findingsError) && (
            <section className="findings-result" aria-label="研究发现">
              {researchFindings.length > 0 && (
                <>
                  <h2>研究发现</h2>
                  <div className="finding-list">
                    {researchFindings.map((finding) => (
                      <article className="finding-item" key={finding.query}>
                        <h3>{finding.query}</h3>
                        <div className="markdown-preview">
                          <ReactMarkdown>{finding.finding}</ReactMarkdown>
                        </div>
                        <div className="source-links">
                          {finding.sources.map((source, index) => (
                            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                              [{index + 1}] {source.title}
                            </a>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
              {findingsError && <p className="error-text">{findingsError}</p>}
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
