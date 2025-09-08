import { db } from '../db';
import { salesTable } from '../db/schema';
import { type UpdateSaleInput, type Sale } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSale = async (input: UpdateSaleInput): Promise<Sale> => {
  try {
    // First check if the sale exists
    const existingSale = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, input.id))
      .execute();

    if (existingSale.length === 0) {
      throw new Error(`Sale with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof salesTable.$inferInsert> = {};
    
    if (input.product_service !== undefined) {
      updateData.product_service = input.product_service;
    }
    
    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString(); // Convert number to string for numeric column
    }
    
    if (input.date !== undefined) {
      updateData.date = input.date;
    }
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the sale
    const result = await db.update(salesTable)
      .set(updateData)
      .where(eq(salesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const sale = result[0];
    return {
      ...sale,
      amount: parseFloat(sale.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Sale update failed:', error);
    throw error;
  }
};