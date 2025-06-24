/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type Row,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type Column,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";

type ExtendedColumnDef<TData> = ColumnDef<TData> & {
  showFloatingFilter?: boolean;
  enableSorting?: boolean;
};

type SortIconProps<TData> = {
  column: Column<TData, unknown>;
};

function SortIcon<TData>({ column }: SortIconProps<TData>) {
  const sort = column.getIsSorted();
  if (!sort) return null;
  return sort === "asc" ? (
    <ArrowUp className="w-3 h-3 inline" />
  ) : (
    <ArrowDown className="w-3 h-3 inline" />
  );
}

const ChildTable = <TData,>({
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

  const childrenTable = useReactTable({
    columns: childrenColumns ?? [],
    data: children ?? [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: childrenSorting,
    },
    onSortingChange: setChildrenSorting,
    enableSortingRemoval: false,
  });

  if (!children.length || !childrenColumns) return null;

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
                        className={`group px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${
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
                    {enableExpanding && <td className="px-2 py-1 w-8"></td>}
                    {childRow.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-2 py-1 text-sm text-gray-900"
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

export default ChildTable;
