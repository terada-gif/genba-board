import { writeFile } from "node:fs/promises";

const mode = process.env.BOARD_DATA_MODE === "supabase" ? "supabase" : "local";
const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_PUBLISHABLE_KEY || "";

function isServiceRoleKey(value) {
  if (value.startsWith("sb_secret_")) return true;
  try {
    const payload = value.split(".")[1].replaceAll("-", "+").replaceAll("_", "/");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.role === "service_role";
  } catch {
    return false;
  }
}

if (isServiceRoleKey(key)) {
  throw new Error("SUPABASE_PUBLISHABLE_KEY must not contain a Secret Key.");
}

if (mode === "supabase" && (!url || !key)) {
  throw new Error("Supabase mode requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");
}

const config = {
  BOARD_DATA_MODE: mode,
  SUPABASE_URL: url,
  SUPABASE_PUBLISHABLE_KEY: key,
};

const output = `window.RUNTIME_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)});\n`;
await writeFile(new URL("../runtime-config.js", import.meta.url), output, "utf8");
