CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"skills" text[] DEFAULT '{}'::text[] NOT NULL,
	"preferred" text[] DEFAULT '{}'::text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "applications_job";--> statement-breakpoint
ALTER TABLE "abouts" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "resume_files" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abouts" ADD CONSTRAINT "abouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_files" ADD CONSTRAINT "resume_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "abouts_user" ON "abouts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_user_job" ON "applications" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX "resumes_user" ON "resumes" USING btree ("user_id");