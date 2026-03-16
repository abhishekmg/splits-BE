import { createSwaggerSpec } from 'next-swagger-doc';

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Splits API',
        version: '1.0.0',
        description: 'Splitwise clone backend API. Manage groups, expenses, splits, balances, and settlements.',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Supabase JWT token from login/signup',
          },
        },
      },
      security: [],
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User search' },
        { name: 'Groups', description: 'Group management' },
        { name: 'Invitations', description: 'Group invitations' },
        { name: 'Expenses', description: 'Expense management' },
        { name: 'Balances', description: 'Balance computation' },
        { name: 'Settlements', description: 'Settlement recording' },
      ],
    },
  });
}
