export type RunConfiguration = {
  version: number;
  model: {
    apiFormat: "openai" | "anthropic";
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  search: {
    provider: "tavily" | "duckduckgo";
    apiKey: string;
    sourceLimitPerQuery: number;
  };
  content: {
    clarifyingQuestionCount: number;
    searchPlanQuestionCount: number;
    reportTone: "neutral" | "concise" | "analytical";
    outputLanguage: "zh-CN" | "en";
  };
  ui: {
    density: "comfortable" | "compact";
  };
};

export type ApiRunConfiguration = {
  model: {
    api_format: "openai" | "anthropic";
    api_key: string;
    base_url: string;
    model: string;
  };
  search: {
    provider: "tavily" | "duckduckgo";
    api_key: string;
    source_limit_per_query: number;
  };
  content: {
    clarifying_question_count: number;
    search_plan_question_count: number;
    report_tone: "neutral" | "concise" | "analytical";
    output_language: "zh-CN" | "en";
  };
  ui: {
    density: "comfortable" | "compact";
  };
};

export const runConfigVersion = 4;

export const defaultRunConfig: RunConfiguration = {
  version: runConfigVersion,
  model: {
    apiFormat: "openai",
    apiKey: "",
    baseUrl: "",
    model: "",
  },
  search: {
    provider: "tavily",
    apiKey: "",
    sourceLimitPerQuery: 3,
  },
  content: {
    clarifyingQuestionCount: 4,
    searchPlanQuestionCount: 5,
    reportTone: "neutral",
    outputLanguage: "zh-CN",
  },
  ui: {
    density: "comfortable",
  },
};

export const runConfigStorageKey = "deepresearch.run-config";

function cloneDefaultRunConfig(): RunConfiguration {
  return {
    version: defaultRunConfig.version,
    model: { ...defaultRunConfig.model },
    search: { ...defaultRunConfig.search },
    content: { ...defaultRunConfig.content },
    ui: { ...defaultRunConfig.ui },
  };
}

export function cloneRunConfig(config: RunConfiguration): RunConfiguration {
  return {
    version: config.version,
    model: { ...config.model },
    search: { ...config.search },
    content: { ...config.content },
    ui: { ...config.ui },
  };
}

export function loadRunConfig(): RunConfiguration {
  if (typeof window === "undefined") {
    return cloneDefaultRunConfig();
  }

  const raw = window.localStorage.getItem(runConfigStorageKey);
  if (!raw) {
    return cloneDefaultRunConfig();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RunConfiguration>;
    if (parsed.version !== runConfigVersion) {
      const migrated = cloneDefaultRunConfig();
      migrated.model.apiKey = parsed.model?.apiKey ?? "";
      migrated.search.apiKey = parsed.search?.apiKey ?? "";
      return migrated;
    }

    return {
      version: runConfigVersion,
      model: {
        ...defaultRunConfig.model,
        ...parsed.model,
        baseUrl: "",
        model: "",
      },
      search: {
        ...defaultRunConfig.search,
        ...parsed.search,
      },
      content: {
        ...defaultRunConfig.content,
        ...parsed.content,
      },
      ui: {
        ...defaultRunConfig.ui,
        ...parsed.ui,
      },
    };
  } catch {
    return cloneDefaultRunConfig();
  }
}

export function saveRunConfig(config: RunConfiguration): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(runConfigStorageKey, JSON.stringify(config));
}

export function resetRunConfig(): RunConfiguration {
  const fresh = cloneDefaultRunConfig();
  saveRunConfig(fresh);
  return fresh;
}

export function toApiRunConfig(config: RunConfiguration): ApiRunConfiguration {
  return {
    model: {
      api_format: config.model.apiFormat,
      api_key: config.model.apiKey,
      base_url: config.model.baseUrl,
      model: config.model.model,
    },
    search: {
      provider: config.search.provider,
      api_key: config.search.apiKey,
      source_limit_per_query: config.search.sourceLimitPerQuery,
    },
    content: {
      clarifying_question_count: config.content.clarifyingQuestionCount,
      search_plan_question_count: config.content.searchPlanQuestionCount,
      report_tone: config.content.reportTone,
      output_language: config.content.outputLanguage,
    },
    ui: {
      density: config.ui.density,
    },
  };
}
