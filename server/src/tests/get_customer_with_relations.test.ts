import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, salesTable, interactionsTable } from '../db/schema';
import { getCustomerWithRelations } from '../handlers/get_customer_with_relations';

describe('getCustomerWithRelations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent customer', async () => {
    const result = await getCustomerWithRelations(999);
    expect(result).toBeNull();
  });

  it('should return customer with empty relations when no sales or interactions exist', async () => {
    // Create a customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-1234',
        company: 'Test Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    const result = await getCustomerWithRelations(customerId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(customerId);
    expect(result!.name).toEqual('Test Customer');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.phone).toEqual('555-1234');
    expect(result!.company).toEqual('Test Company');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.sales).toEqual([]);
    expect(result!.interactions).toEqual([]);
  });

  it('should return customer with sales and interactions', async () => {
    // Create a customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Customer with Data',
        email: 'customer@example.com',
        phone: '555-5678',
        company: 'Data Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create sales
    await db.insert(salesTable)
      .values([
        {
          customer_id: customerId,
          product_service: 'Product A',
          amount: '199.99',
          date: new Date('2024-01-15'),
          status: 'Completed'
        },
        {
          customer_id: customerId,
          product_service: 'Service B',
          amount: '299.50',
          date: new Date('2024-02-20'),
          status: 'Pending'
        }
      ])
      .execute();

    // Create interactions
    await db.insert(interactionsTable)
      .values([
        {
          customer_id: customerId,
          type: 'Call',
          date: new Date('2024-01-10'),
          summary: 'Initial contact call'
        },
        {
          customer_id: customerId,
          type: 'Email',
          date: new Date('2024-01-12'),
          summary: 'Follow-up email with proposal'
        },
        {
          customer_id: customerId,
          type: 'Meeting',
          date: new Date('2024-02-25'),
          summary: 'Contract discussion meeting'
        }
      ])
      .execute();

    const result = await getCustomerWithRelations(customerId);

    expect(result).not.toBeNull();
    
    // Verify customer data
    expect(result!.id).toEqual(customerId);
    expect(result!.name).toEqual('Customer with Data');
    expect(result!.email).toEqual('customer@example.com');
    expect(result!.phone).toEqual('555-5678');
    expect(result!.company).toEqual('Data Company');
    expect(result!.created_at).toBeInstanceOf(Date);

    // Verify sales data
    expect(result!.sales).toHaveLength(2);
    
    const sale1 = result!.sales.find(s => s.product_service === 'Product A');
    expect(sale1).toBeDefined();
    expect(sale1!.amount).toEqual(199.99);
    expect(typeof sale1!.amount).toBe('number');
    expect(sale1!.status).toEqual('Completed');
    expect(sale1!.date).toBeInstanceOf(Date);
    expect(sale1!.created_at).toBeInstanceOf(Date);

    const sale2 = result!.sales.find(s => s.product_service === 'Service B');
    expect(sale2).toBeDefined();
    expect(sale2!.amount).toEqual(299.50);
    expect(typeof sale2!.amount).toBe('number');
    expect(sale2!.status).toEqual('Pending');

    // Verify interactions data
    expect(result!.interactions).toHaveLength(3);

    const callInteraction = result!.interactions.find(i => i.type === 'Call');
    expect(callInteraction).toBeDefined();
    expect(callInteraction!.summary).toEqual('Initial contact call');
    expect(callInteraction!.date).toBeInstanceOf(Date);
    expect(callInteraction!.created_at).toBeInstanceOf(Date);

    const emailInteraction = result!.interactions.find(i => i.type === 'Email');
    expect(emailInteraction).toBeDefined();
    expect(emailInteraction!.summary).toEqual('Follow-up email with proposal');

    const meetingInteraction = result!.interactions.find(i => i.type === 'Meeting');
    expect(meetingInteraction).toBeDefined();
    expect(meetingInteraction!.summary).toEqual('Contract discussion meeting');
  });

  it('should return customer with only sales when no interactions exist', async () => {
    // Create a customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Sales Only Customer',
        email: 'sales@example.com',
        phone: '555-9999',
        company: 'Sales Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create only sales
    await db.insert(salesTable)
      .values({
        customer_id: customerId,
        product_service: 'Solo Product',
        amount: '150.00',
        date: new Date('2024-03-01'),
        status: 'Completed'
      })
      .execute();

    const result = await getCustomerWithRelations(customerId);

    expect(result).not.toBeNull();
    expect(result!.sales).toHaveLength(1);
    expect(result!.sales[0].product_service).toEqual('Solo Product');
    expect(result!.sales[0].amount).toEqual(150.00);
    expect(typeof result!.sales[0].amount).toBe('number');
    expect(result!.interactions).toEqual([]);
  });

  it('should return customer with only interactions when no sales exist', async () => {
    // Create a customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Interactions Only Customer',
        email: 'interactions@example.com',
        phone: '555-0000',
        company: 'Interactions Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create only interactions
    await db.insert(interactionsTable)
      .values({
        customer_id: customerId,
        type: 'Meeting',
        date: new Date('2024-03-05'),
        summary: 'Exploratory meeting'
      })
      .execute();

    const result = await getCustomerWithRelations(customerId);

    expect(result).not.toBeNull();
    expect(result!.sales).toEqual([]);
    expect(result!.interactions).toHaveLength(1);
    expect(result!.interactions[0].type).toEqual('Meeting');
    expect(result!.interactions[0].summary).toEqual('Exploratory meeting');
  });
});