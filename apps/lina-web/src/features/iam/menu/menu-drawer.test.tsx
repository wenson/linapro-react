import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";

import type { SystemMenuApi } from "#/api/system/menu";
import { Providers } from "#/app/providers";
import { MenuDrawer } from "#/features/iam/menu/menu-drawer";

it("shows an API validation error and keeps the drawer open", async () => {
  const api: SystemMenuApi = {
    create: vi.fn().mockRejectedValue(new Error("Menu icon already exists")),
    delete: vi.fn(),
    get: vi.fn(),
    getRoleTree: vi.fn(),
    getTreeSelect: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
  };
  const onClose = vi.fn();

  render(
    <Providers queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MenuDrawer api={api} onClose={onClose} onSaved={vi.fn()} open />
    </Providers>,
  );

  await userEvent.type(await screen.findByRole("textbox", { name: /Menu name|菜单名称/i }), "Duplicate icon");
  await userEvent.type(screen.getByRole("textbox", { name: /Menu icon|菜单图标/i }), "lucide:layout-dashboard");
  await userEvent.type(screen.getByRole("textbox", { name: /Route path|路由路径/i }), "duplicate-icon");
  await userEvent.click(screen.getByRole("button", { name: /Save|保存/i }));

  expect(await screen.findByText("Menu icon already exists")).toBeVisible();
  await waitFor(() => expect(api.create).toHaveBeenCalledOnce());
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeVisible();
});
