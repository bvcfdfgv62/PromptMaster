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
Você é uma IA arquiteta de software sênior, product designer e engenheira de sistemas.
Sua missão é gerar uma ESPECIFICAÇÃO TÉCNICA DE ALTA FIDELIDADE para o Lovable.
O output deve ser direto, técnico e sem introduções ou conclusões desnecessárias.

1️⃣ CONTEXTO DO SISTEMA
{{tipo_do_sistema}} | {{web | mobile | web+mobile}}
Público-alvo: {{descrição}}
Problema: {{dor real}}
Modelo: {{SaaS | freemium | assinatura | interno}}

2️⃣ DESIGN & UX/UI (ESTILO: {{moderno | minimalista | etc}})
2.1 Identidade: Paleta HEX, Tipografia e Iconografia.
2.2 Telas do MVP:
Listing das telas fundamentais (Login, Dashboard, Core modules).
Para CADA tela, defina: Objetivo e Componentes Principais.

3️⃣ ARQUITETURA INTERNA & DADOS
3.1 Stack: Sugira a melhor stack moderna (ex: React, Supabase, Tailwind).
3.2 Modelagem: Entidades, Campos principais e Relacionamentos.

4️⃣ FUNCIONALIDADES CONECTADAS
Implemente APENAS as funcionalidades necessárias para o MVP solicitado. 
IMPORTANTE: Se o usuário pediu um número específico (ex: "10 funções"), siga EXATAMENTE esse número.
REGRA DE OURO: Cada funcionalidade DEVE estar associada a uma das telas definidas no item 2.2.

Formato:
- [Nome da Funcionalidade]: [Descrição concisa]. [Tela Relacionada]
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