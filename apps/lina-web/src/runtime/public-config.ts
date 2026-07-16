import type { ApiClient } from "#/api/client";

export type AuthPanelLayout = "panel-center" | "panel-left" | "panel-right";
export type ThemeMode = "auto" | "dark" | "light";
export type WorkspaceLayout =
  | "full-content"
  | "header-mixed-nav"
  | "header-nav"
  | "header-sidebar-nav"
  | "mixed-nav"
  | "sidebar-mixed-nav"
  | "sidebar-nav";
export type CronLogRetentionMode = "count" | "days" | "none";

export interface PublicFrontendConfig {
  app: {
    logo: string;
    logoDark: string;
    name: string;
  };
  auth: {
    loginSubtitle: string;
    panelLayout: AuthPanelLayout;
    pageDesc: string;
    pageTitle: string;
  };
  cron: {
    logRetention: {
      mode: CronLogRetentionMode;
      value: number;
    };
    shell: {
      disabledReason: string;
      disabledReasonKey: string;
      enabled: boolean;
      supported: boolean;
    };
    timezone: {
      current: string;
    };
  };
  ui: {
    layout: WorkspaceLayout;
    themeMode: ThemeMode;
    watermarkContent: string;
    watermarkEnabled: boolean;
  };
  user: {
    defaultAvatar: string;
  };
  workspace: {
    basePath: string;
  };
}

export const DEFAULT_WORKSPACE_BASE_PATH = "/admin";

export const defaultPublicFrontendConfig: PublicFrontendConfig = {
  app: {
    logo: "/logo.webp",
    logoDark: "/logo.webp",
    name: "LinaPro.AI",
  },
  auth: {
    loginSubtitle: "Enter your account credentials to start managing your projects",
    panelLayout: "panel-right",
    pageDesc:
      "Built for evolving business needs, with an out-of-the-box admin entry point and a flexible pluggable extension model",
    pageTitle: "An AI-native full-stack framework engineered for sustainable delivery",
  },
  cron: {
    logRetention: {
      mode: "days",
      value: 30,
    },
    shell: {
      disabledReason: "",
      disabledReasonKey: "",
      enabled: false,
      supported: true,
    },
    timezone: {
      current: "Asia/Shanghai",
    },
  },
  ui: {
    layout: "sidebar-nav",
    themeMode: "light",
    watermarkContent: "LinaPro",
    watermarkEnabled: false,
  },
  user: {
    defaultAvatar: "/avatar.webp",
  },
  workspace: {
    basePath: DEFAULT_WORKSPACE_BASE_PATH,
  },
};

const authPanelLayouts = new Set<AuthPanelLayout>(["panel-left", "panel-center", "panel-right"]);
const themeModes = new Set<ThemeMode>(["auto", "dark", "light"]);
const workspaceLayouts = new Set<WorkspaceLayout>([
  "full-content",
  "header-mixed-nav",
  "header-nav",
  "header-sidebar-nav",
  "mixed-nav",
  "sidebar-mixed-nav",
  "sidebar-nav",
]);
const logRetentionModes = new Set<CronLogRetentionMode>(["count", "days", "none"]);
const reservedWorkspacePrefixes = ["/api", "/x", "/x-assets"];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (value === true || value === "true") {
    return true;
  }
  if (value === false || value === "false") {
    return false;
  }
  return fallback;
}

function normalizePositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeEnum<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  const normalized = normalizeString(value) as T;
  return allowed.has(normalized) ? normalized : fallback;
}

export function normalizeWorkspaceBasePath(value: unknown, fallback = DEFAULT_WORKSPACE_BASE_PATH): string {
  const input = normalizeString(value);
  if (input.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(input)) {
    return fallback;
  }
  const cleaned = input
    .replaceAll("\\", "/")
    .replace(/\/{2,}/g, "/");
  if (cleaned === "/") {
    return "/";
  }

  const normalized = cleaned.replace(/\/+$/, "");
  if (
    !normalized ||
    !normalized.startsWith("/") ||
    normalized.includes("*") ||
    normalized.includes("?") ||
    normalized.includes("#") ||
    normalized.includes("://") ||
    normalized.split("/").some((segment) => segment === "..") ||
    reservedWorkspacePrefixes.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return fallback;
  }
  return normalized;
}

export function resolveWorkspaceRouterBase(basePath: unknown): string {
  const normalized = normalizeWorkspaceBasePath(basePath);
  return normalized === "/" ? "/" : `${normalized}/`;
}

function splitUrlSuffix(value: string): [string, string] {
  const indexes = [value.indexOf("?"), value.indexOf("#")].filter((index) => index >= 0);
  if (!indexes.length) {
    return [value, ""];
  }
  const suffixIndex = Math.min(...indexes);
  return [value.slice(0, suffixIndex), value.slice(suffixIndex)];
}

export function resolveWorkspaceAssetUrl(value: unknown, basePath: unknown): string {
  const cleaned = normalizeString(value);
  if (!cleaned || cleaned.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(cleaned)) {
    return cleaned;
  }

  const [rawPath, suffix] = splitUrlSuffix(cleaned);
  const normalizedPath = rawPath.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/{2,}/g, "/");
  const rootedPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  if (
    rootedPath === "/api.json" ||
    ["/api", "/x", "/x-assets"].some(
      (prefix) => rootedPath === prefix || rootedPath.startsWith(`${prefix}/`),
    )
  ) {
    return `${rootedPath}${suffix}`;
  }

  const normalizedBasePath = normalizeWorkspaceBasePath(basePath);
  if (
    normalizedBasePath === "/" ||
    rootedPath === normalizedBasePath ||
    rootedPath.startsWith(`${normalizedBasePath}/`)
  ) {
    return `${rootedPath}${suffix}`;
  }
  return `${normalizedBasePath}${rootedPath}${suffix}`;
}

export function normalizePublicFrontendConfig(payload: unknown): PublicFrontendConfig {
  const root = asRecord(payload);
  const app = asRecord(root.app);
  const auth = asRecord(root.auth);
  const cron = asRecord(root.cron);
  const logRetention = asRecord(cron.logRetention);
  const shell = asRecord(cron.shell);
  const timezone = asRecord(cron.timezone);
  const ui = asRecord(root.ui);
  const user = asRecord(root.user);
  const workspace = asRecord(root.workspace);
  const logRetentionMode = normalizeEnum(
    logRetention.mode,
    logRetentionModes,
    defaultPublicFrontendConfig.cron.logRetention.mode,
  );

  return {
    app: {
      logo: normalizeString(app.logo, defaultPublicFrontendConfig.app.logo),
      logoDark: normalizeString(app.logoDark, defaultPublicFrontendConfig.app.logoDark),
      name: normalizeString(app.name, defaultPublicFrontendConfig.app.name),
    },
    auth: {
      loginSubtitle: normalizeString(auth.loginSubtitle, defaultPublicFrontendConfig.auth.loginSubtitle),
      panelLayout: normalizeEnum(
        auth.panelLayout,
        authPanelLayouts,
        defaultPublicFrontendConfig.auth.panelLayout,
      ),
      pageDesc: normalizeString(auth.pageDesc, defaultPublicFrontendConfig.auth.pageDesc),
      pageTitle: normalizeString(auth.pageTitle, defaultPublicFrontendConfig.auth.pageTitle),
    },
    cron: {
      logRetention: {
        mode: logRetentionMode,
        value:
          logRetentionMode === "none"
            ? 0
            : normalizePositiveNumber(logRetention.value, defaultPublicFrontendConfig.cron.logRetention.value),
      },
      shell: {
        disabledReason: normalizeString(shell.disabledReason),
        disabledReasonKey: normalizeString(shell.disabledReasonKey),
        enabled: normalizeBoolean(shell.enabled, defaultPublicFrontendConfig.cron.shell.enabled),
        supported: normalizeBoolean(shell.supported, defaultPublicFrontendConfig.cron.shell.supported),
      },
      timezone: {
        current: normalizeString(timezone.current, defaultPublicFrontendConfig.cron.timezone.current),
      },
    },
    ui: {
      layout: normalizeEnum(ui.layout, workspaceLayouts, defaultPublicFrontendConfig.ui.layout),
      themeMode: normalizeEnum(ui.themeMode, themeModes, defaultPublicFrontendConfig.ui.themeMode),
      watermarkContent: normalizeString(
        ui.watermarkContent,
        defaultPublicFrontendConfig.ui.watermarkContent,
      ),
      watermarkEnabled: normalizeBoolean(
        ui.watermarkEnabled,
        defaultPublicFrontendConfig.ui.watermarkEnabled,
      ),
    },
    user: {
      defaultAvatar: normalizeString(user.defaultAvatar, defaultPublicFrontendConfig.user.defaultAvatar),
    },
    workspace: {
      basePath: normalizeWorkspaceBasePath(workspace.basePath),
    },
  };
}

export interface LoadPublicFrontendConfigOptions {
  locale?: string;
  onDiagnostic?: (error: unknown) => void;
}

export async function loadPublicFrontendConfig(
  client: ApiClient,
  options: LoadPublicFrontendConfigOptions = {},
): Promise<PublicFrontendConfig> {
  try {
    const payload = await client.get<unknown>("config/public/frontend", {
      cache: "no-store",
      headers: options.locale ? { "Accept-Language": options.locale } : undefined,
    });
    return normalizePublicFrontendConfig(payload);
  } catch (error) {
    options.onDiagnostic?.(error);
    return normalizePublicFrontendConfig(defaultPublicFrontendConfig);
  }
}
