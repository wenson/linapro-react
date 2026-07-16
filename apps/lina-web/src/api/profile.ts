import type { ApiClient } from "#/api/client";

export interface UserProfile {
  avatar: string;
  createdAt: number | null;
  deptId: number;
  deptName: string;
  email: string;
  id: number;
  loginDate: number | null;
  nickname: string;
  phone: string;
  postIds: number[];
  remark: string;
  roleIds: number[];
  roleNames: string[];
  sex: number;
  status: number;
  tenantId?: number;
  tenantIds?: number[];
  tenantName?: string;
  tenantNames?: string[];
  updatedAt: number | null;
  username: string;
}

export interface UpdateProfileInput {
  email?: string;
  nickname?: string;
  password?: string;
  phone?: string;
  sex?: number;
}

export interface ProfileApi {
  getProfile(): Promise<UserProfile>;
  updateAvatar(file: Blob, filename?: string): Promise<string>;
  updateProfile(input: UpdateProfileInput): Promise<void>;
}

export function createProfileApi(client: ApiClient): ProfileApi {
  return {
    getProfile: () => client.get<UserProfile>("user/profile"),
    async updateAvatar(file, filename) {
      const upload = new FormData();
      upload.append("file", new File([file], filename?.trim() || `avatar-${Date.now()}.png`));
      upload.append("scene", "avatar");
      const result = await client.request<{ url: string }>("file/upload", {
        body: upload,
        method: "POST",
      });
      await client.put<void>("user/profile/avatar", { avatar: result.url });
      return result.url;
    },
    updateProfile: (input) => client.put<void>("user/profile", input),
  };
}
