import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "#/api/client";
import {
  HostedPluginBridge,
  HOSTED_BRIDGE_LIMITS,
  HOSTED_BRIDGE_PROTOCOL,
  HOSTED_BRIDGE_VERSION,
  normalizeHostedBridgePath,
} from "#/plugin-ui/hosted-bridge";

const pluginId = "linapro-demo-dynamic";
const nonce = "nonce-1";
const generation = 7;

function envelope(type: string, extra: Record<string, unknown> = {}) {
  return {
    generation,
    nonce,
    pluginId,
    protocol: HOSTED_BRIDGE_PROTOCOL,
    type,
    version: HOSTED_BRIDGE_VERSION,
    ...extra,
  };
}

function harness(requestRaw = vi.fn()) {
  const guest = { postMessage: vi.fn() } as unknown as Window;
  const apiClient = new ApiClient();
  vi.spyOn(apiClient, "requestRaw").mockImplementation(requestRaw);
  const bridge = new HostedPluginBridge({
    apiClient,
    contentWindow: () => guest,
    context: { locale: "en-US", messages: { plugin: {} }, permissions: [`${pluginId}:view`] },
    generation,
    nonce,
    pluginId,
  });
  bridge.start();
  return {
    bridge,
    guest,
    post: (data: unknown, source: Window = guest) => {
      window.dispatchEvent(new MessageEvent("message", { data, source }));
    },
    requestRaw,
  };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("hosted bridge path governance", () => {
  it("maps only relative current-plugin API paths", () => {
    expect(normalizeHostedBridgePath(pluginId, "records?pageNum=2")).toBe(
      `/x/${pluginId}/api/v1/records?pageNum=2`,
    );
    for (const path of [
      "",
      "/api/v1/users",
      `/x/another/api/v1/data`,
      "/x-assets/demo/index.html",
      "../secrets",
      "records/../secrets",
      "records/%2e%2e/secrets",
      "https://example.com/data",
      "//example.com/data",
      "records#token",
    ]) {
      expect(() => normalizeHostedBridgePath(pluginId, path), path).toThrow();
    }
  });
});

describe("hosted bridge session", () => {
  it("handshakes only with the bound contentWindow, nonce, plugin and generation", () => {
    const { bridge, guest, post } = harness();
    post(envelope("hello"), {} as Window);
    post({ ...envelope("hello"), nonce: "forged" });
    post({ ...envelope("hello"), generation: generation - 1 });
    expect(guest.postMessage).not.toHaveBeenCalled();

    post(envelope("hello"));
    expect(guest.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({ locale: "en-US" }),
        generation,
        nonce,
        pluginId,
        type: "ready",
      }),
      "*",
      [],
    );
    bridge.dispose();
  });

  it("proxies JSON and sanitizes secrets without returning host credentials", async () => {
    const requestRaw = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      authorization: "Bearer secret-token",
      password: "hidden",
      title: "safe",
    }), { headers: { "content-type": "application/json" } }));
    const { bridge, guest, post } = harness(requestRaw);
    post(envelope("request", {
      request: { body: { title: "new" }, kind: "json", method: "POST", path: "records" },
      requestId: "req-1",
    }));
    await settle();

    expect(requestRaw).toHaveBeenCalledWith(`/x/${pluginId}/api/v1/records`, expect.objectContaining({
      body: { title: "new" },
      method: "POST",
    }));
    await vi.waitFor(() => {
      expect(guest.postMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          body: { authorization: "[redacted]", password: "[redacted]", title: "safe" },
          ok: true,
          requestId: "req-1",
          type: "response",
        }),
        "*",
        [],
      );
    });
    bridge.dispose();
  });

  it("rejects duplicate request IDs and messages that cannot be measured safely", async () => {
    const requestRaw = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const { bridge, guest, post } = harness(requestRaw);
    const request = envelope("request", {
      request: { kind: "json", path: "records" },
      requestId: "req-duplicate",
    });
    post(request);
    await settle();
    post(request);
    await settle();
    expect(guest.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "DUPLICATE_REQUEST" }) }),
      "*",
      [],
    );

    const cyclic = envelope("hello") as Record<string, unknown>;
    cyclic.self = cyclic;
    post(cyclic);
    expect(guest.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "MESSAGE_TOO_LARGE" }) }),
      "*",
      [],
    );
    bridge.dispose();
  });

  it("cancels active requests, times out stalled requests and aborts on dispose", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const requestRaw = vi.fn().mockImplementation((_path: string, options: { signal: AbortSignal }) => {
      signals.push(options.signal);
      return new Promise<Response>((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      });
    });
    const { bridge, guest, post } = harness(requestRaw);
    const request = (requestId: string) => envelope("request", {
      request: { kind: "json", path: "records" },
      requestId,
    });

    post(request("req-cancel"));
    await settle();
    post(envelope("cancel", { requestId: "req-cancel" }));
    await settle();
    expect(signals[0]?.aborted).toBe(true);
    expect(guest.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "REQUEST_ABORTED" }), requestId: "req-cancel" }),
      "*",
      [],
    );

    post(request("req-timeout"));
    await settle();
    await vi.advanceTimersByTimeAsync(HOSTED_BRIDGE_LIMITS.requestTimeoutMs);
    expect(signals[1]?.aborted).toBe(true);

    post(request("req-dispose"));
    await settle();
    bridge.dispose();
    expect(signals[2]?.aborted).toBe(true);
    post(envelope("hello"));
    expect(guest.postMessage).not.toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "ready" }),
      "*",
      [],
    );
  });

  it("rejects oversized request bodies and files before calling the API", async () => {
    const requestRaw = vi.fn();
    const { bridge, guest, post } = harness(requestRaw);
    post(envelope("request", {
      request: {
        body: "x".repeat(HOSTED_BRIDGE_LIMITS.maxJSONRequestBytes + 1),
        kind: "json",
        path: "records",
      },
      requestId: "req-large-json",
    }));
    await settle();
    expect(requestRaw).not.toHaveBeenCalled();
    expect(guest.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "REQUEST_FAILED" }) }),
      "*",
      [],
    );
    post({ ...envelope("hello"), padding: "x".repeat(HOSTED_BRIDGE_LIMITS.maxMessageBytes + 1) });
    expect(guest.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "MESSAGE_TOO_LARGE" }) }),
      "*",
      [],
    );
    bridge.dispose();
  });

  it("supports multipart uploads and transferable Blob downloads", async () => {
    const requestRaw = vi.fn()
      .mockImplementationOnce((_path: string, options: { body: FormData }) => {
        expect(options.body).toBeInstanceOf(FormData);
        expect(options.body.get("title")).toBe("demo");
        expect(options.body.get("attachment")).toBeInstanceOf(File);
        return Promise.resolve(new Response(JSON.stringify({ id: "record-1" }), {
          headers: { "content-type": "application/json" },
        }));
      })
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "application/octet-stream" },
      }));
    const { bridge, guest, post } = harness(requestRaw);
    post(envelope("request", {
      request: {
        fields: { title: "demo" },
        files: [{ data: new Uint8Array([1, 2]).buffer, field: "attachment", name: "demo.txt", type: "text/plain" }],
        kind: "multipart",
        method: "POST",
        path: "demo-records",
      },
      requestId: "req-upload",
    }));
    await vi.waitFor(() => {
      expect(guest.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ body: { id: "record-1" }, requestId: "req-upload" }),
        "*",
        [],
      );
    });

    post(envelope("request", {
      request: { kind: "blob", path: "demo-records/record-1/attachment" },
      requestId: "req-download",
    }));
    await vi.waitFor(() => {
      expect(guest.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.any(ArrayBuffer), bodyKind: "blob", requestId: "req-download" }),
        "*",
        [expect.any(ArrayBuffer)],
      );
    });
    bridge.dispose();
  });
});
