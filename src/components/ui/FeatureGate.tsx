"use client";

import React from 'react';
import { useTenant } from '@/components/providers/TenantProvider';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Enterprise Feature Gate
 * Conditionally renders content based on the tenant's active features.
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { hasFeature, isLoading } = useTenant();

  if (isLoading) return null;

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
