import {
  Activity,
  Check,
  Download,
  Library,
  PencilLine,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  createSavedResearchReport,
  downloadMarkdownReport,
  formatDateTime,
  loadReportLibrary,
  saveReportLibrary,
  type SavedResearchReport,
} from "./reportLibrary";
import {
  cloneRunConfig,
  loadRunConfig,
  resetRunConfig,
  saveRunConfig,
  toApiRunConfig,
  type RunConfiguration,
} from "./runConfig";
import {
  loadResearchWorkspaceState,
  researchWorkspaceStateVersion,
  resetResearchWorkspaceState,
  saveResearchWorkspaceState,
} from "./workspaceState";

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

type ResearchReportResponse = {
  report: string;
  references: ResearchSource[];
};

type ResearchProgressStep = {
  id: string;
  label: string;
  description: string;
  state: "pending" | "active" | "complete" | "error";
};

function App() {
  const [initialWorkspace] = useState(() => loadResearchWorkspaceState());
  const [topic, setTopic] = useState(initialWorkspace.topic);
  const [runConfig, setRunConfig] = useState<RunConfiguration>(() => loadRunConfig());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [health, setHealth] = useState<HealthState>({ status: "idle" });
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>(
    initialWorkspace.clarifyingQuestions,
  );
  const [clarification, setClarification] = useState(initialWorkspace.clarification);
  const [researchBrief, setResearchBrief] = useState(initialWorkspace.researchBrief);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [searchQueries, setSearchQueries] = useState<string[]>(initialWorkspace.searchQueries);
  const [editingSearchQueryIndex, setEditingSearchQueryIndex] = useState<number | null>(null);
  const [researchFindings, setResearchFindings] = useState<ResearchFinding[]>(
    initialWorkspace.researchFindings,
  );
  const [researchReport, setResearchReport] = useState(initialWorkspace.researchReport);
  const [researchReportReferences, setResearchReportReferences] = useState<ResearchSource[]>(
    initialWorkspace.researchReportReferences,
  );
  const [questionStatus, setQuestionStatus] = useState<"idle" | "loading" | "error">("idle");
  const [questionError, setQuestionError] = useState("");
  const [briefStatus, setBriefStatus] = useState<"idle" | "loading" | "error">("idle");
  const [briefError, setBriefError] = useState("");
  const [searchPlanStatus, setSearchPlanStatus] = useState<"idle" | "loading" | "error">("idle");
  const [searchPlanError, setSearchPlanError] = useState("");
  const [findingsStatus, setFindingsStatus] = useState<"idle" | "loading" | "error">("idle");
  const [findingsError, setFindingsError] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "loading" | "error">("idle");
  const [reportError, setReportError] = useState("");
  const [reportLibrary, setReportLibrary] = useState<SavedResearchReport[]>(() =>
    loadReportLibrary(),
  );
  const [isReportLibraryOpen, setIsReportLibraryOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportLibraryNotice, setReportLibraryNotice] = useState("");

  const briefTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const searchQueryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const apiRunConfig = toApiRunConfig(runConfig);

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

  useEffect(() => {
    saveRunConfig(runConfig);
    document.documentElement.dataset.density = runConfig.ui.density;
  }, [runConfig]);

  useEffect(() => {
    saveReportLibrary(reportLibrary);
  }, [reportLibrary]);

  useEffect(() => {
    saveResearchWorkspaceState({
      version: researchWorkspaceStateVersion,
      topic,
      clarifyingQuestions,
      clarification,
      researchBrief,
      searchQueries,
      researchFindings,
      researchReport,
      researchReportReferences,
    });
  }, [
    topic,
    clarifyingQuestions,
    clarification,
    researchBrief,
    searchQueries,
    researchFindings,
    researchReport,
    researchReportReferences,
  ]);

  useEffect(() => {
    document.body.style.overflow = isSettingsOpen || isReportLibraryOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSettingsOpen, isReportLibraryOpen]);

  function updateRunConfig(path: string, value: string | number) {
    setRunConfig((current) => {
      const next = cloneRunConfig(current);

      switch (path) {
        case "model.apiFormat":
          next.model.apiFormat = value as RunConfiguration["model"]["apiFormat"];
          break;
        case "model.apiKey":
          next.model.apiKey = String(value);
          break;
        case "model.baseUrl":
          next.model.baseUrl = String(value);
          break;
        case "model.model":
          next.model.model = String(value);
          break;
        case "search.provider":
          next.search.provider = value as RunConfiguration["search"]["provider"];
          if (next.search.provider === "duckduckgo") {
            next.search.apiKey = "";
          }
          break;
        case "search.apiKey":
          next.search.apiKey = String(value);
          break;
        case "search.sourceLimitPerQuery":
          next.search.sourceLimitPerQuery = Number(value);
          break;
        case "content.clarifyingQuestionCount":
          next.content.clarifyingQuestionCount = Number(value);
          break;
        case "content.searchPlanQuestionCount":
          next.content.searchPlanQuestionCount = Number(value);
          break;
        case "content.reportTone":
          next.content.reportTone = value as RunConfiguration["content"]["reportTone"];
          break;
        case "content.outputLanguage":
          next.content.outputLanguage =
            value as RunConfiguration["content"]["outputLanguage"];
          break;
        case "ui.density":
          next.ui.density = value as RunConfiguration["ui"]["density"];
          break;
        default:
          break;
      }

      return next;
    });
  }

  function restartResearchWorkspace() {
    const fresh = resetResearchWorkspaceState();
    setTopic(fresh.topic);
    setClarifyingQuestions(fresh.clarifyingQuestions);
    setClarification(fresh.clarification);
    setResearchBrief(fresh.researchBrief);
    setIsEditingBrief(false);
    setSearchQueries(fresh.searchQueries);
    setEditingSearchQueryIndex(null);
    setResearchFindings(fresh.researchFindings);
    setResearchReport(fresh.researchReport);
    setResearchReportReferences(fresh.researchReportReferences);
    setQuestionStatus("idle");
    setQuestionError("");
    setBriefStatus("idle");
    setBriefError("");
    setSearchPlanStatus("idle");
    setSearchPlanError("");
    setFindingsStatus("idle");
    setFindingsError("");
    setReportStatus("idle");
    setReportError("");
    setReportLibraryNotice("");
  }

  function currentSavedReport(): SavedResearchReport {
    return createSavedResearchReport({
      topic,
      brief: researchBrief,
      findings: researchFindings,
      report: researchReport,
      references: researchReportReferences,
    });
  }

  function downloadCurrentReport() {
    if (!researchReport.trim()) {
      return;
    }

    downloadMarkdownReport(currentSavedReport());
  }

  function saveCurrentReportToLibrary() {
    if (!researchReport.trim()) {
      return;
    }

    const savedReport = currentSavedReport();
    setReportLibrary((current) => [savedReport, ...current]);
    setSelectedReportId(savedReport.id);
    setReportLibraryNotice("已保存到报告库。");
  }

  function loadSavedReport(report: SavedResearchReport) {
    setTopic(report.topic);
    setResearchBrief(report.brief);
    setResearchFindings(report.findings);
    setResearchReport(report.report);
    setResearchReportReferences(report.references);
    setClarifyingQuestions([]);
    setClarification("");
    setSearchQueries(report.findings.map((finding) => finding.query).filter(Boolean));
    setEditingSearchQueryIndex(null);
    setIsEditingBrief(false);
    setQuestionStatus("idle");
    setQuestionError("");
    setBriefStatus("idle");
    setBriefError("");
    setSearchPlanStatus("idle");
    setSearchPlanError("");
    setFindingsStatus("idle");
    setFindingsError("");
    setReportStatus("idle");
    setReportError("");
    setIsReportLibraryOpen(false);
    setReportLibraryNotice("已载入历史报告。");
  }

  function removeSavedReport(reportId: string) {
    setReportLibrary((current) => current.filter((report) => report.id !== reportId));
    setSelectedReportId((current) => (current === reportId ? null : current));
  }

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
    setResearchReport("");
    setResearchReportReferences([]);
    setReportError("");
    setReportLibraryNotice("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/clarifying-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: normalizedTopic, run_config: apiRunConfig }),
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
    setResearchReport("");
    setResearchReportReferences([]);
    setReportError("");
    setReportLibraryNotice("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: normalizedTopic,
          clarifying_questions: normalizedQuestions,
          clarification: normalizedClarification,
          run_config: apiRunConfig,
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
    setResearchReport("");
    setResearchReportReferences([]);
    setReportError("");
    setReportLibraryNotice("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/search-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: normalizedBrief, run_config: apiRunConfig }),
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
    setResearchReport("");
    setResearchReportReferences([]);
    setReportError("");
    setReportLibraryNotice("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: normalizedQueries, run_config: apiRunConfig }),
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

  async function createResearchReport() {
    const normalizedBrief = researchBrief.trim();

    if (!normalizedBrief) {
      setReportStatus("error");
      setReportError("请先生成研究简报。");
      return;
    }

    if (researchFindings.length === 0) {
      setReportStatus("error");
      setReportError("请先整理研究发现。");
      return;
    }

    setReportStatus("loading");
    setReportError("");
    setResearchReport("");
    setResearchReportReferences([]);
    setReportLibraryNotice("");

    try {
      const response = await fetch(`${apiBaseUrl}/research/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: normalizedBrief,
          findings: researchFindings,
          run_config: apiRunConfig,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? `HTTP ${response.status}`);
      }

      const data = (await response.json()) as ResearchReportResponse;
      setResearchReport(data.report);
      setResearchReportReferences(data.references ?? []);
      setReportStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "研究报告生成失败。";
      setReportStatus("error");
      setReportError(message);
    }
  }

  function updateSearchQuery(index: number, value: string) {
    setSearchQueries((current) =>
      current.map((query, queryIndex) => (queryIndex === index ? value : query)),
    );
    setResearchFindings([]);
    setFindingsError("");
    setResearchReport("");
    setResearchReportReferences([]);
    setReportError("");
    setReportLibraryNotice("");
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
    setResearchReport("");
    setResearchReportReferences([]);
    setReportError("");
    setReportLibraryNotice("");
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
    setResearchReport("");
    setResearchReportReferences([]);
    setReportError("");
    setReportLibraryNotice("");
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

  const selectedReport =
    reportLibrary.find((report) => report.id === selectedReportId) ?? reportLibrary[0] ?? null;
  const researchProgressSteps: ResearchProgressStep[] = [
    {
      id: "topic",
      label: "研究主题",
      description: "输入要研究的问题",
      state: topic.trim() ? "complete" : "active",
    },
    {
      id: "questions",
      label: "澄清问题",
      description: "明确研究边界",
      state:
        questionStatus === "error"
          ? "error"
          : questionStatus === "loading"
            ? "active"
            : clarifyingQuestions.length > 0
              ? "complete"
              : topic.trim()
                ? "active"
                : "pending",
    },
    {
      id: "brief",
      label: "研究简报",
      description: "整理任务范围",
      state:
        briefStatus === "error"
          ? "error"
          : briefStatus === "loading"
            ? "active"
            : researchBrief.trim()
              ? "complete"
              : clarifyingQuestions.length > 0
                ? "active"
                : "pending",
    },
    {
      id: "search-plan",
      label: "检索问题",
      description: "生成搜索计划",
      state:
        searchPlanStatus === "error"
          ? "error"
          : searchPlanStatus === "loading"
            ? "active"
            : searchQueries.length > 0
              ? "complete"
              : researchBrief.trim()
                ? "active"
                : "pending",
    },
    {
      id: "findings",
      label: "研究发现",
      description: "检索并整理资料",
      state:
        findingsStatus === "error"
          ? "error"
          : findingsStatus === "loading"
            ? "active"
            : researchFindings.length > 0
              ? "complete"
              : searchQueries.length > 0
                ? "active"
                : "pending",
    },
    {
      id: "report",
      label: "研究报告",
      description: "生成最终报告",
      state:
        reportStatus === "error"
          ? "error"
          : reportStatus === "loading"
            ? "active"
            : researchReport.trim()
              ? "complete"
              : researchFindings.length > 0
                ? "active"
                : "pending",
    },
  ];

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Deep Research</p>
            <h1>研究工作台</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" onClick={restartResearchWorkspace}>
              <RotateCcw size={18} aria-hidden="true" />
              <span>重新开始</span>
            </button>
            <button className="icon-button" type="button" onClick={() => setIsReportLibraryOpen(true)}>
              <Library size={18} aria-hidden="true" />
              <span>报告库</span>
            </button>
            <button className="icon-button" type="button" onClick={() => setIsSettingsOpen(true)}>
              <Settings2 size={18} aria-hidden="true" />
              <span>设置</span>
            </button>
            <button className="icon-button" type="button" onClick={checkHealth}>
              <RefreshCcw size={18} aria-hidden="true" />
              <span>刷新状态</span>
            </button>
          </div>
        </header>

        <ResearchProgress steps={researchProgressSteps} />

        {isSettingsOpen && (
          <div className="settings-backdrop" onClick={() => setIsSettingsOpen(false)}>
            <aside
              className="settings-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="settings-header">
                <div>
                  <p className="eyebrow">运行配置</p>
                  <h2 id="settings-title">设置</h2>
                </div>
                <button
                  className="icon-only-button secondary-icon"
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  aria-label="关闭设置"
                  title="关闭设置"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="settings-body">
                <section className="settings-section">
                  <div className="settings-section-title">
                    <h3>配置</h3>
                    <p>模型和搜索服务会在每次请求时按这里的配置运行。</p>
                  </div>
                  <div className="settings-grid">
                    <label className="settings-field" htmlFor="model-api-format">
                      <span>模型接口</span>
                      <select
                        id="model-api-format"
                        value={runConfig.model.apiFormat}
                        onChange={(event) =>
                          updateRunConfig("model.apiFormat", event.target.value)
                        }
                      >
                        <option value="openai">OpenAI 兼容</option>
                        <option value="anthropic">Anthropic 兼容</option>
                      </select>
                    </label>

                    <label className="settings-field" htmlFor="model-base-url">
                      <span>模型 Base URL</span>
                      <input
                        id="model-base-url"
                        type="text"
                        value={runConfig.model.baseUrl}
                        placeholder="填写服务根地址，不含 /chat/completions 或 /messages"
                        onChange={(event) => updateRunConfig("model.baseUrl", event.target.value)}
                      />
                    </label>

                    <label className="settings-field" htmlFor="model-api-key">
                      <span>模型 API Key</span>
                      <input
                        id="model-api-key"
                        type="password"
                        value={runConfig.model.apiKey}
                        onChange={(event) => updateRunConfig("model.apiKey", event.target.value)}
                      />
                    </label>

                    <label className="settings-field" htmlFor="model-name">
                      <span>模型名称</span>
                      <input
                        id="model-name"
                        type="text"
                        value={runConfig.model.model}
                        placeholder="填写模型名称"
                        onChange={(event) => updateRunConfig("model.model", event.target.value)}
                      />
                    </label>

                    <label className="settings-field" htmlFor="search-provider">
                      <span>搜索提供商</span>
                      <select
                        id="search-provider"
                        value={runConfig.search.provider}
                        onChange={(event) =>
                          updateRunConfig("search.provider", event.target.value)
                        }
                      >
                        <option value="tavily">Tavily</option>
                        <option value="duckduckgo">DuckDuckGo</option>
                      </select>
                    </label>

                    <label className="settings-field" htmlFor="search-api-key">
                      <span>搜索 API Key</span>
                      <input
                        id="search-api-key"
                        type="password"
                        value={runConfig.search.apiKey}
                        disabled={runConfig.search.provider === "duckduckgo"}
                        placeholder={
                          runConfig.search.provider === "duckduckgo" ? "DuckDuckGo 不需要密钥" : ""
                        }
                        onChange={(event) => updateRunConfig("search.apiKey", event.target.value)}
                      />
                    </label>

                    <label className="settings-field" htmlFor="source-limit">
                      <span>每题保留来源数</span>
                      <input
                        id="source-limit"
                        type="number"
                        min={1}
                        max={10}
                        value={runConfig.search.sourceLimitPerQuery}
                        onChange={(event) =>
                          updateRunConfig(
                            "search.sourceLimitPerQuery",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  </div>
                </section>

                <section className="settings-section">
                  <div className="settings-section-title">
                    <h3>内容</h3>
                    <p>这些参数会直接影响澄清、检索和报告的产出形态。</p>
                  </div>
                  <div className="settings-grid">
                    <label className="settings-field" htmlFor="clarifying-count">
                      <span>澄清问题数</span>
                      <input
                        id="clarifying-count"
                        type="number"
                        min={3}
                        max={10}
                        value={runConfig.content.clarifyingQuestionCount}
                        onChange={(event) =>
                          updateRunConfig(
                            "content.clarifyingQuestionCount",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>

                    <label className="settings-field" htmlFor="search-plan-count">
                      <span>检索问题数</span>
                      <input
                        id="search-plan-count"
                        type="number"
                        min={3}
                        max={10}
                        value={runConfig.content.searchPlanQuestionCount}
                        onChange={(event) =>
                          updateRunConfig(
                            "content.searchPlanQuestionCount",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>

                    <label className="settings-field" htmlFor="report-tone">
                      <span>报告语气</span>
                      <select
                        id="report-tone"
                        value={runConfig.content.reportTone}
                        onChange={(event) =>
                          updateRunConfig("content.reportTone", event.target.value)
                        }
                      >
                        <option value="neutral">中性</option>
                        <option value="concise">简洁</option>
                        <option value="analytical">分析性</option>
                      </select>
                    </label>

                    <label className="settings-field" htmlFor="output-language">
                      <span>输出语言</span>
                      <select
                        id="output-language"
                        value={runConfig.content.outputLanguage}
                        onChange={(event) =>
                          updateRunConfig("content.outputLanguage", event.target.value)
                        }
                      >
                        <option value="zh-CN">中文</option>
                        <option value="en">英文</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section className="settings-section">
                  <div className="settings-section-title">
                    <h3>界面</h3>
                    <p>界面密度会影响卡片间距和信息压缩程度。</p>
                  </div>
                  <div className="settings-grid">
                    <label className="settings-field" htmlFor="ui-density">
                      <span>界面密度</span>
                      <select
                        id="ui-density"
                        value={runConfig.ui.density}
                        onChange={(event) => updateRunConfig("ui.density", event.target.value)}
                      >
                        <option value="comfortable">舒展</option>
                        <option value="compact">紧凑</option>
                      </select>
                    </label>
                  </div>
                </section>
              </div>

              <div className="settings-footer">
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setRunConfig(resetRunConfig())}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  <span>恢复默认</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {isReportLibraryOpen && (
          <div className="settings-backdrop" onClick={() => setIsReportLibraryOpen(false)}>
            <aside
              className="library-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="library-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="settings-header">
                <div>
                  <p className="eyebrow">本地知识库</p>
                  <h2 id="library-title">报告库</h2>
                </div>
                <button
                  className="icon-only-button secondary-icon"
                  type="button"
                  onClick={() => setIsReportLibraryOpen(false)}
                  aria-label="关闭报告库"
                  title="关闭报告库"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              {reportLibrary.length === 0 ? (
                <div className="library-empty">
                  <h3>暂无历史报告</h3>
                  <p>生成研究报告后，可以在报告区保存到本地报告库。</p>
                </div>
              ) : (
                <div className="library-body">
                  <div className="library-list" aria-label="历史报告列表">
                    {reportLibrary.map((report) => (
                      <button
                        className={`library-item${selectedReport?.id === report.id ? " active" : ""}`}
                        type="button"
                        key={report.id}
                        onClick={() => setSelectedReportId(report.id)}
                      >
                        <span>{report.title}</span>
                        <small>{formatDateTime(report.createdAt)}</small>
                      </button>
                    ))}
                  </div>

                  {selectedReport && (
                    <article className="library-preview" aria-label="历史报告预览">
                      <div className="module-header">
                        <div>
                          <h3>{selectedReport.title}</h3>
                          <p>{formatDateTime(selectedReport.createdAt)}</p>
                        </div>
                        <button
                          className="icon-only-button"
                          type="button"
                          onClick={() => removeSavedReport(selectedReport.id)}
                          aria-label="删除历史报告"
                          title="删除历史报告"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="markdown-preview library-report-preview">
                        <ReactMarkdown>{selectedReport.report}</ReactMarkdown>
                      </div>
                      <div className="action-row">
                        <button
                          className="secondary-action"
                          type="button"
                          onClick={() => loadSavedReport(selectedReport)}
                        >
                          <RefreshCcw size={16} aria-hidden="true" />
                          <span>载入</span>
                        </button>
                        <button
                          className="secondary-action"
                          type="button"
                          onClick={() => downloadMarkdownReport(selectedReport)}
                        >
                          <Download size={16} aria-hidden="true" />
                          <span>下载</span>
                        </button>
                      </div>
                    </article>
                  )}
                </div>
              )}
            </aside>
          </div>
        )}

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
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={reportStatus === "loading"}
                    onClick={createResearchReport}
                  >
                    <span>{reportStatus === "loading" ? "正在生成研究报告" : "生成研究报告"}</span>
                  </button>
                </>
              )}
              {findingsError && <p className="error-text">{findingsError}</p>}
            </section>
          )}

          {(researchReport || reportError) && (
            <section className="report-result" aria-label="研究报告">
              {researchReport && (
                <>
                  <div className="module-header">
                    <h2>研究报告</h2>
                    <div className="report-actions">
                      <button
                        className="icon-only-button secondary-icon"
                        type="button"
                        onClick={downloadCurrentReport}
                        aria-label="下载研究报告"
                        title="下载 Markdown"
                      >
                        <Download size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-only-button secondary-icon"
                        type="button"
                        onClick={saveCurrentReportToLibrary}
                        aria-label="保存到报告库"
                        title="保存到报告库"
                      >
                        <Save size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  {reportLibraryNotice && <p className="success-text">{reportLibraryNotice}</p>}
                  <div className="markdown-preview report-preview">
                    <ReactMarkdown>{researchReport}</ReactMarkdown>
                  </div>
                  {researchReportReferences.length > 0 && (
                    <div className="source-links">
                      {researchReportReferences.map((source, index) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                          [{index + 1}] {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
              {reportError && <p className="error-text">{reportError}</p>}
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

function ResearchProgress({ steps }: { steps: ResearchProgressStep[] }) {
  const completedCount = steps.filter((step) => step.state === "complete").length;
  const activeStep = steps.find((step) => step.state === "active" || step.state === "error");
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <section className="progress-panel" aria-label="研究流程进度">
      <div className="progress-header">
        <div>
          <p className="eyebrow">研究流程</p>
          <h2>{activeStep ? `当前：${activeStep.label}` : "流程完成"}</h2>
        </div>
        <span className="progress-count">
          {completedCount}/{steps.length}
        </span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <ol className="progress-steps">
        {steps.map((step, index) => (
          <li className={`progress-step ${step.state}`} key={step.id}>
            <span className="progress-marker">
              {step.state === "complete" ? <Check size={14} aria-hidden="true" /> : index + 1}
            </span>
            <span>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default App;
