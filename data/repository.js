(function initializeRepository(global) {
  const config = global.RUNTIME_CONFIG || {};
  const requestedMode = String(config.BOARD_DATA_MODE || "local").toLowerCase();
  const mode = requestedMode === "supabase" ? "supabase" : "local";
  const local = new global.LocalRepository();
  const supabase = new global.SupabaseRepository(config);
  let cloudWriteQueue = Promise.resolve();

  function enqueueCloudWrite(operation) {
    const queued = cloudWriteQueue.then(operation);
    cloudWriteQueue = queued.catch(() => {});
    return queued;
  }

  global.BoardRepository = Object.freeze({
    mode,
    dataMode: mode === "supabase" ? "supabase-partial" : "local",
    isSupabaseMode: mode === "supabase",
    supabase,
    loadPeople: (...args) => local.loadPeople(...args),
    loadCards: (...args) => local.loadCards(...args),
    loadSuggestions: (...args) => local.loadSuggestions(...args),
    saveSuggestions: (...args) => local.saveSuggestions(...args),
    loadWorkTemplates: (...args) => local.loadWorkTemplates(...args),
    loadCloudData: async () => {
      await cloudWriteQueue;
      return supabase.loadInitialBoardData();
    },
    subscribeRealtime: (...args) => supabase.subscribeToChanges(...args),
    unsubscribeRealtime: (channel) => supabase.unsubscribeFromChanges(channel),
    savePeople(people, operation = {}) {
      if (mode === "local") return local.savePeople(people);
      const peopleSnapshot = people.map((person) => ({ ...person }));
      if (operation.type === "create") {
        return enqueueCloudWrite(() =>
          supabase.createWorker(operation.person, operation.sortOrder),
        );
      }
      if (operation.type === "update") {
        return enqueueCloudWrite(() => supabase.updateWorker(operation.person));
      }
      if (operation.type === "delete") {
        return enqueueCloudWrite(() =>
          supabase
            .deleteWorker(operation.personId)
            .then(() => supabase.updateWorkerOrder(peopleSnapshot)),
        );
      }
      if (operation.type === "reorder") {
        return enqueueCloudWrite(() => supabase.updateWorkerOrder(peopleSnapshot));
      }
      if (operation.type === "upsert") {
        return enqueueCloudWrite(() => supabase.upsertWorkers(peopleSnapshot));
      }
      return Promise.resolve();
    },
    saveCards(cards, operation = {}) {
      if (mode === "local") return local.saveCards(cards);
      const cardSnapshot = cards.map((card) => ({ ...card, imageData: null }));
      if (operation.type === "create") {
        return enqueueCloudWrite(() => supabase.createJob(operation.card));
      }
      if (operation.type === "update") {
        return enqueueCloudWrite(() =>
          supabase
            .updateJob(operation.card)
            .then(() => supabase.updateJobOrder(cardSnapshot)),
        );
      }
      if (operation.type === "delete") {
        return enqueueCloudWrite(() =>
          supabase
            .deleteJob(operation.cardId)
            .then(() => supabase.updateJobOrder(cardSnapshot)),
        );
      }
      if (operation.type === "reorder") {
        return enqueueCloudWrite(() => supabase.updateJobOrder(cardSnapshot));
      }
      return Promise.resolve();
    },
    saveWorkTemplates(workTemplates, operation = {}) {
      if (mode === "local") return local.saveWorkTemplates(workTemplates);
      const templateSnapshot = [...workTemplates];
      if (operation.type === "create") {
        return enqueueCloudWrite(() =>
          supabase.createWorkTemplate(operation.label, operation.sortOrder),
        );
      }
      if (operation.type === "delete") {
        return enqueueCloudWrite(() =>
          supabase
            .deleteWorkTemplate(operation.label)
            .then(() => supabase.updateWorkTemplateOrder(templateSnapshot)),
        );
      }
      if (operation.type === "reorder") {
        return enqueueCloudWrite(() =>
          supabase.updateWorkTemplateOrder(templateSnapshot),
        );
      }
      return Promise.resolve();
    },
  });
})(window);
