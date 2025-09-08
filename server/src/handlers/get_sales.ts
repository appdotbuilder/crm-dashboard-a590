import { db } from '../db';
import { salesTable } from '../db/schema';
import { type Sale } from '../schema';

export const getSales = async (): Promise<Sale[]> => {
  try {
    // Fetch all sales from the database
    const results = await db.select()
      .from(salesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(sale => ({
      ...sale,
      amount: parseFloat(sale.amount) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    throw error;
  }
};