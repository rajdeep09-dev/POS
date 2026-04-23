"use client";

import React from 'react';
import { useTenant } from '@/components/providers/TenantProvider';

interface RoleGateProps {
  allowedRoles: Array<'admin' | 'manager' | 'cashier'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Enterprise RBAC Gate
 * Conditionally renders content based on the authenticated user's role.
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { role, isLoading } = useTenant();

  if (isLoading) return null;

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
