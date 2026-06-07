import type { WorkspaceResearchFinding, WorkspaceResearchSource } from "./workspaceState";

export type SavedResearchReport = {
  id: string;
  title: string;
  topic: string;
  createdAt: string;
  brief: string;
  findings: WorkspaceResearchFinding[];
  report: string;
  references: WorkspaceResearchSource[];
};

export const reportLibraryStorageKey = "deepresearch.report-library";
export const reportLibraryVersion = 1;

type StoredReportLibrary = {
  version: number;
  reports: SavedResearchReport[];
};

function createEmptyLibrary(): StoredReportLibrary {
  return { version: reportLibraryVersion, reports: [] };
}

export function loadReportLibrary(): SavedResearchReport[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(reportLibraryStorageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredReportLibrary>;
    if (parsed.version !== reportLibraryVersion) {
      return [];
    }

    return (parsed.reports ?? []).map((report) => ({
      ...report,
      findings: report.findings ?? [],
      references: report.references ?? [],
    }));
  } catch {
    return [];
  }
}

export function saveReportLibrary(reports: SavedResearchReport[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    reportLibraryStorageKey,
    JSON.stringify({ ...createEmptyLibrary(), reports }),
  );
}

export function createSavedResearchReport(input: {
  topic: string;
  brief: string;
  findings: WorkspaceResearchFinding[];
  report: string;
  references: WorkspaceResearchSource[];
}): SavedResearchReport {
  const createdAt = new Date().toISOString();
  const title = input.topic.trim() || firstMarkdownHeading(input.report) || "未命名研究报告";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    topic: input.topic,
    createdAt,
    brief: input.brief,
    findings: input.findings.map((finding) => ({
      ...finding,
      sources: finding.sources.map((source) => ({ ...source })),
    })),
    report: input.report,
    references: input.references.map((reference) => ({ ...reference })),
  };
}

export function formatReportMarkdown(report: SavedResearchReport): string {
  const references = report.references
    .map((reference, index) => `${index + 1}. [${reference.title}](${reference.url})`)
    .join("\n");

  const metadata = [
    `# ${report.title}`,
    "",
    `- 研究主题：${report.topic || report.title}`,
    `- 保存时间：${formatDateTime(report.createdAt)}`,
    "",
  ].join("\n");

  if (!references) {
    return `${metadata}${report.report.trim()}\n`;
  }

  return `${metadata}${report.report.trim()}\n\n## 参考来源\n${references}\n`;
}

export function downloadMarkdownReport(report: SavedResearchReport): void {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([formatReportMarkdown(report)], {
    type: "text/markdown;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFileName(report.title)}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function firstMarkdownHeading(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "";
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "research-report";
}
