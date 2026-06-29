// Hand-maintained mirror of supabase/migrations/0001_init.sql. Keep in sync when
// the schema changes (or regenerate with `supabase gen types typescript`).

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[]

interface Row<T> {
  Row: T
  Insert: Partial<T>
  Update: Partial<T>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      workshops: Row<{
        id: string
        slug: string
        name: string
        leanx_collection_uuid: string | null
        settings: Json
        active: boolean
        created_at: string
      }>
      profiles: Row<{
        id: string
        workshop_id: string | null
        role: 'owner' | 'staff' | 'byki_admin'
        full_name: string
        created_at: string
      }>
      products: Row<{
        id: string
        workshop_id: string
        slug: string
        sku: string
        kind: 'service' | 'device' | 'part'
        category: string
        name: string
        description: string
        short_description: string
        image: string | null
        price_retail: number
        price_bulk: number | null
        bulk_min_qty: number
        original_price: number | null
        deposit_amount: number | null
        specifications: Json
        compatible_vehicles: string[]
        compatible_gearboxes: string[]
        tags: string[]
        in_stock: boolean
        coming_soon: boolean
        is_featured: boolean
        active: boolean
        created_at: string
      }>
      inventory: Row<{
        workshop_id: string
        product_id: string
        stock_qty: number
        reorder_level: number
        updated_at: string
      }>
      stock_movements: Row<{
        id: string
        workshop_id: string
        product_id: string
        type: 'restock' | 'sale' | 'workshop_use' | 'adjustment'
        qty: number
        reference: string
        note: string
        created_at: string
      }>
      customers: Row<{
        id: string
        workshop_id: string
        name: string
        phone: string
        email: string
        vehicles: string[]
        total_spent: number
        orders_count: number
        bookings_count: number
        first_seen: string
        last_seen: string
        created_at: string
      }>
      orders: Row<{
        id: string
        workshop_id: string
        customer_id: string | null
        invoice_ref: string
        channel: 'retail' | 'bulk' | 'owner'
        customer_name: string
        customer_email: string
        customer_phone: string
        amount: number
        status: 'pending_payment' | 'paid' | 'cancelled' | 'fulfilled'
        payment_status: 'pending' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
        leanx_bill_no: string | null
        leanx_invoice_ref: string | null
        payment_link: string | null
        payment_provider: string | null
        payment_method: string | null
        payment_transaction_id: string | null
        stock_applied: boolean
        created_at: string
        paid_at: string | null
      }>
      order_items: Row<{
        id: string
        workshop_id: string
        order_id: string
        product_id: string
        sku: string
        name: string
        unit_price: number
        qty: number
        pricing: string
        line_total: number
      }>
      bookings: Row<{
        id: string
        workshop_id: string
        customer_id: string | null
        invoice_ref: string
        service_type: string
        customer_name: string
        customer_email: string
        customer_phone: string
        vehicle_model: string
        preferred_date: string | null
        time_slot: string
        amount: number
        status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'
        payment_status: 'pending' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
        leanx_bill_no: string | null
        leanx_invoice_ref: string | null
        payment_link: string | null
        payment_provider: string | null
        payment_method: string | null
        payment_transaction_id: string | null
        fault_codes: string[]
        notes: string
        created_at: string
        paid_at: string | null
      }>
      diagnose_sessions: Row<{
        id: string
        workshop_id: string
        customer_id: string | null
        booking_id: string | null
        source: 'obd' | 'cvt_sim'
        vehicle_model: string
        fault_codes: string[]
        payload: Json
        created_at: string
      }>
    }
    Views: Record<string, never>
    Functions: {
      current_workshop_id: { Args: Record<string, never>; Returns: string }
      is_byki_admin: { Args: Record<string, never>; Returns: boolean }
      apply_stock_movement: {
        Args: {
          p_workshop: string
          p_product: string
          p_type: 'restock' | 'sale' | 'workshop_use' | 'adjustment'
          p_qty: number
          p_reference?: string
          p_note?: string
        }
        Returns: Database['public']['Tables']['stock_movements']['Row']
      }
    }
    Enums: Record<string, never>
  }
}
