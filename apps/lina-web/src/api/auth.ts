import type { ApiClient, ApiTokenPair } from "#/api/client";

export interface LoginParams {
  password: string;
  username: string;
}

export interface LoginTenant {
  code: string;
  id: number;
  name: string;
  status?: string;
}

export interface LoginResult extends Partial<ApiTokenPair> {
  preToken?: string;
  tenants?: LoginTenant[];
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export interface AuthApi {
  login(params: LoginParams): Promise<LoginResult>;
  logout(): Promise<void>;
  refresh(params: RefreshTokenParams): Promise<ApiTokenPair>;
}

export function createAuthApi(client: ApiClient): AuthApi {
  return {
    login: (params) => client.post<LoginResult>("auth/login", { ...params, clientType: "web" }),
    logout: () => client.post<void>("auth/logout"),
    refresh: (params) => client.post<ApiTokenPair>("auth/refresh", params),
  };
}
