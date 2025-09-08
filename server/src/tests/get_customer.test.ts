import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomer } from '../handlers/get_customer';

// Test input for creating a customer
const testCustomerInput: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Test Company'
};

describe('getCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a customer by ID', async () => {
    // Create a test customer first
    const insertResult = await db.insert(customersTable)
      .values(testCustomerInput)
      .returning()
      .execute();
    
    const createdCustomer = insertResult[0];

    // Get the customer using the handler
    const result = await getCustomer(createdCustomer.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCustomer.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.company).toEqual('Test Company');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent customer ID', async () => {
    const result = await getCustomer(999);
    
    expect(result).toBeNull();
  });

  it('should return correct customer when multiple customers exist', async () => {
    // Create multiple test customers
    const customer1Input = {
      ...testCustomerInput,
      name: 'Customer One',
      email: 'customer1@example.com'
    };
    
    const customer2Input = {
      ...testCustomerInput,
      name: 'Customer Two',
      email: 'customer2@example.com'
    };

    const insertResult1 = await db.insert(customersTable)
      .values(customer1Input)
      .returning()
      .execute();
    
    const insertResult2 = await db.insert(customersTable)
      .values(customer2Input)
      .returning()
      .execute();

    const createdCustomer1 = insertResult1[0];
    const createdCustomer2 = insertResult2[0];

    // Get the second customer
    const result = await getCustomer(createdCustomer2.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCustomer2.id);
    expect(result!.name).toEqual('Customer Two');
    expect(result!.email).toEqual('customer2@example.com');
    
    // Verify it's not the first customer
    expect(result!.id).not.toEqual(createdCustomer1.id);
    expect(result!.name).not.toEqual('Customer One');
  });

  it('should handle zero ID correctly', async () => {
    const result = await getCustomer(0);
    
    expect(result).toBeNull();
  });

  it('should handle negative ID correctly', async () => {
    const result = await getCustomer(-1);
    
    expect(result).toBeNull();
  });
});