(function initializeSupabaseRepository(global) {
  const SUPABASE_SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm";

  function isUnsafeBrowserKey(key) {
    if (!key) return false;
    if (key.startsWith("sb_secret_")) return true;

    try {
      const segment = key.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
      const padded = segment.padEnd(Math.ceil(segment.length / 4) * 4, "=");
      const payload = JSON.parse(atob(padded));
      return payload.role === "service_role";
    } catch {
      return false;
    }
  }

  class SupabaseRepository {
    constructor(config) {
      this.url = String(config.SUPABASE_URL || "").trim();
      this.publishableKey = String(config.SUPABASE_PUBLISHABLE_KEY || "").trim();
      this.client = null;
      this.clientPromise = null;
    }

    configurationError() {
      if (!this.url || !this.publishableKey) {
        return "Supabase URLとPublishable Keyを設定してください。";
      }
      if (isUnsafeBrowserKey(this.publishableKey)) {
        return "Secret Keyまたはservice_role keyはブラウザで使用できません。";
      }
      return null;
    }

    async getClient() {
      const error = this.configurationError();
      if (error) throw new Error(error);
      if (this.client) return this.client;
      if (this.clientPromise) return this.clientPromise;

      this.clientPromise = import(SUPABASE_SDK_URL)
        .then(({ createClient }) => {
          this.client = createClient(this.url, this.publishableKey, {
            auth: { persistSession: true, autoRefreshToken: true },
          });
          return this.client;
        })
        .catch((loadError) => {
          this.clientPromise = null;
          throw loadError;
        });
      return this.clientPromise;
    }

    async loadWorkers() {
      const client = await this.getClient();
      const { data, error } = await client
        .from("workers")
        .select("id, name, is_visible, sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        visible: row.is_visible,
      }));
    }

    async createWorker(person, sortOrder) {
      const client = await this.getClient();
      const { data, error } = await client
        .from("workers")
        .insert({
          id: person.id,
          name: person.name,
          is_visible: person.visible !== false,
          sort_order: sortOrder,
        })
        .select("id, name, is_visible, sort_order")
        .single();
      if (error) throw error;
      return data;
    }

    async updateWorker(person) {
      const client = await this.getClient();
      const { error } = await client
        .from("workers")
        .update({ name: person.name, is_visible: person.visible !== false })
        .eq("id", person.id);
      if (error) throw error;
    }

    async deleteWorker(personId) {
      const client = await this.getClient();
      const { error } = await client.from("workers").delete().eq("id", personId);
      if (error) throw error;
    }

    async updateWorkerOrder(people) {
      const client = await this.getClient();
      const results = await Promise.all(
        people.map((person, index) =>
          client.from("workers").update({ sort_order: index }).eq("id", person.id),
        ),
      );
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
    }

    async upsertWorkers(people) {
      if (people.length === 0) return;
      const client = await this.getClient();
      const rows = people.map((person, index) => ({
        id: person.id,
        name: person.name,
        is_visible: person.visible !== false,
        sort_order: index,
      }));
      const { error } = await client.from("workers").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }

    async loadWorkTemplates() {
      const client = await this.getClient();
      const { data, error } = await client
        .from("work_templates")
        .select("id, label, sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => row.label);
    }

    async createWorkTemplate(label, sortOrder) {
      const client = await this.getClient();
      const { error } = await client
        .from("work_templates")
        .insert({ label, sort_order: sortOrder });
      if (error) throw error;
    }

    async deleteWorkTemplate(label) {
      const client = await this.getClient();
      const { error } = await client.from("work_templates").delete().eq("label", label);
      if (error) throw error;
    }

    async updateWorkTemplateOrder(labels) {
      const client = await this.getClient();
      const results = await Promise.all(
        labels.map((label, index) =>
          client.from("work_templates").update({ sort_order: index }).eq("label", label),
        ),
      );
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
    }

    async loadInitialBoardData() {
      const [people, workTemplates] = await Promise.all([
        this.loadWorkers(),
        this.loadWorkTemplates(),
      ]);
      return { people, workTemplates, cards: [] };
    }
  }

  global.SupabaseRepository = SupabaseRepository;
})(window);
