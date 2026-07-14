import "server-only";

import { createReceiptService } from "../services/receiptService";
import { SupabaseReceiptRepository } from "../adapters/supabase/repositories/supabaseReceiptRepository";

/**
 * Server-only composition root for the Receipt Service.
 * This guarantees the Supabase Service Role Key and adapter logic 
 * are never bundled into the client browser.
 */

// Singleton instance to avoid recreating repositories per request
let receiptServiceInstance: ReturnType<typeof createReceiptService> | null = null;

export function getReceiptService() {
  if (!receiptServiceInstance) {
    receiptServiceInstance = createReceiptService({
      receiptRepository: new SupabaseReceiptRepository(),
    });
  }
  return receiptServiceInstance;
}
