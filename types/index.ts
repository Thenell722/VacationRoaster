export type Role = 'ADMIN' | 'EMPLOYEE';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Holiday {
  id: string;
  name: string;
  date: string;
}

export interface VacationBalance {
  annualAllowance: number;
  carryOverDays: number;
  approvedDays: number;
  pendingDays: number;
  remaining: number;
}
