import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, interactionsTable } from '../db/schema';
import { type CreateInteractionInput } from '../schema';
import { createInteraction } from '../handlers/create_interaction';
import { eq } from 'drizzle-orm';

describe('createInteraction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCustomerId: number;

  beforeEach(async () => {
    // Create a test customer for foreign key reference
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Company'
      })
      .returning()
      .execute();
    
    testCustomerId = customerResult[0].id;
  });

  const testInput: CreateInteractionInput = {
    customer_id: 0, // Will be set in each test
    type: 'Call',
    date: new Date('2024-01-15T10:30:00Z'),
    summary: 'Initial sales call to discuss requirements'
  };

  it('should create an interaction', async () => {
    const input = { ...testInput, customer_id: testCustomerId };
    const result = await createInteraction(input);

    // Basic field validation
    expect(result.customer_id).toEqual(testCustomerId);
    expect(result.type).toEqual('Call');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.summary).toEqual('Initial sales call to discuss requirements');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save interaction to database', async () => {
    const input = { ...testInput, customer_id: testCustomerId };
    const result = await createInteraction(input);

    // Query the database to verify the interaction was saved
    const interactions = await db.select()
      .from(interactionsTable)
      .where(eq(interactionsTable.id, result.id))
      .execute();

    expect(interactions).toHaveLength(1);
    expect(interactions[0].customer_id).toEqual(testCustomerId);
    expect(interactions[0].type).toEqual('Call');
    expect(interactions[0].date).toBeInstanceOf(Date);
    expect(interactions[0].summary).toEqual('Initial sales call to discuss requirements');
    expect(interactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different interaction types', async () => {
    const emailInput = { 
      ...testInput, 
      customer_id: testCustomerId,
      type: 'Email' as const,
      summary: 'Follow-up email with proposal details'
    };
    
    const result = await createInteraction(emailInput);

    expect(result.type).toEqual('Email');
    expect(result.summary).toEqual('Follow-up email with proposal details');

    // Test Meeting type
    const meetingInput = { 
      ...testInput, 
      customer_id: testCustomerId,
      type: 'Meeting' as const,
      summary: 'In-person meeting to finalize contract terms'
    };
    
    const meetingResult = await createInteraction(meetingInput);

    expect(meetingResult.type).toEqual('Meeting');
    expect(meetingResult.summary).toEqual('In-person meeting to finalize contract terms');
  });

  it('should throw error when customer does not exist', async () => {
    const input = { ...testInput, customer_id: 99999 }; // Non-existent customer ID
    
    expect(createInteraction(input)).rejects.toThrow(/Customer with id 99999 does not exist/i);
  });

  it('should handle different date formats correctly', async () => {
    const futureDate = new Date('2024-12-25T15:45:30Z');
    const input = { 
      ...testInput, 
      customer_id: testCustomerId,
      date: futureDate,
      summary: 'Scheduled follow-up meeting'
    };
    
    const result = await createInteraction(input);

    expect(result.date).toBeInstanceOf(Date);
    expect(result.date).toEqual(futureDate);

    // Verify in database
    const savedInteraction = await db.select()
      .from(interactionsTable)
      .where(eq(interactionsTable.id, result.id))
      .execute();

    expect(savedInteraction[0].date).toBeInstanceOf(Date);
    expect(savedInteraction[0].date).toEqual(futureDate);
  });
});