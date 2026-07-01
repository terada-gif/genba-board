(function initializeRepository(global) {
  const config = global.RUNTIME_CONFIG || {};
  const requestedMode = String(config.BOARD_DATA_MODE || "local").toLowerCase();
  const mode = requestedMode === "supabase" ? "supabase" : "local";
  const local = new global.LocalRepository();
  const supabase = new global.SupabaseRepository(config);

  // v1.0-1 keeps board data local while Supabase Auth connectivity is introduced.
  const dataRepository = local;

  global.BoardRepository = Object.freeze({
    mode,
    dataMode: "local",
    isSupabaseMode: mode === "supabase",
    supabase,
    loadPeople: (...args) => dataRepository.loadPeople(...args),
    loadCards: (...args) => dataRepository.loadCards(...args),
    savePeople: (...args) => dataRepository.savePeople(...args),
    saveCards: (...args) => dataRepository.saveCards(...args),
    loadSuggestions: (...args) => dataRepository.loadSuggestions(...args),
    saveSuggestions: (...args) => dataRepository.saveSuggestions(...args),
    loadWorkTemplates: (...args) => dataRepository.loadWorkTemplates(...args),
    saveWorkTemplates: (...args) => dataRepository.saveWorkTemplates(...args),
  });
})(window);
