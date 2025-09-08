import { db } from '../db';
import { interactionsTable } from '../db/schema';
import { type Interaction } from '../schema';
import { eq } from 'drizzle-orm';

export const getInteraction = async (id: number): Promise<Interaction | null> => {
  try {
    const results = await db.select()
      .from(interactionsTable)
      .where(eq(interactionsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const interaction = results[0];
    return {
      ...interaction,
      // No numeric conversions needed - all fields are already proper types
    };
  } catch (error) {
    console.error('Failed to get interaction:', error);
    throw error;
  }
};