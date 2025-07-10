  export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

  export interface Database {
    public: {
      Tables: {
        profiles: {
          Row: {
            id: string
            email: string
            full_name: string | null
            phone: string | null
            avatar_url: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id: string
            email: string
            full_name?: string | null
            phone?: string | null
            avatar_url?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            email?: string
            full_name?: string | null
            phone?: string | null
            avatar_url?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        stores: {
          Row: {
            id: string
            user_id: string
            name: string
            slug: string
            description: string | null
            logo_url: string | null
            banner_url: string | null
            theme: Json | null
            is_published: boolean
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            user_id: string
            name: string
            slug: string
            description?: string | null
            logo_url?: string | null
            banner_url?: string | null
            theme?: Json | null
            is_published?: boolean
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            name?: string
            slug?: string
            description?: string | null
            logo_url?: string | null
            banner_url?: string | null
            theme?: Json | null
            is_published?: boolean
            created_at?: string
            updated_at?: string
          }
        }
        categories: {
          Row: {
            id: string
            store_id: string
            name: string
            description: string | null
            image_url: string | null
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            store_id: string
            name: string
            description?: string | null
            image_url?: string | null
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            store_id?: string
            name?: string
            description?: string | null
            image_url?: string | null
            created_at?: string
            updated_at?: string
          }
        }
        products: {
          Row: {
            id: string
            store_id: string
            category_id: string | null
            name: string
            description: string | null
            price: number
            compare_at_price: number | null
            inventory_quantity: number
            is_published: boolean
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            store_id: string
            category_id?: string | null
            name: string
            description?: string | null
            price: number
            compare_at_price?: number | null
            inventory_quantity?: number
            is_published?: boolean
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            store_id?: string
            category_id?: string | null
            name?: string
            description?: string | null
            price?: number
            compare_at_price?: number | null
            inventory_quantity?: number
            is_published?: boolean
            created_at?: string
            updated_at?: string
          }
        }
        product_images: {
          Row: {
            id: string
            product_id: string
            url: string
            alt_text: string | null
            position: number
            created_at: string
          }
          Insert: {
            id?: string
            product_id: string
            url: string
            alt_text?: string | null
            position?: number
            created_at?: string
          }
          Update: {
            id?: string
            product_id?: string
            url?: string
            alt_text?: string | null
            position?: number
            created_at?: string
          }
        }
      }
    }
  }
