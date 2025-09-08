import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { getCustomers } from '../handlers/get_customers';
import { type CreateCustomerInput } from '../schema';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    
    expect(result).toEqual([]);
  });

  it('should return all customers from database', async () => {
    // Create test customers
    const testCustomers: CreateCustomerInput[] = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        company: 'Tech Corp'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '987-654-3210',
        company: 'Business Inc'
      }
    ];

    // Insert test customers directly into database
    await db.insert(customersTable)
      .values(testCustomers)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    
    // Verify first customer
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].phone).toEqual('123-456-7890');
    expect(result[0].company).toEqual('Tech Corp');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second customer
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[1].email).toEqual('jane@example.com');
    expect(result[1].phone).toEqual('987-654-3210');
    expect(result[1].company).toEqual('Business Inc');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Verify customers are ordered by ID (default order)
    expect(result[0].id).toBeLessThan(result[1].id);
  });

  it('should return customers with correct data types', async () => {
    // Create a single test customer
    const testCustomer: CreateCustomerInput = {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+1-555-0123',
      company: 'Test Company LLC'
    };

    await db.insert(customersTable)
      .values([testCustomer])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];

    // Verify data types
    expect(typeof customer.id).toBe('number');
    expect(typeof customer.name).toBe('string');
    expect(typeof customer.email).toBe('string');
    expect(typeof customer.phone).toBe('string');
    expect(typeof customer.company).toBe('string');
    expect(customer.created_at).toBeInstanceOf(Date);
  });

  it('should handle large number of customers', async () => {
    // Create multiple customers
    const customers: CreateCustomerInput[] = [];
    for (let i = 1; i <= 50; i++) {
      customers.push({
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `555-010${i.toString().padStart(2, '0')}`,
        company: `Company ${i}`
      });
    }

    await db.insert(customersTable)
      .values(customers)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(50);
    
    // Verify first and last customers
    expect(result[0].name).toEqual('Customer 1');
    expect(result[49].name).toEqual('Customer 50');
    
    // Verify all customers have required fields
    result.forEach(customer => {
      expect(customer.id).toBeDefined();
      expect(customer.name).toBeDefined();
      expect(customer.email).toBeDefined();
      expect(customer.phone).toBeDefined();
      expect(customer.company).toBeDefined();
      expect(customer.created_at).toBeInstanceOf(Date);
    });
  });
});