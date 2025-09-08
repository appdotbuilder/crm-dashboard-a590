import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, salesTable } from '../db/schema';
import { getSales } from '../handlers/get_sales';

describe('getSales', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sales exist', async () => {
    const result = await getSales();
    
    expect(result).toEqual([]);
  });

  it('should return all sales when sales exist', async () => {
    // Create a customer first (required for foreign key)
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test sales
    const testSales = [
      {
        customer_id: customerId,
        product_service: 'Product A',
        amount: '99.99',
        date: new Date('2023-01-15'),
        status: 'Completed' as const
      },
      {
        customer_id: customerId,
        product_service: 'Service B',
        amount: '149.50',
        date: new Date('2023-02-20'),
        status: 'Pending' as const
      },
      {
        customer_id: customerId,
        product_service: 'Product C',
        amount: '75.25',
        date: new Date('2023-03-10'),
        status: 'Cancelled' as const
      }
    ];

    await db.insert(salesTable)
      .values(testSales)
      .execute();

    const result = await getSales();

    // Should return 3 sales
    expect(result).toHaveLength(3);

    // Verify each sale has correct structure and types
    result.forEach(sale => {
      expect(sale.id).toBeNumber();
      expect(sale.customer_id).toEqual(customerId);
      expect(sale.product_service).toBeString();
      expect(typeof sale.amount).toBe('number'); // Verify numeric conversion
      expect(sale.date).toBeInstanceOf(Date);
      expect(['Pending', 'Completed', 'Cancelled']).toContain(sale.status);
      expect(sale.created_at).toBeInstanceOf(Date);
    });

    // Verify specific sales data
    const productA = result.find(s => s.product_service === 'Product A');
    const serviceB = result.find(s => s.product_service === 'Service B');
    const productC = result.find(s => s.product_service === 'Product C');

    expect(productA).toBeDefined();
    expect(productA!.amount).toEqual(99.99);
    expect(productA!.status).toEqual('Completed');

    expect(serviceB).toBeDefined();
    expect(serviceB!.amount).toEqual(149.50);
    expect(serviceB!.status).toEqual('Pending');

    expect(productC).toBeDefined();
    expect(productC!.amount).toEqual(75.25);
    expect(productC!.status).toEqual('Cancelled');
  });

  it('should handle sales with different statuses correctly', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Status Test Customer',
        email: 'status@example.com',
        phone: '987-654-3210',
        company: 'Status Test Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create sales with each status
    await db.insert(salesTable)
      .values([
        {
          customer_id: customerId,
          product_service: 'Pending Sale',
          amount: '100.00',
          date: new Date(),
          status: 'Pending'
        },
        {
          customer_id: customerId,
          product_service: 'Completed Sale',
          amount: '200.00',
          date: new Date(),
          status: 'Completed'
        },
        {
          customer_id: customerId,
          product_service: 'Cancelled Sale',
          amount: '300.00',
          date: new Date(),
          status: 'Cancelled'
        }
      ])
      .execute();

    const result = await getSales();

    expect(result).toHaveLength(3);

    const statusCounts = result.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(statusCounts['Pending']).toEqual(1);
    expect(statusCounts['Completed']).toEqual(1);
    expect(statusCounts['Cancelled']).toEqual(1);
  });

  it('should handle sales from multiple customers', async () => {
    // Create multiple customers
    const customer1Result = await db.insert(customersTable)
      .values({
        name: 'Customer One',
        email: 'one@example.com',
        phone: '111-111-1111',
        company: 'Company One'
      })
      .returning()
      .execute();

    const customer2Result = await db.insert(customersTable)
      .values({
        name: 'Customer Two',
        email: 'two@example.com',
        phone: '222-222-2222',
        company: 'Company Two'
      })
      .returning()
      .execute();

    const customerId1 = customer1Result[0].id;
    const customerId2 = customer2Result[0].id;

    // Create sales for both customers
    await db.insert(salesTable)
      .values([
        {
          customer_id: customerId1,
          product_service: 'Customer 1 Sale',
          amount: '50.00',
          date: new Date(),
          status: 'Completed'
        },
        {
          customer_id: customerId2,
          product_service: 'Customer 2 Sale',
          amount: '75.00',
          date: new Date(),
          status: 'Pending'
        }
      ])
      .execute();

    const result = await getSales();

    expect(result).toHaveLength(2);

    const customer1Sales = result.filter(s => s.customer_id === customerId1);
    const customer2Sales = result.filter(s => s.customer_id === customerId2);

    expect(customer1Sales).toHaveLength(1);
    expect(customer2Sales).toHaveLength(1);

    expect(customer1Sales[0].product_service).toEqual('Customer 1 Sale');
    expect(customer1Sales[0].amount).toEqual(50.00);

    expect(customer2Sales[0].product_service).toEqual('Customer 2 Sale');
    expect(customer2Sales[0].amount).toEqual(75.00);
  });
});