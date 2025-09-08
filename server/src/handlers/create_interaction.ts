import { db } from '../db';
import { interactionsTable, customersTable } from '../db/schema';
import { type CreateInteractionInput, type Interaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createInteraction = async (input: CreateInteractionInput): Promise<Interaction> => {
  try {
    // Verify the customer exists to prevent foreign key constraint violations
    const customerExists = await db.select({ id: customersTable.id })
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customerExists.length === 0) {
      throw new Error(`Customer with id ${input.customer_id} does not exist`);
    }

    // Insert interaction record
    const result = await db.insert(interactionsTable)
      .values({
        customer_id: input.customer_id,
        type: input.type,
        date: input.date,
        summary: input.summary
      })
      .returning()
      .execute();

    // Return the created interaction
    return result[0];
  } catch (error) {
    console.error('Interaction creation failed:', error);
    throw error;
  }
};