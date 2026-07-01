(function initializeSupabaseRepository(global) {
  const SUPABASE_SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm";
  const JOB_COLUMNS = [
    "id",
    "assignee_id",
    "status",
    "company",
    "plate_suffix",
    "car_name",
    "work_content",
    "customer_name",
    "sort_order",
    "completed_at",
    "created_at",
    "updated_at",
  ].join(", ");

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

  function mapJobRow(row) {
    return {
      id: row.id,
      assigneeId: row.assignee_id,
      status: row.status,
      company: row.company,
      plate: row.plate_suffix,
      car: row.car_name,
      work: row.work_content,
      customer: row.customer_name,
      order: row.sort_order,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      imageData: null,
    };
  }

  function mapJobToRow(card) {
    return {
      id: card.id,
      assignee_id: card.assigneeId,
      status: card.status,
      company: card.company,
      plate_suffix: card.plate,
      car_name: card.car,
      work_content: card.work,
      customer_name: card.customer,
      sort_order: card.order,
      completed_at: card.completedAt || null,
    };
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

    async loadJobs() {
      const client = await this.getClient();
      const { data, error } = await client
        .from("jobs")
        .select(JOB_COLUMNS)
        .neq("status", "done")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapJobRow);
    }

    async loadCompletedJobs(days = 30) {
      const client = await this.getClient();
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await client
        .from("jobs")
        .select(JOB_COLUMNS)
        .eq("status", "done")
        .gte("completed_at", cutoff)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapJobRow);
    }

    async createJob(card) {
      const client = await this.getClient();
      const { data, error } = await client
        .from("jobs")
        .insert(mapJobToRow(card))
        .select(JOB_COLUMNS)
        .single();
      if (error) throw error;
      return mapJobRow(data);
    }

    async updateJob(card) {
      const client = await this.getClient();
      const row = mapJobToRow(card);
      delete row.id;
      const { error } = await client.from("jobs").update(row).eq("id", card.id);
      if (error) throw error;
    }

    async deleteJob(cardId) {
      const client = await this.getClient();
      const { error } = await client.from("jobs").delete().eq("id", cardId);
      if (error) throw error;
    }

    async updateJobOrder(cards) {
      const activeCards = cards.filter((card) => card.status !== "done");
      const client = await this.getClient();
      const results = await Promise.all(
        activeCards.map((card) =>
          client
            .from("jobs")
            .update({ assignee_id: card.assigneeId, sort_order: card.order })
            .eq("id", card.id),
        ),
      );
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
    }

    async subscribeToChanges(onChange, onStatus) {
      const client = await this.getClient();
      let channel = client.channel("digital-whiteboard-v1");
      ["workers", "jobs", "work_templates"].forEach((table) => {
        channel = channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => onChange(payload),
        );
      });
      return channel.subscribe((status, error) => onStatus(status, error));
    }

    async unsubscribeFromChanges(channel) {
      if (!channel) return;
      const client = await this.getClient();
      await client.removeChannel(channel);
    }

    async loadInitialBoardData() {
      const [people, workTemplates, activeJobs, completedJobs] = await Promise.all([
        this.loadWorkers(),
        this.loadWorkTemplates(),
        this.loadJobs(),
        this.loadCompletedJobs(),
      ]);
      return { people, workTemplates, cards: [...activeJobs, ...completedJobs] };
    }
  }

  global.SupabaseRepository = SupabaseRepository;
})(window);
