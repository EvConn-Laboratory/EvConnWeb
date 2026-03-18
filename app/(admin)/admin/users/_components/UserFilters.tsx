"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, FileUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "", label: "All Roles" },
  { value: "super_admin", label: "Super Admin" },
  { value: "assistant", label: "Assistant" },
  { value: "student", label: "Student" },
  { value: "guest", label: "Guest" },
];

interface UserFiltersProps {
  currentSearch?: string;
  currentRole?: string;
}

export function UserFilters({ currentSearch = "", currentRole = "" }: UserFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 whenever filters change
      params.delete("page");
      return params.toString();
    },
    [searchParams],
  );

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement).value;
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ q })}`);
    });
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ role: e.target.value })}`);
    });
  }

  function handleClear() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters = currentSearch || currentRole;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={currentSearch}
            placeholder="Search name, NIM, email..."
            className="h-8 w-64 pl-8 text-sm"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          Search
        </Button>
      </form>

      {/* Role filter */}
      <select
        value={currentRole}
        onChange={handleRoleChange}
        disabled={isPending}
        className={cn(
          "h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50",
        )}
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={isPending}
          className="gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Reset
        </Button>
      )}

      {/* CSV Import shortcut */}
      <Link href="/admin/import" className="ml-auto">
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileUp className="h-3.5 w-3.5" />
          Import CSV
        </Button>
      </Link>
    </div>
  );
}
