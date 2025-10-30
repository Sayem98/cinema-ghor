export type NodeEnv = "development" | "production";

export type IAppConfig = {
  node_env: NodeEnv;
  port: number;
  database_url: string;
  redis_url: string;
  // bcrypt_salt_rounds: number;
  // default_password: string;

  // // JWT
  // jwt_access_secret_key: string;
  // jwt_refresh_secret_key: string;
  // jwt_access_expires_in: string;
  // jwt_refresh_expires_in: string;
};
