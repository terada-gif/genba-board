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
  }

  global.SupabaseRepository = SupabaseRepository;
})(window);
