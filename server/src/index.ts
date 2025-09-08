import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCustomerInputSchema,
  updateCustomerInputSchema,
  createSaleInputSchema,
  updateSaleInputSchema,
  createInteractionInputSchema,
  updateInteractionInputSchema
} from './schema';

// Import handlers
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { getCustomer } from './handlers/get_customer';
import { updateCustomer } from './handlers/update_customer';
import { getCustomerWithRelations } from './handlers/get_customer_with_relations';

import { createSale } from './handlers/create_sale';
import { getSales } from './handlers/get_sales';
import { getSale } from './handlers/get_sale';
import { updateSale } from './handlers/update_sale';
import { getSalesByCustomer } from './handlers/get_sales_by_customer';

import { createInteraction } from './handlers/create_interaction';
import { getInteractions } from './handlers/get_interactions';
import { getInteraction } from './handlers/get_interaction';
import { updateInteraction } from './handlers/update_interaction';
import { getInteractionsByCustomer } from './handlers/get_interactions_by_customer';

import { getDashboardOverview } from './handlers/get_dashboard_overview';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Dashboard
  getDashboardOverview: publicProcedure
    .query(() => getDashboardOverview()),

  // Customer routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),
  
  getCustomer: publicProcedure
    .input(z.number())
    .query(({ input }) => getCustomer(input)),
  
  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),
  
  getCustomerWithRelations: publicProcedure
    .input(z.number())
    .query(({ input }) => getCustomerWithRelations(input)),

  // Sale routes
  createSale: publicProcedure
    .input(createSaleInputSchema)
    .mutation(({ input }) => createSale(input)),
  
  getSales: publicProcedure
    .query(() => getSales()),
  
  getSale: publicProcedure
    .input(z.number())
    .query(({ input }) => getSale(input)),
  
  updateSale: publicProcedure
    .input(updateSaleInputSchema)
    .mutation(({ input }) => updateSale(input)),
  
  getSalesByCustomer: publicProcedure
    .input(z.number())
    .query(({ input }) => getSalesByCustomer(input)),

  // Interaction routes
  createInteraction: publicProcedure
    .input(createInteractionInputSchema)
    .mutation(({ input }) => createInteraction(input)),
  
  getInteractions: publicProcedure
    .query(() => getInteractions()),
  
  getInteraction: publicProcedure
    .input(z.number())
    .query(({ input }) => getInteraction(input)),
  
  updateInteraction: publicProcedure
    .input(updateInteractionInputSchema)
    .mutation(({ input }) => updateInteraction(input)),
  
  getInteractionsByCustomer: publicProcedure
    .input(z.number())
    .query(({ input }) => getInteractionsByCustomer(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();