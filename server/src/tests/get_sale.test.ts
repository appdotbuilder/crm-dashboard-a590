import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, salesTable } from '../db/schema';
import { type CreateCustomerInput, type CreateSaleInput } from '../schema';
import { getSale } from '../handlers/get_sale';

describe('getSale', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a sale by ID', async () => {
    // Create a customer first (required for foreign key)
    const customerData: CreateCustomerInput = {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '123-456-7890',
      company: 'Test Company'
    };
    
    const customerResult = await db.insert(customersTable)
      .values(customerData)
      .returning()
      .execute();
    
    const customer = customerResult[0];

    // Create a sale
    const saleData: CreateSaleInput = {
      customer_id: customer.id,
      product_service: 'Test Product',
      amount: 99.99,
      date: new Date('2024-01-15'),
      status: 'Pending'
    };

    const saleResult = await db.insert(salesTable)
      .values({
        ...saleData,
        amount: saleData.amount.toString() // Convert number to string for insertion
      })
      .returning()
      .execute();
    
    const insertedSale = saleResult[0];

    // Test the handler
    const result = await getSale(insertedSale.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(insertedSale.id);
    expect(result!.customer_id).toEqual(customer.id);
    expect(result!.product_service).toEqual('Test Product');
    expect(result!.amount).toEqual(99.99);
    expect(typeof result!.amount).toEqual('number');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.status).toEqual('Pending');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent sale ID', async () => {
    const result = await getSale(999);
    
    expect(result).toBeNull();
  });

  it('should handle different sale statuses correctly', async () => {
    // Create a customer first
    const customerData: CreateCustomerInput = {
      name: 'Status Test Customer',
      email: 'status@example.com',
      phone: '987-654-3210',
      company: 'Status Test Company'
    };
    
    const customerResult = await db.insert(customersTable)
      .values(customerData)
      .returning()
      .execute();
    
    const customer = customerResult[0];

    // Test each status
    const statuses = ['Pending', 'Completed', 'Cancelled'] as const;
    
    for (const status of statuses) {
      const saleData: CreateSaleInput = {
        customer_id: customer.id,
        product_service: `${status} Product`,
        amount: 50.00,
        date: new Date(),
        status: status
      };

      const saleResult = await db.insert(salesTable)
        .values({
          ...saleData,
          amount: saleData.amount.toString()
        })
        .returning()
        .execute();
      
      const insertedSale = saleResult[0];
      const result = await getSale(insertedSale.id);

      expect(result).toBeDefined();
      expect(result!.status).toEqual(status);
      expect(result!.product_service).toEqual(`${status} Product`);
    }
  });

  it('should handle numeric amounts correctly', async () => {
    // Create a customer first
    const customerData: CreateCustomerInput = {
      name: 'Numeric Test Customer',
      email: 'numeric@example.com',
      phone: '555-123-4567',
      company: 'Numeric Test Company'
    };
    
    const customerResult = await db.insert(customersTable)
      .values(customerData)
      .returning()
      .execute();
    
    const customer = customerResult[0];

    // Test with decimal amount
    const saleData: CreateSaleInput = {
      customer_id: customer.id,
      product_service: 'Decimal Amount Product',
      amount: 123.45,
      date: new Date(),
      status: 'Completed'
    };

    const saleResult = await db.insert(salesTable)
      .values({
        ...saleData,
        amount: saleData.amount.toString()
      })
      .returning()
      .execute();
    
    const insertedSale = saleResult[0];
    const result = await getSale(insertedSale.id);

    expect(result).toBeDefined();
    expect(result!.amount).toEqual(123.45);
    expect(typeof result!.amount).toEqual('number');
    expect(Number.isFinite(result!.amount)).toBe(true);
  });

  it('should handle zero amount correctly', async () => {
    // Create a customer first
    const customerData: CreateCustomerInput = {
      name: 'Zero Amount Customer',
      email: 'zero@example.com',
      phone: '000-000-0000',
      company: 'Zero Test Company'
    };
    
    const customerResult = await db.insert(customersTable)
      .values(customerData)
      .returning()
      .execute();
    
    const customer = customerResult[0];

    // Test with zero amount
    const saleData: CreateSaleInput = {
      customer_id: customer.id,
      product_service: 'Free Product',
      amount: 0,
      date: new Date(),
      status: 'Completed'
    };

    const saleResult = await db.insert(salesTable)
      .values({
        ...saleData,
        amount: saleData.amount.toString()
      })
      .returning()
      .execute();
    
    const insertedSale = saleResult[0];
    const result = await getSale(insertedSale.id);

    expect(result).toBeDefined();
    expect(result!.amount).toEqual(0);
    expect(typeof result!.amount).toEqual('number');
  });
});