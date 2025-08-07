// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

// Error response type
export interface ApiErrorResponse {
  success: false
  message: string
}

// Success response types
export interface ProductResponse {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  category_id: string | null
  inventory_quantity: number
  images: {
    id: string
    url: string
    alt_text: string | null
  }[]
  store_id: string
  created_at: Date
  updated_at: Date
}

export interface CategoryResponse {
  id: string
  name: string
  description: string | null
  store_id: string
  created_at: Date
  updated_at: Date
}

export interface PaginationResponse {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Success API responses
export interface ProductsApiSuccessResponse {
  success: true
  products: ProductResponse[]
  count: number
}

export interface CategoriesApiSuccessResponse {
  success: true
  categories: CategoryResponse[]
  count: number
}

export interface SearchProductsApiSuccessResponse {
  success: true
  products: ProductResponse[]
  pagination: PaginationResponse
}

// Union types for complete API responses (success or error)
export type ProductsApiResponse = ProductsApiSuccessResponse | ApiErrorResponse
export type CategoriesApiResponse = CategoriesApiSuccessResponse | ApiErrorResponse
export type SearchProductsApiResponse = SearchProductsApiSuccessResponse | ApiErrorResponse
