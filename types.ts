export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: 'ADMIN' | 'USER';
  created_at?: string;
}

export enum PromptType {
  WEBSITE = 'Site',
  SAAS = 'SaaS'
}

export interface PromptEntry {
  id: string;
  user_id: string;
  type: PromptType;
  prompt: string;
  output: string;
  timestamp: number | string;
}

// Interface para respostas da API (preparando para o Backend)
export interface SystemMetrics {
  totalUsers: number;
  totalCredits: number;
  totalPrompts: number;
  activeUsers: number;
}

export interface UserUpdateParams {
  name?: string;
  password?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}