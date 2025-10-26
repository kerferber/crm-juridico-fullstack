var TaskStatus = /* @__PURE__ */ ((TaskStatus2) => {
  TaskStatus2["Pendente"] = "Pendente";
  TaskStatus2["Concluida"] = "Conclu\xEDda";
  TaskStatus2["Atrasada"] = "Atrasada";
  return TaskStatus2;
})(TaskStatus || {});
var KanbanColumn = /* @__PURE__ */ ((KanbanColumn2) => {
  KanbanColumn2["Prospeccao"] = "Prospec\xE7\xE3o";
  KanbanColumn2["AnaliseDocumentos"] = "An\xE1lise de Documentos";
  KanbanColumn2["ElaboracaoPeticao"] = "Elabora\xE7\xE3o da Peti\xE7\xE3o";
  KanbanColumn2["AguardandoJulgamento"] = "Aguardando Julgamento";
  KanbanColumn2["Finalizados"] = "Finalizados";
  return KanbanColumn2;
})(KanbanColumn || {});
var KanbanPhase = /* @__PURE__ */ ((KanbanPhase2) => {
  KanbanPhase2["Judicial"] = "Judicial";
  KanbanPhase2["Extrajudicial"] = "Extrajudicial";
  return KanbanPhase2;
})(KanbanPhase || {});
var TransactionType = /* @__PURE__ */ ((TransactionType2) => {
  TransactionType2["Receita"] = "Receita";
  TransactionType2["Despesa"] = "Despesa";
  return TransactionType2;
})(TransactionType || {});
export {
  KanbanColumn,
  KanbanPhase,
  TaskStatus,
  TransactionType
};
