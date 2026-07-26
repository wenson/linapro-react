import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Space from "@douyinfe/semi-ui/lib/es/space";
import Tag from "@douyinfe/semi-ui/lib/es/tag";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useCallback, useEffect, useState } from "react";

import type { AiCoreApi, ProviderEndpoint, ProviderEndpointSaveInput, ProviderProtocol } from "./ai-client";
import { protocolLabel, protocolOptions, type Translate } from "./ai-data";
import "./ai-core.css";

interface EndpointFormValues extends Partial<ProviderEndpointSaveInput> { protocol?: ProviderProtocol }

export function EndpointSideSheet({ api, onClose, onSaved, open, providerId, providerName, t }: {
  api: AiCoreApi; onClose(): void; onSaved(): Promise<void>; open: boolean; providerId?: number; providerName?: string; t: Translate;
}) {
  const [items, setItems] = useState<ProviderEndpoint[]>([]);
  const [editing, setEditing] = useState<ProviderEndpoint>();
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => setItems(providerId ? await api.providerEndpoints(providerId) : []), [api, providerId]);
  useEffect(() => { if (open) queueMicrotask(() => void load().catch((error: unknown) => Toast.error(error instanceof Error ? error.message : String(error)))); }, [load, open]);
  const initial: EndpointFormValues = editing ? { ...editing, protocol: editing.protocol as ProviderProtocol, secretRef: "" } : { enabled: 1, metadataJson: "{}", protocol: "openai" };
  async function submit(values: EndpointFormValues) {
    if (!providerId) return;
    setSaving(true);
    try {
      const payload = values as ProviderEndpointSaveInput;
      if (editing) await api.providerEndpointUpdate(providerId, editing.id, payload); else await api.providerEndpointAdd(providerId, payload);
      Toast.success(t(editing ? "pages.common.updateSuccess" : "pages.common.createSuccess"));
      setEditing(undefined); await load(); await onSaved();
    } finally { setSaving(false); }
  }
  async function remove(item: ProviderEndpoint) {
    if (!providerId) return;
    await api.providerEndpointDelete(providerId, item.id); Toast.success(t("pages.common.deleteSuccess")); await load(); await onSaved();
  }
  return <SideSheet closable onCancel={onClose} title={t("plugin.linapro-ai-core.endpoint.drawer.title", { name: providerName || "-" })} visible={open} width="min(760px, 100vw)">
    <div className="ai-core-endpoint-list">
      {items.length ? items.map((item) => <div className="ai-core-endpoint-row" key={item.id}>
        <div className="ai-core-endpoint-header"><div><Tag color={item.enabled === 1 ? "blue" : "grey"}>{protocolLabel(item.protocol)}</Tag> <span className="ai-core-mono ai-core-muted">{item.secretRef || "-"}</span><div className="ai-core-mono">{item.baseUrl}</div></div><Space><Button onClick={() => setEditing(item)} theme="borderless">{t("pages.common.edit")}</Button><Popconfirm content={t("plugin.linapro-ai-core.common.deleteConfirm")} onConfirm={() => void remove(item)}><Button theme="borderless" type="danger">{t("pages.common.delete")}</Button></Popconfirm></Space></div>
      </div>) : <div className="ai-core-endpoint-row ai-core-muted">{t("plugin.linapro-ai-core.endpoint.empty")}</div>}
    </div>
    <Form<EndpointFormValues> key={editing?.id ?? "new"} initValues={initial} labelPosition="top" onSubmit={submit}>
      <Form.Select field="protocol" label={t("plugin.linapro-ai-core.endpoint.fields.protocol")} optionList={protocolOptions} rules={[{ required: true }]} />
      <Form.Input field="baseUrl" label={t("plugin.linapro-ai-core.endpoint.fields.baseUrl")} rules={[{ required: true }]} />
      <Form.Input field="secretRef" label={t("plugin.linapro-ai-core.endpoint.fields.secretRef")} mode="password" placeholder={editing ? t("plugin.linapro-ai-core.endpoint.placeholders.keepSecret") : ""} />
      <Form.RadioGroup field="enabled" label={t("pages.common.status")} options={[{ label: t("plugin.linapro-ai-core.common.enabled"), value: 1 }, { label: t("plugin.linapro-ai-core.common.disabled"), value: 0 }]} />
      <Form.TextArea field="metadataJson" label={t("plugin.linapro-ai-core.endpoint.fields.metadataJson")} rows={4} />
      <div className="ai-core-form-actions"><Button onClick={() => setEditing(undefined)}>{t("plugin.linapro-ai-core.common.reset")}</Button><Button htmlType="submit" loading={saving} theme="solid" type="primary">{t(editing ? "pages.common.save" : "plugin.linapro-ai-core.endpoint.actions.add")}</Button></div>
    </Form>
  </SideSheet>;
}
