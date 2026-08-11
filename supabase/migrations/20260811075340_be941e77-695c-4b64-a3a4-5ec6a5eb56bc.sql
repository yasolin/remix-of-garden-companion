-- 1. Profiles: restrict PII
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Safe, limited public view for community features (no PII)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off)
AS SELECT user_id, display_name, avatar_url FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. Notifications: only for yourself
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. SECURITY DEFINER functions should not be API-callable
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_post_comments_count() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_post_likes_count() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;