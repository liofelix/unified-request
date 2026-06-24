import type { AxiosInstance, CreateAxiosDefaults } from "axios";

export type RequestInterceptor = Parameters<AxiosInstance["interceptors"]["request"]["use"]>;

export type ResponseInterceptor = Parameters<AxiosInstance["interceptors"]["response"]["use"]>;

export interface RequestClientInterceptor {
  request?: RequestInterceptor;
  response?: ResponseInterceptor;
}

export interface RequestClientOptions {
  /**
   * Axios 实例配置
   */
  axiosConfig?: CreateAxiosDefaults;

  /**
   * 请求/响应拦截器
   * request 适合统一追加 token、trace id、租户信息等
   * response 适合统一错误提示、日志上报、异常监控等
   */
  interceptors?: RequestClientInterceptor[];
}

export type RequestClient = AxiosInstance;
