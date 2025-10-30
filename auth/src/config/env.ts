import { IAppConfig, NodeEnv } from "../types";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../.env") });

type EnvValue = string | undefined;

/**
 * Retrieves an environment variable, with validation and optional fallback.
 * @param key The environment variable key.
 * @param required If true, throws an error if the value is null/undefined.
 * @param fallback A default value to use if the key is not set.
 * @returns The string value of the environment variable.
 */
const getEnv = (key: string, required: boolean, fallback: string): string => {
  const value: EnvValue = process.env[key] ?? fallback;

  if (required && !value) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }

  // If not required and value is null/undefined, return an empty string or undefined based on need
  // Your current usage relies on 'value!' so we stick to string return for simplicity
  return value ?? "";
};

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `FATAL: Environment variable ${key} is required but not set.`,
    );
  }
  return value;
};

// Overload 1: For calls WITHOUT a fallback (returns string | undefined)
function getOptionalEnv(key: string): string | undefined;

// Overload 2: For calls WITH a string fallback (returns guaranteed string)
function getOptionalEnv(key: string, fallback: string): string;

// Implementation:
function getOptionalEnv(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

const getAsInt = (key: string, fallback?: number): number => {
  const value = process.env[key];
  if (value && !isNaN(parseInt(value, 10))) {
    return parseInt(value, 10);
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(
    `FATAL: Environment variable ${key} is required and must be a number.`,
  );
};

export const envs: IAppConfig = {
  // --- General Settings ---
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  node_env: getOptionalEnv("NODE_ENV", "development") as NodeEnv,
  port: getAsInt("PORT", 5002),
  database_url: getRequiredEnv("DATABASE_URL"),
  redis_url: getRequiredEnv("REDIS_URL"),

  // // --- Authentication ---
  // bcrypt_salt_rounds: getAsInt("BCRYPT_SALT_ROUNDS", 10),
  // default_password: getRequiredEnv("DEFAULT_PASSWORD"),

  // jwt_access_secret_key: getRequiredEnv("JWT_ACCESS_SECRET_KEY"),
  // jwt_refresh_secret_key: getRequiredEnv("JWT_REFRESH_SECRET_KEY"),
  // // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  // jwt_access_expires_in: getOptionalEnv("JWT_ACCESS_EXPIRES", "15m") as string,
  // // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  // jwt_refresh_expires_in: getOptionalEnv("JWT_REFRESH_EXPIRES", "7d") as string,
};
