import type { ApiClient } from "#/api/client";
export interface UserMessage { categoryCode: string; createdAt: number | null; id: number; isRead: number; readAt: number | null; sourceId: string; sourceType: string; title: string; typeColor: string; typeLabel: string; userId: number }
export interface UserMessageDetail { categoryCode: string; content: string; createdAt: number | null; createdByName: string; id: number; sourceId: string; sourceType: string; title: string; typeColor: string; typeLabel: string }
export function createSystemMessageApi(client: ApiClient) { return {
  clear: () => client.delete<void>("user/message/clear"), count: async () => (await client.get<{ count: number }>("user/message/count")).count,
  delete: (id: number) => client.delete<void>(`user/message/${id}`), get: (id: number) => client.get<UserMessageDetail>(`user/message/${id}`),
  list: (pageNum: number, pageSize: number) => client.get<{ list: UserMessage[]; total: number }>("user/message", { query: { pageNum, pageSize } }),
  read: (id: number) => client.put<void>(`user/message/${id}/read`), readAll: () => client.put<void>("user/message/read-all"),
}; }
