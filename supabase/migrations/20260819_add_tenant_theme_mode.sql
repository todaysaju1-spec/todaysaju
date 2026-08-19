-- Phase 3 후속: tenant_themes에 라이트/다크 모드 컬럼 추가
-- todaysaju는 기존 그대로 'dark' 유지.

ALTER TABLE public.tenant_themes ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'dark';

DO $$
BEGIN
  ALTER TABLE public.tenant_themes ADD CONSTRAINT tenant_themes_mode_check CHECK (mode IN ('dark', 'light'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.tenant_themes SET mode = 'dark' WHERE mode IS NULL;
