import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, salesTable } from '../db/schema';
import { getSalesByCustomer } from '../handlers/get_sales_by_customer';

describe('getSalesByCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return sales for a specific customer', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        company: 'Test Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test sales for this customer
    await db.insert(salesTable)
      .values([
        {
          customer_id: customerId,
          product_service: 'Software License',
          amount: '1500.00',
          date: new Date('2024-01-15'),
          status: 'Completed'
        },
        {
          customer_id: customerId,
          product_service: 'Consulting Service',
          amount: '750.50',
          date: new Date('2024-01-20'),
          status: 'Pending'
        }
      ])
      .execute();

    const result = await getSalesByCustomer(customerId);

    expect(result).toHaveLength(2);
    expect(result[0].customer_id).toEqual(customerId);
    expect(result[0].product_service).toEqual('Software License');
    expect(result[0].amount).toEqual(1500.00);
    expect(typeof result[0].amount).toEqual('number');
    expect(result[0].status).toEqual('Completed');
    expect(result[0].date).toBeInstanceOf(Date);

    expect(result[1].customer_id).toEqual(customerId);
    expect(result[1].product_service).toEqual('Consulting Service');
    expect(result[1].amount).toEqual(750.50);
    expect(typeof result[1].amount).toEqual('number');
    expect(result[1].status).toEqual('Pending');
  });

  it('should return empty array when customer has no sales', async () => {
    // Create test customer with no sales
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '098-765-4321',
        company: 'Another Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    const result = await getSalesByCustomer(customerId);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent customer', async () => {
    const nonExistentCustomerId = 99999;

    const result = await getSalesByCustomer(nonExistentCustomerId);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return sales for the specified customer', async () => {
    // Create two test customers
    const customer1Result = await db.insert(customersTable)
      .values({
        name: 'Customer One',
        email: 'customer1@example.com',
        phone: '111-111-1111',
        company: 'Company One'
      })
      .returning()
      .execute();

    const customer2Result = await db.insert(customersTable)
      .values({
        name: 'Customer Two',
        email: 'customer2@example.com',
        phone: '222-222-2222',
        company: 'Company Two'
      })
      .returning()
      .execute();

    const customer1Id = customer1Result[0].id;
    const customer2Id = customer2Result[0].id;

    // Create sales for both customers
    await db.insert(salesTable)
      .values([
        {
          customer_id: customer1Id,
          product_service: 'Product A',
          amount: '100.00',
          date: new Date('2024-01-01'),
          status: 'Completed'
        },
        {
          customer_id: customer1Id,
          product_service: 'Product B',
          amount: '200.00',
          date: new Date('2024-01-02'),
          status: 'Pending'
        },
        {
          customer_id: customer2Id,
          product_service: 'Product C',
          amount: '300.00',
          date: new Date('2024-01-03'),
          status: 'Completed'
        }
      ])
      .execute();

    const customer1Sales = await getSalesByCustomer(customer1Id);
    const customer2Sales = await getSalesByCustomer(customer2Id);

    // Customer 1 should have 2 sales
    expect(customer1Sales).toHaveLength(2);
    customer1Sales.forEach(sale => {
      expect(sale.customer_id).toEqual(customer1Id);
    });

    // Customer 2 should have 1 sale
    expect(customer2Sales).toHaveLength(1);
    expect(customer2Sales[0].customer_id).toEqual(customer2Id);
    expect(customer2Sales[0].product_service).toEqual('Product C');
    expect(customer2Sales[0].amount).toEqual(300.00);
  });

  it('should handle various sale statuses correctly', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Status Test Customer',
        email: 'status@example.com',
        phone: '555-555-5555',
        company: 'Status Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create sales with different statuses
    await db.insert(salesTable)
      .values([
        {
          customer_id: customerId,
          product_service: 'Pending Sale',
          amount: '100.00',
          date: new Date('2024-01-01'),
          status: 'Pending'
        },
        {
          customer_id: customerId,
          product_service: 'Completed Sale',
          amount: '200.00',
          date: new Date('2024-01-02'),
          status: 'Completed'
        },
        {
          customer_id: customerId,
          product_service: 'Cancelled Sale',
          amount: '300.00',
          date: new Date('2024-01-03'),
          status: 'Cancelled'
        }
      ])
      .execute();

    const result = await getSalesByCustomer(customerId);

    expect(result).toHaveLength(3);
    
    const pendingSale = result.find(s => s.status === 'Pending');
    const completedSale = result.find(s => s.status === 'Completed');
    const cancelledSale = result.find(s => s.status === 'Cancelled');

    expect(pendingSale).toBeDefined();
    expect(pendingSale!.product_service).toEqual('Pending Sale');
    expect(pendingSale!.amount).toEqual(100.00);

    expect(completedSale).toBeDefined();
    expect(completedSale!.product_service).toEqual('Completed Sale');
    expect(completedSale!.amount).toEqual(200.00);

    expect(cancelledSale).toBeDefined();
    expect(cancelledSale!.product_service).toEqual('Cancelled Sale');
    expect(cancelledSale!.amount).toEqual(300.00);
  });
});