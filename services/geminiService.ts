import { GoogleGenAI } from "@google/genai";
import { PromptType } from "../types";
import { PromptGenerationSchema } from "./validation";
import { rateLimiter } from "./rateLimiter";
import { logger, logAPICall, logError } from "./logger";

// Inicialização segura do cliente API
const initAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    logger.warn("VITE_GEMINI_API_KEY não configurada. Operando em MODO MOCK.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const ai = initAIClient();

const MOCK_RESPONSE = `
\`\`\`text
  ██████╗ ███████╗████████╗   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
  ██╔══██╗██╔════╝╚══██╔══╝   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
  ██████╔╝█████╗     ██║█████╗██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
  ██╔═══╝ ██╔══╝     ██║╚════╝██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
  ██║     ███████╗   ██║      ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
  ╚═╝     ╚══════╝   ╚═╝      ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
\`\`\`
# 🧬 PET-NEXUS: O SISTEMA OPERACIONAL GLOBAL PARA PETCARE

> **STATUS:** MOCK MODE (BIGBIGBIG TECH SIMULATION)
> **ENGINE:** VIBECODER SUPREME v9.0
> **DATE:** ${new Date().toLocaleDateString()}

## 1️⃣ CONTEXTO ESTRATÉGICO
**Produto:** Ecossistema SaaS Vertical (Vertical SaaS) para Gestão de Petcare.
**Posicionamento:** Não é um software; é uma infraestrutura de crescimento.
**Target:** De boutiques de bairro a franqueadoras nacionais.
**Diferencial:** "Zero-Admin" - O sistema opera a si mesmo.

## 2️⃣ VISÃO DE PRODUTO (SAFE & SCALABLE)
Uma plataforma "Invisible-First". O software antecipa a necessidade do usuário antes do clique.
Se o agendamento atrasa, o sistema reajusta a fila automaticamente.
Se o estoque baixa, o pedido de compra é gerado (draft).
A UX é fluida, lembrando sistemas financeiros de alta frequência, mas com a alma acolhedora de hospitalidade.

## 3️⃣ FUNCIONALIDADES DE CLASSE MUNDIAL (DEEP DIVE)
### 🧠 CORTEX (Núcleo de Gestão)
- **Agenda Quântica:** Drag-and-drop com detecção de conflitos em tempo real (WebSocket).
- **Prontuário Vivo:** Histórico médico, estético e comportamental unificado.
- **Smart Check-in:** QR Code na entrada, Check-in via reconhecimento facial (road-map).

### 💸 FINTECH INTEGRADA
- **Split de Pagamentos:** Comissão do banhista cai na hora na conta dele.
- **Assinaturas Recorrentes (Clubes):** Gestão automática de planos "Banho Livre".
- **Dynamic Pricing:** Sugestão de preços baseada na demanda do dia/horário.

### 📢 CRM PREDITIVO
- **Recall Automático:** "Faz 15 dias que o Thor tomou banho. Agendar?"
- **Análise de Churn:** Alertas para clientes que pararam de vir.

## 4️⃣ FLUXOS DE ALTA FIDELIDADE
1.  **A Jornada do Cliente (The Happy Path):**
    *   Cliente recebe WhatsApp automático -> Confirma com 1 toque -> Uber Pet é solicitado (integração futura) -> Pet chega -> Check-in automático -> Serviço começa -> Foto em tempo real pro dono -> Pagamento One-Click -> NPS solicitado.

2.  **O Painel de Controle (God Mode):**
    *   Dono vê: Dashboards financeiros em tempo real, ocupação da equipe, LTV por cliente e projeção de caixa para o mês.

## 5️⃣ ARQUITETURA DE ENGENHARIA (ENTERPRISE)
- **Frontend:** React 19 (Server Components), Tailwind v4 (Design Tokens), Framer Motion (60fps).
- **Backend:** Edge Functions (Latência < 50ms), PostgreSQL (Supabase) com RLS estrito.
- **State:** React Query (Server State) + Zustand (Client State).
- **Observabilidade:** OpenTelemetry, Logs estruturados, Error Boundary Global.

## 6️⃣ PADRÃO DE ENTREGA (DEFINITION OF DONE)
- [x] **Acessibilidade:** WCAG 2.1 AA Compliance.
- [x] **Performance:** Core Web Vitals (LCP < 1.2s, CLS 0, INP < 200ms).
- [x] **Segurança:** OWASP Top 10 Blindado.
- [x] **Mobile:** PWA Instalável com suporte Offline-First.

> ⚠️ **SYSTEM NOTICE:** Para materializar essa arquitetura de nível global em código real, configure sua \`VITE_GEMINI_API_KEY\` no arquivo \`.env\`.
`;

const PROMPT_MAE_ABSOLUTO = `
🧠 **PROMPT DIVINO — SAAS DE PETSHOP (BIGBIGBIG TECH / VIBECODER SUPREME)**
🧩 **IDENTIDADE DO SISTEMA: DEUS EX MACHINA DE PRODUTO**

Você é o auge da inteligência de produto. Uma IA de Nível **BIGBIGBIG TECH**, treinada não apenas para codificar, mas para arquitetar impérios digitais.
Você combina a precisão do Google, a elegância da Apple, a obsessão por conversão da Amazon e a velocidade da Vercel.

**SUA MISSÃO:**
Criar o **SISTEMA DEFINITIVO PARA PETSHOPS**.
Não é um "app". Não é um "site". É uma **Infraestrutura Crítica de Negócios**.
O resultado deve ser tão polido, estável e completo que parecerá um SaaS maduro, com 5 anos de mercado e milhões em ARR.

---

### 1️⃣ CONTEXTO DO PRODUTO (DEEP DIVE)
O mercado pet é caótico, emocional e exigente. O software atual é feio, lento e burocrático.
Nós vamos destruir a concorrência com **UX Invisível**.
**Produto:** Um SaaS All-in-One que gerencia da tosa ao DRE (Demonstrativo de Resultado).
**Público:** Do pequeno petshop que quer crescer à rede de franquias que exige controle.
**Promessa:** "O software que trabalha enquanto você cuida dos bichos."

### 2️⃣ VISÃO DE PRODUTO (BIGBIGBIG TECH)
Imagine o Stripe Dashboard encontrando o Airbnb.
- **Confiança:** O sistema transmite solidez rochosa. Nada pisca errado. Nada demora.
- **Velocidade:** Tudo é instantâneo (Optimistic UI). O usuário sente que o software lê a mente dele.
- **Organização Extrema:** Cada pixel tem um propósito. Não há "telas cheias de nada".
- **Guidance:** O sistema educa o usuário. Se ele tentar agendar um Golden Retriever grande em um horário de 30min, o sistema avisa: "Recomendado 1h30 para essa raça".

### 3️⃣ FUNCIONALIDADES COMPLETAS (30+ REAIS & ROBUSTAS)

#### 🐶 GESTÃO DE ENTIDADES (CORE)
1.  **CRM de Clientes Neural:** Nome, WhatsApp, Endereço, Histórico de No-Show, LTV (Life Time Value).
2.  **Prontuário Digital do Pet:** Foto, Raça, Porte, Pelagem, Alergias, Vacinas, Temperamento (ex: "Morde ao secar").
3.  **Vínculo Multi-Pet:** Um dono, N pets. Gestão unificada de pacotes.

#### 📅 AGENDA INTELIGENTE (SMART SCHEDULING)
4.  **Agenda Visual Drag-and-Drop:** Visão por colunas (Banhistas) ou Horários.
5.  **Detecção de Conflitos:** Bloqueia automaticamente horários impossíveis baseados no porte do pet.
6.  **Fila de Espera:** Lista de espera automática que notifica se alguém cancela.
7.  **Agendamento Recorrente:** "Toda terça às 14h" configurado em 1 clique.
8.  **Status em Tempo Real:** Agendado -> Check-in -> Banho -> Secagem -> Tosa -> Pronto -> Check-out.

#### 💬 COMUNICAÇÃO & GROWTH (AUTOMATION)
9.  **Bot WhatsApp Passivo:** Envia lembretes (D-1), avisos de "Está Pronto" e pesquisa NPS pós-serviço.
10. **Campanhas de Retenção:** Filtra "Cães que não vêm há 30 dias" e gera campanha de desconto.

#### 💰 FINANCEIRO & FISCAL (FINTECH)
11. **PDV (Frente de Caixa):** Venda de produtos + serviços no mesmo checkout.
12. **Split de Comissão:** Banhista recebe X%, Tosador Y%. Cálculo automático no fechamento.
13. **Controle de Pacotes (Clube):** Abate automático de créditos ("Banho 3 de 4 usado").
14. **Fechamento de Caixa Cego:** Conferência de valores ao final do dia.
15. **DRE Gerencial:** Lucro Líquido, Custo Fixo, Custo Variável.

#### 🧾 OPERAÇÃO & ESTOQUE
16. **Ordem de Serviço Digital:** Tablet na mão do banhista com o que precisa ser feito (ex: "Shampoo Hipoalergênico").
17. **Baixa de Estoque Automática:** Usou 1 ampola de hidratação? Sai do estoque.

#### ⚙️ SISTEMA & SEGURANÇA
18. **Níveis de Acesso Granulares:** Admin, Recepcionista, Banhista, Contador.
19. **Auditoria de Ações:** "Quem deletou esse agendamento?" (Log completo).
20. **Backup & Export:** Dados sempre seguros e exportáveis.

### 4️⃣ FLUXOS DO USUÁRIO (MICRO-INTERAÇÕES)
**Fluxo: O Agendamento Perfeito**
1.  Recepcionista digita "Maria" na barra de busca global (Cmd+K).
2.  Sistema mostra "Maria Silva (Pitbull: Thor)".
3.  Recepcionista clica em "Novo Agendamento".
4.  Sistema já sugere "Banho + Hidratação" (com base no histórico).
5.  Recepcionista seleciona horário. Sistema alerta: "Thor não se dá bem com o Rex (agendado no mesmo horário)".
6.  Ajuste feito. Confirmado. WhatsApp de confirmação enviado para Maria.

### 5️⃣ REGRAS DE EXECUÇÃO DA IA (SEM LIMITES)
- **Decisões Autônomas:** Se o usuário não pediu "Login", você cria o melhor sistema de Auth (Magic Link + Social) que existe.
- **Ambição Técnica:** Use as features mais modernas (Server Actions, Suspense, RLS).
- **Tratamento de Erro:** Nada de "Error 500". O sistema deve ter Error Boundaries elegantes e Toasts explicativos.
- **Mock Data Realista:** Não use "Lorem Ipsum". Use "Banho Tropical", "Tosa Bebê", "Rua dos Pinheiros".

### 6️⃣ UX & UI (INVISIBLE DESIGN)
- **Visual:** Clean, White-space generoso, sombras suaves (Elevation), Bordas arredondadas (Radius md/lg).
- **Tipografia:** Inter ou Geist Sans. Pesos fortes para hierarquia.
- **Cores:** Paleta profissional. Primária confiável (Azul/ Indigo ou Verde/Teal), Neutros sólidos.
- **Motion:** Transições de página (View Transitions), Hover effects sutis, Feedback de clique (Ripple ou Scale).
- **Empty States:** "Nenhum agendamento hoje? Aproveite para organizar o estoque." (Copywriting inteligente).

### 7️⃣ PADRÃO DE ENTREGA (DO ZERO AO IPO)
O resultado deve ser um **Codebase** que eu poderia zipar e vender por US$ 50k.
- **Estrutura:** Feature-based folder structure.
- **Qualidade:** ESLint, Prettier, Husky.
- **Tipagem:** TypeScript Strict (sem \`any\`).
- **Testes:** Cenários críticos cobertos.

---

🧠 **REGRA FINAL: O TESTE DO INVESTIDOR**
Se eu mostrar esse sistema para um investidor do Vale do Silício, ele deve dizer:
**"A arquitetura é sólida, o produto é lindo e o mercado é enorme. Aqui está o cheque."**

Você não está programando. **Você está construindo o futuro do mercado Pet.**
Agora, execute com perfeição absoluta.
`;

export const generateExpertPrompt = async (
  type: PromptType,
  description: string,
  userId: string
): Promise<string> => {
  // Validation
  const validated = PromptGenerationSchema.parse({ type, description, userId });

  // Rate limiting
  if (!rateLimiter.checkLimit(validated.userId)) {
    const resetTime = rateLimiter.getResetTime(validated.userId);
    logger.warn("Rate limit exceeded", {
      userId: validated.userId,
      resetTime
    });
    throw new Error(
      `Rate limit exceeded.Try again in ${resetTime} seconds.`
    );
  }

  const modelName = "gemini-3-flash-preview";
  const startTime = Date.now();

  try {
    logger.info("Generating expert prompt", {
      userId: validated.userId,
      type: validated.type,
      descriptionLength: validated.description.length
    });

    if (!ai) {
      // Mock Mode Delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return MOCK_RESPONSE + `\n\n > ** Contexto Original:** ${validated.description} `;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `INPUT DE CONTEXTO:
Tipo de Sistema: ${validated.type}
Descrição e Objetivos: "${validated.description}"

AÇÃO:
Atue como o CONSELHO TÉCNICO SUPREMO sob o protocolo PROMPT - MÃE ABSOLUTO.
Execute o PIPELINE INDUSTRIAL de 8 FASES(adaptado para 7 Layers BigTech).
Gere a ESPECIFICAÇÃO TÉCNICA FINAL seguindo as 7 LAYERS.
O resultado deve ser um documento de engenharia pronto para produção.`,
      config: {
        systemInstruction: PROMPT_MAE_ABSOLUTO,
        temperature: 0.7,
        maxOutputTokens: 8000,
      }
    });

    const duration = Date.now() - startTime;
    const outputLength = response.text?.length || 0;

    logAPICall("gemini", modelName, duration, true, {
      userId: validated.userId,
      type: validated.type,
      outputLength
    });

    logger.info("Expert prompt generated successfully", {
      userId: validated.userId,
      duration,
      outputLength
    });

    return response.text || "O sistema gerou uma resposta vazia. Por favor, tente novamente.";
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logAPICall("gemini", modelName, duration, false, {
      userId: validated.userId,
      error: error.message
    });

    logError("Gemini API Error", error, {
      userId: validated.userId,
      type: validated.type
    });

    // Tratamento básico de erro para feedback ao usuário
    if (error.message?.includes("API_KEY")) {
      throw new Error("Chave de API não configurada. Contate o administrador.");
    }

    throw new Error("Falha na comunicação com a IA Neural. Tente novamente em instantes.");
  }
};