import { db } from '../db';
import { salesTable } from '../db/schema';
import { type Sale } from '../schema';
import { eq } from 'drizzle-orm';

export const getSalesByCustomer = async (customerId: number): Promise<Sale[]> => {
  try {
    // Query sales for the specific customer
    const results = await db.select()
      .from(salesTable)
      .where(eq(salesTable.customer_id, customerId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(sale => ({
      ...sale,
      amount: parseFloat(sale.amount) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to get sales by customer:', error);
    throw error;
  }
};