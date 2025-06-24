import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  table: {
    getState: () => { pagination: { pageIndex: number; pageSize: number } };
    getFilteredRowModel: () => {
      rows: { length: number }[] | { length: number };
    };
    setPageSize: (size: number) => void;
    firstPage: () => void;
    previousPage: () => void;
    nextPage: () => void;
    lastPage: () => void;
    getCanPreviousPage: () => boolean;
    getCanNextPage: () => boolean;
    getPageCount: () => number;
  };
}

const Pagination: React.FC<PaginationProps> = ({ table }) => {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Showing X to Y of Z */}
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{start}</span> to{" "}
          <span className="font-medium">{end}</span> of{" "}
          <span className="font-medium">{totalRows}</span> results
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Page size select */}
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {[15, 30, 45, 60].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>

          {/* Navigation buttons */}
          <button
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border rounded disabled:opacity-40 hover:bg-gray-100"
            aria-label="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border rounded disabled:opacity-40 hover:bg-gray-100"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm">
            Page <strong>{pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount()}</strong>
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 border rounded disabled:opacity-40 hover:bg-gray-100"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 border rounded disabled:opacity-40 hover:bg-gray-100"
            aria-label="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
