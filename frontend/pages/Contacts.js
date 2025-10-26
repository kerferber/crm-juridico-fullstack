import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { useApp } from "../store/AppContext";
import { formatDocument, formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import {
  Plus,
  Search,
  Users,
  Briefcase,
  Sparkles,
  User,
  ClipboardList,
  Phone,
  Mail,
  IdCard,
  Upload,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { useContactModal } from "../hooks/useContactModal";
import { useTaskModal } from "../hooks/useTaskModal";
import { useProcessModal } from "../hooks/useProcessModal";
const CONTACT_SEGMENTS_KEY = "workflow-studio:contact-segments:v1";
const STATUS_COLORS = {
  Cliente: "bg-primary/10 text-primary dark:bg-dark-primary/15 dark:text-dark-primary",
  Lead: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
};
const parseHexColor = (value) => {
  if (!value) return null;
  let hex = value.trim();
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }
  if (hex.length === 3) {
    hex = hex.split("").map((char) => `${char}${char}`).join("");
  }
  if (hex.length !== 6) {
    return null;
  }
  const numeric = Number.parseInt(hex, 16);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return {
    r: numeric >> 16 & 255,
    g: numeric >> 8 & 255,
    b: numeric & 255
  };
};
const getBadgeStyles = (color) => {
  const rgb = parseHexColor(color);
  if (!rgb) return void 0;
  const { r, g, b } = rgb;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.28)`,
    color: `rgb(${r}, ${g}, ${b})`
  };
};
const loadSegments = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CONTACT_SEGMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn("N\xE3o foi poss\xEDvel carregar segmentos salvos", error);
  }
  return [];
};
const Contacts = () => {
  const { contacts, users, lawsuits, tasks, categoryGroups, deleteContact } = useApp();
  const { open: openContactModal } = useContactModal();
  const { openForCreate: openTaskModal } = useTaskModal();
  const { open: openProcessModal } = useProcessModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContactCategory, setSelectedContactCategory] = useState("all");
  const [selectedLeadCategory, setSelectedLeadCategory] = useState("all");
  const [selectedOwner, setSelectedOwner] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [deletingContactId, setDeletingContactId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [savedSegments, setSavedSegments] = useState(() => loadSegments());
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONTACT_SEGMENTS_KEY, JSON.stringify(savedSegments));
  }, [savedSegments]);
  const contactsWithProcesses = useMemo(() => {
    return lawsuits.reduce((acc, lawsuit) => {
      acc[lawsuit.clientId] = (acc[lawsuit.clientId] ?? 0) + 1;
      return acc;
    }, {});
  }, [lawsuits]);
  const tasksByContact = useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (task.clientId) {
        acc[task.clientId] = (acc[task.clientId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [tasks]);
  const totalContacts = contacts.length;
  const totalWithProcess = Object.keys(contactsWithProcesses).length;
  const totalLeads = contacts.filter((contact) => contact.status === "Lead").length;
  const leadsWithoutProcess = totalContacts - totalWithProcess;
  const leadsPercentage = totalContacts > 0 ? Math.round(totalLeads / totalContacts * 100) : 0;
  const followUpAlerts = useMemo(() => {
    const threshold = dayjs().subtract(21, "day");
    return contacts.filter((contact) => contact.status === "Lead" && (!contact.lastInteraction || dayjs(contact.lastInteraction).isBefore(threshold))).slice(0, 4);
  }, [contacts]);
  const highlightCards = useMemo(
    () => [
      {
        title: "Total",
        value: totalContacts,
        description: "Carteira completa cadastrada no CRM.",
        icon: Users
      },
      {
        title: "Com processos",
        value: totalWithProcess,
        description: "Clientes j\xE1 vinculados a casos ativos.",
        icon: Briefcase
      },
      {
        title: "Leads",
        value: totalLeads,
        description: "Potenciais clientes em nutri\xE7\xE3o.",
        icon: Sparkles
      },
      {
        title: "Sem processo",
        value: leadsWithoutProcess,
        description: "Oportunidades prontas para abordar.",
        icon: ClipboardList
      }
    ],
    [totalContacts, totalWithProcess, totalLeads, leadsWithoutProcess]
  );
  const quickStats = [
    { label: "Carteira total", value: totalContacts },
    { label: "Com processos", value: totalWithProcess },
    { label: "Leads ativos", value: totalLeads }
  ];
  const originOptions = useMemo(() => {
    const origins = contacts.map((contact) => contact.origin).filter((origin) => Boolean(origin));
    return ["all", ...Array.from(new Set(origins))];
  }, [contacts]);
  const contactCategories = useMemo(() => {
    return categoryGroups.find((group) => group.id === "contacts")?.items ?? [];
  }, [categoryGroups]);
  const leadCategories = useMemo(() => {
    return categoryGroups.find((group) => group.id === "leads")?.items ?? [];
  }, [categoryGroups]);
  const contactCategoryMap = useMemo(() => {
    return new Map(contactCategories.map((item) => [item.id, item]));
  }, [contactCategories]);
  const leadCategoryMap = useMemo(() => {
    return new Map(leadCategories.map((item) => [item.id, item]));
  }, [leadCategories]);
  const contactCategoryOptions = useMemo(() => {
    return [
      { id: "all", label: "Todas as categorias" },
      ...contactCategories.map((item) => ({
        id: item.id,
        label: item.name,
        color: item.color
      })),
      { id: "none", label: "Sem categoria atribu\xEDda" }
    ];
  }, [contactCategories]);
  const leadCategoryOptions = useMemo(() => {
    return [
      { id: "all", label: "Todos os est\xE1gios" },
      ...leadCategories.map((item) => ({
        id: item.id,
        label: item.name,
        color: item.color
      })),
      { id: "none", label: "Sem est\xE1gio" }
    ];
  }, [leadCategories]);
  const filteredContacts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return contacts.filter((contact) => {
      const searchPool = [contact.name, contact.document, contact.email, contact.phone].filter(
        (value) => Boolean(value)
      );
      const matchesSearch = search.length === 0 || searchPool.some((value) => value.toLowerCase().includes(search));
      const matchesOrigin = selectedOrigin === "all" || contact.origin === selectedOrigin;
      const matchesOwner = selectedOwner === "all" || contact.ownerId === Number.parseInt(selectedOwner, 10);
      const matchesContactCategory = selectedContactCategory === "all" ? true : selectedContactCategory === "none" ? !contact.categoryId : contact.categoryId === selectedContactCategory;
      const matchesLeadCategory = selectedLeadCategory === "all" ? true : selectedLeadCategory === "none" ? !contact.leadCategoryId : contact.leadCategoryId === selectedLeadCategory;
      return matchesSearch && matchesOrigin && matchesOwner && matchesContactCategory && matchesLeadCategory;
    });
  }, [
    contacts,
    searchTerm,
    selectedOrigin,
    selectedOwner,
    selectedContactCategory,
    selectedLeadCategory
  ]);
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedContactCategory("all");
    setSelectedLeadCategory("all");
    setSelectedOwner("all");
    setSelectedOrigin("all");
    setSelectedSegmentId("");
  };
  const handleApplySegment = (segmentId) => {
    setSelectedSegmentId(segmentId);
    const segment = savedSegments.find((item) => item.id === segmentId);
    if (!segment) return;
    setSelectedContactCategory(segment.filters.contactCategory);
    setSelectedLeadCategory(segment.filters.leadCategory);
    setSelectedOwner(segment.filters.owner);
    setSelectedOrigin(segment.filters.origin);
  };
  const handleSaveSegment = () => {
    const name = window.prompt("Nome do segmento");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const newSegment = {
      id: `${Date.now()}`,
      name: trimmed,
      filters: {
        contactCategory: selectedContactCategory,
        leadCategory: selectedLeadCategory,
        owner: selectedOwner,
        origin: selectedOrigin
      }
    };
    setSavedSegments((prev) => [...prev, newSegment]);
    setSelectedSegmentId(newSegment.id);
  };
  const handleDeleteSegment = (segmentId) => {
    setSavedSegments((prev) => prev.filter((segment) => segment.id !== segmentId));
    if (selectedSegmentId === segmentId) {
      setSelectedSegmentId("");
    }
  };
  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      window.alert(`Arquivo "${file.name}" enviado para processamento.`);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }, 800);
  };
  const handleDeleteContact = async (target) => {
    const confirmed = window.confirm(
      `Excluir o contato "${target.name}"? Esta a\xE7\xE3o n\xE3o pode ser desfeita.`
    );
    if (!confirmed) {
      return;
    }
    try {
      setActionError(null);
      setDeletingContactId(target.id);
      await deleteContact(target.id);
    } catch (err) {
      console.error(err);
      setActionError("N\xE3o foi poss\xEDvel excluir o contato selecionado.");
    } finally {
      setDeletingContactId(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-border/60 bg-white px-5 py-5 shadow-sm dark:border-dark-border/60 dark:bg-dark-card/80", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground", children: "Relacionamentos" }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight text-foreground dark:text-dark-foreground", children: "Carteira ativa e oportunidades quentes" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Monitore indicadores cr\xEDticos e use segmentos salvos para agir com rapidez." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { className: "gap-2 rounded-full", size: "sm", onClick: openContactModal, children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
            "Novo contato"
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "gap-2 rounded-full",
              onClick: () => importInputRef.current?.click(),
              disabled: importing,
              children: [
                /* @__PURE__ */ jsx(Upload, { className: "h-4 w-4" }),
                importing ? "Importando..." : "Importar planilha"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "gap-2 rounded-full",
              onClick: () => {
                const csvRows = [
                  [
                    "nome",
                    "email",
                    "telefone",
                    "documento",
                    "status",
                    "origem",
                    "responsavel_id",
                    "categoria_id",
                    "lead_categoria_id",
                    "ultima_interacao",
                    "anotacoes"
                  ],
                  [
                    "Empresa Alpha Ltda",
                    "contato@alpha.com",
                    "(11) 99999-9999",
                    "12345678000190",
                    "Cliente",
                    "Indica\xE7\xE3o",
                    "1",
                    "contacts-cliente",
                    "leads-clientes-ativos",
                    "2025-01-15",
                    "Validar proposta com @Sofia."
                  ]
                ];
                const csvContent = csvRows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "modelo-importacao-contatos.csv";
                link.click();
                URL.revokeObjectURL(url);
              },
              children: "Baixar modelo"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: importInputRef,
              type: "file",
              accept: ".csv,.xlsx",
              className: "hidden",
              onChange: handleImportFile
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
        highlightCards.map((card) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-surface/60",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { children: card.title }),
                /* @__PURE__ */ jsx(card.icon, { className: "h-4 w-4 text-muted-foreground" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-semibold text-foreground dark:text-dark-foreground", children: card.value }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: card.description })
            ]
          },
          card.title
        )),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-surface/60", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: "% Leads na base" }),
            /* @__PURE__ */ jsx(Users, { className: "h-4 w-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-2xl font-semibold text-foreground dark:text-dark-foreground", children: [
            leadsPercentage,
            "%"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/50 dark:bg-dark-border/60", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-full rounded-full bg-sky-500 dark:bg-dark-primary",
              style: { width: `${leadsPercentage}%` }
            }
          ) }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Leads em nutri\xE7\xE3o ativa" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-surface/60", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground", children: "Segmentos salvos" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "rounded-full text-xs", onClick: handleSaveSegment, children: "Salvar segmento" }),
              savedSegments.length > 0 && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "rounded-full text-xs", onClick: () => setSavedSegments([]), children: "Limpar favoritos" })
            ] })
          ] }),
          savedSegments.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Crie combina\xE7\xF5es personalizadas de filtros e salve para acesso r\xE1pido." }) : /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: savedSegments.map((segment) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                selectedSegmentId === segment.id ? "border-primary/40 bg-primary/10 text-primary dark:border-dark-primary/40 dark:bg-dark-primary/15 dark:text-dark-primary" : "border-border/60 bg-white text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-muted"
              ),
              children: [
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => handleApplySegment(segment.id), children: segment.name }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "text-muted-foreground hover:text-red-500",
                    onClick: () => handleDeleteSegment(segment.id),
                    children: "\xD7"
                  }
                )
              ]
            },
            segment.id
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm dark:border-dark-border/60 dark:bg-dark-surface/60", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground", children: "Follow-ups sugeridos" }),
          followUpAlerts.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Nenhum lead cr\xEDtico aguardando intera\xE7\xE3o." }) : /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2 text-sm", children: followUpAlerts.map((alert) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2 text-foreground dark:text-dark-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: alert.name }),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                className: "rounded-full px-2 text-[11px]",
                onClick: () => openTaskModal({
                  clientId: alert.id,
                  responsibleId: alert.ownerId ?? users[0]?.id
                }),
                children: "Criar tarefa"
              }
            )
          ] }, alert.id)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border border-slate-200 bg-white shadow-[0_18px_48px_-38px_rgba(15,23,42,0.3)] backdrop-blur-sm dark:border-dark-border/60 dark:bg-dark-card/80", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base font-semibold tracking-tight text-foreground dark:text-dark-foreground", children: "Lista inteligente de contatos" }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-[12px]", children: "Acompanhe categorias, est\xE1gios e respons\xE1veis para priorizar relacionamentos em alta." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex w-full max-w-xl items-center gap-2.5", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-muted-foreground shadow-inner dark:border-dark-border/60 dark:bg-dark-background/70", children: [
            /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                value: searchTerm,
                onChange: (event) => setSearchTerm(event.target.value),
                placeholder: "Buscar por nome, documento ou contato...",
                className: "w-full border-none bg-transparent text-sm focus:outline-none dark:text-dark-foreground"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "rounded-full text-xs", onClick: resetFilters, children: "Limpar filtros" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        actionError && /* @__PURE__ */ jsx("p", { className: "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200", children: actionError }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2", children: contactCategoryOptions.map((option) => {
          const isActive = selectedContactCategory === option.id;
          const badgeStyles = getBadgeStyles(option.color);
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSelectedContactCategory(option.id),
              className: cn(
                "inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold transition",
                option.color ? "bg-white/80 text-foreground shadow-sm dark:bg-dark-card/60 dark:text-dark-foreground" : "border-slate-200 bg-white text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground",
                isActive ? "ring-2 ring-primary/40 ring-offset-1 ring-offset-white dark:ring-dark-primary/40 dark:ring-offset-dark-card" : "hover:border-sky-300 hover:text-sky-600 dark:hover:border-dark-primary/40 dark:hover:text-dark-primary"
              ),
              style: badgeStyles,
              children: option.label
            },
            option.id
          );
        }) }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2", children: leadCategoryOptions.map((option) => {
          const isActive = selectedLeadCategory === option.id;
          const badgeStyles = getBadgeStyles(option.color);
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSelectedLeadCategory(option.id),
              className: cn(
                "inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold transition",
                option.color ? "bg-white/80 text-foreground shadow-sm dark:bg-dark-card/60 dark:text-dark-foreground" : "border-slate-200 bg-white text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70 dark:text-dark-foreground",
                isActive ? "ring-2 ring-primary/40 ring-offset-1 ring-offset-white dark:ring-dark-primary/40 dark:ring-offset-dark-card" : "hover:border-sky-300 hover:text-sky-600 dark:hover:border-dark-primary/40 dark:hover:text-dark-primary"
              ),
              style: badgeStyles,
              children: option.label
            },
            option.id
          );
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: selectedOwner,
              onChange: (event) => setSelectedOwner(event.target.value),
              className: "flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground",
              children: [
                /* @__PURE__ */ jsx("option", { value: "all", children: "Todos os respons\xE1veis" }),
                users.map((user) => /* @__PURE__ */ jsx("option", { value: user.id, children: user.name }, user.id))
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: selectedOrigin,
              onChange: (event) => setSelectedOrigin(event.target.value),
              className: "flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-foreground shadow-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border/60 dark:bg-dark-background/70 dark:text-dark-foreground",
              children: originOptions.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option === "all" ? "Todas as origens" : option }, option))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden grid-cols-[1.6fr,1.1fr,1fr,1fr,auto] gap-5 rounded-xl border border-slate-200 bg-muted/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/80 lg:grid", children: [
            /* @__PURE__ */ jsx("span", { children: "Contato" }),
            /* @__PURE__ */ jsx("span", { children: "Segmenta\xE7\xE3o" }),
            /* @__PURE__ */ jsx("span", { children: "Respons\xE1vel" }),
            /* @__PURE__ */ jsx("span", { children: "Relacionamento" }),
            /* @__PURE__ */ jsx("span", { children: "A\xE7\xF5es" })
          ] }),
          filteredContacts.map((contact) => {
            const owner = users.find((user) => user.id === contact.ownerId);
            const processCount = contactsWithProcesses[contact.id] ?? 0;
            const taskCount = tasksByContact[contact.id] ?? 0;
            const statusClass = STATUS_COLORS[contact.status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200";
            const contactCategory = contact.categoryId ? contactCategoryMap.get(contact.categoryId) : void 0;
            const leadCategory = contact.leadCategoryId ? leadCategoryMap.get(contact.leadCategoryId) : void 0;
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: "group rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-dark-border/60 dark:bg-dark-card/80",
                children: /* @__PURE__ */ jsxs("div", { className: "space-y-4 lg:grid lg:grid-cols-[1.6fr,1.1fr,1fr,1fr,auto] lg:items-center lg:gap-5 lg:space-y-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-600 shadow-inner dark:bg-dark-primary/15 dark:text-dark-primary", children: /* @__PURE__ */ jsx(User, { className: "h-5 w-5" }) }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx(
                        Link,
                        {
                          to: `/contatos/${contact.id}`,
                          className: "text-sm font-semibold text-foreground transition hover:text-primary dark:text-dark-foreground dark:hover:text-dark-primary",
                          children: contact.name
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 text-xs text-muted-foreground", children: [
                        contact.document && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700/40 dark:text-slate-200", children: [
                          /* @__PURE__ */ jsx(IdCard, { className: "h-3 w-3" }),
                          formatDocument(contact.document)
                        ] }),
                        contact.email && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700/40 dark:text-slate-200", children: [
                          /* @__PURE__ */ jsx(Mail, { className: "h-3 w-3" }),
                          contact.email
                        ] }),
                        contact.phone && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700/40 dark:text-slate-200", children: [
                          /* @__PURE__ */ jsx(Phone, { className: "h-3 w-3" }),
                          contact.phone
                        ] })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs font-semibold", children: [
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: cn(
                          "inline-flex items-center rounded-md px-3 py-1 uppercase tracking-[0.18em]",
                          statusClass
                        ),
                        children: contact.status
                      }
                    ),
                    contactCategory && contactCategory.name !== contact.status && /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: "inline-flex items-center rounded-md border px-3 py-1",
                        style: getBadgeStyles(contactCategory.color),
                        children: contactCategory.name
                      }
                    ),
                    leadCategory && /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: "inline-flex items-center rounded-md border px-3 py-1",
                        style: getBadgeStyles(leadCategory.color),
                        children: leadCategory.name
                      }
                    ),
                    !leadCategory && /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-md border border-dashed border-border px-3 py-1 text-muted-foreground dark:border-dark-border", children: "Sem est\xE1gio" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground dark:text-dark-foreground", children: owner?.name ?? "Equipe" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 text-[11px] text-muted-foreground", children: [
                      /* @__PURE__ */ jsxs(
                        Link,
                        {
                          to: `/processos?cliente=${contact.id}`,
                          className: "inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-primary hover:border-primary dark:border-dark-border/60 dark:text-dark-primary",
                          children: [
                            processCount,
                            " processo(s)"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        Link,
                        {
                          to: `/tarefas?clientId=${contact.id}`,
                          className: "inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-primary hover:border-primary dark:border-dark-border/60 dark:text-dark-primary",
                          children: [
                            taskCount,
                            " tarefa(s)"
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm", children: [
                    /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/70", children: contact.origin || "Origem n\xE3o informada" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                      "\xDAltima intera\xE7\xE3o:",
                      " ",
                      contact.lastInteraction ? formatDate(contact.lastInteraction) : "Sem registro"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2", children: [
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        className: "h-8 w-8 rounded-md border border-slate-200 text-sky-600 hover:border-sky-300 hover:bg-sky-50 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/50 dark:hover:bg-dark-primary/15",
                        title: "Novo processo",
                        onClick: () => openProcessModal({
                          clientId: contact.id,
                          responsibleId: contact.ownerId ?? users[0]?.id
                        }),
                        children: /* @__PURE__ */ jsx(Briefcase, { className: "h-4 w-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        className: "h-8 w-8 rounded-md border border-slate-200 text-sky-600 hover:border-sky-300 hover:bg-sky-50 dark:border-dark-border/60 dark:text-dark-primary dark:hover:border-dark-primary/50 dark:hover:bg-dark-primary/15",
                        title: "Nova tarefa",
                        onClick: () => openTaskModal({
                          clientId: contact.id,
                          responsibleId: contact.ownerId ?? users[0]?.id
                        }),
                        children: /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        className: "h-8 w-8 rounded-md border border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/15",
                        title: "Excluir contato",
                        onClick: () => handleDeleteContact(contact),
                        disabled: deletingContactId === contact.id,
                        children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "outline",
                        size: "sm",
                        className: "rounded-md border-sky-400 px-3 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-dark-primary/40 dark:text-dark-primary dark:hover:bg-dark-primary/15",
                        asChild: true,
                        children: /* @__PURE__ */ jsx(Link, { to: `/contatos/${contact.id}`, children: "Ver perfil" })
                      }
                    )
                  ] })
                ] })
              },
              contact.id
            );
          })
        ] }),
        filteredContacts.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground dark:border-dark-border/60 dark:bg-dark-card/60", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-dark-primary/10 dark:text-dark-primary", children: /* @__PURE__ */ jsx(Users, { className: "h-6 w-6" }) }),
          "Nenhum contato encontrado com os filtros selecionados.",
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: resetFilters,
              className: "rounded-md border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 dark:border-dark-border/60 dark:text-dark-foreground",
              children: "Limpar filtros"
            }
          )
        ] })
      ] })
    ] })
  ] });
};
var Contacts_default = Contacts;
export {
  Contacts_default as default
};
