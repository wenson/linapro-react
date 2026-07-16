import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useEffect, useState } from "react";

import type { AiCoreApi, Provider, ProviderEndpoint, ProviderEndpointSaveInput, ProviderSaveInput } from "./ai-client";
import type { Translate } from "./ai-data";
import "./ai-core.css";

interface ProviderFormValues {
  anthropicBaseUrl?: string;
  enabled?: number;
  name?: string;
  openaiBaseUrl?: string;
  remark?: string;
  secretRef?: string;
  websiteUrl?: string;
}

function endpointPayload(endpoint: ProviderEndpoint | undefined, protocol: "anthropic" | "openai", baseUrl: string, secretRef: string): ProviderEndpointSaveInput | undefined {
  if (!endpoint?.id && !baseUrl) return undefined;
  return { baseUrl, enabled: endpoint?.enabled ?? 1, id: endpoint?.id, metadataJson: endpoint?.metadataJson || "{}", protocol, secretRef };
}

export function ProviderSideSheet({ api, onClose, onSaved, open, providerId, t }: {
  api: AiCoreApi; onClose(): void; onSaved(): Promise<void>; open: boolean; providerId?: number; t: Translate;
}) {
  const [detail, setDetail] = useState<Provider>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (!open || !providerId) return () => { active = false; };
    queueMicrotask(() => {
      if (!active) return;
      setDetail(undefined); setLoading(true);
      void api.providerInfo(providerId).then((value) => { if (active) setDetail(value); }).catch((error: unknown) => Toast.error(error instanceof Error ? error.message : String(error))).finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, [api, open, providerId]);

  const openai = detail?.endpoints?.find((item) => item.protocol === "openai");
  const anthropic = detail?.endpoints?.find((item) => item.protocol === "anthropic");
  const initial: ProviderFormValues = detail ? {
    anthropicBaseUrl: anthropic?.baseUrl || "", enabled: detail.enabled, name: detail.name,
    openaiBaseUrl: openai?.baseUrl || "", remark: detail.remark, secretRef: "", websiteUrl: detail.websiteUrl,
  } : { anthropicBaseUrl: "", enabled: 1, openaiBaseUrl: "", secretRef: "" };

  async function submit(values: ProviderFormValues) {
    const secretRef = String(values.secretRef || "").trim();
    const endpoints = [
      endpointPayload(openai, "openai", String(values.openaiBaseUrl || "").trim(), secretRef),
      endpointPayload(anthropic, "anthropic", String(values.anthropicBaseUrl || "").trim(), secretRef),
    ].filter((item): item is ProviderEndpointSaveInput => Boolean(item));
    const payload: ProviderSaveInput = {
      enabled: Number(values.enabled ?? 1), endpoints, name: String(values.name || "").trim(),
      remark: String(values.remark || "").trim(), websiteUrl: String(values.websiteUrl || "").trim(),
    };
    setSaving(true);
    try {
      if (providerId) await api.providerUpdate(providerId, payload); else await api.providerAdd(payload);
      Toast.success(t(providerId ? "pages.common.updateSuccess" : "pages.common.createSuccess"));
      await onSaved();
      onClose();
    } finally { setSaving(false); }
  }

  return <SideSheet closable onCancel={onClose} title={t(providerId ? "plugin.linapro-ai-core.provider.drawer.editTitle" : "plugin.linapro-ai-core.provider.drawer.createTitle")} visible={open} width={720}>
    {loading ? <Spin aria-label={t("pages.common.loading")} /> : <Form<ProviderFormValues> key={`${providerId ?? "new"}-${detail?.updatedAt ?? 0}`} initValues={initial} labelPosition="top" onSubmit={submit}>
      <Form.Input field="name" label={t("plugin.linapro-ai-core.provider.fields.name")} rules={[{ message: t("plugin.linapro-ai-core.common.required"), required: true }]} />
      <Form.Input field="websiteUrl" label={t("plugin.linapro-ai-core.provider.fields.websiteUrl")} />
      <Form.RadioGroup field="enabled" label={t("pages.common.status")} options={[{ label: t("plugin.linapro-ai-core.common.enabled"), value: 1 }, { label: t("plugin.linapro-ai-core.common.disabled"), value: 0 }]} />
      <Form.Input field="secretRef" label={t("plugin.linapro-ai-core.provider.fields.apiKeySecretRef")} mode="password" placeholder={t(providerId ? "plugin.linapro-ai-core.provider.placeholders.keepSecret" : "plugin.linapro-ai-core.provider.placeholders.apiKeyCreate")} />
      <Form.Input field="openaiBaseUrl" label={t("plugin.linapro-ai-core.provider.fields.openaiBaseUrl")} placeholder={t("plugin.linapro-ai-core.provider.placeholders.openaiBaseUrl")} />
      <Form.Input field="anthropicBaseUrl" label={t("plugin.linapro-ai-core.provider.fields.anthropicBaseUrl")} placeholder={t("plugin.linapro-ai-core.provider.placeholders.anthropicBaseUrl")} />
      <Form.TextArea field="remark" label={t("pages.common.remark")} rows={3} />
      <div className="ai-core-form-actions"><Button onClick={onClose}>{t("pages.common.cancel")}</Button><Button htmlType="submit" loading={saving} theme="solid" type="primary">{t("pages.common.save")}</Button></div>
    </Form>}
  </SideSheet>;
}
