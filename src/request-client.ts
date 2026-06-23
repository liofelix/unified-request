import axios, { AxiosError } from "axios";
import type { RequestClient, RequestClientOptions } from "./type.ts";

/**
 * 创建请求客户端
 * @param options 请求客户端选项
 * @returns 请求客户端实例
 */
export function createRequestClient(options: RequestClientOptions): RequestClient {
  const { onUnauthorized, onError, ...axiosOptions } = options;

  const instance = axios.create({
    timeout: 10 * 1000,
    ...axiosOptions,
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401 && onUnauthorized) {
        await onUnauthorized(error);
      }

      if (onError) {
        await onError(error);
      }

      return Promise.reject(error);
    },
  );

  return instance;
}
