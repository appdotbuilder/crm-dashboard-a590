import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const saleStatusEnum = pgEnum('sale_status', ['Pending', 'Completed', 'Cancelled']);
export const interactionTypeEnum = pgEnum('interaction_type', ['Call', 'Email', 'Meeting']);

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  company: text('company').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Sales table
export const salesTable = pgTable('sales', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customersTable.id).notNull(),
  product_service: text('product_service').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  status: saleStatusEnum('status').notNull().default('Pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Interactions table
export const interactionsTable = pgTable('interactions', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customersTable.id).notNull(),
  type: interactionTypeEnum('type').notNull(),
  date: timestamp('date').notNull(),
  summary: text('summary').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  sales: many(salesTable),
  interactions: many(interactionsTable),
}));

export const salesRelations = relations(salesTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [salesTable.customer_id],
    references: [customersTable.id],
  }),
}));

export const interactionsRelations = relations(interactionsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [interactionsTable.customer_id],
    references: [customersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;

export type Sale = typeof salesTable.$inferSelect;
export type NewSale = typeof salesTable.$inferInsert;

export type Interaction = typeof interactionsTable.$inferSelect;
export type NewInteraction = typeof interactionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  customers: customersTable,
  sales: salesTable,
  interactions: interactionsTable,
};

export const relationsList = {
  customersRelations,
  salesRelations,
  interactionsRelations,
};