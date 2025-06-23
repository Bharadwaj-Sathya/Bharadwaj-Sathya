/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Column,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type PaginationState,
  type Row,
} from "@tanstack/react-table";

export interface ITableActions<TData> {
  label: string;
  handler: (r: TData) => void;
}

type ExtendedColumnDef<TData> = ColumnDef<TData> & {
  showFloatingFilter?: boolean;
  enableSorting?: boolean;
};

export type ITableProps<TData> = {
  columns: ExtendedColumnDef<TData>[];
  data: NonNullable<TData>[];
  showSearchBar?: boolean;
  showFloatingFilters?: boolean;
  childrenColumns?: ExtendedColumnDef<any>[];
  getSubRows?: (row: TData) => any[];
  enableExpanding?: boolean;
  getRowClassName?: (row: Row<TData>) => string;
};

// Enhanced global filter function that searches in children as well
const globalFilterFn = (
  row: Row<any>,
  columnId: string,
  filterValue: string,
  addMeta: any
) => {
  const searchValue = filterValue.toLowerCase();

  // Check parent row values
  const parentMatch = Object.values(row.original).some((value: any) => {
    if (value == null) return false;
    return String(value).toLowerCase().includes(searchValue);
  });

  if (parentMatch) return true;

  // Check children values if they exist
  const children = row.original?.children || [];
  const childrenMatch = children.some((child: any) => {
    return Object.values(child).some((value: any) => {
      if (value == null) return false;
      return String(value).toLowerCase().includes(searchValue);
    });
  });

  return childrenMatch;
};

// Column Filter Component
const ColumnFilter = <TData,>({
  column,
}: {
  column: Column<TData, unknown>;
}) => {
  const value = (column.getFilterValue() ?? "") as string;
  const setValue = column.setFilterValue;

  return (
    <div className="flex items-center space-x-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Filter..."
        className="w-full px-2 py-1 text-xs border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Clear filter"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}
    </div>
  );
};

const SortIcon = ({ column }: { column: Column<any, unknown> }) => {
  const sorted = column.getIsSorted();

  if (!sorted) return <div className="w-4 h-4" />;

  return sorted === "asc" ? (
    <ArrowUp className="h-4 w-4 text-black" />
  ) : (
    <ArrowDown className="h-4 w-4 text-black" />
  );
};

// Enhanced Expandable Row Component with proper TanStack Table integration
const ExpandableRowContent = <TData,>({
  row,
  childrenColumns,
  enableExpanding = false,
  totalColumns,
}: {
  row: Row<TData>;
  childrenColumns?: ExtendedColumnDef<any>[];
  enableExpanding?: boolean;
  totalColumns: number;
}) => {
  const children = (row.original as any)?.children || [];
  const [childrenSorting, setChildrenSorting] = useState<any>([]);

  if (!children.length || !childrenColumns) return null;

  // Create a separate table instance for children
  const childrenTable = useReactTable({
    columns: childrenColumns,
    data: children,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: childrenSorting,
    },
    onSortingChange: setChildrenSorting,
    enableSortingRemoval: false,
  });

  return (
    <tr className="bg-blue-50/30">
      <td colSpan={totalColumns} className="p-0">
        <div className="px-4 py-2">
          <div className="bg-white rounded border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#e7e4df]">
                {childrenTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {enableExpanding && <td className="px-4 py-2 w-8"></td>}
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${
                          header.column.getCanSort()
                            ? "cursor-pointer hover:bg-[#ddd8d3]"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center space-x-2">
                            <span className="select-none">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {header.column.getCanSort() && (
                              <SortIcon column={header.column} />
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {childrenTable.getRowModel().rows.map((childRow) => (
                  <tr key={childRow.id} className="hover:bg-gray-50">
                    {enableExpanding && <td className="px-4 py-2 w-8"></td>}
                    {childRow.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2 text-sm text-gray-900"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </tr>
  );
};

const ColumnFilterDropdown = <TData,>({
  isOpen,
  onClose,
  column,
  anchorRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  column: Column<TData, unknown>;
  anchorRef: React.RefObject<HTMLButtonElement>;
}) => {
  const [localFilter, setLocalFilter] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize local filter from current column state
  useEffect(() => {
    if (isOpen) {
      const currentFilter = column.getFilterValue() || "";
      setLocalFilter(String(currentFilter));
    }
  }, [isOpen, column]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Position dropdown relative to anchor
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let left = rect.left + scrollX;
      let top = rect.bottom + scrollY + 4;

      const dropdownWidth = 250;
      const dropdownHeight = 120;

      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 20;
      }

      if (top + dropdownHeight > window.innerHeight + scrollY) {
        top = rect.top + scrollY - dropdownHeight - 4;
      }

      setDropdownPosition({ top, left });
    }
  }, [isOpen]);

  // Apply filter in real-time as user types
  const handleFilterChange = (value: string) => {
    setLocalFilter(value);
    column.setFilterValue(value || undefined);
  };

  const clearFilter = () => {
    setLocalFilter("");
    column.setFilterValue(undefined);
  };

  if (!isOpen) return null;

  const columnHeader =
    typeof column.columnDef.header === "string"
      ? column.columnDef.header
      : column.id;

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-64"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          Filter
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Close filter dropdown"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={localFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder={`Search ${columnHeader}...`}
            className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          {localFilter && (
            <button
              onClick={clearFilter}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
              aria-label="Clear search"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const Table = <TData,>({
  columns,
  data,
  showSearchBar,
  showFloatingFilters,
  childrenColumns,
  getSubRows,
  enableExpanding = false,
}: ITableProps<TData>) => {
  const [filtering, setFiltering] = useState("");
  const [openColumnFilter, setOpenColumnFilter] = useState<string | null>(null);
  const columnFilterRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Memoize processed data to avoid unnecessary re-renders
  const processedData = useMemo(() => data, [data]);

  const table = useReactTable({
    columns,
    data: processedData,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    getSubRows: getSubRows,
    enableExpanding,
    globalFilterFn: globalFilterFn,
    state: {
      pagination,
      globalFilter: filtering,
    },
    onGlobalFilterChange: setFiltering,
  });

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const hasChildren = (row: any) => {
    const children = getSubRows
      ? getSubRows(row.original)
      : (row.original as any)?.children;
    return children && children.length > 0;
  };

  // Calculate total columns for colspan
  const totalColumns = columns.length + (enableExpanding ? 1 : 0);

  return (
    <div className="ag-theme-alpine bg-white rounded-lg shadow-sm border border-gray-200">
      {showSearchBar && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Search all columns..."
              value={filtering}
              onChange={(e) => setFiltering(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  // Replace the existing header section with this:
                  <th
                    key={header.id}
                    className={`group px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-black border-r border-[#f2efeb] last:border-r-0 bg-[#e7e4df] transition-colors duration-150 ${
                      header.column.getCanSort()
                        ? "cursor-pointer hover:bg-[#ddd8d3]"
                        : ""
                    }`}
                    style={{ minWidth: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center space-x-2 flex-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="select-none">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {header.column.getCanSort() && (
                            <SortIcon column={header.column} />
                          )}
                        </div>

                        {/* Individual Filter Button */}
                        {header.column.getCanFilter() &&
                          (header.column.columnDef as any)?.enableFilter && (
                            <button
                              ref={(el) => {
                                const columnId =
                                  (header.column.columnDef
                                    .accessorKey as string) ||
                                  header.column.id ||
                                  "";
                                columnFilterRefs.current[columnId] = el;
                              }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent sorting when clicking filter
                                const columnId =
                                  (header.column.columnDef
                                    .accessorKey as string) ||
                                  header.column.id ||
                                  "";
                                setOpenColumnFilter(
                                  openColumnFilter === columnId
                                    ? null
                                    : columnId
                                );
                              }}
                              className={`p-1 hover:bg-gray-200 rounded transition-colors ${
                                header.column.getFilterValue()
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                              aria-label="Open column filter"
                            >
                              <Search className="w-4 h-4 text-gray-600 hover:text-blue-500 hover:bg-[#e7e4df]" />
                            </button>
                          )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}

            {columns.map((column) => {
              const columnId =
                (column.accessorKey as string) || column.id || "";
              if (!(column as any).enableFilter || !columnId) return null;

              const tableColumn = table.getColumn(columnId);
              if (!tableColumn) return null;

              return (
                <ColumnFilterDropdown
                  key={`filter-${columnId}`}
                  isOpen={openColumnFilter === columnId}
                  onClose={() => setOpenColumnFilter(null)}
                  column={tableColumn}
                  anchorRef={
                    columnFilterRefs.current[columnId]
                      ? { current: columnFilterRefs.current[columnId] }
                      : { current: undefined as unknown as HTMLButtonElement }
                  }
                />
              );
            })}

            {/* Floating Filters Row */}
            {showFloatingFilters && (
              <tr className="bg-white border-b border-gray-200">
                {table.getHeaderGroups()[0].headers.map((header, i) => {
                  const originalColumn = columns[i] as ExtendedColumnDef<TData>;
                  return (
                    <th
                      key={`filter-${header.id}`}
                      className="px-4 py-2 border-r border-gray-200 last:border-r-0"
                    >
                      {header.column.getCanFilter() &&
                      originalColumn.showFloatingFilter ? (
                        <ColumnFilter column={header.column} />
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, index) => {
              const isExpanded = expandedRows.has(row.id);
              const rowHasChildren = hasChildren(row);

              return (
                <>
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50 hover:bg-gray-50"
                    }`}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <td
                        key={cell.id}
                        className={`px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 whitespace-nowrap ${
                          rowHasChildren && cellIndex > 0 ? "hidden" : ""
                        }`}
                        colSpan={
                          rowHasChildren && cellIndex === 0
                            ? row.getVisibleCells().length
                            : 1
                        }
                      >
                        {cellIndex === 0 && rowHasChildren ? (
                          <div className="flex items-center gap-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                            <button
                              onClick={() => toggleRowExpansion(row.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              aria-label={
                                isExpanded ? "Collapse row" : "Expand row"
                              }
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        )}
                      </td>
                    ))}
                  </tr>
                  {/* Expandable content */}
                  {isExpanded && rowHasChildren && (
                    <ExpandableRowContent
                      row={row}
                      childrenColumns={childrenColumns}
                      enableExpanding={enableExpanding}
                      totalColumns={totalColumns}
                    />
                  )}
                </>
              );
            })}

            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <Search className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm">No data found</p>
                    {filtering && (
                      <p className="text-xs text-gray-400 mt-1">
                        Try adjusting your search or filters
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <PaginationFooter table={table} />
    </div>
  );
};

const PaginationFooter = ({ table }: { table: any }) => {
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
            {[10, 20, 30, 40, 50].map((size) => (
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
