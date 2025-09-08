import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesTable, customersTable } from '../db/schema';
import { type CreateSaleInput } from '../schema';
import { createSale } from '../handlers/create_sale';
import { eq } from 'drizzle-orm';

// Create a test customer first (required for foreign key)
const createTestCustomer = async () => {
  const customerResult = await db.insert(customersTable)
    .values({
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '555-0123',
      company: 'Test Corp'
    })
    .returning()
    .execute();
  return customerResult[0];
};

// Test input with all required fields
const testInput: CreateSaleInput = {
  customer_id: 1, // Will be updated with actual customer ID
  product_service: 'Software License',
  amount: 299.99,
  date: new Date('2024-01-15T10:00:00Z'),
  status: 'Pending'
};

describe('createSale', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a sale with valid input', async () => {
    // Create prerequisite customer
    const customer = await createTestCustomer();
    const saleInput = { ...testInput, customer_id: customer.id };

    const result = await createSale(saleInput);

    // Basic field validation
    expect(result.customer_id).toEqual(customer.id);
    expect(result.product_service).toEqual('Software License');
    expect(result.amount).toEqual(299.99);
    expect(typeof result.amount).toBe('number'); // Verify numeric conversion
    expect(result.date).toEqual(saleInput.date);
    expect(result.status).toEqual('Pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save sale to database', async () => {
    // Create prerequisite customer
    const customer = await createTestCustomer();
    const saleInput = { ...testInput, customer_id: customer.id };

    const result = await createSale(saleInput);

    // Query database to verify persistence
    const sales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, result.id))
      .execute();

    expect(sales).toHaveLength(1);
    const savedSale = sales[0];
    expect(savedSale.customer_id).toEqual(customer.id);
    expect(savedSale.product_service).toEqual('Software License');
    expect(parseFloat(savedSale.amount)).toEqual(299.99); // Database stores as string
    expect(savedSale.date).toEqual(saleInput.date);
    expect(savedSale.status).toEqual('Pending');
    expect(savedSale.created_at).toBeInstanceOf(Date);
  });

  it('should create sale with different status values', async () => {
    const customer = await createTestCustomer();
    
    // Test with 'Completed' status
    const completedSaleInput: CreateSaleInput = {
      ...testInput,
      customer_id: customer.id,
      product_service: 'Consulting Services',
      amount: 1500.00,
      status: 'Completed'
    };

    const result = await createSale(completedSaleInput);
    
    expect(result.status).toEqual('Completed');
    expect(result.product_service).toEqual('Consulting Services');
    expect(result.amount).toEqual(1500.00);
  });

  it('should handle decimal amounts correctly', async () => {
    const customer = await createTestCustomer();
    
    // Test with precise decimal amount
    const decimalSaleInput: CreateSaleInput = {
      ...testInput,
      customer_id: customer.id,
      amount: 123.45,
      product_service: 'Subscription'
    };

    const result = await createSale(decimalSaleInput);
    
    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const savedSales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, result.id))
      .execute();
    
    expect(parseFloat(savedSales[0].amount)).toEqual(123.45);
  });

  it('should throw error for non-existent customer', async () => {
    const invalidSaleInput: CreateSaleInput = {
      ...testInput,
      customer_id: 999999 // Non-existent customer ID
    };

    // Should throw foreign key constraint error
    await expect(createSale(invalidSaleInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple sales for same customer', async () => {
    const customer = await createTestCustomer();
    
    const sale1Input: CreateSaleInput = {
      ...testInput,
      customer_id: customer.id,
      product_service: 'Product A',
      amount: 100.00
    };

    const sale2Input: CreateSaleInput = {
      ...testInput,
      customer_id: customer.id,
      product_service: 'Product B',
      amount: 200.00,
      status: 'Completed'
    };

    const result1 = await createSale(sale1Input);
    const result2 = await createSale(sale2Input);

    // Both sales should be created successfully
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.customer_id).toEqual(customer.id);
    expect(result2.customer_id).toEqual(customer.id);
    expect(result1.amount).toEqual(100.00);
    expect(result2.amount).toEqual(200.00);
    expect(result1.status).toEqual('Pending');
    expect(result2.status).toEqual('Completed');

    // Verify both are in database
    const allSales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.customer_id, customer.id))
      .execute();
    
    expect(allSales).toHaveLength(2);
  });
});