CREATE TABLE "abouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"target" text,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
