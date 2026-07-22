import type { BackendError } from "../errors/BackendError";

export type ID = string;
export type ISODateTime = string;
export type CurrencyCode = "INR";

export interface MoneyAmount {
  amount: number;
  currency: CurrencyCode;
}

export interface BackendResultMeta {
  requestId: string;
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
  cacheStatus?: "hit" | "miss" | "bypass";
}

export interface BackendResult<T> {
  ok: boolean;
  data: T | null;
  error: BackendError | null;
  meta?: BackendResultMeta;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total?: number;
  hasMore: boolean;
  nextCursor?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortInput {
  field: string;
  direction: SortDirection;
}

export interface DateRangeInput {
  from?: ISODateTime;
  to?: ISODateTime;
}

export interface ActorContext {
  actorType: "public" | "member" | "admin" | "system";
  memberId?: ID;
  adminId?: ID;
  actorName?: string;
  permissions?: readonly string[];
  ip?: string;
  device?: string;
  requestId: string;
}

export interface AuditMetadata {
  action: string;
  entityType: string;
  entityId: ID | string;
  summary: string;
  before?: unknown;
  after?: unknown;
}
