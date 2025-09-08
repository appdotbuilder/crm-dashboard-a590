import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const getCustomer = async (id: number): Promise<Customer | null> => {
  try {
    const result = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Get customer failed:', error);
    throw error;
  }
};