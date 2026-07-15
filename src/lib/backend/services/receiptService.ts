import type { ReceiptRepository } from "../contracts/payment.contract";
import type { ReceiptService } from "../contracts/payment.contract";
import type { ActorContext, BackendResult } from "../contracts/common.contract";
import type { ReceiptDTO } from "../dto/payment.dto";
import { notFoundError } from "../errors/createBackendError";
import { ok, fail, fromThrowable } from "../errors/resultHelpers";
import { validateReceiptTokenInput } from "../validation/paymentSchemas";

export function createReceiptService(deps: {
  receiptRepository: ReceiptRepository;
}): ReceiptService {
  const { receiptRepository } = deps;

  return {
    async getReceiptByToken(
      receiptId: string, 
      token: string, 
      actor: ActorContext
    ): Promise<BackendResult<ReceiptDTO>> {
      try {
        const validation = validateReceiptTokenInput({ receiptId, token });
        if (!validation.ok) return fail(validation.error!);

        const receipt = await receiptRepository.findByReceiptIdAndToken(
          validation.data!.receiptId, 
          validation.data!.token
        );

        if (!receipt) {
          return fail(notFoundError("Receipt not found or invalid token.", "RECEIPT_NOT_FOUND"));
        }

        // Best effort view count increment
        receiptRepository.incrementViewCount(receipt.receiptId).catch(() => {
          console.error(`[${actor.requestId}] Receipt view count increment failed.`);
        });

        return ok(receipt);
      } catch (err) {
        return fail(fromThrowable(err));
      }
    }
  };
}
