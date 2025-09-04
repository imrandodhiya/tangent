"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PaginationControlsProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationControls({ page, totalPages, onPageChange, className }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const go = (p: number) => {
    if (p < 1 || p > totalPages) return
    onPageChange(p)
  }

  // Build a compact page list with ellipsis
  const pages: (number | "ellipsis")[] = []
  const add = (n: number) => pages.push(n)
  const addEllipsis = () => {
    if (pages[pages.length - 1] !== "ellipsis") pages.push("ellipsis")
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      add(i)
    } else if (i === 2 && page > 3) {
      add(2)
      addEllipsis()
      i = page - 2
    } else if (i === page + 2 && page < totalPages - 2) {
      addEllipsis()
      i = totalPages - 1
    }
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go(page - 1)
            }}
          />
        </PaginationItem>

        {pages.map((p, idx) => (
          <PaginationItem key={`${p}-${idx}`}>
            {p === "ellipsis" ? (
              // Reuse built-in ellipsis style
              <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">…</span>
            ) : (
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault()
                  go(p)
                }}
              >
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

type PageSizeSelectProps = {
  value: number
  onChange: (n: number) => void
  options?: number[]
  className?: string
}

export function PageSizeSelect({
  value,
  onChange,
  className,
  options = [10, 20, 50, 100, 200, 500],
}: PageSizeSelectProps) {
  return (
    <div className={className}>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Per page" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={String(opt)}>
              {opt} / page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
