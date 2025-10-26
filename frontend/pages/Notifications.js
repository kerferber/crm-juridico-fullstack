import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { useAuth } from "../store/AuthContext";
import { Button } from "../components/ui/Button";
import {
  Bell,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Gavel,
  Inbox,
  ListFilter,
  Sparkles,
  UserCircle2
} from "lucide-react";
const MAX_HISTORY = 200;
const filterMeta = {
  all: {
    label: "Todos",
    icon: BellRing,
    description: "Fluxo completo de alertas em ordem cronol\xF3gica."
  },
  unread: {
    label: "N\xE3o lidos",
    icon: Sparkles,
    description: "Pend\xEAncias para acompanhar agora."
  },
  task: {
    label: "Tarefas",
    icon: ClipboardList,
    description: "Atualiza\xE7\xF5es de tarefas e follow-ups."
  },
  lawsuit: {
    label: "Processos",
    icon: Gavel,
    description: "Movimenta\xE7\xF5es jur\xEDdicas relevantes."
  },
  contact: {
    label: "Contatos",
    icon: UserCircle2,
    description: "Novas intera\xE7\xF5es com clientes e leads."
  },
  goal: {
    label: "Metas",
    icon: BellRing,
    description: "Alerta sobre objetivos e pontua\xE7\xF5es."
  }
};
const Notifications = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter((notification) => notification.recipientId === user.id).slice(0, MAX_HISTORY).sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }, [notifications, user]);
  if (!user) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60", children: [
      /* @__PURE__ */ jsx(Inbox, { className: "h-6 w-6" }),
      "Fa\xE7a login para visualizar suas notifica\xE7\xF5es."
    ] });
  }
  const unreadCount = userNotifications.filter((notification) => !notification.isRead).length;
  const tasksCount = userNotifications.filter((notification) => notification.entityType === "task").length;
  const lawsuitsCount = userNotifications.filter((notification) => notification.entityType === "lawsuit").length;
  const contactsCount = userNotifications.filter((notification) => notification.entityType === "contact").length;
  const goalsCount = userNotifications.filter((notification) => notification.entityType === "goal").length;
  const filterCounts = {
    all: userNotifications.length,
    unread: unreadCount,
    task: tasksCount,
    lawsuit: lawsuitsCount,
    contact: contactsCount,
    goal: goalsCount
  };
  const entityIcons = {
    task: ClipboardList,
    lawsuit: Gavel,
    contact: UserCircle2,
    goal: Sparkles,
    social: BellRing,
    all: BellRing,
    unread: BellRing
  };
  const handleNavigate = (notification) => {
    markNotificationAsRead(notification.id);
    let target = "/";
    if (notification.entityType === "task") {
      target = `/tarefas/${notification.entityId}`;
    } else if (notification.entityType === "lawsuit") {
      target = `/processos/${notification.entityId}`;
    } else if (notification.entityType === "contact") {
      target = `/contatos/${notification.entityId}`;
    } else if (notification.entityType === "goal") {
      target = null;
    }
    if (target) {
      navigate(target);
    }
  };
  const handleMarkAll = () => {
    if (!user) return;
    markAllNotificationsAsRead(user.id);
  };
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return userNotifications.filter((notification) => !notification.isRead);
      case "task":
      case "lawsuit":
      case "contact":
      case "goal":
        return userNotifications.filter((notification) => notification.entityType === activeFilter);
      case "all":
      default:
        return userNotifications;
    }
  }, [activeFilter, userNotifications]);
  const groupedNotifications = useMemo(() => {
    const groups = [];
    filteredNotifications.forEach((notification) => {
      const day = dayjs(notification.createdAt);
      const key = day.format("YYYY-MM-DD");
      let label = day.format("DD MMM YYYY");
      if (day.isSame(dayjs(), "day")) {
        label = "Hoje";
      } else if (day.isSame(dayjs().subtract(1, "day"), "day")) {
        label = "Ontem";
      }
      const existing = groups.find((group) => group.key === key);
      if (existing) {
        existing.items.push(notification);
      } else {
        groups.push({
          key,
          label,
          items: [notification]
        });
      }
    });
    return groups;
  }, [filteredNotifications]);
  return /* @__PURE__ */ jsxs("section", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("header", { className: "premium-hero", children: [
      /* @__PURE__ */ jsx("div", { className: "premium-hero__overlay" }),
      /* @__PURE__ */ jsxs("div", { className: "premium-hero__content", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-5", children: [
          /* @__PURE__ */ jsx("span", { className: "premium-badge", children: "Caixa de entrada inteligente" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("h1", { className: "premium-hero__title", children: "Centralize alertas cr\xEDticos e acompanhe tudo em tempo real." }),
            /* @__PURE__ */ jsx("p", { className: "premium-hero__subtitle", children: "Use os filtros r\xE1pidos para priorizar tarefas, processos ou intera\xE7\xF5es com clientes. Clique em um item para navegar diretamente at\xE9 o contexto." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch", children: [
            /* @__PURE__ */ jsxs("div", { className: "summary-card", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-card__badge bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200", children: "N\xE3o lidos" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Aten\xE7\xE3o imediata" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-semibold text-foreground dark:text-dark-foreground", children: unreadCount })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "summary-card", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-card__badge bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200", children: "Tarefas" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Atualiza\xE7\xF5es operacionais" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-semibold text-foreground dark:text-dark-foreground", children: tasksCount })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "summary-card", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-card__badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200", children: "Processos" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Movimenta\xE7\xF5es jur\xEDdicas" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-semibold text-foreground dark:text-dark-foreground", children: lawsuitsCount })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "summary-card", children: [
              /* @__PURE__ */ jsx("span", { className: "summary-card__badge bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200", children: "Contatos & metas" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Relacionamento e objetivos" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-semibold text-foreground dark:text-dark-foreground", children: contactsCount + goalsCount })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hero-sidecard", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "hero-sidecard__eyebrow", children: "A\xE7\xF5es r\xE1pidas" }),
            /* @__PURE__ */ jsx("h2", { className: "hero-sidecard__title", children: "Organize sua rotina em segundos" }),
            /* @__PURE__ */ jsx("p", { className: "hero-sidecard__subtitle", children: "Marque tudo como lido para come\xE7ar com a caixa zerada ou filtre por tipo de alerta para definir prioridades." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3 dark:border-dark-border/60 dark:bg-dark-background", children: [
              /* @__PURE__ */ jsx("span", { children: "Total de alertas" }),
              /* @__PURE__ */ jsx("span", { className: "text-foreground dark:text-dark-foreground", children: userNotifications.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3 dark:border-dark-border/60 dark:bg-dark-background", children: [
              /* @__PURE__ */ jsx("span", { children: "Novos hoje" }),
              /* @__PURE__ */ jsx("span", { className: "text-foreground dark:text-dark-foreground", children: userNotifications.filter(
                (notification) => dayjs(notification.createdAt).isSame(dayjs(), "day")
              ).length })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "hero-sidecard__footer", children: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              className: "hero-sidecard__cta",
              onClick: handleMarkAll,
              disabled: unreadCount === 0,
              children: "Marcar tudo como lido"
            }
          ) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "notification-filters-panel", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-foreground dark:text-dark-foreground", children: [
        /* @__PURE__ */ jsx(ListFilter, { className: "h-4 w-4 text-primary" }),
        "Filtros inteligentes"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "notification-filter-rail", children: Object.keys(filterMeta).map((filterKey) => {
        const meta = filterMeta[filterKey];
        const Icon = meta.icon;
        const isActive = activeFilter === filterKey;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setActiveFilter(filterKey),
            className: `notification-pill ${isActive ? "is-active" : ""}`,
            children: [
              /* @__PURE__ */ jsx("span", { className: "notification-pill__icon", children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxs("div", { className: "notification-pill__body", children: [
                /* @__PURE__ */ jsx("span", { className: "notification-pill__label", children: meta.label }),
                /* @__PURE__ */ jsx("span", { className: "notification-pill__description", children: meta.description })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "notification-pill__count", children: filterCounts[filterKey] })
            ]
          },
          filterKey
        );
      }) })
    ] }),
    userNotifications.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60", children: [
      /* @__PURE__ */ jsx(Inbox, { className: "h-6 w-6" }),
      "Voc\xEA ainda n\xE3o possui notifica\xE7\xF5es."
    ] }) : filteredNotifications.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6" }),
      "Nenhum alerta para este filtro no momento."
    ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-6", children: groupedNotifications.map((group) => /* @__PURE__ */ jsxs("section", { className: "notification-group", children: [
      /* @__PURE__ */ jsx("div", { className: "notification-group__label", children: group.label }),
      /* @__PURE__ */ jsx("div", { className: "notification-timeline", children: group.items.map((notification, index) => {
        const Icon = entityIcons[notification.entityType] ?? Bell;
        return /* @__PURE__ */ jsxs("div", { className: "notification-node", children: [
          /* @__PURE__ */ jsxs("div", { className: "notification-node__rail", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `notification-node__dot ${notification.isRead ? "is-read" : "is-unread"}`
              }
            ),
            index !== group.items.length - 1 && /* @__PURE__ */ jsx("span", { className: "notification-node__line" })
          ] }),
          /* @__PURE__ */ jsxs(
            "article",
            {
              className: `notification-card ${notification.isRead ? "notification-card--read" : "notification-card--unread"}`,
              children: [
                /* @__PURE__ */ jsx("div", { className: "notification-card__icon", children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) }),
                /* @__PURE__ */ jsxs("div", { className: "notification-card__body", children: [
                  /* @__PURE__ */ jsxs("div", { className: "notification-card__header", children: [
                    /* @__PURE__ */ jsx("p", { className: "notification-card__title", children: notification.title }),
                    /* @__PURE__ */ jsx("span", { className: "notification-card__timestamp", children: dayjs(notification.createdAt).format("DD MMM \xB7 HH:mm") })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "notification-card__message", children: [
                    /* @__PURE__ */ jsx("span", { className: "notification-card__author", children: notification.message?.split(" ")[0] ?? "" }),
                    " ",
                    notification.message?.replace(/^(\S+)/, "").trim()
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "notification-card__chips", children: [
                    /* @__PURE__ */ jsx("span", { className: "notification-chip", children: (notification.entityType || "alerta").toUpperCase() }),
                    notification.isRead ? /* @__PURE__ */ jsx("span", { className: "notification-chip is-muted", children: "Lido" }) : /* @__PURE__ */ jsx("span", { className: "notification-chip is-highlight", children: "Novo" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "notification-card__actions", children: [
                  !notification.isRead && /* @__PURE__ */ jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: "ghost",
                      className: "notification-card__button",
                      onClick: () => markNotificationAsRead(notification.id),
                      children: [
                        /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }),
                        "Lida"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      size: "sm",
                      className: "notification-card__button notification-card__button--primary",
                      onClick: () => handleNavigate(notification),
                      children: "Abrir"
                    }
                  )
                ] })
              ]
            }
          )
        ] }, notification.id);
      }) })
    ] }, group.key)) })
  ] });
};
var Notifications_default = Notifications;
export {
  Notifications_default as default
};
