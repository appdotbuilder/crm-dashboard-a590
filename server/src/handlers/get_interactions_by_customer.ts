import { db } from '../db';
import { interactionsTable } from '../db/schema';
import { type Interaction } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getInteractionsByCustomer = async (customerId: number): Promise<Interaction[]> => {
  try {
    const results = await db.select()
      .from(interactionsTable)
      .where(eq(interactionsTable.customer_id, customerId))
      .orderBy(desc(interactionsTable.date))
      .execute();

    return results.map(interaction => ({
      ...interaction,
      // Convert timestamps to Date objects for schema compliance
      date: new Date(interaction.date),
      created_at: new Date(interaction.created_at)
    }));
  } catch (error) {
    console.error('Failed to get interactions by customer:', error);
    throw error;
  }
};