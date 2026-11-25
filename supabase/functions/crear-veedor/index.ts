import { handleCreateAccount } from '../_shared/create-account.ts';

/**
 * Edge Function: crear-veedor (R2 / R5 / ADR-002 / ADR-007)
 * Solo ejecutable por un usuario autenticado con rol 'recinto'.
 * El recinto_id del veedor se toma del perfil del coordinador que llama.
 */
Deno.serve((req) =>
  handleCreateAccount(req, {
    requiredCallerRole: 'recinto',
    targetRole: 'veedor',
  }),
);
