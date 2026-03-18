import { pgTable, text, uuid, timestamp, boolean, integer, pgEnum, unique } from "drizzle-orm/pg-core";

export const assistantStatusEnum = pgEnum("assistant_status", ["active", "alumni"]);

export const generations = pgTable("generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  number: integer("number").notNull().unique(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const organizationalRoles = pgTable("organizational_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const assistantProfiles = pgTable("assistant_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  generationId: uuid("generation_id").notNull().references(() => generations.id),
  fullName: text("full_name").notNull(),
  profilePhotoPath: text("profile_photo_path"),
  bio: text("bio"),
  githubUrl: text("github_url"),
  instagramUrl: text("instagram_url"),
  linkedinUrl: text("linkedin_url"),
  status: assistantStatusEnum("status").notNull().default("active"),
  joinedYear: integer("joined_year").notNull(),
  endYear: integer("end_year"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assistantRoles = pgTable("assistant_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  assistantId: uuid("assistant_id").notNull().references(() => assistantProfiles.id),
  roleId: uuid("role_id").notNull().references(() => organizationalRoles.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
}, (t) => [
  unique("uq_assistant_role").on(t.assistantId, t.roleId),
]);

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
export type OrganizationalRole = typeof organizationalRoles.$inferSelect;
export type AssistantProfile = typeof assistantProfiles.$inferSelect;
export type NewAssistantProfile = typeof assistantProfiles.$inferInsert;
export type AssistantRole = typeof assistantRoles.$inferSelect;
