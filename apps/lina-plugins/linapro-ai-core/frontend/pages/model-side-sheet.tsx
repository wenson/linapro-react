import Button from "@douyinfe/semi-ui/lib/es/button";
import { Form } from "@douyinfe/semi-ui/lib/es/form";
import SideSheet from "@douyinfe/semi-ui/lib/es/sideSheet";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import { useEffect, useMemo, useState } from "react";

import type { AiCoreApi, Model, Provider } from "./ai-client";
import { protocolLabel, type Translate } from "./ai-data";
import "./ai-core.css";

interface ModelFormValues { enabled?: number; endpointIds?: number[] | number; modelName?: string; providerId?: number }

function selectedIds(value: ModelFormValues["endpointIds"]): number[] {
  return [...new Set((Array.isArray(value) ? value : value ? [value] : []).map(Number).filter((item) => item > 0))];
}

export function ModelSideSheet({ api, initialProviderId, model, onClose, onSaved, open, t }: {
  api: AiCoreApi; initialProviderId?: number; model?: Model; onClose(): void; onSaved(): Promise<void>; open: boolean; t: Translate;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    if (!open) return () => { active = false; };
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      void api.providerList({ pageNum: 1, pageSize: 100 }).then((result) => {
        if (!active) return; setProviders(result.items); setProviderId(model?.providerId || initialProviderId);
      }).catch((error: unknown) => Toast.error(error instanceof Error ? error.message : String(error))).finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, [api, initialProviderId, model, open]);
  const endpoints = useMemo(() => providers.find((item) => item.id === providerId)?.endpoints ?? [], [providerId, providers]);
  const endpointOptions = endpoints.map((item) => ({ label: `${protocolLabel(item.protocol)} · ${item.baseUrl}`, value: item.id }));
  const initial: ModelFormValues = {
    enabled: model?.enabled ?? 1,
    endpointIds: model?.endpointId || (endpointOptions.length === 1 && !model ? [endpointOptions[0]!.value] : []),
    modelName: model?.modelName,
    providerId: model?.providerId || initialProviderId || providerId,
  };
  async function submit(values: ModelFormValues) {
    const selectedProviderId = Number(values.providerId || 0);
    const endpointIds = selectedIds(values.endpointIds);
    setSaving(true);
    try {
      if (model) {
        const endpointId = endpointIds[0] || 0;
        const endpoint = providers.find((item) => item.id === selectedProviderId)?.endpoints.find((item) => item.id === endpointId);
        await api.modelUpdate(model.id, { enabled: Number(values.enabled ?? 1), endpointId, modelName: String(values.modelName || "").trim(), protocol: endpoint?.protocol || model.protocol });
      } else {
        const created: number[] = [];
        try {
          for (const endpointId of endpointIds) {
            const endpoint = providers.find((item) => item.id === selectedProviderId)?.endpoints.find((item) => item.id === endpointId);
            const result = await api.modelAdd(selectedProviderId, { enabled: Number(values.enabled ?? 1), endpointId, modelName: String(values.modelName || "").trim(), protocol: endpoint?.protocol || "openai" });
            if (result.id) created.push(result.id);
          }
        } catch (error) { await Promise.all(created.map((id) => api.modelDelete(id).catch(() => undefined))); throw error; }
      }
      Toast.success(t(model ? "pages.common.updateSuccess" : "pages.common.createSuccess")); await onSaved(); onClose();
    } finally { setSaving(false); }
  }
  return <SideSheet closable onCancel={onClose} title={t(model ? "plugin.linapro-ai-core.model.drawer.editTitle" : "plugin.linapro-ai-core.model.drawer.createTitle")} visible={open} width={760}>
    {loading ? <Spin aria-label={t("pages.common.loading")} /> : <Form<ModelFormValues> key={`${model?.id ?? "new"}-${providerId ?? 0}-${endpointOptions.length}`} initValues={initial} labelPosition="top" onSubmit={submit}>
      <Form.Select disabled={Boolean(model || initialProviderId)} field="providerId" filter optionList={providers.map((item) => ({ label: item.name, value: item.id }))} label={t("plugin.linapro-ai-core.model.fields.provider")} onChange={(value) => setProviderId(Number(value))} rules={[{ required: true }]} />
      <Form.Select field="endpointIds" filter label={t("plugin.linapro-ai-core.model.fields.endpoint")} multiple={!model} optionList={endpointOptions} rules={[{ required: true }]} />
      <Form.Input field="modelName" label={t("plugin.linapro-ai-core.model.fields.modelName")} rules={[{ required: true }]} />
      <Form.RadioGroup field="enabled" label={t("pages.common.status")} options={[{ label: t("plugin.linapro-ai-core.common.enabled"), value: 1 }, { label: t("plugin.linapro-ai-core.common.disabled"), value: 0 }]} />
      <div className="ai-core-form-actions"><Button onClick={onClose}>{t("pages.common.cancel")}</Button><Button htmlType="submit" loading={saving} theme="solid" type="primary">{t("pages.common.save")}</Button></div>
    </Form>}
  </SideSheet>;
}
