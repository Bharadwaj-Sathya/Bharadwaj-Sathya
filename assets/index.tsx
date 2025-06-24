/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef } from "react";
import {
  Search,
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
import Pagination from "./Pagination";
import ColumnFilter from "./ColumnFilter";
import ChildTable from "./ChildTable";
import React from "react";

export interface ITableActions<TData> {
  label: string;
  handler: (r: TData) => void;
}

type ExtendedColumnDef<TData> = ColumnDef<TData> & {
  showFloatingFilter?: boolean;
  enableSorting?: boolean;
  enableFilter?: boolean;
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

const globalFilterFn = (
  row: Row<any>,
  columnId: string,
  filterValue: string
) => {
  const searchValue = filterValue.toLowerCase();
  const parentMatch = Object.values(row.original).some((value: any) =>
    String(value ?? "")
      .toLowerCase()
      .includes(searchValue)
  );
  if (parentMatch) return true;
  const children = row.original?.children || [];
  return children.some((child: any) =>
    Object.values(child).some((value: any) =>
      String(value ?? "")
        .toLowerCase()
        .includes(searchValue)
    )
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

export const Table = <TData,>({
  columns,
  data,
  showSearchBar,
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
    getSubRows,
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

  const totalColumns = columns.length + (enableExpanding ? 1 : 0);

  return (
    <div className="ag-theme-alpine bg-white rounded-sm border border-zinc-300">
      {showSearchBar && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-sm"
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
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;

                  return (
                    <th
                      key={header.id}
                      className={`group px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-black border-r border-[#f2efeb] last:border-r-0 bg-[#e7e4df] transition-colors duration-150 ${
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

                          {header.column.getCanFilter() &&
                            (header.column.columnDef as any)?.enableFilter && (
                              <button
                                ref={(el) => {
                                  columnFilterRefs.current[columnId] = el;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenColumnFilter((prev) =>
                                    prev === columnId ? null : columnId
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
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, index) => {
              const isExpanded = expandedRows.has(row.id);
              const rowHasChildren = hasChildren(row);

              return (
                <React.Fragment key={row.id}>
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-100 hover:bg-blue-100"
                    }`}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <td
                        key={cell.id}
                        className={`px-3 py-2 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 whitespace-nowrap ${
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
                  {isExpanded && rowHasChildren && (
                    <ChildTable
                      row={row}
                      childrenColumns={childrenColumns}
                      enableExpanding={enableExpanding}
                      totalColumns={totalColumns}
                    />
                  )}
                </React.Fragment>
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

      {/* Column Filter Popups */}
      {columns.map((column) => {
        const columnId = column.id || "";
        const tableColumn = table.getColumn(columnId);
        if (!(column as any).enableFilter || !tableColumn) return null;

        return (
          <ColumnFilter
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

      <Pagination table={table} />
    </div>
  );
};
