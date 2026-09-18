import { api } from "../api";

export const customerApi = <T>(path: string, init?: RequestInit) => api<T>(`/customer${path}`, init);
