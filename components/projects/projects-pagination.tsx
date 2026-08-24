// components/projects/projects-pagination.tsx
"use client"

import {
  Pagination as ShadPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useProjectTranslations } from "@/components/LocaleProvider"

interface ProjectsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export function ProjectsPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: ProjectsPaginationProps) {
  const tProject = useProjectTranslations()

  if (totalPages <= 1) {
    return null
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const generatePageNumbers = () => {
    const pages = []
    
    // Toujours ajouter la première page
    pages.push(1)
    
    // Ajouter des points si nécessaire avant
    if (currentPage > 3) {
      pages.push(-1) // -1 représente les points de suspension
    }
    
    // Ajouter les pages autour de la page courante
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    
    // Ajouter des points si nécessaire après
    if (currentPage < totalPages - 2) {
      pages.push(-2) // -2 représente les points de suspension à la fin
    }
    
    // Toujours ajouter la dernière page si plus d'une page
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }

  const pageNumbers = generatePageNumbers()
  const paginationSummary = tProject("paginationSummary")
    .replace("{start}", String(startItem))
    .replace("{end}", String(endItem))
    .replace("{total}", String(totalItems))

  return (
    <div className={className}>
      {/* Information sur les éléments affichés */}
      <div className="mb-4 text-sm text-gray-600">
        {paginationSummary}
      </div>
      
      {/* Pagination ShadCN */}
      <ShadPagination>
        <PaginationContent>
          {/* Bouton Précédent */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              aria-disabled={currentPage === 1}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer hover:bg-gray-50"
              }
            />
          </PaginationItem>

          {/* Numéros de page */}
          {pageNumbers.map((pageNum, index) => (
            <PaginationItem key={index}>
              {pageNum === -1 || pageNum === -2 ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={currentPage === pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className="cursor-pointer hover:bg-gray-50 min-w-[2.5rem]"
                >
                  {pageNum}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Bouton Suivant */}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer hover:bg-gray-50"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </ShadPagination>
    </div>
  )
}
