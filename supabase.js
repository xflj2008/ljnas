/**
 * Supabase 统一入口
 */
const SUPABASE_URL = 'https://zbczzlefrjvwxbzbjzkw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiY3p6bGVmcmp2d3hiemJqemt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNjEyMTYsImV4cCI6MjA2MTYzNzIxNn0.YRNFNDr6fYTCgdD5Q6bJHC7E1_8qmvHtLg3g4bJNk7E';

const { createClient } = window.supabaseLib;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
