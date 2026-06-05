import { Activity, RefreshCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8011";

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

function App() {
  const [topic, setTopic] = useState("");
  const [health, setHealth] = useState<HealthState>({ status: "idle" });

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

          <button className="primary-action" type="button" disabled>
            <Search size={18} aria-hidden="true" />
            <span>下一步接入研究流程</span>
          </button>
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
