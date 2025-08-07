"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const exportToCSV = () => {
    const headers = table
      .getAllColumns()
      .filter((column) => column.getIsVisible() && column.id !== "select" && column.id !== "actions")
      .map((column) => column.id)

    const csvContent = [
      headers.join(","),
      ...table.getFilteredRowModel().rows.map((row) =>
        headers
          .map((header) => {
            const cellValue = row.getValue(header)
            if (cellValue === null || cellValue === undefined) return ""
            if (typeof cellValue === "string" && cellValue.includes(",")) {
              return `"${cellValue.replace(/"/g, '""')}"`
            }
            return String(cellValue)
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `export-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length
  const totalRowsCount = table.getFilteredRowModel().rows.length

  // Get the search value from either global filter or specific column filter
  const searchValue = React.useMemo(() => {
    const columnValue = table.getColumn(searchKey)?.getFilterValue() as string
    return columnValue || globalFilter || ""
  }, [table, searchKey, globalFilter])

  // Handle search input change
  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      if (searchKey && table.getColumn(searchKey)) {
        table.getColumn(searchKey)?.setFilterValue(value === "" ? undefined : value)
      } else {
        setGlobalFilter(value)
      }
    },
    [searchKey, table],
  )

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-9 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:bg-muted/50 transition-colors"
              >
                <Filter className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Columns</span>
                <span className="sm:hidden">View</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Toggle Columns
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      <span className="flex items-center gap-2">
                        {column.getIsVisible() ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {column.id.replace(/_/g, " ")}
                      </span>
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {selectedRowsCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {selectedRowsCount} selected
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:bg-muted/50 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <Card className="border-muted-foreground/20 bg-background/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b border-muted-foreground/10 hover:bg-muted/30 transition-colors"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className="whitespace-nowrap font-semibold text-foreground/80 bg-muted/20"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b border-muted-foreground/5 hover:bg-muted/20 transition-colors data-[state=selected]:bg-primary/5"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap py-3 text-foreground/90">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                          <Search className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="font-medium">No results found</p>
                          <p className="text-sm text-muted-foreground/70">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card className="border-muted-foreground/20 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
            {/* Selection Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground order-2 sm:order-1">
              <span>
                {selectedRowsCount} of {totalRowsCount} row(s) selected
              </span>
              <div className="hidden sm:block h-4 w-px bg-muted-foreground/20" />
              <span className="hidden sm:inline">
                Showing {Math.min(table.getState().pagination.pageSize, totalRowsCount)} of {totalRowsCount} entries
              </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 order-1 sm:order-2">
              {/* Rows per page - Desktop only */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm font-medium text-foreground/80">Rows per page</span>
                <Select
                  value={table.getState().pagination.pageSize.toString()}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-16 h-8 bg-background/50 border-muted-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={pageSize.toString()}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page Info */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground/80">
                  Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
                </span>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex h-8 w-8 p-0 bg-background/50 border-muted-foreground/20 hover:bg-muted/50"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/50 border-muted-foreground/20 hover:bg-muted/50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/50 border-muted-foreground/20 hover:bg-muted/50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex h-8 w-8 p-0 bg-background/50 border-muted-foreground/20 hover:bg-muted/50"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Rows per page */}
          <div className="flex lg:hidden items-center justify-center gap-2 mt-4 pt-4 border-t border-muted-foreground/10">
            <span className="text-sm font-medium text-foreground/80">Rows per page:</span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20 h-8 bg-background/50 border-muted-foreground/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
