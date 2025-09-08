import { db } from '../db';
import { interactionsTable } from '../db/schema';
import { type UpdateInteractionInput, type Interaction } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInteraction = async (input: UpdateInteractionInput): Promise<Interaction> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof interactionsTable.$inferInsert> = {};
    
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    
    if (input.date !== undefined) {
      updateData.date = input.date;
    }
    
    if (input.summary !== undefined) {
      updateData.summary = input.summary;
    }

    // Update the interaction record
    const result = await db.update(interactionsTable)
      .set(updateData)
      .where(eq(interactionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Interaction with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Interaction update failed:', error);
    throw error;
  }
};