import { pluginApiPath } from "@host-tests/fixtures/config";
import {
  createAdminApiContext,
  expectSuccess,
} from "@host-tests/support/api/job";

const pluginID = "linapro-content-notice";

export const systemUpgradeNoticeTitle = "系统升级通知";

export async function ensureSystemUpgradeNotice() {
  const api = await createAdminApiContext();
  try {
    const existing = await expectSuccess<{
      list: Array<{ id: number; title: string }>;
    }>(
      await api.get(
        pluginApiPath(
          pluginID,
          `notice?pageNum=1&pageSize=100&title=${encodeURIComponent(systemUpgradeNoticeTitle)}`,
        ),
      ),
    );
    if (existing.list.some((item) => item.title === systemUpgradeNoticeTitle)) {
      return;
    }

    await expectSuccess(
      await api.post(pluginApiPath(pluginID, "notice"), {
        data: {
          content:
            "<p>系统将于本周六凌晨2:00-4:00进行升级维护，届时系统将暂停服务。</p>",
          status: 1,
          title: systemUpgradeNoticeTitle,
          type: 1,
        },
      }),
    );
  } finally {
    await api.dispose();
  }
}
