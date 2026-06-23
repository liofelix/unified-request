import type { AxiosError, AxiosInstance, CreateAxiosDefaults } from "axios";

export interface RequestClientOptions extends CreateAxiosDefaults {
  /**
   * 401 未授权处理
   * 外部可在这里移除 token、跳转登录页、弹提示等
   */
  onUnauthorized?: (error: AxiosError) => void | Promise<void>;

  /**
   * 请求错误统一回调
   * 适合统一错误提示、日志上报、异常监控等
   */
  onError?: (error: AxiosError) => void | Promise<void>;
}

export type RequestClient = AxiosInstance;
