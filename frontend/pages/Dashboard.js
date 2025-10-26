import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  AlertTriangle,
  CalendarClock,
  CalendarRange,
  Gavel,
  Scale,
  ScrollText,
  Landmark,
  Briefcase,
  LayoutDashboard,
  BarChart3,
  CalendarDays
} from "lucide-react";
import { useApp } from "../store/AppContext";
import { TaskStatus } from "../types/types";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import { AlertBell } from "../components/dashboard/AlertBell";
import { DashboardDonut } from "../components/dashboard/DashboardDonut";
import { DashboardBar } from "../components/dashboard/DashboardBar";
import { DashboardArea } from "../components/dashboard/DashboardArea";
import { ThemeToggle } from "../components/global/ThemeToggle";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
const WIDGET_ORDER_STORAGE = "dashboard-widget-order-v2";
const HIDDEN_WIDGETS_STORAGE = "dashboard-hidden-widgets-v2";
const DEFAULT_WIDGETS = ["distribution", "activity", "process"];
const tonePalette = {
  overdue: {
    border: "#DC2626",
    text: "#B91C1C",
    bg: "rgba(220,38,38,0.12)",
    glow: "rgba(220,38,38,0.18)",
    iconBg: "linear-gradient(135deg, #F87171, #EF4444)",
    iconColor: "#fff"
  },
  today: {
    border: "#F97316",
    text: "#C2410C",
    bg: "rgba(249,115,22,0.12)",
    glow: "rgba(249,115,22,0.18)",
    iconBg: "linear-gradient(135deg, #FDBA74, #F97316)",
    iconColor: "#fff"
  },
  upcoming: {
    border: "#16A34A",
    text: "#166534",
    bg: "rgba(22,163,74,0.12)",
    glow: "rgba(22,163,74,0.18)",
    iconBg: "linear-gradient(135deg, #6EE7B7, #16A34A)",
    iconColor: "#0B4F3A"
  }
};
const readLocalArray = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
};
const getInitials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
const SummaryCard = ({ title, value, variation, icon: Icon, tone, onClick }) => {
  const palette = tonePalette[tone];
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: "summary-card group flex flex-col gap-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]",
      children: [
        /* @__PURE__ */ jsx("span", { className: "summary-card__halo", style: { background: palette.glow } }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "summary-card__badge",
              style: { backgroundColor: palette.bg, color: palette.text },
              children: title
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "summary-card__icon",
              style: { background: palette.iconBg, color: palette.iconColor },
              children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6", "aria-hidden": "true" })
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          AnimatedNumber,
          {
            value,
            className: "text-4xl font-semibold leading-none text-[var(--text-primary)] md:text-5xl"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-[var(--text-secondary)]", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", style: { color: palette.text }, children: variation }),
          /* @__PURE__ */ jsx("span", { className: "summary-card__cta", children: "Priorizar \u2192" })
        ] })
      ]
    }
  );
};
const heroMetricPalette = {
  critical: tonePalette.overdue,
  warning: tonePalette.today,
  positive: tonePalette.upcoming
};
const HeroMetric = ({ label, value, helper, tone, onClick }) => {
  const palette = heroMetricPalette[tone];
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      disabled: !onClick,
      className: cn(
        "metric-chip",
        !onClick && "cursor-default opacity-95"
      ),
      style: {
        borderColor: palette.border,
        backgroundColor: palette.bg,
        boxShadow: `0 12px 30px -20px ${palette.glow}`
      },
      children: [
        /* @__PURE__ */ jsx("span", { className: "metric-chip__label", children: label }),
        /* @__PURE__ */ jsx("span", { className: "metric-chip__value", children: value }),
        /* @__PURE__ */ jsx("span", { className: "metric-chip__helper", children: helper })
      ]
    }
  );
};
const QuickActionCard = ({ title, description, icon: Icon, onClick, className }) => /* @__PURE__ */ jsxs(
  "button",
  {
    type: "button",
    onClick,
    className: cn("quick-action-card text-left", className),
    children: [
      /* @__PURE__ */ jsx("div", { className: "quick-action-card__icon", children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-[var(--text-primary)]", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[var(--text-secondary)]", children: description })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "quick-action-card__cta", children: "Abrir m\xF3dulo" })
    ]
  }
);
const WidgetWrapper = ({
  id,
  title,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  menuOpen,
  setMenuOpen,
  onAction,
  dragging,
  children
}) => {
  const isDragging = dragging === id;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "col-span-12 md:col-span-6 xl:col-span-4",
      draggable: true,
      onDragStart: (event) => onDragStart(event, id),
      onDragOver,
      onDrop: (event) => onDrop(event, id),
      onDragEnd,
      "aria-label": `Widget ${title}`,
      role: "group",
      style: { opacity: isDragging ? 0.5 : 1 },
      children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-black/5 text-sm text-[var(--text-secondary)] opacity-0 transition group-hover:opacity-100 hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] dark:bg-white/10",
            onClick: () => setMenuOpen(menuOpen === id ? null : id),
            "aria-label": `Op\xE7\xF5es do widget ${title}`,
            children: "\u22EE"
          }
        ),
        menuOpen === id && /* @__PURE__ */ jsxs("div", { className: "absolute right-4 top-14 z-20 w-40 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-2 shadow-[var(--shadow-soft)]", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)]",
              onClick: () => {
                onAction(id, "remove");
                setMenuOpen(null);
              },
              children: "Remover"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)]",
              onClick: () => {
                onAction(id, "pin");
                setMenuOpen(null);
              },
              children: "Adicionar ao topo"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--card-hover)]",
              onClick: () => {
                onAction(id, "configure");
                setMenuOpen(null);
              },
              children: "Configurar"
            }
          )
        ] }),
        children
      ] })
    }
  );
};
const WidgetModal = ({ hidden, setHidden, available, onClose }) => {
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md", children: /* @__PURE__ */ jsxs("div", { className: "dashboard-card max-w-md space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-[var(--text-primary)]", children: "Personalizar widgets" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[var(--text-secondary)]", children: "Escolha quais vis\xE3o deseja exibir no painel." })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "rounded-full border border-[var(--card-border)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]",
          onClick: onClose,
          children: "Fechar"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2 text-sm", children: available.map((widgetId) => {
      const isHidden = hidden.includes(widgetId);
      return /* @__PURE__ */ jsxs(
        "label",
        {
          className: "flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2",
          children: [
            /* @__PURE__ */ jsxs("span", { className: "font-semibold text-[var(--text-primary)]", children: [
              widgetId === "distribution" && "Distribui\xE7\xE3o de tarefas",
              widgetId === "activity" && "Atividade semanal",
              widgetId === "process" && "Status de processos"
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: !isHidden,
                onChange: () => {
                  setHidden(
                    isHidden ? hidden.filter((item) => item !== widgetId) : [...hidden.filter((item) => item !== widgetId)]
                  );
                  if (isHidden) {
                    setHidden(hidden.filter((item) => item !== widgetId));
                  }
                },
                "aria-label": `Alternar widget ${widgetId}`
              }
            )
          ]
        },
        widgetId
      );
    }) })
  ] }) });
};
const Dashboard = () => {
  const navigate = useNavigate();
  const { lawsuits, tasks, contacts, loading, error, users } = useApp();
  const today = dayjs().startOf("day");
  const [widgetOrder, setWidgetOrder] = useState(() => readLocalArray(WIDGET_ORDER_STORAGE, [...DEFAULT_WIDGETS]));
  const [hiddenWidgets, setHiddenWidgets] = useState(() => readLocalArray(HIDDEN_WIDGETS_STORAGE, []));
  const [draggingWidget, setDraggingWidget] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [isWidgetModalOpen, setWidgetModalOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(WIDGET_ORDER_STORAGE, JSON.stringify(widgetOrder));
    }
  }, [widgetOrder]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(HIDDEN_WIDGETS_STORAGE, JSON.stringify(hiddenWidgets));
    }
  }, [hiddenWidgets]);
  const {
    summary,
    distribution,
    completionTrend,
    processStatus,
    kpiCards,
    quickLinks,
    monthlyStats
  } = useMemo(() => {
    const buckets = {
      overdue: [],
      today: [],
      upcoming: [],
      done: []
    };
    tasks.forEach((task) => {
      const due = dayjs(task.deadline || task.dueDate);
      if (task.status === TaskStatus.Concluida) {
        buckets.done.push(task);
        return;
      }
      if (!due.isValid()) {
        buckets.upcoming.push(task);
        return;
      }
      if (due.isBefore(today, "day")) {
        buckets.overdue.push(task);
      } else if (due.isSame(today, "day")) {
        buckets.today.push(task);
      } else if (due.diff(today, "day") <= 30) {
        buckets.upcoming.push(task);
      }
    });
    const summary2 = {
      overdue: buckets.overdue.length,
      today: buckets.today.length,
      upcoming: buckets.upcoming.length
    };
    const distribution2 = [
      { name: "Atrasadas", value: summary2.overdue, color: "#DC2626" },
      { name: "Hoje", value: summary2.today, color: "#F97316" },
      { name: "Pr\xF3ximos 30 dias", value: summary2.upcoming, color: "#16A34A" },
      { name: "Conclu\xEDdas", value: buckets.done.length, color: "#475569" }
    ];
    const completionTrend2 = Array.from({ length: 7 }).map((_, index) => {
      const day = today.clone().subtract(6 - index, "day");
      const label = day.format("DD/MM");
      const completed = tasks.filter(
        (task) => task.status === TaskStatus.Concluida && dayjs(task.dueDate || task.deadline).isSame(day, "day")
      ).length;
      return { label, value: completed };
    });
    const processStatusMap = {};
    lawsuits.forEach((lawsuit) => {
      processStatusMap[lawsuit.status] = (processStatusMap[lawsuit.status] ?? 0) + 1;
    });
    const processStatus2 = Object.keys(processStatusMap).map((status) => ({
      label: status,
      value: processStatusMap[status]
    }));
    const activeLawsuits = processStatusMap["Ativo"] ?? 0;
    const overdueTasks = summary2.overdue;
    const concludedThisMonth = tasks.filter(
      (task) => task.status === TaskStatus.Concluida && dayjs(task.dueDate).isSame(today, "month")
    ).length;
    const newLeads = contacts.filter((contact) => contact.status === "Lead").length;
    const kpiCards2 = [
      {
        title: "Processos ativos",
        value: activeLawsuits,
        icon: Scale
      },
      {
        title: "Pend\xEAncias cr\xEDticas",
        value: overdueTasks,
        icon: Gavel
      },
      {
        title: "Conclu\xEDdas no m\xEAs",
        value: concludedThisMonth,
        icon: ScrollText
      },
      {
        title: "Novos leads",
        value: newLeads,
        icon: Landmark
      }
    ];
    const quickLinks2 = [
      {
        title: "Minhas tarefas",
        description: "Gerencie prazos cr\xEDticos, delega\xE7\xF5es e follow-ups do dia.",
        icon: CalendarDays,
        href: "/tarefas"
      },
      {
        title: "Processos ativos",
        description: "Acompanhe fases, respons\xE1veis e pr\xF3ximos passos dos casos.",
        icon: Briefcase,
        href: "/processos"
      },
      {
        title: "CRM \u2013 Pipeline",
        description: "Visualize oportunidades, leads e negocia\xE7\xF5es em andamento.",
        icon: LayoutDashboard,
        href: "/crm"
      },
      {
        title: "Relat\xF3rios",
        description: "Gere an\xE1lises de performance e produtividade por per\xEDodo.",
        icon: BarChart3,
        href: "/gestao"
      }
    ];
    const monthlyTasks = tasks.filter(
      (task) => dayjs(task.dueDate || task.deadline).isSame(today, "month")
    );
    const monthlyCompleted = monthlyTasks.filter((task) => task.status === TaskStatus.Concluida).length;
    const monthlyPending = Math.max(monthlyTasks.length - monthlyCompleted, 0);
    const percent = monthlyTasks.length > 0 ? Math.round(monthlyCompleted / monthlyTasks.length * 100) : 0;
    return {
      summary: summary2,
      distribution: distribution2,
      completionTrend: completionTrend2,
      processStatus: processStatus2,
      kpiCards: kpiCards2,
      quickLinks: quickLinks2,
      monthlyStats: {
        total: monthlyTasks.length,
        completed: monthlyCompleted,
        pending: monthlyPending,
        percent
      }
    };
  }, [tasks, lawsuits, contacts, today]);
  useEffect(() => {
    setWidgetOrder((prev) => {
      const cleaned = prev.filter((id) => DEFAULT_WIDGETS.includes(id));
      if (cleaned.length === 0) return [...DEFAULT_WIDGETS];
      return cleaned;
    });
  }, []);
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-red-500", children: error });
  }
  const handleNavigate = (filter) => {
    const params = new URLSearchParams();
    params.set("view", filter);
    navigate(`/tarefas?${params.toString()}`);
  };
  const heroTitle = summary.overdue > 0 ? `Priorize ${summary.overdue} pend\xEAncia${summary.overdue > 1 ? "s" : ""} cr\xEDticas hoje.` : "Tudo sob controle: antecipe o pr\xF3ximo movimento estrat\xE9gico.";
  const heroSubtitle = summary.overdue > 0 ? "Direcione follow-ups e delega\xE7\xF5es para manter os prazos impec\xE1veis." : "Use o momento para adiantar entregas e encantar clientes.";
  const heroMetrics = [
    {
      label: "Pend\xEAncias cr\xEDticas",
      value: `${summary.overdue}`,
      helper: summary.overdue > 0 ? "Clique para ver tarefas atrasadas" : "Nenhuma pend\xEAncia no momento",
      tone: "critical",
      onClick: summary.overdue > 0 ? () => handleNavigate("overdue") : void 0
    },
    {
      label: "Agenda de hoje",
      value: `${summary.today}`,
      helper: summary.today > 0 ? "Entregas previstas nas pr\xF3ximas horas" : "Sem entregas para hoje",
      tone: "warning",
      onClick: summary.today > 0 ? () => handleNavigate("today") : void 0
    },
    {
      label: "Produtividade do m\xEAs",
      value: `${monthlyStats.percent}%`,
      helper: `${monthlyStats.completed} de ${monthlyStats.total} tarefas conclu\xEDdas`,
      tone: "positive",
      onClick: monthlyStats.total > 0 ? () => navigate("/gestao") : void 0
    }
  ];
  const teamPreview = users.slice(0, 5);
  const extraMembers = Math.max(users.length - teamPreview.length, 0);
  const heroTeamBlock = teamPreview.length > 0 ? /* @__PURE__ */ jsx("div", { className: "hero-sidecard__team", children: /* @__PURE__ */ jsxs("div", { className: "hero-team hero-team--inline", children: [
    /* @__PURE__ */ jsxs("div", { className: "avatar-stack", children: [
      teamPreview.map((user) => /* @__PURE__ */ jsx(
        "div",
        {
          className: "avatar-stack__item",
          style: {
            backgroundImage: user.avatar ? `url(${user.avatar})` : void 0
          },
          children: !user.avatar && /* @__PURE__ */ jsx("span", { children: getInitials(user.name) })
        },
        user.id
      )),
      extraMembers > 0 && /* @__PURE__ */ jsxs("span", { className: "avatar-stack__more", children: [
        "+",
        extraMembers
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "hero-team__copy", children: [
      "Equipe conectada \xB7 ",
      users.length,
      " membro",
      users.length === 1 ? "" : "s",
      " ativos no painel."
    ] })
  ] }) }) : null;
  const monthlyCopy = monthlyStats.percent >= 75 ? "O time est\xE1 entregando acima da meta programada." : monthlyStats.percent >= 40 ? "H\xE1 espa\xE7o para acelerar entregas nos pr\xF3ximos dias." : "Organize for\xE7as para destravar as pr\xF3ximas demandas.";
  const activeWidgets = widgetOrder.filter((id) => !hiddenWidgets.includes(id));
  const widgetContent = {
    distribution: /* @__PURE__ */ jsx(
      DashboardDonut,
      {
        data: distribution,
        title: "Distribui\xE7\xE3o de tarefas",
        description: "Vis\xE3o geral por status"
      }
    ),
    activity: /* @__PURE__ */ jsx(
      DashboardArea,
      {
        data: completionTrend,
        title: "Conclu\xEDdas na \xFAltima semana",
        description: "Monitoramento das entregas di\xE1rias",
        accent: "#2B6CB0"
      }
    ),
    process: /* @__PURE__ */ jsx(
      DashboardBar,
      {
        data: processStatus.map((item) => ({ label: item.label, value: item.value })),
        title: "Status de processos",
        description: "Casos distribu\xEDdos por etapa",
        primaryColor: "#2B6CB0"
      }
    )
  };
  const handleDragStart = (event, id) => {
    setDraggingWidget(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (event, targetId) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain") || draggingWidget;
    if (!draggedId || draggedId === targetId) {
      setDraggingWidget(null);
      return;
    }
    setWidgetOrder((prev) => {
      const filtered = prev.filter((id) => DEFAULT_WIDGETS.includes(id));
      const fromIndex = filtered.indexOf(draggedId);
      const toIndex = filtered.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return filtered;
      const updated = [...filtered];
      updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, draggedId);
      return updated;
    });
    setDraggingWidget(null);
  };
  const handleWidgetAction = (widgetId, action) => {
    if (action === "remove") {
      setHiddenWidgets((prev) => [.../* @__PURE__ */ new Set([...prev, widgetId])]);
    }
    if (action === "pin") {
      setWidgetOrder((prev) => {
        const others = prev.filter((id) => id !== widgetId);
        return [widgetId, ...others];
      });
    }
    if (action === "configure") {
      alert("Personaliza\xE7\xE3o detalhada dispon\xEDvel em breve.");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxs("section", { className: "premium-hero", children: [
      /* @__PURE__ */ jsx("div", { className: "premium-hero__overlay" }),
      /* @__PURE__ */ jsxs("div", { className: "premium-hero__content", children: [
        /* @__PURE__ */ jsxs("div", { className: "premium-hero__main", children: [
          /* @__PURE__ */ jsxs("span", { className: "premium-badge", children: [
            "Painel executivo \xB7 ",
            today.format("dddd, DD [de] MMMM")
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "premium-hero__title", children: heroTitle }),
          /* @__PURE__ */ jsx("p", { className: "premium-hero__subtitle", children: heroSubtitle }),
          /* @__PURE__ */ jsxs("div", { className: "hero-actions hero-actions--compact", children: [
            /* @__PURE__ */ jsxs(Button, { className: "hero-actions__primary", onClick: () => navigate("/tarefas"), children: [
              /* @__PURE__ */ jsx(CalendarDays, { className: "mr-2 h-4 w-4" }),
              "Ir para Minhas Tarefas"
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "secondary",
                className: "hero-actions__secondary",
                onClick: () => setWidgetModalOpen(true),
                children: "Personalizar painel"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "hero-actions__tools", children: [
              /* @__PURE__ */ jsx(ThemeToggle, {}),
              /* @__PURE__ */ jsx(AlertBell, { tasks })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "premium-hero__metrics", children: heroMetrics.map((metric) => /* @__PURE__ */ jsx(HeroMetric, { ...metric }, metric.label)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hero-sidecard", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("p", { className: "hero-sidecard__eyebrow", children: "Resumo do m\xEAs" }),
            /* @__PURE__ */ jsxs("h3", { className: "hero-sidecard__title", children: [
              monthlyStats.percent,
              "% de produtividade"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "hero-sidecard__subtitle", children: monthlyCopy })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "hero-sidecard__grid", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "hero-sidecard__label", children: "Conclu\xEDdas" }),
              /* @__PURE__ */ jsx(AnimatedNumber, { value: monthlyStats.completed, className: "hero-sidecard__value" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "hero-sidecard__label", children: "Pendentes" }),
              /* @__PURE__ */ jsx(AnimatedNumber, { value: monthlyStats.pending, className: "hero-sidecard__value" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "hero-sidecard__label", children: "Casos ativos" }),
              /* @__PURE__ */ jsx(AnimatedNumber, { value: lawsuits.length, className: "hero-sidecard__value" })
            ] })
          ] }),
          heroTeamBlock,
          /* @__PURE__ */ jsx("div", { className: "hero-sidecard__footer", children: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              className: "hero-sidecard__cta",
              onClick: () => navigate("/gestao"),
              children: "Ver relat\xF3rio mensal"
            }
          ) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: [
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Atrasadas",
          value: summary.overdue,
          variation: `${summary.overdue} pend\xEAncias nesta semana`,
          icon: AlertTriangle,
          tone: "overdue",
          onClick: () => handleNavigate("overdue")
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Hoje",
          value: summary.today,
          variation: `${summary.today} entregas previstas`,
          icon: CalendarClock,
          tone: "today",
          onClick: () => handleNavigate("today")
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Pr\xF3ximos 30 dias",
          value: summary.upcoming,
          variation: `${monthlyStats.percent}% conclu\xEDdas deste m\xEAs`,
          icon: CalendarRange,
          tone: "upcoming",
          onClick: () => handleNavigate("upcoming")
        }
      )
    ] }),
    /* @__PURE__ */ jsx("section", { className: "grid grid-cols-12 gap-6", children: activeWidgets.map((widgetId) => /* @__PURE__ */ jsx(
      WidgetWrapper,
      {
        id: widgetId,
        title: widgetId === "distribution" ? "Distribui\xE7\xE3o de tarefas" : widgetId === "activity" ? "Atividade semanal" : "Status de processos",
        onDragStart: handleDragStart,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
        onDragEnd: () => setDraggingWidget(null),
        menuOpen,
        setMenuOpen,
        onAction: handleWidgetAction,
        dragging: draggingWidget,
        children: widgetContent[widgetId]
      },
      widgetId
    )) }),
    /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-12 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "dashboard-card col-span-12 space-y-4 lg:col-span-4", children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-[var(--text-primary)]", children: "Indicadores principais" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[var(--text-secondary)]", children: "Resumo de performance jur\xEDdica" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: kpiCards.map((card) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)]", children: /* @__PURE__ */ jsx(card.icon, { className: "h-6 w-6", "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]", children: card.title }),
            /* @__PURE__ */ jsx(AnimatedNumber, { value: card.value, className: "text-xl font-semibold text-[var(--text-primary)]" })
          ] })
        ] }, card.title)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dashboard-card col-span-12 space-y-4 lg:col-span-8", children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-[var(--text-primary)]", children: "Objetivos do m\xEAs" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[var(--text-secondary)]", children: "Acompanhe o andamento das metas de receita e produtividade." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]", children: "Metas de receita" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-semibold text-[var(--text-primary)]", children: "R$ 0,00" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-[var(--text-secondary)]", children: "Integre o m\xF3dulo financeiro para visualizar faturamento em tempo real." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]", children: "Progresso de tarefas" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-[var(--text-secondary)]", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  monthlyStats.completed,
                  " conclu\xEDdas"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  monthlyStats.total,
                  " planejadas"
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "progress-bar mt-2",
                  role: "progressbar",
                  "aria-valuemin": 0,
                  "aria-valuemax": 100,
                  "aria-valuenow": monthlyStats.percent,
                  children: /* @__PURE__ */ jsx("div", { className: "progress-bar__value", style: { width: `${monthlyStats.percent}%` } })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs font-semibold text-[var(--text-primary)]", children: [
                monthlyStats.percent,
                "% conclu\xEDdas neste m\xEAs"
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "grid grid-cols-12 gap-4 lg:gap-6", children: quickLinks.map((link) => /* @__PURE__ */ jsx(
      QuickActionCard,
      {
        title: link.title,
        description: link.description,
        icon: link.icon,
        onClick: () => navigate(link.href),
        className: "col-span-12 md:col-span-6 xl:col-span-3"
      },
      link.title
    )) }),
    isWidgetModalOpen && /* @__PURE__ */ jsx(
      WidgetModal,
      {
        hidden: hiddenWidgets,
        setHidden: (next) => setHiddenWidgets(next),
        available: [...DEFAULT_WIDGETS],
        onClose: () => setWidgetModalOpen(false)
      }
    )
  ] });
};
var Dashboard_default = Dashboard;
export {
  Dashboard_default as default
};
