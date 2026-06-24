import { expect, test } from "vite-plus/test";
import { AxiosError, AxiosHeaders, isAxiosError, type InternalAxiosRequestConfig } from "axios";
import { createRequestClient } from "../src/index.ts";

function createRequestConfig(): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
  };
}

test("createRequestClient uses default timeout and passes axios options through", () => {
  const client = createRequestClient({
    axiosConfig: {
      baseURL: "https://example.com/api",
    },
  });

  expect(client.defaults.timeout).toBe(10 * 1000);
  expect(client.defaults.baseURL).toBe("https://example.com/api");
});

test("createRequestClient allows overriding the default timeout", () => {
  const client = createRequestClient({
    axiosConfig: {
      timeout: 3000,
    },
  });

  expect(client.defaults.timeout).toBe(3000);
});

test("createRequestClient returns successful responses unchanged", async () => {
  const client = createRequestClient({
    axiosConfig: {
      adapter: async (config) => ({
        config,
        data: { ok: true },
        headers: {},
        status: 200,
        statusText: "OK",
      }),
    },
  });

  const response = await client.get("/health");

  expect(response.status).toBe(200);
  expect(response.data).toEqual({ ok: true });
});

test("createRequestClient applies request interceptors before the adapter", async () => {
  const client = createRequestClient({
    axiosConfig: {
      adapter: async (config) => ({
        config,
        data: {
          requestId: config.headers.get("x-request-id"),
        },
        headers: {},
        status: 200,
        statusText: "OK",
      }),
    },
    interceptors: [
      {
        request: [
          (config) => {
            config.headers.set("x-request-id", "request-1");
            return config;
          },
        ],
      },
    ],
  });

  const response = await client.get("/with-header");

  expect(response.data).toEqual({ requestId: "request-1" });
});

test("createRequestClient applies paired request and response interceptors", async () => {
  const client = createRequestClient({
    axiosConfig: {
      adapter: async (config) => ({
        config,
        data: {
          requestId: config.headers.get("x-request-id"),
        },
        headers: {},
        status: 200,
        statusText: "OK",
      }),
    },
    interceptors: [
      {
        request: [
          (config) => {
            config.headers.set("x-request-id", "paired-request");
            return config;
          },
        ],
        response: [
          (response) => {
            response.data = { ...response.data, paired: true };
            return response;
          },
        ],
      },
    ],
  });

  const response = await client.get("/paired");

  expect(response.data).toEqual({ requestId: "paired-request", paired: true });
});

test("createRequestClient applies response fulfilled interceptors without changing response shape", async () => {
  const client = createRequestClient({
    axiosConfig: {
      adapter: async (config) => ({
        config,
        data: { ok: true },
        headers: {},
        status: 200,
        statusText: "OK",
      }),
    },
    interceptors: [
      {
        response: [
          (response) => {
            response.data = { ...response.data, intercepted: true };
            return response;
          },
        ],
      },
    ],
  });

  const response = await client.get("/health");

  expect(response.status).toBe(200);
  expect(response.data).toEqual({ ok: true, intercepted: true });
});

test("createRequestClient applies response rejected interceptors for errors", async () => {
  const events: string[] = [];
  const error = new AxiosError("Unauthorized", undefined, undefined, undefined, {
    config: createRequestConfig(),
    data: { message: "unauthorized" },
    headers: {},
    status: 401,
    statusText: "Unauthorized",
  });

  const client = createRequestClient({
    axiosConfig: {
      adapter: async () => Promise.reject(error),
    },
    interceptors: [
      {
        response: [
          undefined,
          (receivedError) => {
            if (isAxiosError(receivedError) && receivedError.response?.status === 401) {
              events.push("unauthorized");
            }

            return Promise.reject(receivedError);
          },
        ],
      },
    ],
  });

  await expect(client.get("/private")).rejects.toBe(error);
  expect(events).toEqual(["unauthorized"]);
});

test("createRequestClient runs interceptors in axios order", async () => {
  const events: string[] = [];

  const client = createRequestClient({
    axiosConfig: {
      adapter: async (config) => ({
        config,
        data: { ok: true },
        headers: {},
        status: 200,
        statusText: "OK",
      }),
    },
    interceptors: [
      {
        request: [
          (config) => {
            events.push("request-1");
            return config;
          },
        ],
        response: [
          (response) => {
            events.push("response-1");
            return response;
          },
        ],
      },
      {
        request: [
          (config) => {
            events.push("request-2");
            return config;
          },
        ],
        response: [
          (response) => {
            events.push("response-2");
            return response;
          },
        ],
      },
    ],
  });

  await client.get("/ordered");

  expect(events).toEqual(["request-2", "request-1", "response-1", "response-2"]);
});
