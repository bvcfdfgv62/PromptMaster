export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Nota: Em produção real, senhas nunca trafegam em texto plano.
  credits: number;
  role: 'ADMIN' | 'USER';
}

export enum PromptType {
  WEBSITE = 'Site',
  SAAS = 'SaaS',
  SALES_COPY = 'Copy de Vendas',
  INSTAGRAM = 'Instagram',
  CHATBOT = 'Chatbot',
  OTHER = 'Outro'
}

export interface PromptEntry {
  id: string;
  userId: string;
  type: PromptType;
  description: string;
  result: string;
  timestamp: number;
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