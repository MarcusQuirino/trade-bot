import type { Config } from '../types/config';
import { validateEnv } from './env';

export const config: Config = validateEnv(); 