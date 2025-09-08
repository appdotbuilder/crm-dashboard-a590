import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesTable, customersTable } from '../db/schema';
import { type UpdateSaleInput, type CreateCustomerInput } from '../schema';
import { updateSale } from '../handlers/update_sale';
import { eq } from 'drizzle-orm';

// Test customer data
const testCustomer: CreateCustomerInput = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '123-456-7890',
  company: 'Test Company'
};

// Test sale data
const testSaleData = {
  customer_id: 1,
  product_service: 'Original Product',
  amount: '199.99', // String for numeric column
  date: new Date('2024-01-01'),
  status: 'Pending' as const
};

describe('updateSale', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update sale product_service', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    // Create test sale
    const createResult = await db.insert(salesTable)
      .values(testSaleData)
      .returning()
      .execute();

    const saleId = createResult[0].id;

    const updateInput: UpdateSaleInput = {
      id: saleId,
      product_service: 'Updated Product'
    };

    const result = await updateSale(updateInput);

    // Verify updated field
    expect(result.product_service).toEqual('Updated Product');
    expect(result.id).toEqual(saleId);
    
    // Verify unchanged fields
    expect(result.customer_id).toEqual(1);
    expect(parseFloat(testSaleData.amount)).toEqual(result.amount);
    expect(result.status).toEqual('Pending');
    expect(result.date).toEqual(testSaleData.date);
  });

  it('should update sale amount', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    // Create test sale
    const createResult = await db.insert(salesTable)
      .values(testSaleData)
      .returning()
      .execute();

    const saleId = createResult[0].id;

    const updateInput: UpdateSaleInput = {
      id: saleId,
      amount: 299.99
    };

    const result = await updateSale(updateInput);

    // Verify updated field
    expect(result.amount).toEqual(299.99);
    expect(typeof result.amount).toEqual('number');
    expect(result.id).toEqual(saleId);
    
    // Verify unchanged fields
    expect(result.product_service).toEqual(testSaleData.product_service);
    expect(result.status).toEqual(testSaleData.status);
  });

  it('should update sale status', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    // Create test sale
    const createResult = await db.insert(salesTable)
      .values(testSaleData)
      .returning()
      .execute();

    const saleId = createResult[0].id;

    const updateInput: UpdateSaleInput = {
      id: saleId,
      status: 'Completed'
    };

    const result = await updateSale(updateInput);

    // Verify updated field
    expect(result.status).toEqual('Completed');
    expect(result.id).toEqual(saleId);
    
    // Verify unchanged fields
    expect(result.product_service).toEqual(testSaleData.product_service);
    expect(result.amount).toEqual(parseFloat(testSaleData.amount));
  });

  it('should update sale date', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    // Create test sale
    const createResult = await db.insert(salesTable)
      .values(testSaleData)
      .returning()
      .execute();

    const saleId = createResult[0].id;

    const newDate = new Date('2024-12-31');
    const updateInput: UpdateSaleInput = {
      id: saleId,
      date: newDate
    };

    const result = await updateSale(updateInput);

    // Verify updated field
    expect(result.date).toEqual(newDate);
    expect(result.id).toEqual(saleId);
    
    // Verify unchanged fields
    expect(result.product_service).toEqual(testSaleData.product_service);
    expect(result.status).toEqual(testSaleData.status);
  });

  it('should update multiple fields at once', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    // Create test sale
    const createResult = await db.insert(salesTable)
      .values(testSaleData)
      .returning()
      .execute();

    const saleId = createResult[0].id;

    const newDate = new Date('2024-06-15');
    const updateInput: UpdateSaleInput = {
      id: saleId,
      product_service: 'Multi-Update Product',
      amount: 149.50,
      status: 'Cancelled',
      date: newDate
    };

    const result = await updateSale(updateInput);

    // Verify all updated fields
    expect(result.product_service).toEqual('Multi-Update Product');
    expect(result.amount).toEqual(149.50);
    expect(result.status).toEqual('Cancelled');
    expect(result.date).toEqual(newDate);
    expect(result.id).toEqual(saleId);
  });

  it('should save updates to database', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    // Create test sale
    const createResult = await db.insert(salesTable)
      .values(testSaleData)
      .returning()
      .execute();

    const saleId = createResult[0].id;

    const updateInput: UpdateSaleInput = {
      id: saleId,
      product_service: 'Database Updated Product',
      amount: 399.99
    };

    await updateSale(updateInput);

    // Query database directly to verify changes were saved
    const sales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, saleId))
      .execute();

    expect(sales).toHaveLength(1);
    expect(sales[0].product_service).toEqual('Database Updated Product');
    expect(parseFloat(sales[0].amount)).toEqual(399.99);
    expect(sales[0].status).toEqual('Pending'); // Unchanged field
  });

  it('should throw error for non-existent sale', async () => {
    const updateInput: UpdateSaleInput = {
      id: 99999,
      product_service: 'Should Not Work'
    };

    await expect(updateSale(updateInput)).rejects.toThrow(/Sale with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    // Create test sale
    const createResult = await db.insert(salesTable)
      .values(testSaleData)
      .returning()
      .execute();

    const saleId = createResult[0].id;

    // Update only product_service
    const updateInput: UpdateSaleInput = {
      id: saleId,
      product_service: 'Partial Update Product'
    };

    const result = await updateSale(updateInput);

    // Verify only specified field was updated
    expect(result.product_service).toEqual('Partial Update Product');
    expect(result.amount).toEqual(parseFloat(testSaleData.amount));
    expect(result.status).toEqual(testSaleData.status);
    expect(result.date).toEqual(testSaleData.date);
  });
});