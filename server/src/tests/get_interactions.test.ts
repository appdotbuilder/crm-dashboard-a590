import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { interactionsTable, customersTable } from '../db/schema';
import { getInteractions } from '../handlers/get_interactions';

describe('getInteractions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no interactions exist', async () => {
    const result = await getInteractions();
    expect(result).toEqual([]);
  });

  it('should return all interactions', async () => {
    // Create test customer first (required for foreign key)
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0123',
        company: 'Test Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test interactions
    const testInteractions = [
      {
        customer_id: customerId,
        type: 'Call' as const,
        date: new Date('2024-01-15T10:00:00Z'),
        summary: 'Initial contact call'
      },
      {
        customer_id: customerId,
        type: 'Email' as const,
        date: new Date('2024-01-16T14:30:00Z'),
        summary: 'Follow-up email sent'
      },
      {
        customer_id: customerId,
        type: 'Meeting' as const,
        date: new Date('2024-01-17T09:00:00Z'),
        summary: 'Product demonstration meeting'
      }
    ];

    await db.insert(interactionsTable)
      .values(testInteractions)
      .execute();

    const result = await getInteractions();

    expect(result).toHaveLength(3);

    // Verify each interaction has required fields
    result.forEach(interaction => {
      expect(interaction.id).toBeDefined();
      expect(interaction.customer_id).toEqual(customerId);
      expect(['Call', 'Email', 'Meeting']).toContain(interaction.type);
      expect(interaction.date).toBeInstanceOf(Date);
      expect(interaction.summary).toBeDefined();
      expect(interaction.created_at).toBeInstanceOf(Date);
    });

    // Verify specific interaction data
    const callInteraction = result.find(i => i.type === 'Call');
    expect(callInteraction?.summary).toEqual('Initial contact call');
    
    const emailInteraction = result.find(i => i.type === 'Email');
    expect(emailInteraction?.summary).toEqual('Follow-up email sent');
    
    const meetingInteraction = result.find(i => i.type === 'Meeting');
    expect(meetingInteraction?.summary).toEqual('Product demonstration meeting');
  });

  it('should return interactions from multiple customers', async () => {
    // Create two test customers
    const customer1Result = await db.insert(customersTable)
      .values({
        name: 'Customer One',
        email: 'customer1@example.com',
        phone: '555-0001',
        company: 'Company One'
      })
      .returning()
      .execute();

    const customer2Result = await db.insert(customersTable)
      .values({
        name: 'Customer Two',
        email: 'customer2@example.com',
        phone: '555-0002',
        company: 'Company Two'
      })
      .returning()
      .execute();

    const customer1Id = customer1Result[0].id;
    const customer2Id = customer2Result[0].id;

    // Create interactions for both customers
    await db.insert(interactionsTable)
      .values([
        {
          customer_id: customer1Id,
          type: 'Call',
          date: new Date('2024-01-15T10:00:00Z'),
          summary: 'Call with customer one'
        },
        {
          customer_id: customer2Id,
          type: 'Email',
          date: new Date('2024-01-16T14:30:00Z'),
          summary: 'Email to customer two'
        }
      ])
      .execute();

    const result = await getInteractions();

    expect(result).toHaveLength(2);
    
    const customerIds = result.map(i => i.customer_id);
    expect(customerIds).toContain(customer1Id);
    expect(customerIds).toContain(customer2Id);
  });

  it('should handle various interaction types correctly', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0123',
        company: 'Test Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create interactions with all possible types
    await db.insert(interactionsTable)
      .values([
        {
          customer_id: customerId,
          type: 'Call',
          date: new Date(),
          summary: 'Phone call interaction'
        },
        {
          customer_id: customerId,
          type: 'Email',
          date: new Date(),
          summary: 'Email interaction'
        },
        {
          customer_id: customerId,
          type: 'Meeting',
          date: new Date(),
          summary: 'Meeting interaction'
        }
      ])
      .execute();

    const result = await getInteractions();

    expect(result).toHaveLength(3);
    
    const types = result.map(i => i.type);
    expect(types).toContain('Call');
    expect(types).toContain('Email');
    expect(types).toContain('Meeting');
  });
});