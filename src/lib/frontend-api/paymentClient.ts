import { fetchApi } from './httpClient';
import type { CreatePaymentIntentInput } from '../backend/contracts/payment.contract';
import type { PaymentIntentDTO } from '../backend/dto/payment.dto';

export const paymentClient = {
  createIntent: (input: CreatePaymentIntentInput) =>
    fetchApi<PaymentIntentDTO>('/payments/intent', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
