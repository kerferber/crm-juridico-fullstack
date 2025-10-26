import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_BASE_URL } from "../services/api";
window.Pusher = Pusher;
let echo = null;
const getEnvBoolean = (value, fallback = false) => {
  if (value === void 0 || value === null) return fallback;
  const normalized = value.toString().trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};
const initRealtime = ({ token, tenantSlug }) => {
  const appKey = import.meta.env.VITE_REVERB_APP_KEY || "";
  if (!appKey) {
    console.warn("[Realtime] Missing VITE_REVERB_APP_KEY. Realtime updates disabled.");
    return null;
  }
  const resolveHost = () => {
    if (import.meta.env.VITE_REVERB_HOST) {
      return import.meta.env.VITE_REVERB_HOST;
    }
    if (import.meta.env.DEV) {
      return window.location.hostname;
    }
    try {
      const baseUrl = API_BASE_URL ? new URL(API_BASE_URL, window.location.origin) : new URL(window.location.origin);
      return baseUrl.hostname;
    } catch {
      return window.location.hostname;
    }
  };
  const host = resolveHost();
  const scheme = (import.meta.env.VITE_REVERB_SCHEME || (window.location.protocol === "https:" ? "https" : "http")).toLowerCase();
  const useTls = getEnvBoolean(import.meta.env.VITE_REVERB_USE_TLS, scheme === "https");
  const port = Number.parseInt(import.meta.env.VITE_REVERB_PORT || (useTls ? "443" : "8080"), 10);
  const wsPathRaw = import.meta.env.VITE_REVERB_WS_PATH;
  const wsPath = typeof wsPathRaw === "string" && wsPathRaw.trim().length > 0 ? wsPathRaw.trim() : void 0;
  if (echo) {
    echo.disconnect();
  }
  const options = {
    broadcaster: "pusher",
    key: appKey,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: useTls,
    encrypted: useTls,
    disableStats: true,
    enabledTransports: useTls ? ["wss", "ws"] : ["ws", "wss"],
    cluster: import.meta.env.VITE_REVERB_CLUSTER || "mt1",
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        ...tenantSlug ? { "X-Tenant": tenantSlug } : {}
      }
    }
  };
  if (wsPath) {
    options.wsPath = wsPath;
  }
  const resolveAuthEndpoint = () => {
    const override = import.meta.env.VITE_REVERB_AUTH_ENDPOINT;
    if (override && override.trim().length > 0) {
      return override.trim();
    }
    try {
      const parsed = new URL(API_BASE_URL || window.location.origin);
      const normalizedPath = parsed.pathname.replace(/\/api\/?$/, "").replace(/\/$/, "");
      const base = `${parsed.origin}${normalizedPath ? normalizedPath : ""}`;
      return `${base}/broadcasting/auth`;
    } catch {
      return "/broadcasting/auth";
    }
  };
  options.authEndpoint = resolveAuthEndpoint();
  echo = new Echo(options);
  window.Echo = echo;
  return echo;
};
const disconnectRealtime = () => {
  if (echo) {
    echo.disconnect();
    echo = null;
  }
  if (window.Echo) {
    delete window.Echo;
  }
};
const getSocketId = () => {
  return echo?.socketId() ?? null;
};
const subscribeToTenantChannels = (tenantId, userId, callbacks) => {
  if (!echo) {
    return () => {
    };
  }
  const subscriptions = [];
  const subscribe = (channelName, events) => {
    const channel = echo.private(channelName);
    const registered = [];
    events.forEach(({ name, callback }) => {
      if (!callback) return;
      const handler = (data) => callback(data);
      channel.listen(name, handler);
      registered.push({ name, callback: handler });
    });
    subscriptions.push({ channel, events: registered });
  };
  subscribe(`tenant.${tenantId}.tasks`, [
    { name: ".TaskCreated", callback: callbacks.onTaskCreated },
    { name: ".TaskUpdated", callback: callbacks.onTaskUpdated },
    { name: ".TaskDeleted", callback: callbacks.onTaskDeleted }
  ]);
  subscribe(`tenant.${tenantId}.lawsuits`, [
    { name: ".LawsuitCreated", callback: callbacks.onLawsuitCreated },
    { name: ".LawsuitUpdated", callback: callbacks.onLawsuitUpdated },
    { name: ".LawsuitDeleted", callback: callbacks.onLawsuitDeleted }
  ]);
  subscribe(`tenant.${tenantId}.contacts`, [
    { name: ".ContactCreated", callback: callbacks.onContactCreated },
    { name: ".ContactUpdated", callback: callbacks.onContactUpdated },
    { name: ".ContactDeleted", callback: callbacks.onContactDeleted }
  ]);
  subscribe(`tenant.${tenantId}.transactions`, [
    { name: ".TransactionCreated", callback: callbacks.onTransactionCreated },
    { name: ".TransactionUpdated", callback: callbacks.onTransactionUpdated },
    { name: ".TransactionDeleted", callback: callbacks.onTransactionDeleted }
  ]);
  subscribe(`tenant.${tenantId}.calendar-events`, [
    { name: ".CalendarEventCreated", callback: callbacks.onCalendarEventCreated },
    { name: ".CalendarEventUpdated", callback: callbacks.onCalendarEventUpdated },
    { name: ".CalendarEventDeleted", callback: callbacks.onCalendarEventDeleted }
  ]);
  subscribe(`tenant.${tenantId}.social-posts`, [
    { name: ".SocialPostCreated", callback: callbacks.onSocialPostCreated },
    { name: ".SocialPostDeleted", callback: callbacks.onSocialPostDeleted },
    { name: ".SocialCommentCreated", callback: callbacks.onSocialCommentCreated },
    { name: ".SocialCommentDeleted", callback: callbacks.onSocialCommentDeleted },
    { name: ".SocialLikeUpdated", callback: callbacks.onSocialLikeUpdated }
  ]);
  subscribe(`tenant.${tenantId}.users.${userId}`, [
    { name: ".NotificationCreated", callback: callbacks.onNotificationCreated }
  ]);
  return () => {
    subscriptions.forEach(({ channel, events }) => {
      events.forEach(({ name, callback }) => {
        channel.stopListening(name, callback);
      });
      channel.unsubscribe();
    });
  };
};
export {
  disconnectRealtime,
  getSocketId,
  initRealtime,
  subscribeToTenantChannels
};
