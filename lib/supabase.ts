import { createClient } from '@supabase/supabase-js';

// Safely handle environments where import.meta.env might be undefined to prevent crash
const supabaseUrl = (import.meta.env as any)?.VITE_SUPABASE_URL || 'https://cesvueahhotaddamlucj.supabase.co';
const supabaseAnonKey = (import.meta.env as any)?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlc3Z1ZWFoaG90YWRkYW1sdWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODU4NjYsImV4cCI6MjA4MTA2MTg2Nn0.MG6PE8olrxH7fVIdpf1b1Vhl_4uxbUv303i0F6QaI2I';

console.log('Supabase client initialized with URL:', supabaseUrl ? 'success' : 'missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);