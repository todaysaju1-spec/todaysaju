-- Phase 3: 테넌트별 테마/카피/기능 커스터마이징 기반
-- 기존 사이트(todaysaju)의 현재 값을 그대로 시드해서, 적용해도 화면이 바뀌지 않도록 함.

CREATE TABLE IF NOT EXISTS public.tenant_themes (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  site_name text NOT NULL,
  tagline text,
  meta_description text,
  primary_color text NOT NULL DEFAULT '#D4AF37',
  accent_color text NOT NULL DEFAULT '#F3E5AB',
  background_color text NOT NULL DEFAULT '#0a0514',
  logo_url text,
  favicon_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_features (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, feature_key)
);

INSERT INTO public.tenant_themes (tenant_id, site_name, tagline, meta_description, primary_color, accent_color, background_color)
SELECT
  id,
  '오늘의사주 PRO',
  '소름 돋게 정확한 명리학 & 타로',
  '30년 경력 명리학자가 인정한 바로 보는 프리미엄 사주! 나의 오늘 운세, 재물운, 연애운부터 정통 명리학 풀이까지 지금 바로 확인하세요.',
  '#D4AF37',
  '#F3E5AB',
  '#0a0514'
FROM public.tenants
WHERE slug = 'todaysaju'
ON CONFLICT (tenant_id) DO NOTHING;

ALTER TABLE public.tenant_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;

-- 테마/기능 플래그는 화면 렌더링에 필요하므로 공개 조회만 허용 (수정은 service_role만)
DROP POLICY IF EXISTS "tenant_themes_public_select" ON public.tenant_themes;
CREATE POLICY "tenant_themes_public_select" ON public.tenant_themes FOR SELECT USING (true);

DROP POLICY IF EXISTS "tenant_features_public_select" ON public.tenant_features;
CREATE POLICY "tenant_features_public_select" ON public.tenant_features FOR SELECT USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_themes TO service_role;
GRANT SELECT ON public.tenant_themes TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_features TO service_role;
GRANT SELECT ON public.tenant_features TO anon, authenticated;
