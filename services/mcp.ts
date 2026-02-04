import { db } from "./db";
import { auth } from "./auth";

/**
 * MCP (Model Context Protocol) Layer
 * Encapsula funcionalidades do backend como "Ferramentas" padronizadas.
 */
export const mcp = {
    tools: {
        getUserProfile: async (userId: string) => {
            return await db.getUsers().then(users => users.find(u => u.id === userId));
        },

        generatePrompt: async (userId: string, type: string, prompt: string) => {
            // Aqui integraria com o Gemini, mas abstraído via MCP
            console.log(`[MCP] Generating ${type} for user ${userId}`);
        },

        getSystemStatus: async () => {
            return await db.getSystemMetrics();
        }
    },

    // Facilita o deploy eliminando verificações redundantes
    status: () => {
        return {
            database: "Supabase Cloud",
            auth: "Supabase Native",
            protocol: "MCP-Standard v1"
        };
    }
};
