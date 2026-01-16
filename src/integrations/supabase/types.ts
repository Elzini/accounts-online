export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      car_transfers: {
        Row: {
          agreed_commission: number | null
          car_id: string
          commission_percentage: number | null
          created_at: string
          id: string
          notes: string | null
          partner_dealership_id: string
          return_date: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          transfer_date: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at: string
        }
        Insert: {
          agreed_commission?: number | null
          car_id: string
          commission_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_dealership_id: string
          return_date?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          transfer_date?: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
        }
        Update: {
          agreed_commission?: number | null
          car_id?: string
          commission_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_dealership_id?: string
          return_date?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          transfer_date?: string
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_transfers_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_transfers_partner_dealership_id_fkey"
            columns: ["partner_dealership_id"]
            isOneToOne: false
            referencedRelation: "partner_dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          batch_id: string | null
          chassis_number: string
          color: string | null
          created_at: string
          id: string
          inventory_number: number
          model: string | null
          name: string
          purchase_date: string
          purchase_price: number
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          chassis_number: string
          color?: string | null
          created_at?: string
          id?: string
          inventory_number?: number
          model?: string | null
          name: string
          purchase_date?: string
          purchase_price: number
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          chassis_number?: string
          color?: string | null
          created_at?: string
          id?: string
          inventory_number?: number
          model?: string | null
          name?: string
          purchase_date?: string
          purchase_price?: number
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "purchase_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          id_number: string | null
          name: string
          phone: string
          registration_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          id_number?: string | null
          name: string
          phone: string
          registration_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          id_number?: string | null
          name?: string
          phone?: string
          registration_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partner_dealerships: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      purchase_batches: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          purchase_date: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          car_id: string
          created_at: string
          id: string
          profit: number
          sale_id: string
          sale_price: number
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          profit: number
          sale_id: string
          sale_price: number
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          profit?: number
          sale_id?: string
          sale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          car_id: string
          commission: number | null
          created_at: string
          customer_id: string
          id: string
          other_expenses: number | null
          profit: number
          sale_date: string
          sale_number: number
          sale_price: number
          seller_name: string | null
          updated_at: string
        }
        Insert: {
          car_id: string
          commission?: number | null
          created_at?: string
          customer_id: string
          id?: string
          other_expenses?: number | null
          profit: number
          sale_date?: string
          sale_number?: number
          sale_price: number
          seller_name?: string | null
          updated_at?: string
        }
        Update: {
          car_id?: string
          commission?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          other_expenses?: number | null
          profit?: number
          sale_date?: string
          sale_number?: number
          sale_price?: number
          seller_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          id_number: string | null
          name: string
          notes: string | null
          phone: string
          registration_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          id_number?: string | null
          name: string
          notes?: string | null
          phone: string
          registration_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          id_number?: string | null
          name?: string
          notes?: string | null
          phone?: string
          registration_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["user_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["user_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["user_permission"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["user_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      transfer_status: "pending" | "sold" | "returned"
      transfer_type: "outgoing" | "incoming"
      user_permission: "sales" | "purchases" | "reports" | "admin" | "users"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      transfer_status: ["pending", "sold", "returned"],
      transfer_type: ["outgoing", "incoming"],
      user_permission: ["sales", "purchases", "reports", "admin", "users"],
    },
  },
} as const
