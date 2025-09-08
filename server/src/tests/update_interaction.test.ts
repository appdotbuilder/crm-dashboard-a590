import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, interactionsTable } from '../db/schema';
import { type UpdateInteractionInput, type CreateCustomerInput } from '../schema';
import { updateInteraction } from '../handlers/update_interaction';
import { eq } from 'drizzle-orm';

// Create test customer first since interactions require a valid customer_id
const testCustomer: CreateCustomerInput = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '123-456-7890',
  company: 'Test Company'
};

// Create test interaction data
const createTestInteraction = async (customerId: number) => {
  const result = await db.insert(interactionsTable)
    .values({
      customer_id: customerId,
      type: 'Call',
      date: new Date('2024-01-01'),
      summary: 'Initial call summary'
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateInteraction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update interaction type', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test interaction
    const interaction = await createTestInteraction(customer.id);

    // Update interaction type
    const updateInput: UpdateInteractionInput = {
      id: interaction.id,
      type: 'Email'
    };

    const result = await updateInteraction(updateInput);

    expect(result.id).toEqual(interaction.id);
    expect(result.customer_id).toEqual(customer.id);
    expect(result.type).toEqual('Email');
    expect(result.date).toEqual(interaction.date);
    expect(result.summary).toEqual(interaction.summary);
    expect(result.created_at).toEqual(interaction.created_at);
  });

  it('should update interaction date', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test interaction
    const interaction = await createTestInteraction(customer.id);

    // Update interaction date
    const newDate = new Date('2024-02-15');
    const updateInput: UpdateInteractionInput = {
      id: interaction.id,
      date: newDate
    };

    const result = await updateInteraction(updateInput);

    expect(result.id).toEqual(interaction.id);
    expect(result.customer_id).toEqual(customer.id);
    expect(result.type).toEqual(interaction.type);
    expect(result.date).toEqual(newDate);
    expect(result.summary).toEqual(interaction.summary);
    expect(result.created_at).toEqual(interaction.created_at);
  });

  it('should update interaction summary', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test interaction
    const interaction = await createTestInteraction(customer.id);

    // Update interaction summary
    const updateInput: UpdateInteractionInput = {
      id: interaction.id,
      summary: 'Updated summary with new details'
    };

    const result = await updateInteraction(updateInput);

    expect(result.id).toEqual(interaction.id);
    expect(result.customer_id).toEqual(customer.id);
    expect(result.type).toEqual(interaction.type);
    expect(result.date).toEqual(interaction.date);
    expect(result.summary).toEqual('Updated summary with new details');
    expect(result.created_at).toEqual(interaction.created_at);
  });

  it('should update multiple fields at once', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test interaction
    const interaction = await createTestInteraction(customer.id);

    // Update multiple fields
    const newDate = new Date('2024-03-10');
    const updateInput: UpdateInteractionInput = {
      id: interaction.id,
      type: 'Meeting',
      date: newDate,
      summary: 'Important meeting notes'
    };

    const result = await updateInteraction(updateInput);

    expect(result.id).toEqual(interaction.id);
    expect(result.customer_id).toEqual(customer.id);
    expect(result.type).toEqual('Meeting');
    expect(result.date).toEqual(newDate);
    expect(result.summary).toEqual('Important meeting notes');
    expect(result.created_at).toEqual(interaction.created_at);
  });

  it('should save changes to database', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test interaction
    const interaction = await createTestInteraction(customer.id);

    // Update interaction
    const updateInput: UpdateInteractionInput = {
      id: interaction.id,
      type: 'Email',
      summary: 'Email correspondence summary'
    };

    await updateInteraction(updateInput);

    // Verify changes in database
    const interactions = await db.select()
      .from(interactionsTable)
      .where(eq(interactionsTable.id, interaction.id))
      .execute();

    expect(interactions).toHaveLength(1);
    const updatedInteraction = interactions[0];
    expect(updatedInteraction.type).toEqual('Email');
    expect(updatedInteraction.summary).toEqual('Email correspondence summary');
    expect(updatedInteraction.date).toEqual(interaction.date); // Unchanged
  });

  it('should throw error when interaction does not exist', async () => {
    const updateInput: UpdateInteractionInput = {
      id: 99999,
      summary: 'This should fail'
    };

    expect(updateInteraction(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test interaction
    const interaction = await createTestInteraction(customer.id);

    // Update only one field
    const updateInput: UpdateInteractionInput = {
      id: interaction.id,
      type: 'Meeting'
    };

    const result = await updateInteraction(updateInput);

    // Only type should change, other fields should remain the same
    expect(result.type).toEqual('Meeting');
    expect(result.date).toEqual(interaction.date);
    expect(result.summary).toEqual(interaction.summary);
    expect(result.customer_id).toEqual(interaction.customer_id);
    expect(result.created_at).toEqual(interaction.created_at);
  });
});