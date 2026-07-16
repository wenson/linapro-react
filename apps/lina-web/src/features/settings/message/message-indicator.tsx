import { IconBell } from "@douyinfe/semi-icons";
import Badge from "@douyinfe/semi-ui/lib/es/badge";
import Button from "@douyinfe/semi-ui/lib/es/button";
import List from "@douyinfe/semi-ui/lib/es/list";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Popover from "@douyinfe/semi-ui/lib/es/popover";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { ApiClient } from "#/api/client";
import {
  createSystemMessageApi,
  type UserMessage,
} from "#/api/system/message";

export function MessageIndicator({ apiClient }: { apiClient: ApiClient }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const api = useMemo(() => createSystemMessageApi(apiClient), [apiClient]);
  const [pageVisible, setPageVisible] = useState(
    document.visibilityState === "visible",
  );
  const [popoverVisible, setPopoverVisible] = useState(false);

  useEffect(() => {
    const change = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);

  const count = useQuery({
    queryFn: () => api.count(),
    queryKey: ["messages", "unread"],
    refetchInterval: pageVisible ? 30_000 : false,
  });
  const list = useQuery({
    enabled: popoverVisible,
    queryFn: () => api.list(1, 5),
    queryKey: ["messages", "list", 1, 5],
  });

  async function refresh() {
    await Promise.all([count.refetch(), list.refetch()]);
  }

  async function openMessage(item: UserMessage) {
    if (item.isRead === 0) {
      await api.read(item.id);
      await refresh();
    }
    setPopoverVisible(false);
    navigate("/system/message");
  }

  async function markAllRead() {
    await api.readAll();
    Toast.success(t("pages.settings.message.readAllSuccess"));
    await refresh();
  }

  function clearAll() {
    Modal.confirm({
      content: t("pages.settings.message.clearConfirm"),
      onOk: async () => {
        await api.clear();
        Toast.success(t("pages.settings.message.clearSuccess"));
        await refresh();
      },
      title: t("pages.common.confirmTitle"),
    });
  }

  const content = (
    <div className="message-popover" data-testid="message-popover">
      <div className="message-popover-header">
        <Typography.Text strong>
          {t("pages.settings.message.panelTitle")}
        </Typography.Text>
        <Button
          data-testid="message-popover-read-all"
          disabled={!count.data}
          onClick={() => void markAllRead()}
          size="small"
          theme="borderless"
        >
          {t("pages.settings.message.readAll")}
        </Button>
      </div>
      <div data-testid="message-popover-list">
        <List<UserMessage>
          dataSource={list.data?.list ?? []}
          emptyContent={t("pages.settings.message.empty")}
          loading={list.isPending}
          renderItem={(item) => (
            <List.Item
              main={(
                <button
                  className="message-popover-item"
                  data-testid={`message-popover-item-${item.id}`}
                  onClick={() => void openMessage(item)}
                  type="button"
                >
                  {item.isRead === 0 ? <Badge dot /> : null}
                  <span>{item.title}</span>
                </button>
              )}
            />
          )}
        />
      </div>
      <div className="message-popover-footer">
        <Button
          data-testid="message-popover-clear"
          disabled={!list.data?.list.length}
          onClick={clearAll}
          size="small"
          theme="borderless"
          type="danger"
        >
          {t("pages.settings.message.clear")}
        </Button>
        <Button
          data-testid="message-popover-view-all"
          onClick={() => {
            setPopoverVisible(false);
            navigate("/system/message");
          }}
          size="small"
          theme="solid"
          type="primary"
        >
          {t("pages.settings.message.viewAll")}
        </Button>
      </div>
    </div>
  );

  return (
    <Space data-testid="message-indicator">
      <span className="visually-hidden" data-testid="message-indicator-unread-count">
        {count.data ?? 0}
      </span>
      <Popover
        content={content}
        onVisibleChange={setPopoverVisible}
        position="bottomRight"
        trigger="click"
        visible={popoverVisible}
      >
        <Badge count={count.data ?? 0} overflowCount={99}>
          <Button
            aria-label={t("pages.settings.message.open")}
            className="bell-button"
            data-testid="message-indicator-trigger"
            icon={<IconBell />}
            theme="borderless"
          />
        </Badge>
      </Popover>
    </Space>
  );
}
