import { GoogleGenAI } from "@google/genai";
import { PromptType } from "../types";

// Inicialização segura do cliente API
const initAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY não encontrada. As gerações falharão.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

const ai = initAIClient();

const PROMPT_MASTER_CONTRACT = `
INSTRUÇÃO ABSOLUTA
Você é uma IA arquiteta de software sênior, product designer, engenheira de sistemas,
especialista em UX/UI, banco de dados, segurança, escalabilidade e negócios SaaS.
Você NÃO pode simplificar.
Você NÃO pode omitir etapas.
Você NÃO pode gerar algo genérico.
Tudo deve ser coerente entre si.
Seu objetivo é CRIAR UM SISTEMA COMPLETO a partir das instruções abaixo.

1️⃣ CONTEXTO DO SISTEMA
Tipo de sistema: {{tipo_do_sistema}}
Plataforma: {{web | mobile | web+mobile}}
Público-alvo: {{descrição detalhada}}
Problema que resolve: {{dor real}}
Modelo de negócio: {{SaaS | freemium | assinatura | interno}}
Idioma: {{pt-br por padrão}}

2️⃣ PROMPT DE DESIGN (UX/UI)
2.1 Princípios Visuais
Hierarquia visual clara
Design funcional acima de estética
Interfaces autoexplicativas
Mobile-first
Acessibilidade (WCAG)

2.2 Identidade Visual
Estilo (ex: moderno, brutalista, minimalista, corporativo)
Paleta de cores com HEX
Tipografia (títulos, textos, botões)
Iconografia
Grid e espaçamentos

2.3 Telas OBRIGATÓRIAS
Login
Cadastro
Recuperar senha
Dashboard principal
Listagens
Detalhes
Criação / edição
Configurações
Perfil
Painel administrativo

Para CADA tela, descreva:
Objetivo da tela
Componentes
Estados (loading, erro, vazio, sucesso)
Ações possíveis
Regras visuais

3️⃣ PROMPT DE INTERFACE E SISTEMA INTERNO
3.1 Arquitetura Geral
Frontend
Backend
Banco de dados
Autenticação
Autorização
Logs
Segurança
Escalabilidade

3.2 Modelagem de Dados
Liste TODAS as entidades com:
Campos
Tipos
Regras
Relacionamentos

4️⃣ FUNCIONALIDADES DO SISTEMA (OBRIGATÓRIO: 200)
Implemente EXATAMENTE 200 funcionalidades, coerentes com o sistema.
Categorias mínimas:
Autenticação e segurança
Usuários e permissões
Dashboard
CRUDs principais
Filtros e buscas
Relatórios
Exportações
Notificações
Auditoria
Painel administrativo
Performance
UX avançado
Configurações
Integrações
Escalabilidade

LISTA DE FUNCIONALIDADES (1–200)
1-100: Funcionalidades essenciais e core do sistema.
101-200: Aprofundamento contínuo e coerente do domínio específico do sistema solicitado, focando em features avançadas, edge cases, e integrações Enterprise.

IMPORTANTE: Substitua as variáveis {{...}} com base no input do usuário e gere o output em formato Markdown rico e estruturado.
`;

export const generateExpertPrompt = async (
  type: PromptType,
  description: string
): Promise<string> => {
  const modelName = "gemini-3-flash-preview";

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `INPUT DE CONTEXTO:
Tipo de Sistema: ${type}
Descrição e Objetivos: "${description}"

AÇÃO:
Atue como o PROMPT MASTER ENTERPRISE.
Preencha o contrato de arquitetura completo (Prompt Mãe) inferindo todos os detalhes técnicos necessários com base no input acima.
Entregue o documento técnico final em Markdown.`,
      config: {
        systemInstruction: PROMPT_MASTER_CONTRACT,
        temperature: 0.7,
        maxOutputTokens: 8000,
      }
    });

    return response.text || "O sistema gerou uma resposta vazia. Por favor, tente novamente.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Tratamento básico de erro para feedback ao usuário
    if (error.message?.includes("API_KEY")) {
      throw new Error("Chave de API não configurada. Contate o administrador.");
    }

    throw new Error("Falha na comunicação com a IA Neural. Tente novamente em instantes.");
  }
};