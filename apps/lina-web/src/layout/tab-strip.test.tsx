import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { useState } from "react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";

import { Providers } from "#/app/providers";
import enMessages from "#/locales/en-US/app.json";
import { TabStrip } from "#/layout/tab-strip";
import { tabStore } from "#/layout/tab-store";

const i18n = createInstance();

beforeAll(async () => {
  await i18n.init({ lng: "en-US", resources: { "en-US": { translation: enMessages } } });
});

beforeEach(() => {
  tabStore.getState().clear();
  tabStore.getState().open({ path: "/first", query: "", title: "First page" });
  tabStore.getState().open({ path: "/second", query: "", title: "A very long second page title" });
  tabStore.getState().open({ path: "/third", query: "", title: "Third page" });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

it("scrolls the active tab into view and focuses the previous tab after close", async () => {
  function Harness() {
    const [activePath, setActivePath] = useState("/second");
    return <TabStrip activePath={activePath} onNavigate={setActivePath} />;
  }
  render(<Providers i18n={i18n}><Harness /></Providers>);

  expect(screen.getByLabelText("Open pages")).toBeVisible();
  expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Close A very long second page title" }));

  await waitFor(() => expect(screen.getByRole("button", { name: "First page" })).toHaveFocus());
  expect(tabStore.getState().tabs.map((tab) => tab.path)).toEqual(["/first", "/third"]);
});
