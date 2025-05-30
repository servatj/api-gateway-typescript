export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
  healthCheck?: string;
}

export interface ProxyOptions {
  target: string;
  changeOrigin: boolean;
  timeout?: number;
  retries?: number;
  onError?: (err: any, req: any, res: any) => void;
  onProxyReq?: (proxyReq: any, req: any, res: any) => void;
  onProxyRes?: (proxyRes: any, req: any, res: any) => void;
}

export interface RouteConfig {
  path: string;
  service: string;
  methods?: string[];
  auth?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface AuthContext {
  userId?: string;
  roles?: string[];
  permissions?: string[];
  token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
