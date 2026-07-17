import { pluginApiPath } from "#/api/client";
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

export interface RegisterParams {
  email: string;
  nickname?: string;
  password: string;
  username: string;
}

export interface ResetPasswordParams {
  password: string;
  token: string;
}

export interface RequestPasswordResetParams {
  email: string;
}

export interface AuthApi {
  exchangeExternalHandoff?(handoff: string): Promise<LoginResult>;
  forgetPassword?(params: RequestPasswordResetParams): Promise<{ accepted: boolean }>;
  login(params: LoginParams): Promise<LoginResult>;
  logout(): Promise<void>;
  register?(params: RegisterParams): Promise<{ userId: number }>;
  refresh(params: RefreshTokenParams): Promise<ApiTokenPair>;
  resetPassword?(params: ResetPasswordParams): Promise<{ reset: boolean }>;
}

const externalLoginPluginID = "linapro-extlogin-core";
const externalLoginHandoffPath = "handoff/exchange";

export function createAuthApi(client: ApiClient): AuthApi {
  return {
    exchangeExternalHandoff: (handoff) =>
      client.post<LoginResult>(
        pluginApiPath(externalLoginPluginID, externalLoginHandoffPath),
        { handoff },
      ),
    forgetPassword: (params) => client.post<{ accepted: boolean }>("auth/forget-password", params),
    login: (params) => client.post<LoginResult>("auth/login", { ...params, clientType: "web" }),
    logout: () => client.post<void>("auth/logout"),
    register: (params) => client.post<{ userId: number }>("auth/register", params),
    refresh: (params) => client.post<ApiTokenPair>("auth/refresh", params),
    resetPassword: (params) => client.post<{ reset: boolean }>("auth/reset-password", params),
  };
}
