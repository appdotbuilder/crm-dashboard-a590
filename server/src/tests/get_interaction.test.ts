import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, interactionsTable } from '../db/schema';
import { getInteraction } from '../handlers/get_interaction';
import { eq } from 'drizzle-orm';

describe('getInteraction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return interaction when ID exists', async () => {
    // Create a test customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create a test interaction
    const interactionResult = await db.insert(interactionsTable)
      .values({
        customer_id: customerId,
        type: 'Call',
        date: new Date('2024-01-15T10:30:00Z'),
        summary: 'Initial sales call discussion'
      })
      .returning()
      .execute();

    const interactionId = interactionResult[0].id;

    // Test the handler
    const result = await getInteraction(interactionId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(interactionId);
    expect(result!.customer_id).toBe(customerId);
    expect(result!.type).toBe('Call');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.summary).toBe('Initial sales call discussion');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when interaction ID does not exist', async () => {
    const result = await getInteraction(99999);
    expect(result).toBeNull();
  });

  it('should handle different interaction types correctly', async () => {
    // Create a test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Company'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create interactions with different types
    const emailInteraction = await db.insert(interactionsTable)
      .values({
        customer_id: customerId,
        type: 'Email',
        date: new Date('2024-01-16T14:00:00Z'),
        summary: 'Follow-up email sent'
      })
      .returning()
      .execute();

    const meetingInteraction = await db.insert(interactionsTable)
      .values({
        customer_id: customerId,
        type: 'Meeting',
        date: new Date('2024-01-17T09:00:00Z'),
        summary: 'In-person meeting scheduled'
      })
      .returning()
      .execute();

    // Test Email interaction
    const emailResult = await getInteraction(emailInteraction[0].id);
    expect(emailResult).not.toBeNull();
    expect(emailResult!.type).toBe('Email');
    expect(emailResult!.summary).toBe('Follow-up email sent');

    // Test Meeting interaction
    const meetingResult = await getInteraction(meetingInteraction[0].id);
    expect(meetingResult).not.toBeNull();
    expect(meetingResult!.type).toBe('Meeting');
    expect(meetingResult!.summary).toBe('In-person meeting scheduled');
  });

  it('should verify data is saved correctly in database', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Database Test Customer',
        email: 'dbtest@example.com',
        phone: '987-654-3210',
        company: 'DB Test Co'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create interaction
    const testDate = new Date('2024-01-20T11:45:00Z');
    const interactionResult = await db.insert(interactionsTable)
      .values({
        customer_id: customerId,
        type: 'Call',
        date: testDate,
        summary: 'Database verification call'
      })
      .returning()
      .execute();

    const interactionId = interactionResult[0].id;

    // Get interaction using handler
    const handlerResult = await getInteraction(interactionId);

    // Verify against direct database query
    const directDbResult = await db.select()
      .from(interactionsTable)
      .where(eq(interactionsTable.id, interactionId))
      .execute();

    expect(handlerResult).not.toBeNull();
    expect(directDbResult).toHaveLength(1);
    
    // Compare results
    const dbInteraction = directDbResult[0];
    expect(handlerResult!.id).toBe(dbInteraction.id);
    expect(handlerResult!.customer_id).toBe(dbInteraction.customer_id);
    expect(handlerResult!.type).toBe(dbInteraction.type);
    expect(handlerResult!.date.getTime()).toBe(dbInteraction.date.getTime());
    expect(handlerResult!.summary).toBe(dbInteraction.summary);
    expect(handlerResult!.created_at.getTime()).toBe(dbInteraction.created_at.getTime());
  });
});