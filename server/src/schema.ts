import { z } from 'zod';

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Input schema for creating customers
export const createCustomerInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required")
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Input schema for updating customers
export const updateCustomerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  company: z.string().min(1, "Company is required").optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Sale status enum
export const saleStatusEnum = z.enum(["Pending", "Completed", "Cancelled"]);
export type SaleStatus = z.infer<typeof saleStatusEnum>;

// Sale schema
export const saleSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  product_service: z.string(),
  amount: z.number(),
  date: z.coerce.date(),
  status: saleStatusEnum,
  created_at: z.coerce.date()
});

export type Sale = z.infer<typeof saleSchema>;

// Input schema for creating sales
export const createSaleInputSchema = z.object({
  customer_id: z.number(),
  product_service: z.string().min(1, "Product/Service is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  status: saleStatusEnum.default("Pending")
});

export type CreateSaleInput = z.infer<typeof createSaleInputSchema>;

// Input schema for updating sales
export const updateSaleInputSchema = z.object({
  id: z.number(),
  product_service: z.string().min(1, "Product/Service is required").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  date: z.coerce.date().optional(),
  status: saleStatusEnum.optional()
});

export type UpdateSaleInput = z.infer<typeof updateSaleInputSchema>;

// Interaction type enum
export const interactionTypeEnum = z.enum(["Call", "Email", "Meeting"]);
export type InteractionType = z.infer<typeof interactionTypeEnum>;

// Interaction schema
export const interactionSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  type: interactionTypeEnum,
  date: z.coerce.date(),
  summary: z.string(),
  created_at: z.coerce.date()
});

export type Interaction = z.infer<typeof interactionSchema>;

// Input schema for creating interactions
export const createInteractionInputSchema = z.object({
  customer_id: z.number(),
  type: interactionTypeEnum,
  date: z.coerce.date(),
  summary: z.string().min(1, "Summary is required")
});

export type CreateInteractionInput = z.infer<typeof createInteractionInputSchema>;

// Input schema for updating interactions
export const updateInteractionInputSchema = z.object({
  id: z.number(),
  type: interactionTypeEnum.optional(),
  date: z.coerce.date().optional(),
  summary: z.string().min(1, "Summary is required").optional()
});

export type UpdateInteractionInput = z.infer<typeof updateInteractionInputSchema>;

// Dashboard overview schema
export const dashboardOverviewSchema = z.object({
  total_customers: z.number(),
  total_sales: z.number(),
  total_sales_amount: z.number(),
  pending_sales: z.number(),
  completed_sales: z.number(),
  cancelled_sales: z.number(),
  total_interactions: z.number(),
  recent_interactions: z.array(interactionSchema).max(5)
});

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;

// Customer with relations schema
export const customerWithRelationsSchema = customerSchema.extend({
  sales: z.array(saleSchema),
  interactions: z.array(interactionSchema)
});

export type CustomerWithRelations = z.infer<typeof customerWithRelationsSchema>;