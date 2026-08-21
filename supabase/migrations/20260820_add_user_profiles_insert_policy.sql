-- 게스트(익명) 세션에서 무료 사주를 볼 때 saveMyProfile()이 클라이언트에서 직접
-- user_profiles에 upsert를 시도하는데, INSERT를 허용하는 RLS 정책이 없어서
-- "new row violates row-level security policy for table user_profiles" 에러로 실패했다.
-- (기존에는 회원가입 시 별도 트리거/서버 로직으로 먼저 row가 만들어져 있어서
--  클라이언트는 UPDATE만 하면 됐기 때문에 이 문제가 드러나지 않았던 것으로 보인다.)
--
-- 본인 소유 row(id = auth.uid())에 한해 INSERT를 허용한다. 익명/일반 계정 모두 동일하게 적용.

DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
