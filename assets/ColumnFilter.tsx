import type { Column } from "@tanstack/react-table";
import { X, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ColumnFilter = <TData,>({
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
  }, [anchorRef, isOpen, onClose]);

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
  }, [anchorRef, isOpen]);

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
            className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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

export default ColumnFilter;
