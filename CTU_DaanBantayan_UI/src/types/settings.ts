import { Quarter } from './api';

export interface SchoolYear {
  yearRange: string;
  id: number;
  startDate: string;
  endDate: string;
  termType: 'QUARTER';
  isActive: boolean;
  isArchived: boolean;
}

export interface SchoolProfile {
  id?: number;
  name: string;
  address?: string;
  contactInfo?: string;
  email?: string;
  officeHours?: string;
  logoUrl?: string;
  updatedAt?: string;
}

export interface SecuritySettings {
  passwordMinLength: number;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpirationDays: number;
  twoFactorEnabled: boolean;
  twoFactorRequiredForAdmins: boolean;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  category: string;
  content: string;
  type: 'SMS' | 'EMAIL';
  variables: string[];
}

export interface BackupPoint {
  id: number;
  createdAt: string;
  size?: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  filePath?: string;
}

export interface SchoolYearQuarter {
  id: number;
  schoolYear: SchoolYear;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt?: string;
}

export interface ActiveQuarterResponse {
  schoolYear: string;
  activeQuarter: Quarter;
  quarterDetails: {
    id: number;
    startDate: string;
    endDate: string;
    status: string;
  };
}

export interface ThemeSettings {
  theme: 'light' | 'dark';
}

