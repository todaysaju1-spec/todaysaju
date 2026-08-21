-- Phase 3 후속: 캐릭터(꽃미남 명리사) 테마 추가
-- mode에 'character' 허용 + 캐릭터 이미지 URL 3종 컬럼 추가.

ALTER TABLE public.tenant_themes DROP CONSTRAINT IF EXISTS tenant_themes_mode_check;
ALTER TABLE public.tenant_themes ADD CONSTRAINT tenant_themes_mode_check CHECK (mode IN ('dark', 'light', 'character'));

ALTER TABLE public.tenant_themes ADD COLUMN IF NOT EXISTS character_hero_image_url text;
ALTER TABLE public.tenant_themes ADD COLUMN IF NOT EXISTS character_loading_image_url text;
ALTER TABLE public.tenant_themes ADD COLUMN IF NOT EXISTS character_result_image_url text;
