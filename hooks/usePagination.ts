// hooks/usePagination.ts
import { useState, useEffect } from 'react'

interface UsePaginationProps {
  initialPage?: number
  pageSize?: number
  totalItems: number
}

export function usePagination({
  initialPage = 1,
  pageSize = 20,
  totalItems,
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const totalPages = Math.ceil(totalItems / pageSize)

  // Réinitialiser à la première page si le totalItems change
  useEffect(() => {
    setCurrentPage(1)
  }, [totalItems])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const getVisibleItems = <T,>(items: T[]): T[] => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return items.slice(startIndex, endIndex)
  }

  const getPaginationRange = () => {
    const range = []
    const delta = 2 // Nombre de pages à afficher de chaque côté
    
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }
    
    if (currentPage - delta > 2) {
      range.unshift(-1) // Pour les points de suspension
    }
    if (currentPage + delta < totalPages - 1) {
      range.push(-2) // Pour les points de suspension
    }
    
    if (totalPages > 1) {
      range.unshift(1)
      if (totalPages > 1) range.push(totalPages)
    }
    
    return range
  }

  return {
    currentPage,
    totalPages,
    pageSize,
    startItem: (currentPage - 1) * pageSize + 1,
    endItem: Math.min(currentPage * pageSize, totalItems),
    goToPage,
    nextPage,
    prevPage,
    getVisibleItems,
    getPaginationRange,
  }
}