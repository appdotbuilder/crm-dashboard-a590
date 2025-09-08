import { db } from '../db';
import { customersTable, salesTable, interactionsTable } from '../db/schema';
import { type DashboardOverview } from '../schema';
import { count, sum, eq, desc } from 'drizzle-orm';

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  try {
    // Get total customers count
    const [totalCustomersResult] = await db
      .select({ count: count() })
      .from(customersTable)
      .execute();

    // Get total sales count and amount
    const [totalSalesResult] = await db
      .select({
        count: count(),
        total_amount: sum(salesTable.amount)
      })
      .from(salesTable)
      .execute();

    // Get sales counts by status
    const [pendingSalesResult] = await db
      .select({ count: count() })
      .from(salesTable)
      .where(eq(salesTable.status, 'Pending'))
      .execute();

    const [completedSalesResult] = await db
      .select({ count: count() })
      .from(salesTable)
      .where(eq(salesTable.status, 'Completed'))
      .execute();

    const [cancelledSalesResult] = await db
      .select({ count: count() })
      .from(salesTable)
      .where(eq(salesTable.status, 'Cancelled'))
      .execute();

    // Get total interactions count
    const [totalInteractionsResult] = await db
      .select({ count: count() })
      .from(interactionsTable)
      .execute();

    // Get recent interactions (limit 5, ordered by date descending)
    const recentInteractionsResult = await db
      .select()
      .from(interactionsTable)
      .orderBy(desc(interactionsTable.date))
      .limit(5)
      .execute();

    // Convert recent interactions to match schema format
    const recent_interactions = recentInteractionsResult.map(interaction => ({
      id: interaction.id,
      customer_id: interaction.customer_id,
      type: interaction.type,
      date: interaction.date,
      summary: interaction.summary,
      created_at: interaction.created_at
    }));

    return {
      total_customers: totalCustomersResult.count,
      total_sales: totalSalesResult.count,
      total_sales_amount: totalSalesResult.total_amount 
        ? parseFloat(totalSalesResult.total_amount) 
        : 0,
      pending_sales: pendingSalesResult.count,
      completed_sales: completedSalesResult.count,
      cancelled_sales: cancelledSalesResult.count,
      total_interactions: totalInteractionsResult.count,
      recent_interactions
    };
  } catch (error) {
    console.error('Dashboard overview fetch failed:', error);
    throw error;
  }
};