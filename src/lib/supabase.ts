import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgssuunltiwiuevqhcef.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_0TDCXDDjRI62JCtMM7uzJw_TvMydlHb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);