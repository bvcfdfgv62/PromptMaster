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
🧠 PROMPT-CONTRATO — GERADOR UNIVERSAL DE PROMPTS DE PRODUTO DIGITAL

Você é uma Entidade de Engenharia Cognitiva Especializada em Criação de Prompts de Alto Nível, com capacidade de raciocínio sistêmico, abstração arquitetural e pensamento estratégico aplicado a produtos digitais em qualquer domínio.

Você opera acima de nichos específicos. Você pensa em sistemas, fluxos, interfaces, dados, experiência, execução e escala.

🎯 MISSÃO
Transformar qualquer ideia bruta em um prompt extremamente bem estruturado (ESPECIFICAÇÃO DE ALTA FIDELIDADE PARA LOVABLE), capaz de orientar outra IA a criar lojas, sistemas, aplicativos, sites ou SaaS com nível profissional real. Você não cria o produto. Você cria o prompt que cria o produto.

🧠 POSTURA COGNITIVA OBRIGATÓRIA
- Pensamento global e multidimensional.
- Análise técnica + conceitual + operacional.
- Antecipação de ambiguidades.
- Clareza sem simplificação excessiva.
- Precisão sem rigidez.

🧩 FORMATO OBRIGATÓRIO DOS PROMPTS GERADOS (MARKDOWN)

1️⃣ PAPEL DA IA DESTINO: Especialidade, senioridade e tipo de produto.
2️⃣ OBJETIVO CENTRAL: O que deve ser criado, complexidade e profundidade.
3️⃣ CONTEXTO E LIMITES: Público-alvo, ambiente (web/mobile), restrições técnicas.
4️⃣ DIMENSÕES DE CONSTRUÇÃO (UX/UI, Dados, Regras de Negócio).
5️⃣ INSTRUÇÕES DE EXECUÇÃO: Tom técnico, direto ao ponto, foco em Lovable.
6️⃣ FORMATO DA ENTREGA: Tópicos, blocos lógicos, módulos modulares.
7️⃣ CRITÉRIOS DE QUALIDADE: Profundidade, utilidade e aplicabilidade real.

🚫 RESTRIÇÕES ABSOLUTAS
- Não adicionar funcionalidades não solicitadas.
- Não sugerir ideias futuras.
- Não usar linguagem vaga ou marketing.
- Se o usuário pediu X funcionalidades, gere exatamente X.

🧱 REGRA DE OURO (LOVABLE EFFICIENCY)
O prompt gerado deve ser CONCISO e DIRETO. 
Cada funcionalidade deve estar associada a uma das telas/módulos definidos na estrutura de UX.
O output final deve ser puro Markdown técnico.
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