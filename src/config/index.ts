import type { Env } from "../types/config";
import { validateEnv } from "./env";

export const config: Env = validateEnv();
