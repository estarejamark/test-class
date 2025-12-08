/**
 * Authentication-related TypeScript interfaces and types
 * These types match the backend DTOs from the Kotlin Spring Boot API
 */

import { Gender } from "./api";

// Enums from backend - Order must match backend RoleEnum.kt
export enum Role {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  ADVISER = "ADVISER",
}

// Request DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  role: Role;
}

export interface TokenRequest {
  id: string;
  hashedAccessToken: string;
  hashedRefreshToken: string;
}

export interface ProfileRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  birthDate: string; // YYYY-MM-DD format
  contactNumber: string;
  address: string;
}

// Response DTOs
export interface UserResponse {
  id: string;
  email: string;
  role: Role;
  membershipCode?: string; // Added based on actual backend response
  createdAt?: string; // Made optional
  updatedAt?: string; // Made optional
}

export interface ProfileResponse {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD format
  contactNumber: string;
  address: string;
  parentName?: string;
  parentContact?: string;
  gradeLevel?: string;
  isAdviser?: boolean;
  profileImage?: string;
  user: UserResponse;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  userResponse: UserResponse;
  authorization: TokenRequest;
  profileComplete: boolean;
}

// Frontend-specific types
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserResponse | null;
  profile: ProfileResponse | null;
  accessToken?: string;
  refreshToken?: string;
  error: string | null;
}

export interface AuthContextType {
  // State
  authState: AuthState;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<ProfileResponse | void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;

  // Convenience properties
  user: UserResponse | null;
  profile: ProfileResponse | null;
  isProfileComplete: boolean;

  // Computed properties
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

// Error types
export interface AuthError {
  message: string;
  status?: number;
  field?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

// API Error response from backend
export interface ApiErrorResponse {
  message: string;
  status: number;
  timestamp: string;
  path: string;
  details?: unknown;
}

// JWT Token payload (for client-side token parsing if needed)
export interface JwtPayload {
  sub: string; // User ID
  type: "access" | "refresh";
  iat: number; // Issued at
  exp: number; // Expires at
}

// Profile creation/update types
export interface CreateProfileData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface UpdateProfileData extends Partial<CreateProfileData> {
  id: string;
}

// Authentication status check response
export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user?: UserResponse;
  profile?: ProfileResponse;
}

// Refresh token response
export interface RefreshTokenResponse {
  accessToken: string;
  user: UserResponse;
}

// Cookie configuration
export interface CookieConfig {
  name: string;
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
}
