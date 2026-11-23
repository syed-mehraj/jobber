CREATE TABLE "job_matches" (
	"user_id" text NOT NULL,
	"job_id" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"matched" text[] DEFAULT '{}'::text[] NOT NULL,
	"missing" text[] DEFAULT '{}'::text[] NOT NULL,
	"reasons" text[] DEFAULT '{}'::text[] NOT NULL,
	"dismissed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_matches_user_id_job_id_pk" PRIMARY KEY("user_id","job_id")
);
--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_matches_user_score" ON "job_matches" USING btree ("user_id","score");