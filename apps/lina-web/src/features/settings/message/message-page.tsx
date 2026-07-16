import Badge from "@douyinfe/semi-ui/lib/es/badge";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Card from "@douyinfe/semi-ui/lib/es/card";
import List from "@douyinfe/semi-ui/lib/es/list";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Pagination from "@douyinfe/semi-ui/lib/es/pagination";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createSystemMessageApi,
  type UserMessage,
} from "#/api/system/message";
import { useWorkbenchRuntime } from "#/app/workbench-runtime-context";
import { formatTimestamp } from "#/shared/format";

export default function MessagePage() {
  const { apiClient } = useWorkbenchRuntime();
  const { i18n, t } = useTranslation();
  const api = useMemo(() => createSystemMessageApi(apiClient), [apiClient]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailId, setDetailId] = useState<number>();
  const [visible, setVisible] = useState(document.visibilityState === "visible");

  useEffect(() => {
    const change = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);

  const count = useQuery({
    queryFn: () => api.count(),
    queryKey: ["messages", "unread"],
    refetchInterval: visible ? 30_000 : false,
  });
  const list = useQuery({
    queryFn: () => api.list(page, pageSize),
    queryKey: ["messages", "list", page, pageSize],
  });
  const detail = useQuery({
    enabled: typeof detailId === "number",
    queryFn: () => api.get(detailId as number),
    queryKey: ["messages", "detail", detailId],
  });

  async function refresh() {
    await Promise.all([count.refetch(), list.refetch()]);
  }

  async function open(item: UserMessage) {
    setDetailId(item.id);
    if (item.isRead === 0) {
      await api.read(item.id);
      await refresh();
    }
  }

  async function markAllRead() {
    await api.readAll();
    Toast.success(t("pages.settings.message.readAllSuccess"));
    await refresh();
  }

  async function remove(event: React.MouseEvent, id: number) {
    event.stopPropagation();
    await api.delete(id);
    Toast.success(t("pages.common.deleteSuccess"));
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

  return (
    <section className="feature-page" data-testid="message-page">
      <div className="message-title">
        <Typography.Title heading={3}>
          {t("pages.settings.message.title")}
        </Typography.Title>
        <span data-testid="message-unread-count">
          <Badge count={count.data ?? 0} />
        </span>
      </div>
      {list.isError ? (
        <Typography.Text role="alert" type="danger">
          {list.error.message || t("pages.common.loadFailed")}
        </Typography.Text>
      ) : null}
      <Card>
        <div className="iam-toolbar">
          <Space>
            <Button
              data-testid="message-read-all"
              disabled={!list.data?.list.length || !count.data}
              onClick={() => void markAllRead()}
            >
              {t("pages.settings.message.readAll")}
            </Button>
            <Button
              data-testid="message-clear"
              disabled={!list.data?.list.length}
              onClick={clearAll}
              type="danger"
            >
              {t("pages.settings.message.clear")}
            </Button>
          </Space>
        </div>
        <div data-testid="message-list">
          <List<UserMessage>
            dataSource={list.data?.list ?? []}
            loading={list.isPending}
            renderItem={(item) => (
              <List.Item
                extra={(
                  <Button
                    data-testid={`message-delete-${item.id}`}
                    onClick={(event) => void remove(event, item.id)}
                    type="danger"
                  >
                    {t("pages.common.delete")}
                  </Button>
                )}
                main={(
                  <div
                    className="message-row"
                    data-testid={`message-row-${item.id}`}
                    onClick={() => void open(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void open(item);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <Space>
                      {item.isRead === 0 ? (
                        <span data-testid={`message-unread-${item.id}`}>
                          <Badge dot />
                        </span>
                      ) : null}
                      <Typography.Text
                        data-testid={`message-title-${item.id}`}
                        strong={item.isRead === 0}
                      >
                        {item.title}
                      </Typography.Text>
                      <Tag data-testid={`message-type-${item.id}`}>
                        {item.typeLabel}
                      </Tag>
                    </Space>
                    <Typography.Text type="tertiary">
                      {formatTimestamp(
                        item.createdAt,
                        i18n.resolvedLanguage || "en-US",
                      )}
                    </Typography.Text>
                  </div>
                )}
              />
            )}
          />
        </div>
        {list.data?.total ? (
          <div className="message-pagination" data-testid="message-pagination">
            <Pagination
              currentPage={page}
              onChange={(next) => setPage(next)}
              onPageSizeChange={(size) => {
                setPage(1);
                setPageSize(size);
              }}
              pageSize={pageSize}
              showSizeChanger
              total={list.data.total}
            />
          </div>
        ) : null}
      </Card>
      <Modal
        footer={null}
        onCancel={() => setDetailId(undefined)}
        title={detail.data?.title || t("pages.settings.message.detail")}
        visible={detailId !== undefined}
        width={800}
      >
        <Spin spinning={detail.isPending}>
          <div data-testid="message-detail-dialog">
            <Typography.Text type="tertiary">
              {detail.data?.createdByName || "-"}
            </Typography.Text>
            <div className="message-content">{detail.data?.content}</div>
          </div>
        </Spin>
      </Modal>
    </section>
  );
}
