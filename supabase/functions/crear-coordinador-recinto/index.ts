import { handleCreateAccount } from '../_shared/create-account.ts';

/**
 * Edge Function: crear-coordinador-recinto (R2 / R4 / ADR-002 / ADR-007)
 * Solo ejecutable por un usuario autenticado con rol 'provincial'.
 */
Deno.serve((req) =>
  handleCreateAccount(req, {
    requiredCallerRole: 'provincial',
    targetRole: 'recinto',
  }),
);
