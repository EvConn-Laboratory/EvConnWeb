import { pgTable, text, uuid, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const importLogs = pgTable("import_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: text("file_name").notNull(),
  importedBy: uuid("imported_by").notNull(),
  importedAt: timestamp("imported_at").notNull().defaultNow(),
  totalRows: integer("total_rows").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  skippedRows: integer("skipped_rows").notNull().default(0),
  errors: jsonb("errors"),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type ImportLog = typeof importLogs.$inferSelect;
export type NewImportLog = typeof importLogs.$inferInsert;
