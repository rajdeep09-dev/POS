'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function login(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: authData, error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  if (authData.user) {
    // Initial profile creation (without tenant_id yet)
    await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: formData.get('full_name') as string,
      role: 'admin'
    });
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function completeOnboarding(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const businessName = formData.get('business_name') as string;
  const themeColor = formData.get('theme_color') as string;
  const features = formData.getAll('features') as string[];

  // 1. Create Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      business_name: businessName,
      theme_color: themeColor,
      active_features: features,
      owner_id: user.id
    })
    .select()
    .single();

  if (tenantError) {
    return { error: tenantError.message };
  }

  // 2. Update Profile with tenant_id
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ tenant_id: tenant.id })
    .eq('id', user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
