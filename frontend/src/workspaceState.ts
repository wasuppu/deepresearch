export type WorkspaceResearchSource = {
  title: string;
  url: string;
  content: string;
  query: string;
};

export type WorkspaceResearchFinding = {
  query: string;
  finding: string;
  sources: WorkspaceResearchSource[];
};

export type ResearchWorkspaceState = {
  version: number;
  topic: string;
  clarifyingQuestions: string[];
  clarification: string;
  researchBrief: string;
  searchQueries: string[];
  researchFindings: WorkspaceResearchFinding[];
  researchReport: string;
  researchReportReferences: WorkspaceResearchSource[];
};

export const researchWorkspaceStateVersion = 1;
export const researchWorkspaceStateStorageKey = "deepresearch.workspace-state";

export const defaultResearchWorkspaceState: ResearchWorkspaceState = {
  version: researchWorkspaceStateVersion,
  topic: "",
  clarifyingQuestions: [],
  clarification: "",
  researchBrief: "",
  searchQueries: [],
  researchFindings: [],
  researchReport: "",
  researchReportReferences: [],
};

export function cloneResearchWorkspaceState(
  state: ResearchWorkspaceState = defaultResearchWorkspaceState,
): ResearchWorkspaceState {
  return {
    version: researchWorkspaceStateVersion,
    topic: state.topic,
    clarifyingQuestions: [...state.clarifyingQuestions],
    clarification: state.clarification,
    researchBrief: state.researchBrief,
    searchQueries: [...state.searchQueries],
    researchFindings: state.researchFindings.map((finding) => ({
      ...finding,
      sources: finding.sources.map((source) => ({ ...source })),
    })),
    researchReport: state.researchReport,
    researchReportReferences: state.researchReportReferences.map((source) => ({
      ...source,
    })),
  };
}

export function loadResearchWorkspaceState(): ResearchWorkspaceState {
  if (typeof window === "undefined") {
    return cloneResearchWorkspaceState();
  }

  const raw = window.localStorage.getItem(researchWorkspaceStateStorageKey);
  if (!raw) {
    return cloneResearchWorkspaceState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ResearchWorkspaceState>;
    if (parsed.version !== researchWorkspaceStateVersion) {
      return cloneResearchWorkspaceState();
    }

    return cloneResearchWorkspaceState({
      ...defaultResearchWorkspaceState,
      ...parsed,
      clarifyingQuestions: parsed.clarifyingQuestions ?? [],
      searchQueries: parsed.searchQueries ?? [],
      researchFindings: parsed.researchFindings ?? [],
      researchReportReferences: parsed.researchReportReferences ?? [],
    });
  } catch {
    return cloneResearchWorkspaceState();
  }
}

export function saveResearchWorkspaceState(state: ResearchWorkspaceState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(researchWorkspaceStateStorageKey, JSON.stringify(state));
}

export function resetResearchWorkspaceState(): ResearchWorkspaceState {
  const fresh = cloneResearchWorkspaceState();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(researchWorkspaceStateStorageKey);
  }
  return fresh;
}
