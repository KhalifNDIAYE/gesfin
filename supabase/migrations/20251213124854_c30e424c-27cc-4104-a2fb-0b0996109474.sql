-- Fix 1: Remove duplicate SELECT policy on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Fix 2: Enable security_invoker on user_names view to inherit RLS from profiles table
ALTER VIEW user_names SET (security_invoker = on);