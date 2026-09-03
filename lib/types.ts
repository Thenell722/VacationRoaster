export type Role = 'ADMIN' | 'EMPLOYEE';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export const ROLES: Role[] = ['ADMIN', 'EMPLOYEE'];
export const STATUSES: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
