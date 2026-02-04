import { User, PromptEntry, SystemMetrics, UserUpdateParams } from "../types";
import { supabase } from "./supabase";
import { UUIDSchema, CreditUpdateSchema, UserUpdateSchema, PromptEntrySchema } from "./validation";
import { logger, logUserAction, logError } from "./logger";

if (!supabase) {
  throw new Error("Supabase client is not initialized. Please check your environment variables.");
}

export const db = {
  init: async () => {
    logger.info("Enterprise Mode: Supabase Engine Active ✅");
  },

  // --- User Services ---

  getUsers: async (): Promise<User[]> => {
    try {
      logger.debug("Fetching all users");
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      logger.info("Users fetched successfully", { count: data?.length || 0 });
      return (data || []) as User[];
    } catch (error: any) {
      logError("Failed to fetch users", error);
      throw error;
    }
  },

  getUserByEmail: async (email: string): Promise<User | undefined> => {
    try {
      logger.debug("Fetching user by email", { email });
      const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (error) throw error;

      if (data) {
        logger.info("User found", { userId: data.id, email });
      } else {
        logger.debug("User not found", { email });
      }

      return data || undefined;
    } catch (error: any) {
      logError("Failed to fetch user by email", error, { email });
      throw error;
    }
  },

  updateUserCredits: async (id: string, amount: number): Promise<User> => {
    // Validation
    const validated = CreditUpdateSchema.parse({ id, amount });

    try {
      logger.info("Updating user credits", { userId: validated.id, amount: validated.amount });

      const { data: user } = await supabase.from('users').select('credits').eq('id', validated.id).single();
      const currentBalance = user?.credits || 0;
      const newBalance = currentBalance + validated.amount;

      if (newBalance < 0) {
        logger.warn("Insufficient credits", { userId: validated.id, currentBalance, requestedAmount: validated.amount });
        throw new Error("Saldo insuficiente.");
      }

      const { data, error } = await supabase.from('users').update({ credits: newBalance }).eq('id', validated.id).select().single();
      if (error) throw error;

      logUserAction("Credits updated", validated.id, {
        previousBalance: currentBalance,
        newBalance,
        change: validated.amount
      });

      return data as User;
    } catch (error: any) {
      logError("Failed to update user credits", error, { userId: validated.id, amount: validated.amount });
      throw error;
    }
  },

  savePromptHistory: async (entry: Omit<PromptEntry, "id" | "timestamp">): Promise<PromptEntry> => {
    // Validation (partial schema without id and timestamp)
    const partialSchema = PromptEntrySchema.omit({ id: true, timestamp: true });
    const validated = partialSchema.parse(entry);

    try {
      logger.info("Saving prompt history", { userId: validated.user_id, type: validated.type });

      const { data, error } = await supabase.from('prompt_history').insert({
        user_id: validated.user_id,
        type: validated.type,
        prompt: validated.prompt,
        output: validated.output
      }).select().single();

      if (error) throw error;

      logUserAction("Prompt history saved", validated.user_id, {
        promptId: data.id,
        type: validated.type,
        promptLength: validated.prompt.length,
        outputLength: validated.output.length
      });

      return data as PromptEntry;
    } catch (error: any) {
      logError("Failed to save prompt history", error, { userId: validated.user_id });
      throw error;
    }
  },

  getUserHistory: async (userId: string): Promise<PromptEntry[]> => {
    // Validation
    const validatedId = UUIDSchema.parse(userId);

    try {
      logger.debug("Fetching user history", { userId: validatedId });

      const { data, error } = await supabase.from('prompt_history').select('*').eq('user_id', validatedId).order('timestamp', { ascending: false });
      if (error) throw error;

      logger.info("User history fetched", { userId: validatedId, count: data?.length || 0 });
      return (data || []) as PromptEntry[];
    } catch (error: any) {
      logError("Failed to fetch user history", error, { userId });
      throw error;
    }
  },

  updateUserProfile: async (id: string, updates: UserUpdateParams): Promise<User> => {
    // Validation
    const validatedId = UUIDSchema.parse(id);
    const validatedUpdates = UserUpdateSchema.parse(updates);

    try {
      logger.info("Updating user profile", { userId: validatedId, fields: Object.keys(validatedUpdates) });

      const dbUpdates: any = {};
      if (validatedUpdates.name) dbUpdates.name = validatedUpdates.name;

      const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', validatedId).select().single();
      if (error) throw error;

      logUserAction("Profile updated", validatedId, { updatedFields: Object.keys(dbUpdates) });

      return data as User;
    } catch (error: any) {
      logError("Failed to update user profile", error, { userId: id });
      throw error;
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    // Validation
    const validatedId = UUIDSchema.parse(id);

    try {
      logger.warn("Deleting user (HARD DELETE)", { userId: validatedId });

      const { error } = await supabase.from('users').delete().eq('id', validatedId);
      if (error) throw error;

      logUserAction("User deleted", validatedId, { action: "hard_delete" });
    } catch (error: any) {
      logError("Failed to delete user", error, { userId: id });
      throw error;
    }
  },

  getSystemMetrics: async (): Promise<SystemMetrics> => {
    try {
      logger.debug("Fetching system metrics");

      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'ADMIN');
      const { count: promptsCount } = await supabase.from('prompt_history').select('*', { count: 'exact', head: true });
      const { data: creditsData } = await supabase.from('users').select('credits').neq('role', 'ADMIN');

      const metrics = {
        totalUsers: usersCount || 0,
        totalCredits: creditsData?.reduce((acc, curr) => acc + curr.credits, 0) || 0,
        totalPrompts: promptsCount || 0,
        activeUsers: usersCount || 0
      };

      logger.info("System metrics fetched", metrics);

      return metrics;
    } catch (error: any) {
      logError("Failed to fetch system metrics", error);
      throw error;
    }
  }
};