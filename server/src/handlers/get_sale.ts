import { db } from '../db';
import { salesTable } from '../db/schema';
import { type Sale } from '../schema';
import { eq } from 'drizzle-orm';

export const getSale = async (id: number): Promise<Sale | null> => {
  try {
    const results = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const sale = results[0];
    
    // Convert numeric field back to number for the Sale type
    return {
      ...sale,
      amount: parseFloat(sale.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Get sale failed:', error);
    throw error;
  }
};