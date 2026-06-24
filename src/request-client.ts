import axios from "axios";
import type { RequestClient, RequestClientOptions } from "./type.ts";

/**
 * 创建请求客户端
 * @param options 请求客户端选项
 * @returns 请求客户端实例
 */
export function createRequestClient(options: RequestClientOptions = {}): RequestClient {
  const { axiosConfig = {}, interceptors = [] } = options;

  const instance = axios.create({
    timeout: 10 * 1000,
    ...axiosConfig,
  });

  for (const { request, response } of interceptors) {
    if (request) {
      instance.interceptors.request.use(...request);
    }

    if (response) {
      instance.interceptors.response.use(...response);
    }
  }

  return instance;
}
