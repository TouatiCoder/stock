// components/ui/table-pagination.tsx
import { Table } from "@/components/ui/table"
import { ProjectsPagination } from "./projects/pagination"

interface TablePaginationProps {
  data: any[]
  columns: any[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export function TablePagination({
  data,
  columns,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: TablePaginationProps) {
  return (
    <div className={className}>
      {/* Tableau */}
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left">
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 border-t pt-4">
          <ProjectsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}