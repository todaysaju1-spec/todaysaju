-- Phase 2: 테넌트 기반 데이터 모델 도입 (화이트라벨 준비)
-- 기존 서비스는 그대로 동작하고, 새 테넌트를 위한 기반만 깔아둡니다.
-- 적용 방법: Supabase 대시보드 > SQL Editor에서 이 파일 전체를 붙여넣고 Run.

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  domain text UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.tenants (slug, name, domain)
VALUES ('todaysaju', '오늘의사주', 'todaysajupro.com')
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  default_tenant_id uuid;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'todaysaju';

  ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
  ALTER TABLE public.saju_history ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
  ALTER TABLE public.payment_logs ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
  ALTER TABLE public.deposit_requests ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

  UPDATE public.user_profiles SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.saju_history SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.payment_logs SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.deposit_requests SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;

  -- PL/pgSQL 변수는 ALTER ... SET DEFAULT 같은 DDL 상수 표현식에 직접 못 넣으므로 동적 SQL로 실행
  EXECUTE format('ALTER TABLE public.user_profiles ALTER COLUMN tenant_id SET DEFAULT %L::uuid', default_tenant_id);
  EXECUTE format('ALTER TABLE public.saju_history ALTER COLUMN tenant_id SET DEFAULT %L::uuid', default_tenant_id);
  EXECUTE format('ALTER TABLE public.payment_logs ALTER COLUMN tenant_id SET DEFAULT %L::uuid', default_tenant_id);
  EXECUTE format('ALTER TABLE public.deposit_requests ALTER COLUMN tenant_id SET DEFAULT %L::uuid', default_tenant_id);

  ALTER TABLE public.user_profiles ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.saju_history ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.payment_logs ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE public.deposit_requests ALTER COLUMN tenant_id SET NOT NULL;
END $$;

-- tenants 테이블: 도메인 -> 테넌트 매핑은 proxy.ts가 매 요청마다 읽어야 하므로 공개 조회만 허용
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_public_select" ON public.tenants;
CREATE POLICY "tenants_public_select"
ON public.tenants FOR SELECT
USING (true);

-- 이 프로젝트는 service_role 기본 권한이 비어있는 테이블이 있었음(과거 Data API 비활성화 이력) -> 명시적으로 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO service_role;
GRANT SELECT ON public.tenants TO anon, authenticated;
