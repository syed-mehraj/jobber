ALTER TABLE "resumes" ADD COLUMN "design" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "target" text;