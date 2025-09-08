import { db } from '../db';
import { interactionsTable } from '../db/schema';
import { type Interaction } from '../schema';

export const getInteractions = async (): Promise<Interaction[]> => {
  try {
    const results = await db.select()
      .from(interactionsTable)
      .execute();

    // No numeric conversions needed for interactions table
    return results;
  } catch (error) {
    console.error('Failed to fetch interactions:', error);
    throw error;
  }
};