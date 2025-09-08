import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Acme Corporation'
};

const minimalInput: CreateCustomerInput = {
  name: 'J',
  email: 'j@example.com',
  phone: '1',
  company: 'A'
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Verify all fields are set correctly
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.company).toEqual('Acme Corporation');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query database to verify customer was saved
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    const savedCustomer = customers[0];
    expect(savedCustomer.name).toEqual('John Doe');
    expect(savedCustomer.email).toEqual('john.doe@example.com');
    expect(savedCustomer.phone).toEqual('+1234567890');
    expect(savedCustomer.company).toEqual('Acme Corporation');
    expect(savedCustomer.created_at).toBeInstanceOf(Date);
  });

  it('should handle minimal valid input', async () => {
    const result = await createCustomer(minimalInput);

    expect(result.name).toEqual('J');
    expect(result.email).toEqual('j@example.com');
    expect(result.phone).toEqual('1');
    expect(result.company).toEqual('A');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple customers', async () => {
    const customer1 = await createCustomer(testInput);
    const customer2 = await createCustomer({
      ...testInput,
      email: 'different@example.com'
    });

    expect(customer1.id).not.toEqual(customer2.id);
    expect(customer1.id).toBeGreaterThan(0);
    expect(customer2.id).toBeGreaterThan(0);
  });

  it('should set created_at timestamp automatically', async () => {
    const beforeCreation = new Date();
    const result = await createCustomer(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle unicode characters in customer data', async () => {
    const unicodeInput: CreateCustomerInput = {
      name: 'José María García',
      email: 'jose@éxample.com',
      phone: '+34-123-456-789',
      company: 'Compañía Española'
    };

    const result = await createCustomer(unicodeInput);

    expect(result.name).toEqual('José María García');
    expect(result.email).toEqual('jose@éxample.com');
    expect(result.phone).toEqual('+34-123-456-789');
    expect(result.company).toEqual('Compañía Española');
  });

  it('should handle long text fields', async () => {
    const longTextInput: CreateCustomerInput = {
      name: 'A'.repeat(100),
      email: 'long@example.com',
      phone: '1'.repeat(20),
      company: 'B'.repeat(150)
    };

    const result = await createCustomer(longTextInput);

    expect(result.name).toEqual('A'.repeat(100));
    expect(result.phone).toEqual('1'.repeat(20));
    expect(result.company).toEqual('B'.repeat(150));
    expect(result.id).toBeDefined();
  });
});