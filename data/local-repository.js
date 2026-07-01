(function initializeLocalRepository(global) {
  const STORAGE_KEYS = {
    cards: "morning-board-cards-v1",
    people: "morning-board-people-v1",
    suggestions: "morning-board-suggestions-v2",
    legacySuggestions: "morning-board-suggestions-v1",
    workTemplates: "morning-board-work-templates-v1",
  };

  class LocalRepository {
    loadPeople(defaultPeople) {
      const stored = localStorage.getItem(STORAGE_KEYS.people);
      if (!stored) return defaultPeople.map((person) => ({ ...person }));

      try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          return defaultPeople.map((person) => ({ ...person }));
        }

        return parsed.map((person, index) => ({
          id: person.id || crypto.randomUUID(),
          name: person.name || `作業者${index + 1}`,
          visible: person.visible !== false,
        }));
      } catch {
        return defaultPeople.map((person) => ({ ...person }));
      }
    }

    loadCards(seedCards, normalizeCard) {
      const stored = localStorage.getItem(STORAGE_KEYS.cards);
      if (!stored) return seedCards.map((card) => ({ ...card }));

      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed)
          ? parsed.map(normalizeCard)
          : seedCards.map((card) => normalizeCard({ ...card }));
      } catch {
        return seedCards.map((card) => normalizeCard({ ...card }));
      }
    }

    savePeople(people) {
      localStorage.setItem(STORAGE_KEYS.people, JSON.stringify(people));
    }

    saveCards(cards) {
      localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards));
    }

    loadSuggestions(fields, normalizeRecords) {
      const empty = Object.fromEntries(fields.map((field) => [field, []]));
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.suggestions) || "null");
        if (stored) {
          fields.forEach((field) => {
            empty[field] = normalizeRecords(stored[field] || []);
          });
          return empty;
        }

        const legacy = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacySuggestions) || "{}");
        empty.company = normalizeRecords(legacy.companies || []);
        empty.customer = normalizeRecords(legacy.customers || []);
        return empty;
      } catch {
        return empty;
      }
    }

    saveSuggestions(suggestions) {
      localStorage.setItem(STORAGE_KEYS.suggestions, JSON.stringify(suggestions));
    }

    loadWorkTemplates(defaultTemplates, normalizeTemplates) {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.workTemplates) || "null");
        if (Array.isArray(stored)) return normalizeTemplates(stored);
      } catch {
        // Use defaults when stored data cannot be read.
      }
      return [...defaultTemplates];
    }

    saveWorkTemplates(workTemplates) {
      localStorage.setItem(STORAGE_KEYS.workTemplates, JSON.stringify(workTemplates));
    }
  }

  global.LocalRepository = LocalRepository;
})(window);
