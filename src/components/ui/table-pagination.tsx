"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface TablePaginationProps {
  page: number
  totalItems: number
  onPageChange: (page: number) => void
  pageSize?: number
  disabled?: boolean
  itemLabel?: string
}

function getPaginationItems(currentPage: number, totalPages: number): Array<number | string> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const visiblePages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  const pages = [...visiblePages]
    .filter((candidate) => candidate >= 1 && candidate <= totalPages)
    .sort((a, b) => a - b)
  const items: Array<number | string> = []

  pages.forEach((candidate, index) => {
    const previous = pages[index - 1]
    if (previous !== undefined && candidate - previous > 1) {
      if (candidate - previous === 2) items.push(previous + 1)
      else items.push(`ellipsis-${previous}`)
    }
    items.push(candidate)
  })

  return items
}

export function TablePagination({
  page,
  totalItems,
  onPageChange,
  pageSize = 10,
  disabled = false,
  itemLabel = "items",
}: TablePaginationProps) {
  if (totalItems <= 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const paginationItems = getPaginationItems(currentPage, totalPages)
  const firstItem = (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, totalItems)

  const changePage = (nextPage: number) => {
    if (disabled || nextPage === currentPage || nextPage < 1 || nextPage > totalPages) return
    onPageChange(nextPage)
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        {disabled ? "Updating..." : `Showing ${firstItem}-${lastItem} of ${totalItems} ${itemLabel}`}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={`?page=${Math.max(1, currentPage - 1)}`}
              aria-disabled={currentPage === 1 || disabled}
              tabIndex={currentPage === 1 || disabled ? -1 : undefined}
              onClick={(event) => {
                event.preventDefault()
                changePage(currentPage - 1)
              }}
            />
          </PaginationItem>
          {paginationItems.map((item) => (
            typeof item === "number" ? (
              <PaginationItem key={item}>
                <PaginationLink
                  href={`?page=${item}`}
                  isActive={item === currentPage}
                  aria-label={`Go to page ${item}`}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    changePage(item)
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          ))}
          <PaginationItem>
            <PaginationNext
              href={`?page=${Math.min(totalPages, currentPage + 1)}`}
              aria-disabled={currentPage === totalPages || disabled}
              tabIndex={currentPage === totalPages || disabled ? -1 : undefined}
              onClick={(event) => {
                event.preventDefault()
                changePage(currentPage + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
