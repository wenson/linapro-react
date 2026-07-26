import { test } from "@host-tests/fixtures/auth";
import { prepareSourcePluginsBaseline } from "@host-tests/fixtures/plugin";

import { NoticePage } from "../../pages/NoticePage";

test.describe("TC-11 通知公告响应式布局", () => {
  test.beforeAll(async () => {
    await prepareSourcePluginsBaseline(["linapro-content-notice"], {
      loadMockData: false,
    });
  });

  test("TC-11a: 筛选按钮、桌面表格和手机信息卡均完整可用", async ({
    adminPage,
  }) => {
    const noticeRoute =
      "**/x/linapro-content-notice/api/v1/notice**";
    await adminPage.route(noticeRoute, async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          code: 0,
          data: {
            list: [
              {
                content: "<p>响应式布局测试内容</p>",
                createdAt: Date.now(),
                createdBy: 1,
                createdByName: "admin",
                fileIds: "",
                id: 1,
                remark: "",
                status: 1,
                title: "响应式布局测试公告",
                type: 1,
                updatedAt: Date.now(),
                updatedBy: 1,
              },
            ],
            total: 1,
          },
        }),
        contentType: "application/json",
        status: 200,
      });
    });
    const noticePage = new NoticePage(adminPage);
    try {
      await noticePage.goto();
      await noticePage.assertResponsiveLayout();
    } finally {
      await adminPage.unroute(noticeRoute).catch(() => {});
    }
  });
});
