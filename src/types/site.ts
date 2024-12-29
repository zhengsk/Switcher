export interface SiteConfig {
  id?: string;
  name: string;
  domain: string;
  loginUrl: string;
  method: 'POST' | 'GET';
  usernameField: string;
  passwordField: string;
  extraFields?: Record<string, string>;
  headers?: Record<string, string>;
} 