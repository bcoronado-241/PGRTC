import type { StatusLevel } from '../utils/status';

export type { StatusLevel };

export type UserRole = 'admin' | 'rescuer';
export type CenterType = 'hospital' | 'collection_center';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type AlertLevel = 'red' | 'yellow';

export interface User {
  id: number;
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date;
}

export interface PublicUser {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: Date;
}

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface Center {
  id: number;
  center_name: string;
  type: CenterType;
  latitude: number;
  longitude: number;
  status: StatusLevel;
  created_at: Date;
}

export interface Supply {
  id: number;
  supply_name: string;
  unit: string;
  created_at: Date;
}

export interface Inventory {
  id: number;
  center_id: number;
  supply_id: number;
  quantity: number;
  min_threshold: number;
  status: StatusLevel;
  updated_at: Date;
}

export interface RedistributionRequest {
  id: number;
  source_center_id: number;
  target_center_id: number;
  supply_id: number;
  quantity: number;
  status: RequestStatus;
  requested_by: number;
  created_at: Date;
  resolved_at: Date | null;
}

export interface Alert {
  id: number;
  center_id: number;
  supply_id: number;
  alert_level: AlertLevel;
  message: string;
  created_at: Date;
}

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
