import { db } from '../db';
import { salesTable } from '../db/schema';
import { type CreateSaleInput, type Sale } from '../schema';

export const createSale = async (input: CreateSaleInput): Promise<Sale> => {
  try {
    // Insert sale record
    const result = await db.insert(salesTable)
      .values({
        customer_id: input.customer_id,
        product_service: input.product_service,
        amount: input.amount.toString(), // Convert number to string for numeric column
        date: input.date,
        status: input.status
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const sale = result[0];
    return {
      ...sale,
      amount: parseFloat(sale.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Sale creation failed:', error);
    throw error;
  }
};