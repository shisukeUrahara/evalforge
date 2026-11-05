import { loadEnv } from "@/core/env";

/** Folder with data/, runs/, fixtures/ (EF_DATA_DIR in Docker, the checkout otherwise). Pages call this after `await connection()`. */
export const dataDir = () => loadEnv(process.env).dataDir;

/** One value of a search param, or undefined. */
export const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
