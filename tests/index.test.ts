import { expect, test } from "vite-plus/test";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { createRequestClient } from "../src/index.ts";

function createRequestConfig(): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
  };
}

test("createRequestClient uses default timeout and passes axios options through", () => {
  const client = createRequestClient({
    baseURL: "https://example.com/api",
  });

  expect(client.defaults.timeout).toBe(10 * 1000);
  expect(client.defaults.baseURL).toBe("https://example.com/api");
});

test("createRequestClient allows overriding the default timeout", () => {
  const client = createRequestClient({
    timeout: 3000,
  });

  expect(client.defaults.timeout).toBe(3000);
});

test("createRequestClient returns successful responses unchanged", async () => {
  const client = createRequestClient({
    adapter: async (config) => ({
      config,
      data: { ok: true },
      headers: {},
      status: 200,
      statusText: "OK",
    }),
  });

  const response = await client.get("/health");

  expect(response.status).toBe(200);
  expect(response.data).toEqual({ ok: true });
});

test("createRequestClient calls unauthorized and error handlers for 401 responses", async () => {
  const events: string[] = [];
  const error = new AxiosError("Unauthorized", undefined, undefined, undefined, {
    config: createRequestConfig(),
    data: { message: "unauthorized" },
    headers: {},
    status: 401,
    statusText: "Unauthorized",
  });

  const client = createRequestClient({
    adapter: async () => Promise.reject(error),
    onUnauthorized: async (receivedError) => {
      events.push("unauthorized");
      expect(receivedError).toBe(error);
    },
    onError: async (receivedError) => {
      events.push("error");
      expect(receivedError).toBe(error);
    },
  });

  await expect(client.get("/private")).rejects.toBe(error);
  expect(events).toEqual(["unauthorized", "error"]);
});

test("createRequestClient only calls the error handler for non-401 responses", async () => {
  const events: string[] = [];
  const error = new AxiosError("Server Error", undefined, undefined, undefined, {
    config: createRequestConfig(),
    data: { message: "failed" },
    headers: {},
    status: 500,
    statusText: "Server Error",
  });

  const client = createRequestClient({
    adapter: async () => Promise.reject(error),
    onUnauthorized: async () => {
      events.push("unauthorized");
    },
    onError: async (receivedError) => {
      events.push("error");
      expect(receivedError).toBe(error);
    },
  });

  await expect(client.get("/broken")).rejects.toBe(error);
  expect(events).toEqual(["error"]);
});
