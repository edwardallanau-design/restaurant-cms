import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ── Schema DDL (idempotent — uses IF NOT EXISTS / DO-EXCEPTION guards) ──────
  // These are no-ops if Payload's dev-mode already pushed the schema.

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tenant_page_content_about_story_formatting_background" AS ENUM('white', 'surface', 'primary-light');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tenant_page_content_about_story_formatting_text_align" AS ENUM('center', 'left');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_tenant_page_content_about_story_formatting_container_width" AS ENUM('narrow', 'default', 'wide');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_menu_items_dietary_flags" AS ENUM('vegetarian', 'vegan', 'gluten-free', 'spicy', 'contains-nuts', 'dairy-free', 'chefs-special');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "restaurants" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "active" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "tenant_site_settings_navigation" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "label" varchar NOT NULL, "href" varchar NOT NULL)`)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "tenant_site_settings_hours" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "day" varchar NOT NULL, "open_time" varchar, "close_time" varchar, "closed" boolean DEFAULT false)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenant_site_settings" (
      "id" serial PRIMARY KEY NOT NULL, "restaurant_id" integer, "restaurant_name" varchar NOT NULL,
      "tagline" varchar, "logo_id" integer, "contact_phone" varchar, "contact_email" varchar,
      "contact_address_street" varchar, "contact_address_city" varchar, "contact_address_state" varchar,
      "contact_address_zip" varchar, "contact_address_country" varchar DEFAULT 'USA',
      "contact_google_maps_embed_url" varchar, "social_links_instagram" varchar,
      "social_links_facebook" varchar, "social_links_tiktok" varchar, "seo_meta_title" varchar,
      "seo_meta_description" varchar, "seo_og_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenant_hero_sections" (
      "id" serial PRIMARY KEY NOT NULL, "restaurant_id" integer, "heading" varchar NOT NULL,
      "subheading" varchar, "background_image_id" integer NOT NULL, "background_video" varchar,
      "primary_cta_text" varchar, "primary_cta_link" varchar, "secondary_cta_text" varchar,
      "secondary_cta_link" varchar, "overlay_opacity" numeric DEFAULT 50,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "tenant_page_content_about_values" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "icon" varchar, "title" varchar NOT NULL, "description" varchar NOT NULL)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenant_page_content" (
      "id" serial PRIMARY KEY NOT NULL, "restaurant_id" integer,
      "home_eyebrow" varchar DEFAULT 'Our Selection', "home_header_title" varchar DEFAULT 'Featured Dishes',
      "menu_eyebrow" varchar DEFAULT 'What We Offer', "menu_header_title" varchar DEFAULT 'Our Menu',
      "gallery_eyebrow" varchar DEFAULT 'A Visual Story', "gallery_header_title" varchar DEFAULT 'Gallery',
      "events_eyebrow" varchar DEFAULT 'What''s Coming Up', "events_header_title" varchar DEFAULT 'Events & Specials',
      "contact_eyebrow" varchar DEFAULT 'Find Us', "contact_header_title" varchar DEFAULT 'Contact & Location',
      "about_eyebrow" varchar DEFAULT 'Who We Are', "about_header_title" varchar DEFAULT 'About Us',
      "about_tagline" varchar, "about_story" jsonb,
      "about_story_formatting_background" "enum_tenant_page_content_about_story_formatting_background" DEFAULT 'white',
      "about_story_formatting_text_align" "enum_tenant_page_content_about_story_formatting_text_align" DEFAULT 'center',
      "about_story_formatting_container_width" "enum_tenant_page_content_about_story_formatting_container_width" DEFAULT 'narrow',
      "about_values_heading" varchar DEFAULT 'Our Values',
      "about_cta_heading" varchar DEFAULT 'Come Visit Us',
      "about_cta_subtext" varchar DEFAULT 'We''d love to welcome you. View our menu or get in touch to plan your visit.',
      "about_cta_primary_text" varchar DEFAULT 'View Our Menu',
      "about_cta_secondary_text" varchar DEFAULT 'Contact Us',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "users_tenants" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "tenant_id" integer NOT NULL)`)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "users_sessions" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "created_at" timestamp(3) with time zone, "expires_at" timestamp(3) with time zone NOT NULL)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL, "name" varchar, "role" "enum_users_role" DEFAULT 'editor',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "email" varchar NOT NULL, "reset_password_token" varchar,
      "reset_password_expiration" timestamp(3) with time zone, "salt" varchar, "hash" varchar,
      "login_attempts" numeric DEFAULT 0, "lock_until" timestamp(3) with time zone
    )
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "media" (
      "id" serial PRIMARY KEY NOT NULL, "alt" varchar NOT NULL, "caption" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar, "thumbnail_u_r_l" varchar, "filename" varchar, "mime_type" varchar,
      "filesize" numeric, "width" numeric, "height" numeric, "focal_x" numeric, "focal_y" numeric,
      "sizes_thumbnail_url" varchar, "sizes_thumbnail_width" numeric, "sizes_thumbnail_height" numeric,
      "sizes_thumbnail_mime_type" varchar, "sizes_thumbnail_filesize" numeric, "sizes_thumbnail_filename" varchar,
      "sizes_card_url" varchar, "sizes_card_width" numeric, "sizes_card_height" numeric,
      "sizes_card_mime_type" varchar, "sizes_card_filesize" numeric, "sizes_card_filename" varchar,
      "sizes_hero_url" varchar, "sizes_hero_width" numeric, "sizes_hero_height" numeric,
      "sizes_hero_mime_type" varchar, "sizes_hero_filesize" numeric, "sizes_hero_filename" varchar
    )
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "menu_categories" (
      "id" serial PRIMARY KEY NOT NULL, "restaurant_id" integer, "name" varchar NOT NULL,
      "slug" varchar, "description" varchar, "order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "menu_items_dietary_flags" ("order" integer NOT NULL, "parent_id" integer NOT NULL, "value" "enum_menu_items_dietary_flags", "id" serial PRIMARY KEY NOT NULL)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "menu_items" (
      "id" serial PRIMARY KEY NOT NULL, "restaurant_id" integer, "name" varchar NOT NULL,
      "slug" varchar, "category_id" integer NOT NULL, "description" jsonb, "price" numeric NOT NULL,
      "image_id" integer, "featured" boolean DEFAULT false, "available" boolean DEFAULT true,
      "order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "gallery_images" (
      "id" serial PRIMARY KEY NOT NULL, "restaurant_id" integer, "image_id" integer NOT NULL,
      "caption" varchar, "featured" boolean DEFAULT false, "order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "events" (
      "id" serial PRIMARY KEY NOT NULL, "restaurant_id" integer, "title" varchar NOT NULL,
      "slug" varchar, "description" jsonb, "date" timestamp(3) with time zone NOT NULL,
      "end_date" timestamp(3) with time zone, "image_id" integer,
      "featured" boolean DEFAULT false, "status" "enum_events_status" DEFAULT 'draft',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "payload_kv" ("id" serial PRIMARY KEY NOT NULL, "key" varchar NOT NULL, "data" jsonb NOT NULL)`)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "payload_locked_documents" ("id" serial PRIMARY KEY NOT NULL, "global_slug" varchar, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
      "id" serial PRIMARY KEY NOT NULL, "order" integer, "parent_id" integer NOT NULL,
      "path" varchar NOT NULL, "restaurants_id" integer, "tenant_site_settings_id" integer,
      "tenant_hero_sections_id" integer, "tenant_page_content_id" integer, "users_id" integer,
      "media_id" integer, "menu_categories_id" integer, "menu_items_id" integer,
      "gallery_images_id" integer, "events_id" integer
    )
  `)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "payload_preferences" ("id" serial PRIMARY KEY NOT NULL, "key" varchar, "value" jsonb, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL)`)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "payload_preferences_rels" ("id" serial PRIMARY KEY NOT NULL, "order" integer, "parent_id" integer NOT NULL, "path" varchar NOT NULL, "users_id" integer)`)
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "payload_migrations" ("id" serial PRIMARY KEY NOT NULL, "name" varchar, "batch" numeric, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL)`)

  // ── Add restaurant_id columns if missing (idempotent — plugin may not have pushed them) ──
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "menu_categories" ADD COLUMN "restaurant_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "menu_items" ADD COLUMN "restaurant_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "gallery_images" ADD COLUMN "restaurant_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "events" ADD COLUMN "restaurant_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_site_settings" ADD COLUMN "restaurant_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_hero_sections" ADD COLUMN "restaurant_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_page_content" ADD COLUMN "restaurant_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "users_tenants" ADD COLUMN "tenant_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  // payload_locked_documents_rels may be missing tenant-related columns if restaurants was added later
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "restaurants_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenant_site_settings_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenant_hero_sections_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenant_page_content_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "gallery_images_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer; EXCEPTION WHEN duplicate_column THEN null; END $$`)

  // ── FK Constraints (idempotent — each in its own execute + DO-EXCEPTION) ─────
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_site_settings_navigation" ADD CONSTRAINT "tenant_site_settings_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenant_site_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_site_settings_hours" ADD CONSTRAINT "tenant_site_settings_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenant_site_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_site_settings" ADD CONSTRAINT "tenant_site_settings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_site_settings" ADD CONSTRAINT "tenant_site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_site_settings" ADD CONSTRAINT "tenant_site_settings_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_hero_sections" ADD CONSTRAINT "tenant_hero_sections_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_hero_sections" ADD CONSTRAINT "tenant_hero_sections_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_page_content_about_values" ADD CONSTRAINT "tenant_page_content_about_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenant_page_content"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "tenant_page_content" ADD CONSTRAINT "tenant_page_content_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_tenant_id_restaurants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "menu_items_dietary_flags" ADD CONSTRAINT "menu_items_dietary_flags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "events" ADD CONSTRAINT "events_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenant_site_settings_fk" FOREIGN KEY ("tenant_site_settings_id") REFERENCES "public"."tenant_site_settings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenant_hero_sections_fk" FOREIGN KEY ("tenant_hero_sections_id") REFERENCES "public"."tenant_hero_sections"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenant_page_content_fk" FOREIGN KEY ("tenant_page_content_id") REFERENCES "public"."tenant_page_content"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_categories_fk" FOREIGN KEY ("menu_categories_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_items_fk" FOREIGN KEY ("menu_items_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_images_fk" FOREIGN KEY ("gallery_images_id") REFERENCES "public"."gallery_images"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$`)

  // ── Indexes (idempotent) ──────────────────────────────────────────────────────
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_slug_idx" ON "restaurants" USING btree ("slug")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "restaurants_updated_at_idx" ON "restaurants" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "restaurants_created_at_idx" ON "restaurants" USING btree ("created_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_site_settings_navigation_order_idx" ON "tenant_site_settings_navigation" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_site_settings_navigation_parent_id_idx" ON "tenant_site_settings_navigation" USING btree ("_parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_site_settings_hours_order_idx" ON "tenant_site_settings_hours" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_site_settings_hours_parent_id_idx" ON "tenant_site_settings_hours" USING btree ("_parent_id")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "tenant_site_settings_restaurant_idx" ON "tenant_site_settings" USING btree ("restaurant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_site_settings_logo_idx" ON "tenant_site_settings" USING btree ("logo_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_site_settings_seo_seo_og_image_idx" ON "tenant_site_settings" USING btree ("seo_og_image_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_site_settings_updated_at_idx" ON "tenant_site_settings" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_site_settings_created_at_idx" ON "tenant_site_settings" USING btree ("created_at")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "tenant_hero_sections_restaurant_idx" ON "tenant_hero_sections" USING btree ("restaurant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_hero_sections_background_image_idx" ON "tenant_hero_sections" USING btree ("background_image_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_hero_sections_updated_at_idx" ON "tenant_hero_sections" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_hero_sections_created_at_idx" ON "tenant_hero_sections" USING btree ("created_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_page_content_about_values_order_idx" ON "tenant_page_content_about_values" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_page_content_about_values_parent_id_idx" ON "tenant_page_content_about_values" USING btree ("_parent_id")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "tenant_page_content_restaurant_idx" ON "tenant_page_content" USING btree ("restaurant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_page_content_updated_at_idx" ON "tenant_page_content" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenant_page_content_created_at_idx" ON "tenant_page_content" USING btree ("created_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "users_tenants_order_idx" ON "users_tenants" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "users_tenants_tenant_idx" ON "users_tenants" USING btree ("tenant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_categories_restaurant_idx" ON "menu_categories" USING btree ("restaurant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_categories_updated_at_idx" ON "menu_categories" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_categories_created_at_idx" ON "menu_categories" USING btree ("created_at")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_slug_idx" ON "menu_categories" USING btree ("restaurant_id","slug")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_items_dietary_flags_order_idx" ON "menu_items_dietary_flags" USING btree ("order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_items_dietary_flags_parent_idx" ON "menu_items_dietary_flags" USING btree ("parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_items_restaurant_idx" ON "menu_items" USING btree ("restaurant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_items_category_idx" ON "menu_items" USING btree ("category_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_items_image_idx" ON "menu_items" USING btree ("image_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_items_updated_at_idx" ON "menu_items" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "menu_items_created_at_idx" ON "menu_items" USING btree ("created_at")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_slug_1_idx" ON "menu_items" USING btree ("restaurant_id","slug")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "gallery_images_restaurant_idx" ON "gallery_images" USING btree ("restaurant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "gallery_images_image_idx" ON "gallery_images" USING btree ("image_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "gallery_images_updated_at_idx" ON "gallery_images" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "gallery_images_created_at_idx" ON "gallery_images" USING btree ("created_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "events_restaurant_idx" ON "events" USING btree ("restaurant_id")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "events_slug_idx" ON "events" USING btree ("slug")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "events_image_idx" ON "events" USING btree ("image_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "events_updated_at_idx" ON "events" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" USING btree ("created_at")`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_restaurants_id_idx" ON "payload_locked_documents_rels" USING btree ("restaurants_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tenant_site_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("tenant_site_settings_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tenant_hero_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("tenant_hero_sections_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tenant_page_content_id_idx" ON "payload_locked_documents_rels" USING btree ("tenant_page_content_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_categories_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_menu_items_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_items_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gallery_images_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_images_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at")`)

  // ── Pilot restaurant + backfill + NOT NULL (idempotent) ───────────────────────
  await db.execute(sql`
    INSERT INTO restaurants (name, slug, active, updated_at, created_at)
    VALUES ('Pilot Café', 'pilot', true, NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING
  `)

  await db.execute(sql`
    UPDATE menu_categories
    SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'pilot' LIMIT 1)
    WHERE restaurant_id IS NULL
  `)
  await db.execute(sql`
    UPDATE menu_items
    SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'pilot' LIMIT 1)
    WHERE restaurant_id IS NULL
  `)
  await db.execute(sql`
    UPDATE gallery_images
    SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'pilot' LIMIT 1)
    WHERE restaurant_id IS NULL
  `)
  await db.execute(sql`
    UPDATE events
    SET restaurant_id = (SELECT id FROM restaurants WHERE slug = 'pilot' LIMIT 1)
    WHERE restaurant_id IS NULL
  `)

  // Apply NOT NULL — wrapped in DO blocks to safely skip if already enforced
  await db.execute(sql`DO $$ BEGIN ALTER TABLE menu_categories ALTER COLUMN restaurant_id SET NOT NULL; EXCEPTION WHEN others THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE menu_items ALTER COLUMN restaurant_id SET NOT NULL; EXCEPTION WHEN others THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE gallery_images ALTER COLUMN restaurant_id SET NOT NULL; EXCEPTION WHEN others THEN null; END $$`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE events ALTER COLUMN restaurant_id SET NOT NULL; EXCEPTION WHEN others THEN null; END $$`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "restaurants" CASCADE;
  DROP TABLE IF EXISTS "tenant_site_settings_navigation" CASCADE;
  DROP TABLE IF EXISTS "tenant_site_settings_hours" CASCADE;
  DROP TABLE IF EXISTS "tenant_site_settings" CASCADE;
  DROP TABLE IF EXISTS "tenant_hero_sections" CASCADE;
  DROP TABLE IF EXISTS "tenant_page_content_about_values" CASCADE;
  DROP TABLE IF EXISTS "tenant_page_content" CASCADE;
  DROP TABLE IF EXISTS "users_tenants" CASCADE;
  DROP TABLE IF EXISTS "users_sessions" CASCADE;
  DROP TABLE IF EXISTS "users" CASCADE;
  DROP TABLE IF EXISTS "media" CASCADE;
  DROP TABLE IF EXISTS "menu_categories" CASCADE;
  DROP TABLE IF EXISTS "menu_items_dietary_flags" CASCADE;
  DROP TABLE IF EXISTS "menu_items" CASCADE;
  DROP TABLE IF EXISTS "gallery_images" CASCADE;
  DROP TABLE IF EXISTS "events" CASCADE;
  DROP TABLE IF EXISTS "payload_kv" CASCADE;
  DROP TABLE IF EXISTS "payload_locked_documents" CASCADE;
  DROP TABLE IF EXISTS "payload_locked_documents_rels" CASCADE;
  DROP TABLE IF EXISTS "payload_preferences" CASCADE;
  DROP TABLE IF EXISTS "payload_preferences_rels" CASCADE;
  DROP TABLE IF EXISTS "payload_migrations" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_tenant_page_content_about_story_formatting_background";
  DROP TYPE IF EXISTS "public"."enum_tenant_page_content_about_story_formatting_text_align";
  DROP TYPE IF EXISTS "public"."enum_tenant_page_content_about_story_formatting_container_width";
  DROP TYPE IF EXISTS "public"."enum_users_role";
  DROP TYPE IF EXISTS "public"."enum_menu_items_dietary_flags";
  DROP TYPE IF EXISTS "public"."enum_events_status";`)
}
