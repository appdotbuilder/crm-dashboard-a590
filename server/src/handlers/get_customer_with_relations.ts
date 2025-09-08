import { db } from '../db';
import { customersTable, salesTable, interactionsTable } from '../db/schema';
import { type CustomerWithRelations } from '../schema';
import { eq } from 'drizzle-orm';

export const getCustomerWithRelations = async (id: number): Promise<CustomerWithRelations | null> => {
  try {
    // Fetch the customer
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, id))
      .execute();

    if (customers.length === 0) {
      return null;
    }

    const customer = customers[0];

    // Fetch related sales
    const sales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.customer_id, id))
      .execute();

    // Fetch related interactions
    const interactions = await db.select()
      .from(interactionsTable)
      .where(eq(interactionsTable.customer_id, id))
      .execute();

    // Convert numeric fields for sales
    const salesWithNumericConversion = sales.map(sale => ({
      ...sale,
      amount: parseFloat(sale.amount) // Convert numeric column from string to number
    }));

    // Return customer with relations
    return {
      ...customer,
      sales: salesWithNumericConversion,
      interactions
    };
  } catch (error) {
    console.error('Failed to get customer with relations:', error);
    throw error;
  }
};