-- Phase 2 후속: user_profiles.tenant_id를 나머지 테이블과 동일한 체계로 통합
--
-- 배경: user_profiles에는 이미 tenant_id(text) 컬럼이 있었고, 과거 화이트라벨
-- 시도의 흔적으로 "client_a"(신규 유저 기본값, 앱 코드에 하드코딩되어 있었음)
-- 또는 "main"(그 이전 유저) 값이 들어있었음. 실제로는 둘 다 같은 사이트
-- (오늘의사주 하나)를 가리키고, 다른 도메인은 운영 중이 아님이 확인됨.
-- 따라서 두 값을 모두 tenants 테이블의 'todaysaju' 테넌트로 통합하고,
-- 컬럼 타입을 다른 테이블(saju_history/payment_logs/deposit_requests)과
-- 동일하게 uuid + FK로 맞춘다.
--
-- 적용 방법: Supabase 대시보드 > SQL Editor에서 전체 실행.
-- 전제조건: 20260819_add_tenants.sql이 먼저 적용되어 있어야 함(tenants 테이블 존재).

DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'todaysaju';

  IF default_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenants 테이블에 todaysaju 테넌트가 없습니다. 20260819_add_tenants.sql을 먼저 실행하세요.';
  END IF;

  -- 기존 값("client_a", "main" 등)은 전부 이 값으로 대체 (현재 운영 중인 도메인은 하나뿐이라 전부 동일 테넌트)
  UPDATE public.user_profiles SET tenant_id = default_tenant_id::text;

  -- 컬럼 타입을 text -> uuid로 변환
  ALTER TABLE public.user_profiles ALTER COLUMN tenant_id DROP DEFAULT;
  ALTER TABLE public.user_profiles ALTER COLUMN tenant_id TYPE uuid USING tenant_id::uuid;

  -- 나머지 테이블과 동일하게 FK + 기본값 설정 (재실행 대비 이미 있으면 무시)
  BEGIN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  EXECUTE format('ALTER TABLE public.user_profiles ALTER COLUMN tenant_id SET DEFAULT %L::uuid', default_tenant_id);
  ALTER TABLE public.user_profiles ALTER COLUMN tenant_id SET NOT NULL;
END $$;
