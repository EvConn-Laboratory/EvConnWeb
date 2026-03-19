"use client";

import { useState, useCallback, useRef } from "react";
import {
  FileUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  FileText,
  X,
  RefreshCw,
  Table2,
} from "lucide-react";
import Papa from "papaparse";
import { importEnrollmentCsvAction } from "@/lib/actions/enrollment";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  "name",
  "nim",
  "major",
  "class",
  "semester",
  "day",
  "shift",
  "group",
  "course_name",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const PREVIEW_ROWS = 8;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface ImportResult {
  success: true;
  data?: {
    totalRows: number;
    successCount: number;
    skippedRows: number;
    errors: Array<{ row: number; nim: string; reason: string }>;
  };
}

interface ImportError {
  error: string;
}

// ─── Column pill ──────────────────────────────────────────────────────────────

function ColumnPill({
  name,
  present,
}: {
  name: string;
  present: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium",
        present
          ? "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {present ? (
        <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
      ) : (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-current opacity-40" />
      )}
      {name}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | ImportError | null>(null);

  // ─── File handling ─────────────────────────────────────────────────────────

  const processFile = useCallback((f: File) => {
    setParseError(null);
    setResult(null);

    if (!f.name.toLowerCase().endsWith(".csv")) {
      setParseError("Only .csv files are accepted.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setParseError("File size cannot exceed 5 MB.");
      return;
    }

    setFile(f);

    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      preview: PREVIEW_ROWS + 1, // +1 to know if there are more rows
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        setPreview({
          headers,
          rows: rows
            .slice(0, PREVIEW_ROWS)
            .map((row) => headers.map((h) => row[h] ?? "")),
          totalRows: rows.length,
        });
      },
      error: (err) => {
        setParseError(`Failed to parse CSV: ${err.message}`);
        setFile(null);
      },
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setParseError(null);
    setResult(null);
    setImporting(false);
  };

  // ─── Import ────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await importEnrollmentCsvAction(formData);
      setResult(res as ImportResult | ImportError);
    } catch {
      setResult({ error: "An unexpected error occurred. Please try again." });
    } finally {
      setImporting(false);
    }
  };

  // ─── Derived state ─────────────────────────────────────────────────────────

  const presentColumns = new Set(preview?.headers ?? []);
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !presentColumns.has(c));
  const canImport = file !== null && missingColumns.length === 0 && !importing;

  const importResult =
    result && "success" in result && result.data ? result.data : null;
  const importErrorMsg = result && "error" in result ? result.error : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 text-left">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <FileUp className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground text-left">
            Import Enrollment CSV
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground text-left">
          Upload SIAM CSV file to enroll students into courses.
          Existing data will be skipped.
        </p>
      </div>

      {/* Required columns reference */}
      <div className="rounded-xl border border-border bg-card p-4 text-left">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
          <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
          Required Columns
        </div>
        <div className="flex flex-wrap gap-1.5 text-left">
          {REQUIRED_COLUMNS.map((col) => (
            <ColumnPill
              key={col}
              name={col}
              present={preview ? presentColumns.has(col) : false}
            />
          ))}
        </div>
        {!preview && (
          <p className="mt-2 text-[11px] text-muted-foreground text-left">
            Columns will be validated after selecting a file.
          </p>
        )}
        {preview && missingColumns.length > 0 && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 text-left">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Missing columns:{" "}
            <span className="font-mono font-semibold">
              {missingColumns.join(", ")}
            </span>
          </p>
        )}
        {preview && missingColumns.length === 0 && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 text-left">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            All columns found
          </p>
        )}
      </div>

      {/* Dropzone */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3",
            "rounded-xl border-2 border-dashed p-12 text-center transition-all duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            isDragOver
              ? "border-teal-500 bg-teal-500/5 text-teal-600 dark:text-teal-400"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/30",
          )}
        >
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
              isDragOver ? "bg-teal-500/10" : "bg-muted",
            )}
          >
            <Upload
              className={cn("h-6 w-6", isDragOver ? "text-teal-500" : "")}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {isDragOver ? "Drop file here" : "Drag & drop CSV file"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              or click to browse &middot; Max 5 MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Error reading file
            </p>
            <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
              {parseError}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="shrink-0 text-red-500 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* File selected + preview */}
      {file && preview && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB &middot;{" "}
                  {preview.totalRows} data rows
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preview table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card text-left">
            <div className="border-b border-border bg-muted/40 px-4 py-2.5 text-left">
              <p className="text-xs font-semibold text-foreground">
                Preview (showing {Math.min(preview.rows.length, PREVIEW_ROWS)} of{" "}
                {preview.totalRows} rows)
              </p>
            </div>
            <div className="overflow-x-auto text-left">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                      #
                    </th>
                    {preview.headers.map((h) => (
                      <th
                        key={h}
                        className={cn(
                          "whitespace-nowrap px-3 py-2 text-left font-semibold",
                          REQUIRED_COLUMNS.includes(h)
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-left">
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-3 py-2 text-muted-foreground">{i + 2}</td>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="max-w-32 truncate px-3 py-2 text-foreground"
                          title={cell}
                        >
                          {cell || (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground text-left">
              {canImport
                ? "File is ready to import. Click the button below to proceed."
                : missingColumns.length > 0
                  ? "Fix missing columns before importing."
                  : ""}
            </p>
            <Button
              onClick={handleImport}
              disabled={!canImport}
              className="gap-2 font-semibold"
            >
              {importing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Import {preview.totalRows} Rows
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Import error */}
      {importErrorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 text-left">
              Import failed
            </p>
            <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80 text-left">
              {importErrorMsg}
            </p>
          </div>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 text-left">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                Import completed
              </p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-left">
              {[
                {
                  label: "Total Rows",
                  value: importResult.totalRows,
                  accent: "text-foreground font-semibold",
                },
                {
                  label: "Successful",
                  value: importResult.successCount,
                  accent: "text-green-600 dark:text-green-400 font-semibold",
                },
                {
                  label: "Skipped",
                  value: importResult.skippedRows,
                  accent: "text-yellow-600 dark:text-yellow-400 font-semibold",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border/60 bg-card/80 px-3 py-2.5 text-center"
                >
                  <p className={cn("text-xl font-bold leading-none", s.accent)}>
                    {s.value}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Errors table */}
          {importResult.errors.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card text-left">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                <p className="text-xs font-semibold text-foreground">
                  {importResult.errors.length} problematic rows
                </p>
              </div>
              <div className="overflow-x-auto text-left">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                        Row
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                        NIM
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {importResult.errors.map((err, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-mono text-muted-foreground">
                          {err.row}
                        </td>
                        <td className="px-4 py-2 font-mono text-foreground font-semibold">
                          {err.nim}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {err.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import again */}
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 font-semibold">
            <RefreshCw className="h-3.5 w-3.5" />
            Import another file
          </Button>
        </div>
      )}
    </div>
  );
}
