import type { FullConfig } from "@playwright/test";

import { adminStorageStatePath } from "./fixtures/auth-state";
import { logoutStorageStateFile } from "./support/auth-session";

export default async function globalTeardown(_config: FullConfig) {
  await logoutStorageStateFile(adminStorageStatePath);
}
