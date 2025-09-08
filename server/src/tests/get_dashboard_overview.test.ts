import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, salesTable, interactionsTable } from '../db/schema';
import { getDashboardOverview } from '../handlers/get_dashboard_overview';

describe('getDashboardOverview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard when no data exists', async () => {
    const result = await getDashboardOverview();

    expect(result.total_customers).toEqual(0);
    expect(result.total_sales).toEqual(0);
    expect(result.total_sales_amount).toEqual(0);
    expect(result.pending_sales).toEqual(0);
    expect(result.completed_sales).toEqual(0);
    expect(result.cancelled_sales).toEqual(0);
    expect(result.total_interactions).toEqual(0);
    expect(result.recent_interactions).toEqual([]);
  });

  it('should return correct customer and sales statistics', async () => {
    // Create test customers
    const customers = await db.insert(customersTable)
      .values([
        {
          name: 'Customer 1',
          email: 'customer1@example.com',
          phone: '123-456-7890',
          company: 'Company 1'
        },
        {
          name: 'Customer 2',
          email: 'customer2@example.com',
          phone: '123-456-7891',
          company: 'Company 2'
        }
      ])
      .returning()
      .execute();

    // Create test sales with different statuses
    await db.insert(salesTable)
      .values([
        {
          customer_id: customers[0].id,
          product_service: 'Product A',
          amount: '100.50',
          date: new Date('2024-01-01'),
          status: 'Pending'
        },
        {
          customer_id: customers[0].id,
          product_service: 'Product B',
          amount: '200.25',
          date: new Date('2024-01-02'),
          status: 'Completed'
        },
        {
          customer_id: customers[1].id,
          product_service: 'Product C',
          amount: '150.75',
          date: new Date('2024-01-03'),
          status: 'Cancelled'
        }
      ])
      .execute();

    const result = await getDashboardOverview();

    expect(result.total_customers).toEqual(2);
    expect(result.total_sales).toEqual(3);
    expect(result.total_sales_amount).toEqual(451.50); // 100.50 + 200.25 + 150.75
    expect(result.pending_sales).toEqual(1);
    expect(result.completed_sales).toEqual(1);
    expect(result.cancelled_sales).toEqual(1);
  });

  it('should return correct interactions statistics and recent interactions', async () => {
    // Create test customer
    const [customer] = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Company'
      })
      .returning()
      .execute();

    // Create test interactions (6 interactions to test limit of 5)
    const interactions = await db.insert(interactionsTable)
      .values([
        {
          customer_id: customer.id,
          type: 'Call',
          date: new Date('2024-01-01T10:00:00Z'),
          summary: 'First call'
        },
        {
          customer_id: customer.id,
          type: 'Email',
          date: new Date('2024-01-02T10:00:00Z'),
          summary: 'Follow-up email'
        },
        {
          customer_id: customer.id,
          type: 'Meeting',
          date: new Date('2024-01-03T10:00:00Z'),
          summary: 'In-person meeting'
        },
        {
          customer_id: customer.id,
          type: 'Call',
          date: new Date('2024-01-04T10:00:00Z'),
          summary: 'Second call'
        },
        {
          customer_id: customer.id,
          type: 'Email',
          date: new Date('2024-01-05T10:00:00Z'),
          summary: 'Contract sent'
        },
        {
          customer_id: customer.id,
          type: 'Call',
          date: new Date('2024-01-06T10:00:00Z'),
          summary: 'Final call'
        }
      ])
      .returning()
      .execute();

    const result = await getDashboardOverview();

    expect(result.total_interactions).toEqual(6);
    expect(result.recent_interactions).toHaveLength(5); // Should be limited to 5

    // Verify interactions are ordered by date descending (most recent first)
    const recentDates = result.recent_interactions.map(i => i.date.getTime());
    for (let i = 1; i < recentDates.length; i++) {
      expect(recentDates[i-1]).toBeGreaterThanOrEqual(recentDates[i]);
    }

    // Verify the most recent interaction is "Final call"
    expect(result.recent_interactions[0].summary).toEqual('Final call');
    expect(result.recent_interactions[0].type).toEqual('Call');
    expect(result.recent_interactions[0].customer_id).toEqual(customer.id);
  });

  it('should handle mixed data correctly', async () => {
    // Create customers
    const customers = await db.insert(customersTable)
      .values([
        {
          name: 'Customer 1',
          email: 'customer1@example.com',
          phone: '123-456-7890',
          company: 'Company 1'
        },
        {
          name: 'Customer 2',
          email: 'customer2@example.com',
          phone: '123-456-7891',
          company: 'Company 2'
        },
        {
          name: 'Customer 3',
          email: 'customer3@example.com',
          phone: '123-456-7892',
          company: 'Company 3'
        }
      ])
      .returning()
      .execute();

    // Create sales
    await db.insert(salesTable)
      .values([
        {
          customer_id: customers[0].id,
          product_service: 'Service A',
          amount: '500.00',
          date: new Date('2024-01-01'),
          status: 'Completed'
        },
        {
          customer_id: customers[1].id,
          product_service: 'Service B',
          amount: '750.50',
          date: new Date('2024-01-02'),
          status: 'Pending'
        }
      ])
      .execute();

    // Create interactions
    await db.insert(interactionsTable)
      .values([
        {
          customer_id: customers[0].id,
          type: 'Call',
          date: new Date('2024-01-01T10:00:00Z'),
          summary: 'Initial contact'
        },
        {
          customer_id: customers[1].id,
          type: 'Email',
          date: new Date('2024-01-02T10:00:00Z'),
          summary: 'Proposal sent'
        },
        {
          customer_id: customers[2].id,
          type: 'Meeting',
          date: new Date('2024-01-03T10:00:00Z'),
          summary: 'Discovery meeting'
        }
      ])
      .execute();

    const result = await getDashboardOverview();

    expect(result.total_customers).toEqual(3);
    expect(result.total_sales).toEqual(2);
    expect(result.total_sales_amount).toEqual(1250.50); // 500.00 + 750.50
    expect(result.pending_sales).toEqual(1);
    expect(result.completed_sales).toEqual(1);
    expect(result.cancelled_sales).toEqual(0);
    expect(result.total_interactions).toEqual(3);
    expect(result.recent_interactions).toHaveLength(3);
  });

  it('should handle zero sales amount correctly', async () => {
    // Create customer
    const [customer] = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Company'
      })
      .returning()
      .execute();

    // Create sale with zero amount
    await db.insert(salesTable)
      .values({
        customer_id: customer.id,
        product_service: 'Free Service',
        amount: '0.00',
        date: new Date('2024-01-01'),
        status: 'Completed'
      })
      .execute();

    const result = await getDashboardOverview();

    expect(result.total_customers).toEqual(1);
    expect(result.total_sales).toEqual(1);
    expect(result.total_sales_amount).toEqual(0);
    expect(result.completed_sales).toEqual(1);
  });
});