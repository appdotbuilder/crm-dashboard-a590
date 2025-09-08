import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type CreateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Test data
const testCustomer: CreateCustomerInput = {
  name: 'Original Name',
  email: 'original@example.com',
  phone: '555-0001',
  company: 'Original Company'
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all customer fields', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = created[0].id;

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Updated Name',
      email: 'updated@example.com',
      phone: '555-0002',
      company: 'Updated Company'
    };

    const result = await updateCustomer(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.phone).toEqual('555-0002');
    expect(result.company).toEqual('Updated Company');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = created[0].id;

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Updated Name Only',
      email: 'updated.email@example.com'
      // phone and company not provided - should remain unchanged
    };

    const result = await updateCustomer(updateInput);

    // Verify only provided fields were updated
    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('Updated Name Only');
    expect(result.email).toEqual('updated.email@example.com');
    expect(result.phone).toEqual('555-0001'); // Original value
    expect(result.company).toEqual('Original Company'); // Original value
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated customer to database', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = created[0].id;

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Database Updated Name',
      company: 'Database Updated Company'
    };

    await updateCustomer(updateInput);

    // Verify in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Database Updated Name');
    expect(customers[0].email).toEqual('original@example.com'); // Unchanged
    expect(customers[0].phone).toEqual('555-0001'); // Unchanged
    expect(customers[0].company).toEqual('Database Updated Company');
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent customer', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 999999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateCustomer(updateInput)).rejects.toThrow(/Customer with id 999999 not found/i);
  });

  it('should handle partial updates with single field', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = created[0].id;

    // Update only phone
    const updateInput: UpdateCustomerInput = {
      id: customerId,
      phone: '555-9999'
    };

    const result = await updateCustomer(updateInput);

    // Verify only phone was updated
    expect(result.id).toEqual(customerId);
    expect(result.name).toEqual('Original Name'); // Unchanged
    expect(result.email).toEqual('original@example.com'); // Unchanged
    expect(result.phone).toEqual('555-9999'); // Updated
    expect(result.company).toEqual('Original Company'); // Unchanged
  });

  it('should preserve created_at timestamp', async () => {
    // Create initial customer
    const created = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = created[0].id;
    const originalCreatedAt = created[0].created_at;

    // Wait a moment to ensure timestamp would be different if changed
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateCustomerInput = {
      id: customerId,
      name: 'Updated Name'
    };

    const result = await updateCustomer(updateInput);

    // Verify created_at is preserved
    expect(result.created_at.getTime()).toEqual(originalCreatedAt.getTime());
  });
});