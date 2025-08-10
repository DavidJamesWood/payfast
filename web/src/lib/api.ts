import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});
api.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {};
  cfg.headers["X-Tenant-ID"] = import.meta.env.VITE_TENANT_ID;
  // TODO: attach Bearer token from OIDC
  return cfg;
});