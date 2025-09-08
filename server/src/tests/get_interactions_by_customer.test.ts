import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, interactionsTable } from '../db/schema';
import { getInteractionsByCustomer } from '../handlers/get_interactions_by_customer';

describe('getInteractionsByCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return interactions for a specific customer', async () => {
    // Create test customers
    const customers = await db.insert(customersTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          company: 'Acme Inc'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '098-765-4321',
          company: 'Tech Corp'
        }
      ])
      .returning()
      .execute();

    const customer1Id = customers[0].id;
    const customer2Id = customers[1].id;

    // Create test interactions for both customers
    const interactionDate1 = new Date('2024-01-15');
    const interactionDate2 = new Date('2024-01-10');
    const interactionDate3 = new Date('2024-01-20');

    await db.insert(interactionsTable)
      .values([
        {
          customer_id: customer1Id,
          type: 'Call',
          date: interactionDate1,
          summary: 'Initial consultation call'
        },
        {
          customer_id: customer1Id,
          type: 'Email',
          date: interactionDate2,
          summary: 'Follow-up email with proposal'
        },
        {
          customer_id: customer2Id,
          type: 'Meeting',
          date: interactionDate3,
          summary: 'In-person meeting'
        }
      ])
      .execute();

    const result = await getInteractionsByCustomer(customer1Id);

    // Should return only interactions for customer1
    expect(result).toHaveLength(2);
    
    // Verify all interactions belong to the correct customer
    result.forEach(interaction => {
      expect(interaction.customer_id).toEqual(customer1Id);
    });

    // Verify interaction details
    expect(result[0].type).toEqual('Call');
    expect(result[0].summary).toEqual('Initial consultation call');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date).toEqual(interactionDate1);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].type).toEqual('Email');
    expect(result[1].summary).toEqual('Follow-up email with proposal');
    expect(result[1].date).toEqual(interactionDate2);
  });

  it('should return interactions ordered by date descending (newest first)', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0123',
        company: 'Test Company'
      })
      .returning()
      .execute();

    const customerId = customer[0].id;

    // Create interactions with different dates
    const oldDate = new Date('2024-01-01');
    const midDate = new Date('2024-01-15');
    const newDate = new Date('2024-01-30');

    await db.insert(interactionsTable)
      .values([
        {
          customer_id: customerId,
          type: 'Call',
          date: midDate,
          summary: 'Middle interaction'
        },
        {
          customer_id: customerId,
          type: 'Email',
          date: newDate,
          summary: 'Latest interaction'
        },
        {
          customer_id: customerId,
          type: 'Meeting',
          date: oldDate,
          summary: 'Oldest interaction'
        }
      ])
      .execute();

    const result = await getInteractionsByCustomer(customerId);

    expect(result).toHaveLength(3);
    
    // Verify descending order (newest first)
    expect(result[0].summary).toEqual('Latest interaction');
    expect(result[0].date).toEqual(newDate);
    
    expect(result[1].summary).toEqual('Middle interaction');
    expect(result[1].date).toEqual(midDate);
    
    expect(result[2].summary).toEqual('Oldest interaction');
    expect(result[2].date).toEqual(oldDate);

    // Verify dates are in descending order
    expect(result[0].date.getTime()).toBeGreaterThan(result[1].date.getTime());
    expect(result[1].date.getTime()).toBeGreaterThan(result[2].date.getTime());
  });

  it('should return empty array when customer has no interactions', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
      .values({
        name: 'No Interactions User',
        email: 'nointeractions@example.com',
        phone: '555-9999',
        company: 'Empty Company'
      })
      .returning()
      .execute();

    const result = await getInteractionsByCustomer(customer[0].id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array when customer does not exist', async () => {
    const nonExistentCustomerId = 99999;
    const result = await getInteractionsByCustomer(nonExistentCustomerId);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle all interaction types correctly', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
      .values({
        name: 'Multi-Type User',
        email: 'multitype@example.com',
        phone: '555-1111',
        company: 'Multi Corp'
      })
      .returning()
      .execute();

    const customerId = customer[0].id;
    const testDate = new Date('2024-01-15');

    // Create interactions of all types
    await db.insert(interactionsTable)
      .values([
        {
          customer_id: customerId,
          type: 'Call',
          date: testDate,
          summary: 'Phone call interaction'
        },
        {
          customer_id: customerId,
          type: 'Email',
          date: testDate,
          summary: 'Email interaction'
        },
        {
          customer_id: customerId,
          type: 'Meeting',
          date: testDate,
          summary: 'Meeting interaction'
        }
      ])
      .execute();

    const result = await getInteractionsByCustomer(customerId);

    expect(result).toHaveLength(3);
    
    // Verify all interaction types are present
    const types = result.map(interaction => interaction.type);
    expect(types).toContain('Call');
    expect(types).toContain('Email');
    expect(types).toContain('Meeting');

    // Verify all interactions have proper structure
    result.forEach(interaction => {
      expect(interaction.id).toBeDefined();
      expect(interaction.customer_id).toEqual(customerId);
      expect(['Call', 'Email', 'Meeting']).toContain(interaction.type);
      expect(interaction.date).toBeInstanceOf(Date);
      expect(interaction.summary).toBeDefined();
      expect(interaction.created_at).toBeInstanceOf(Date);
    });
  });
});