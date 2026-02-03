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
      account_categories: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          parent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      account_mappings: {
        Row: {
          account_id: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          mapping_key: string
          mapping_type: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          mapping_key: string
          mapping_type: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          mapping_key?: string
          mapping_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_mappings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_mappings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          company_id: string
          created_at: string
          default_depreciation_method: string | null
          default_depreciation_rate: number | null
          default_useful_life: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          default_depreciation_method?: string | null
          default_depreciation_rate?: number | null
          default_useful_life?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          default_depreciation_method?: string | null
          default_depreciation_rate?: number | null
          default_useful_life?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          integrity_hash: string | null
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          previous_hash: string | null
          sequence_number: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          integrity_hash?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          previous_hash?: string | null
          sequence_number?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          integrity_hash?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          previous_hash?: string | null
          sequence_number?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_schedules: {
        Row: {
          company_id: string
          created_at: string
          frequency: string
          id: string
          is_enabled: boolean
          last_backup_at: string | null
          next_backup_at: string | null
          retention_days: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_backup_at?: string | null
          next_backup_at?: string | null
          retention_days?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_backup_at?: string | null
          next_backup_at?: string | null
          retention_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          backup_data: Json | null
          backup_type: string
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          error_message: string | null
          file_path: string | null
          file_size: number | null
          id: string
          name: string
          records_count: Json | null
          status: string
          tables_included: string[]
        }
        Insert: {
          backup_data?: Json | null
          backup_type?: string
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          name: string
          records_count?: Json | null
          status?: string
          tables_included?: string[]
        }
        Update: {
          backup_data?: Json | null
          backup_type?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          name?: string
          records_count?: Json | null
          status?: string
          tables_included?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "backups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_category_id: string | null
          account_name: string
          account_number: string | null
          account_number_encrypted: string | null
          bank_name: string
          company_id: string
          created_at: string
          current_balance: number | null
          iban: string | null
          iban_encrypted: string | null
          id: string
          is_active: boolean
          notes: string | null
          opening_balance: number | null
          swift_code: string | null
          updated_at: string
        }
        Insert: {
          account_category_id?: string | null
          account_name: string
          account_number?: string | null
          account_number_encrypted?: string | null
          bank_name: string
          company_id: string
          created_at?: string
          current_balance?: number | null
          iban?: string | null
          iban_encrypted?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          opening_balance?: number | null
          swift_code?: string | null
          updated_at?: string
        }
        Update: {
          account_category_id?: string | null
          account_name?: string
          account_number?: string | null
          account_number_encrypted?: string | null
          bank_name?: string
          company_id?: string
          created_at?: string
          current_balance?: number | null
          iban?: string | null
          iban_encrypted?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          opening_balance?: number | null
          swift_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_category_id_fkey"
            columns: ["account_category_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliations: {
        Row: {
          adjusted_book_balance: number | null
          approved_at: string | null
          approved_by: string | null
          bank_account_id: string
          book_balance: number
          company_id: string
          created_at: string
          difference: number | null
          id: string
          notes: string | null
          prepared_by: string | null
          reconciliation_date: string
          statement_ending_balance: number
          status: string
          updated_at: string
        }
        Insert: {
          adjusted_book_balance?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id: string
          book_balance: number
          company_id: string
          created_at?: string
          difference?: number | null
          id?: string
          notes?: string | null
          prepared_by?: string | null
          reconciliation_date: string
          statement_ending_balance: number
          status?: string
          updated_at?: string
        }
        Update: {
          adjusted_book_balance?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string
          book_balance?: number
          company_id?: string
          created_at?: string
          difference?: number | null
          id?: string
          notes?: string | null
          prepared_by?: string | null
          reconciliation_date?: string
          statement_ending_balance?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statements: {
        Row: {
          bank_account_id: string
          company_id: string
          created_at: string
          file_name: string | null
          id: string
          import_date: string
          imported_by: string | null
          matched_transactions: number | null
          notes: string | null
          statement_date: string
          status: string
          total_transactions: number | null
          unmatched_transactions: number | null
        }
        Insert: {
          bank_account_id: string
          company_id: string
          created_at?: string
          file_name?: string | null
          id?: string
          import_date?: string
          imported_by?: string | null
          matched_transactions?: number | null
          notes?: string | null
          statement_date: string
          status?: string
          total_transactions?: number | null
          unmatched_transactions?: number | null
        }
        Update: {
          bank_account_id?: string
          company_id?: string
          created_at?: string
          file_name?: string | null
          id?: string
          import_date?: string
          imported_by?: string | null
          matched_transactions?: number | null
          notes?: string | null
          statement_date?: string
          status?: string
          total_transactions?: number | null
          unmatched_transactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          balance: number | null
          bank_account_id: string
          created_at: string
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          is_matched: boolean | null
          matched_at: string | null
          matched_by: string | null
          matched_id: string | null
          matched_type: string | null
          notes: string | null
          reference: string | null
          statement_id: string
          transaction_date: string
          value_date: string | null
        }
        Insert: {
          balance?: number | null
          bank_account_id: string
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          is_matched?: boolean | null
          matched_at?: string | null
          matched_by?: string | null
          matched_id?: string | null
          matched_type?: string | null
          notes?: string | null
          reference?: string | null
          statement_id: string
          transaction_date: string
          value_date?: string | null
        }
        Update: {
          balance?: number | null
          bank_account_id?: string
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          is_matched?: boolean | null
          matched_at?: string | null
          matched_by?: string | null
          matched_id?: string | null
          matched_type?: string | null
          notes?: string | null
          reference?: string | null
          statement_id?: string
          transaction_date?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      car_transfers: {
        Row: {
          actual_commission: number | null
          agreed_commission: number | null
          car_id: string
          commission_percentage: number | null
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          partner_dealership_id: string
          return_date: string | null
          sale_id: string | null
          sale_price: number | null
          status: Database["public"]["Enums"]["transfer_status"]
          transfer_date: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at: string
        }
        Insert: {
          actual_commission?: number | null
          agreed_commission?: number | null
          car_id: string
          commission_percentage?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_dealership_id: string
          return_date?: string | null
          sale_id?: string | null
          sale_price?: number | null
          status?: Database["public"]["Enums"]["transfer_status"]
          transfer_date?: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
        }
        Update: {
          actual_commission?: number | null
          agreed_commission?: number | null
          car_id?: string
          commission_percentage?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_dealership_id?: string
          return_date?: string | null
          sale_id?: string | null
          sale_price?: number | null
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
            foreignKeyName: "car_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_transfers_partner_dealership_id_fkey"
            columns: ["partner_dealership_id"]
            isOneToOne: false
            referencedRelation: "partner_dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_transfers_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          batch_id: string | null
          chassis_number: string
          color: string | null
          company_id: string | null
          created_at: string
          fiscal_year_id: string | null
          id: string
          inventory_number: number
          model: string | null
          name: string
          payment_account_id: string | null
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
          company_id?: string | null
          created_at?: string
          fiscal_year_id?: string | null
          id?: string
          inventory_number?: number
          model?: string | null
          name: string
          payment_account_id?: string | null
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
          company_id?: string | null
          created_at?: string
          fiscal_year_id?: string | null
          id?: string
          inventory_number?: number
          model?: string | null
          name?: string
          payment_account_id?: string | null
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
            foreignKeyName: "cars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
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
      coa_templates: {
        Row: {
          code: string
          company_type: Database["public"]["Enums"]["company_activity_type"]
          created_at: string
          id: string
          is_header: boolean | null
          name: string
          name_en: string | null
          parent_code: string | null
          sort_order: number | null
          type: string
        }
        Insert: {
          code: string
          company_type: Database["public"]["Enums"]["company_activity_type"]
          created_at?: string
          id?: string
          is_header?: boolean | null
          name: string
          name_en?: string | null
          parent_code?: string | null
          sort_order?: number | null
          type: string
        }
        Update: {
          code?: string
          company_type?: Database["public"]["Enums"]["company_activity_type"]
          created_at?: string
          id?: string
          is_header?: boolean | null
          name?: string
          name_en?: string | null
          parent_code?: string | null
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          company_type: Database["public"]["Enums"]["company_activity_type"]
          created_at: string
          id: string
          invoice_logo_url: string | null
          invoice_settings: Json | null
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_type?: Database["public"]["Enums"]["company_activity_type"]
          created_at?: string
          id?: string
          invoice_logo_url?: string | null
          invoice_settings?: Json | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_type?: Database["public"]["Enums"]["company_activity_type"]
          created_at?: string
          id?: string
          invoice_logo_url?: string | null
          invoice_settings?: Json | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_accounting_settings: {
        Row: {
          auto_expense_entries: boolean
          auto_journal_entries_enabled: boolean
          auto_purchase_entries: boolean
          auto_sales_entries: boolean
          cogs_account_id: string | null
          company_id: string
          created_at: string
          expense_account_id: string | null
          expense_cash_account_id: string | null
          id: string
          inventory_account_id: string | null
          purchase_cash_account_id: string | null
          purchase_inventory_account_id: string | null
          sales_cash_account_id: string | null
          sales_revenue_account_id: string | null
          suppliers_account_id: string | null
          updated_at: string
          vat_payable_account_id: string | null
          vat_recoverable_account_id: string | null
          vat_settlement_account_id: string | null
        }
        Insert: {
          auto_expense_entries?: boolean
          auto_journal_entries_enabled?: boolean
          auto_purchase_entries?: boolean
          auto_sales_entries?: boolean
          cogs_account_id?: string | null
          company_id: string
          created_at?: string
          expense_account_id?: string | null
          expense_cash_account_id?: string | null
          id?: string
          inventory_account_id?: string | null
          purchase_cash_account_id?: string | null
          purchase_inventory_account_id?: string | null
          sales_cash_account_id?: string | null
          sales_revenue_account_id?: string | null
          suppliers_account_id?: string | null
          updated_at?: string
          vat_payable_account_id?: string | null
          vat_recoverable_account_id?: string | null
          vat_settlement_account_id?: string | null
        }
        Update: {
          auto_expense_entries?: boolean
          auto_journal_entries_enabled?: boolean
          auto_purchase_entries?: boolean
          auto_sales_entries?: boolean
          cogs_account_id?: string | null
          company_id?: string
          created_at?: string
          expense_account_id?: string | null
          expense_cash_account_id?: string | null
          id?: string
          inventory_account_id?: string | null
          purchase_cash_account_id?: string | null
          purchase_inventory_account_id?: string | null
          sales_cash_account_id?: string | null
          sales_revenue_account_id?: string | null
          suppliers_account_id?: string | null
          updated_at?: string
          vat_payable_account_id?: string | null
          vat_recoverable_account_id?: string | null
          vat_settlement_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_accounting_settings_cogs_account_id_fkey"
            columns: ["cogs_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_expense_cash_account_id_fkey"
            columns: ["expense_cash_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_inventory_account_id_fkey"
            columns: ["inventory_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_purchase_cash_account_id_fkey"
            columns: ["purchase_cash_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_purchase_inventory_account_id_fkey"
            columns: ["purchase_inventory_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_sales_cash_account_id_fkey"
            columns: ["sales_cash_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_sales_revenue_account_id_fkey"
            columns: ["sales_revenue_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_suppliers_account_id_fkey"
            columns: ["suppliers_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_vat_payable_account_id_fkey"
            columns: ["vat_payable_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_vat_recoverable_account_id_fkey"
            columns: ["vat_recoverable_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_accounting_settings_vat_settlement_account_id_fkey"
            columns: ["vat_settlement_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          advance_payment: number | null
          advance_percentage: number | null
          company_id: string
          contract_number: number
          contract_type: string | null
          contract_value: number
          contractor_address: string | null
          contractor_name: string | null
          contractor_phone: string | null
          created_at: string
          description: string | null
          end_date: string | null
          fiscal_year_id: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          project_id: string | null
          retention_percentage: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          advance_payment?: number | null
          advance_percentage?: number | null
          company_id: string
          contract_number?: number
          contract_type?: string | null
          contract_value?: number
          contractor_address?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          project_id?: string | null
          retention_percentage?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          advance_payment?: number | null
          advance_percentage?: number | null
          company_id?: string
          contract_number?: number
          contract_type?: string | null
          contract_value?: number
          contractor_address?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          project_id?: string | null
          retention_percentage?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_reports: {
        Row: {
          columns: Json
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          filters: Json | null
          grouping: Json | null
          id: string
          is_active: boolean
          name: string
          report_type: string
          sorting: Json | null
          source_table: string
          styling: Json | null
          updated_at: string
        }
        Insert: {
          columns?: Json
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          is_active?: boolean
          name: string
          report_type?: string
          sorting?: Json | null
          source_table: string
          styling?: Json | null
          updated_at?: string
        }
        Update: {
          columns?: Json
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          report_type?: string
          sorting?: Json | null
          source_table?: string
          styling?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string
          id: string
          id_number: string | null
          id_number_encrypted: string | null
          name: string
          phone: string
          registration_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          id_number?: string | null
          id_number_encrypted?: string | null
          name: string
          phone: string
          registration_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          id_number?: string | null
          id_number_encrypted?: string | null
          name?: string
          phone?: string
          registration_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_config: {
        Row: {
          analytics_settings: Json
          company_id: string
          created_at: string
          id: string
          layout_settings: Json
          stat_cards: Json
          updated_at: string
        }
        Insert: {
          analytics_settings?: Json
          company_id: string
          created_at?: string
          id?: string
          layout_settings?: Json
          stat_cards?: Json
          updated_at?: string
        }
        Update: {
          analytics_settings?: Json
          company_id?: string
          created_at?: string
          id?: string
          layout_settings?: Json
          stat_cards?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      default_company_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_type: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      depreciation_entries: {
        Row: {
          accumulated_after: number
          asset_id: string
          book_value_after: number
          company_id: string
          created_at: string
          depreciation_amount: number
          entry_date: string
          id: string
          journal_entry_id: string | null
          notes: string | null
          period_end: string
          period_start: string
        }
        Insert: {
          accumulated_after: number
          asset_id: string
          book_value_after: number
          company_id: string
          created_at?: string
          depreciation_amount: number
          entry_date: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          period_end: string
          period_start: string
        }
        Update: {
          accumulated_after?: number
          asset_id?: string
          book_value_after?: number
          company_id?: string
          created_at?: string
          depreciation_amount?: number
          entry_date?: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "depreciation_entries_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciation_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depreciation_entries_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_advances: {
        Row: {
          advance_date: string
          amount: number
          company_id: string
          created_at: string
          deducted_in_payroll_id: string | null
          employee_id: string
          id: string
          is_deducted: boolean
          notes: string | null
          reason: string | null
        }
        Insert: {
          advance_date?: string
          amount: number
          company_id: string
          created_at?: string
          deducted_in_payroll_id?: string | null
          employee_id: string
          id?: string
          is_deducted?: boolean
          notes?: string | null
          reason?: string | null
        }
        Update: {
          advance_date?: string
          amount?: number
          company_id?: string
          created_at?: string
          deducted_in_payroll_id?: string | null
          employee_id?: string
          id?: string
          is_deducted?: boolean
          notes?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_advances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bank_name: string | null
          base_salary: number
          company_id: string
          created_at: string
          employee_number: number
          hire_date: string | null
          housing_allowance: number
          iban: string | null
          iban_encrypted: string | null
          id: string
          id_number: string | null
          id_number_encrypted: string | null
          is_active: boolean
          job_title: string
          name: string
          notes: string | null
          phone: string | null
          transport_allowance: number
          updated_at: string
        }
        Insert: {
          bank_name?: string | null
          base_salary?: number
          company_id: string
          created_at?: string
          employee_number?: number
          hire_date?: string | null
          housing_allowance?: number
          iban?: string | null
          iban_encrypted?: string | null
          id?: string
          id_number?: string | null
          id_number_encrypted?: string | null
          is_active?: boolean
          job_title: string
          name: string
          notes?: string | null
          phone?: string | null
          transport_allowance?: number
          updated_at?: string
        }
        Update: {
          bank_name?: string | null
          base_salary?: number
          company_id?: string
          created_at?: string
          employee_number?: number
          hire_date?: string | null
          housing_allowance?: number
          iban?: string | null
          iban_encrypted?: string | null
          id?: string
          id_number?: string | null
          id_number_encrypted?: string | null
          is_active?: boolean
          job_title?: string
          name?: string
          notes?: string | null
          phone?: string | null
          transport_allowance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_keys: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          rotated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          rotated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          rotated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encryption_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          car_id: string | null
          category_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          fiscal_year_id: string | null
          has_vat_invoice: boolean | null
          id: string
          notes: string | null
          payment_method: string | null
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          car_id?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          fiscal_year_id?: string | null
          has_vat_invoice?: boolean | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          car_id?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          fiscal_year_id?: string | null
          has_vat_invoice?: boolean | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_statement_config: {
        Row: {
          company_id: string
          created_at: string
          display_options: Json | null
          id: string
          sections: Json
          statement_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          display_options?: Json | null
          id?: string
          sections?: Json
          statement_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          display_options?: Json | null
          id?: string
          sections?: Json
          statement_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_statement_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_companies: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          bank_name: string | null
          commission_rate: number | null
          company_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          bank_name?: string | null
          commission_rate?: number | null
          company_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          bank_name?: string | null
          commission_rate?: number | null
          company_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financing_contracts: {
        Row: {
          amount_received_from_bank: number | null
          bank_reference: string | null
          bank_transfer_date: string | null
          car_id: string | null
          company_id: string
          contract_date: string
          contract_number: string
          created_at: string
          customer_id: string | null
          down_payment: number
          financed_amount: number
          financing_company_id: string
          first_payment_date: string
          id: string
          last_payment_date: string | null
          monthly_payment: number
          notes: string | null
          number_of_months: number
          profit_rate: number
          sale_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_received_from_bank?: number | null
          bank_reference?: string | null
          bank_transfer_date?: string | null
          car_id?: string | null
          company_id: string
          contract_date?: string
          contract_number: string
          created_at?: string
          customer_id?: string | null
          down_payment?: number
          financed_amount: number
          financing_company_id: string
          first_payment_date: string
          id?: string
          last_payment_date?: string | null
          monthly_payment: number
          notes?: string | null
          number_of_months: number
          profit_rate?: number
          sale_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_received_from_bank?: number | null
          bank_reference?: string | null
          bank_transfer_date?: string | null
          car_id?: string | null
          company_id?: string
          contract_date?: string
          contract_number?: string
          created_at?: string
          customer_id?: string | null
          down_payment?: number
          financed_amount?: number
          financing_company_id?: string
          first_payment_date?: string
          id?: string
          last_payment_date?: string | null
          monthly_payment?: number
          notes?: string | null
          number_of_months?: number
          profit_rate?: number
          sale_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_contracts_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_contracts_financing_company_id_fkey"
            columns: ["financing_company_id"]
            isOneToOne: false
            referencedRelation: "financing_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_contracts_financing_company_id_fkey"
            columns: ["financing_company_id"]
            isOneToOne: false
            referencedRelation: "financing_companies_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_contracts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_payments: {
        Row: {
          amount: number
          bank_reference: string | null
          contract_id: string
          created_at: string
          due_date: string
          id: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          payment_number: number
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "financing_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_years: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_balance_entry_id: string | null
          company_id: string
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          notes: string | null
          opening_balance_entry_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_balance_entry_id?: string | null
          company_id: string
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          notes?: string | null
          opening_balance_entry_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_balance_entry_id?: string | null
          company_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          notes?: string | null
          opening_balance_entry_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_years_closing_balance_entry_id_fkey"
            columns: ["closing_balance_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_years_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_years_opening_balance_entry_id_fkey"
            columns: ["opening_balance_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          account_category_id: string | null
          accumulated_depreciation: number | null
          accumulated_depreciation_account_id: string | null
          asset_number: number
          category: string | null
          company_id: string
          created_at: string
          current_value: number | null
          depreciation_account_id: string | null
          depreciation_method: string | null
          depreciation_rate: number | null
          description: string | null
          disposal_date: string | null
          disposal_notes: string | null
          disposal_value: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_date: string
          purchase_price: number
          salvage_value: number | null
          serial_number: string | null
          status: string | null
          updated_at: string
          useful_life_years: number
        }
        Insert: {
          account_category_id?: string | null
          accumulated_depreciation?: number | null
          accumulated_depreciation_account_id?: string | null
          asset_number?: number
          category?: string | null
          company_id: string
          created_at?: string
          current_value?: number | null
          depreciation_account_id?: string | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          description?: string | null
          disposal_date?: string | null
          disposal_notes?: string | null
          disposal_value?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_date: string
          purchase_price: number
          salvage_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          useful_life_years: number
        }
        Update: {
          account_category_id?: string | null
          accumulated_depreciation?: number | null
          accumulated_depreciation_account_id?: string | null
          asset_number?: number
          category?: string | null
          company_id?: string
          created_at?: string
          current_value?: number | null
          depreciation_account_id?: string | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          description?: string | null
          disposal_date?: string | null
          disposal_notes?: string | null
          disposal_value?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          salvage_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_account_category_id_fkey"
            columns: ["account_category_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_accumulated_depreciation_account_id_fkey"
            columns: ["accumulated_depreciation_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_depreciation_account_id_fkey"
            columns: ["depreciation_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      formula_definitions: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          display_order: number | null
          formula_category: string
          formula_expression: Json
          formula_key: string
          formula_name: string
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          formula_category: string
          formula_expression: Json
          formula_key: string
          formula_name: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          formula_category?: string
          formula_expression?: Json
          formula_key?: string
          formula_name?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formula_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      formula_variables: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string
          data_source: string
          icon: string | null
          id: string
          is_system: boolean | null
          query_definition: Json | null
          variable_category: string
          variable_key: string
          variable_name: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          data_source: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          query_definition?: Json | null
          variable_category: string
          variable_key: string
          variable_name: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          data_source?: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          query_definition?: Json | null
          variable_category?: string
          variable_key?: string
          variable_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "formula_variables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_invoice_data: {
        Row: {
          company_id: string
          created_at: string
          data: Json
          file_name: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data: Json
          file_name?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json
          file_name?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_invoice_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_dashboard_config: {
        Row: {
          card_key: string
          color: string | null
          company_type: Database["public"]["Enums"]["company_activity_type"]
          created_at: string
          data_source: string | null
          icon: string | null
          id: string
          label_ar: string
          label_en: string | null
          sort_order: number | null
        }
        Insert: {
          card_key: string
          color?: string | null
          company_type: Database["public"]["Enums"]["company_activity_type"]
          created_at?: string
          data_source?: string | null
          icon?: string | null
          id?: string
          label_ar: string
          label_en?: string | null
          sort_order?: number | null
        }
        Update: {
          card_key?: string
          color?: string | null
          company_type?: Database["public"]["Enums"]["company_activity_type"]
          created_at?: string
          data_source?: string | null
          icon?: string | null
          id?: string
          label_ar?: string
          label_en?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      industry_menu_config: {
        Row: {
          company_type: Database["public"]["Enums"]["company_activity_type"]
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean | null
          label_ar: string
          label_en: string | null
          menu_key: string
          parent_key: string | null
          route: string | null
          sort_order: number | null
        }
        Insert: {
          company_type: Database["public"]["Enums"]["company_activity_type"]
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          label_ar: string
          label_en?: string | null
          menu_key: string
          parent_key?: string | null
          route?: string | null
          sort_order?: number | null
        }
        Update: {
          company_type?: Database["public"]["Enums"]["company_activity_type"]
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          label_ar?: string
          label_en?: string | null
          menu_key?: string
          parent_key?: string | null
          route?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      installment_payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_sale_id: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          payment_number: number
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_sale_id: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_sale_id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_payments_installment_sale_id_fkey"
            columns: ["installment_sale_id"]
            isOneToOne: false
            referencedRelation: "installment_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_sales: {
        Row: {
          company_id: string
          created_at: string
          down_payment: number
          id: string
          installment_amount: number
          notes: string | null
          number_of_installments: number
          remaining_amount: number
          sale_id: string
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          down_payment?: number
          id?: string
          installment_amount: number
          notes?: string | null
          number_of_installments: number
          remaining_amount: number
          sale_id: string
          start_date?: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          down_payment?: number
          id?: string
          installment_amount?: number
          notes?: string | null
          number_of_installments?: number
          remaining_amount?: number
          sale_id?: string
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_sales_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          average_cost: number | null
          barcode: string | null
          brand: string | null
          category: string | null
          cogs_account_id: string | null
          company_id: string
          conversion_rate: number | null
          cost_price: number | null
          created_at: string
          description: string | null
          dimensions: string | null
          has_batch_tracking: boolean | null
          has_expiry_date: boolean | null
          has_serial_number: boolean | null
          id: string
          image_url: string | null
          inventory_account_id: string | null
          is_active: boolean | null
          is_purchasable: boolean | null
          is_sellable: boolean | null
          is_vat_exempt: boolean | null
          item_code: string
          item_name: string
          item_name_en: string | null
          item_type: string | null
          last_cost: number | null
          location: string | null
          maximum_stock: number | null
          minimum_price: number | null
          model: string | null
          notes: string | null
          quantity_available: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          reorder_level: number | null
          reorder_quantity: number | null
          sales_account_id: string | null
          secondary_unit: string | null
          selling_price: number | null
          shelf: string | null
          subcategory: string | null
          unit: string | null
          updated_at: string
          valuation_method: string | null
          vat_rate: number | null
          weight: number | null
          wholesale_price: number | null
        }
        Insert: {
          average_cost?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cogs_account_id?: string | null
          company_id: string
          conversion_rate?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          has_batch_tracking?: boolean | null
          has_expiry_date?: boolean | null
          has_serial_number?: boolean | null
          id?: string
          image_url?: string | null
          inventory_account_id?: string | null
          is_active?: boolean | null
          is_purchasable?: boolean | null
          is_sellable?: boolean | null
          is_vat_exempt?: boolean | null
          item_code: string
          item_name: string
          item_name_en?: string | null
          item_type?: string | null
          last_cost?: number | null
          location?: string | null
          maximum_stock?: number | null
          minimum_price?: number | null
          model?: string | null
          notes?: string | null
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          reorder_level?: number | null
          reorder_quantity?: number | null
          sales_account_id?: string | null
          secondary_unit?: string | null
          selling_price?: number | null
          shelf?: string | null
          subcategory?: string | null
          unit?: string | null
          updated_at?: string
          valuation_method?: string | null
          vat_rate?: number | null
          weight?: number | null
          wholesale_price?: number | null
        }
        Update: {
          average_cost?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cogs_account_id?: string | null
          company_id?: string
          conversion_rate?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          has_batch_tracking?: boolean | null
          has_expiry_date?: boolean | null
          has_serial_number?: boolean | null
          id?: string
          image_url?: string | null
          inventory_account_id?: string | null
          is_active?: boolean | null
          is_purchasable?: boolean | null
          is_sellable?: boolean | null
          is_vat_exempt?: boolean | null
          item_code?: string
          item_name?: string
          item_name_en?: string | null
          item_type?: string | null
          last_cost?: number | null
          location?: string | null
          maximum_stock?: number | null
          minimum_price?: number | null
          model?: string | null
          notes?: string | null
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          reorder_level?: number | null
          reorder_quantity?: number | null
          sales_account_id?: string | null
          secondary_unit?: string | null
          selling_price?: number | null
          shelf?: string | null
          subcategory?: string | null
          unit?: string | null
          updated_at?: string
          valuation_method?: string | null
          vat_rate?: number | null
          weight?: number | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_cogs_account_id_fkey"
            columns: ["cogs_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_inventory_account_id_fkey"
            columns: ["inventory_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_sales_account_id_fkey"
            columns: ["sales_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          account_id: string | null
          car_id: string | null
          created_at: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          inventory_item_id: string | null
          invoice_id: string
          item_code: string | null
          item_description: string
          quantity: number
          taxable_amount: number
          total: number
          unit: string | null
          unit_price: number
          vat_amount: number
          vat_rate: number | null
        }
        Insert: {
          account_id?: string | null
          car_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          inventory_item_id?: string | null
          invoice_id: string
          item_code?: string | null
          item_description: string
          quantity?: number
          taxable_amount: number
          total: number
          unit?: string | null
          unit_price: number
          vat_amount: number
          vat_rate?: number | null
        }
        Update: {
          account_id?: string | null
          car_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          inventory_item_id?: string | null
          invoice_id?: string
          item_code?: string | null
          item_description?: string
          quantity?: number
          taxable_amount?: number
          total?: number
          unit?: string | null
          unit_price?: number
          vat_amount?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_id: string | null
          customer_name: string | null
          customer_vat_number: string | null
          discount_amount: number | null
          due_date: string | null
          fiscal_year_id: string | null
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          invoice_type: string
          journal_entry_id: string | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          sale_id: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          taxable_amount: number
          total: number
          updated_at: string
          vat_amount: number
          vat_rate: number | null
          zatca_invoice_hash: string | null
          zatca_qr: string | null
          zatca_status: string | null
          zatca_uuid: string | null
        }
        Insert: {
          amount_paid?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_vat_number?: string | null
          discount_amount?: number | null
          due_date?: string | null
          fiscal_year_id?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number: string
          invoice_type?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          sale_id?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          taxable_amount?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number | null
          zatca_invoice_hash?: string | null
          zatca_qr?: string | null
          zatca_status?: string | null
          zatca_uuid?: string | null
        }
        Update: {
          amount_paid?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_vat_number?: string | null
          discount_amount?: number | null
          due_date?: string | null
          fiscal_year_id?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          sale_id?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          taxable_amount?: number
          total?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number | null
          zatca_invoice_hash?: string | null
          zatca_qr?: string | null
          zatca_status?: string | null
          zatca_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          entry_number: number
          fiscal_year_id: string | null
          id: string
          is_posted: boolean
          reference_id: string | null
          reference_type: string | null
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          entry_date?: string
          entry_number?: number
          fiscal_year_id?: string | null
          id?: string
          is_posted?: boolean
          reference_id?: string | null
          reference_type?: string | null
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: number
          fiscal_year_id?: string | null
          id?: string
          is_posted?: boolean
          reference_id?: string | null
          reference_type?: string | null
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_rules: {
        Row: {
          amount_field: string | null
          company_id: string
          conditions: Json | null
          created_at: string
          credit_account_id: string | null
          debit_account_id: string | null
          description_template: string | null
          id: string
          is_enabled: boolean
          name: string
          priority: number | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          amount_field?: string | null
          company_id: string
          conditions?: Json | null
          created_at?: string
          credit_account_id?: string | null
          debit_account_id?: string | null
          description_template?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          priority?: number | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          amount_field?: string | null
          company_id?: string
          conditions?: Json | null
          created_at?: string
          credit_account_id?: string | null
          debit_account_id?: string | null
          description_template?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          priority?: number | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_rules_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_rules_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_configuration: {
        Row: {
          company_id: string
          created_at: string
          id: string
          menu_items: Json
          theme_settings: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          menu_items?: Json
          theme_settings?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          menu_items?: Json
          theme_settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_configuration_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_dealerships: {
        Row: {
          address: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_dealerships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          absence_amount: number
          absence_days: number
          advances_deducted: number
          base_salary: number
          bonus: number
          created_at: string
          deduction_notes: string | null
          employee_id: string
          gross_salary: number
          housing_allowance: number
          id: string
          net_salary: number
          other_deductions: number
          overtime_amount: number
          overtime_hours: number
          overtime_rate: number
          payroll_id: string
          total_deductions: number
          transport_allowance: number
        }
        Insert: {
          absence_amount?: number
          absence_days?: number
          advances_deducted?: number
          base_salary?: number
          bonus?: number
          created_at?: string
          deduction_notes?: string | null
          employee_id: string
          gross_salary?: number
          housing_allowance?: number
          id?: string
          net_salary?: number
          other_deductions?: number
          overtime_amount?: number
          overtime_hours?: number
          overtime_rate?: number
          payroll_id: string
          total_deductions?: number
          transport_allowance?: number
        }
        Update: {
          absence_amount?: number
          absence_days?: number
          advances_deducted?: number
          base_salary?: number
          bonus?: number
          created_at?: string
          deduction_notes?: string | null
          employee_id?: string
          gross_salary?: number
          housing_allowance?: number
          id?: string
          net_salary?: number
          other_deductions?: number
          overtime_amount?: number
          overtime_hours?: number
          overtime_rate?: number
          payroll_id?: string
          total_deductions?: number
          transport_allowance?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          id: string
          journal_entry_id: string | null
          month: number
          notes: string | null
          status: string
          total_absences: number
          total_advances: number
          total_allowances: number
          total_base_salaries: number
          total_bonuses: number
          total_deductions: number
          total_net_salaries: number
          total_overtime: number
          updated_at: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          month: number
          notes?: string | null
          status?: string
          total_absences?: number
          total_advances?: number
          total_allowances?: number
          total_base_salaries?: number
          total_bonuses?: number
          total_deductions?: number
          total_net_salaries?: number
          total_overtime?: number
          updated_at?: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          month?: number
          notes?: string | null
          status?: string
          total_absences?: number
          total_advances?: number
          total_allowances?: number
          total_base_salaries?: number
          total_bonuses?: number
          total_deductions?: number
          total_net_salaries?: number
          total_overtime?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      prepaid_expense_amortizations: {
        Row: {
          amortization_date: string
          amount: number
          created_at: string
          expense_id: string | null
          id: string
          journal_entry_id: string | null
          month_number: number
          prepaid_expense_id: string
          processed_at: string | null
          status: string
        }
        Insert: {
          amortization_date: string
          amount: number
          created_at?: string
          expense_id?: string | null
          id?: string
          journal_entry_id?: string | null
          month_number: number
          prepaid_expense_id: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          amortization_date?: string
          amount?: number
          created_at?: string
          expense_id?: string | null
          id?: string
          journal_entry_id?: string | null
          month_number?: number
          prepaid_expense_id?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prepaid_expense_amortizations_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepaid_expense_amortizations_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepaid_expense_amortizations_prepaid_expense_id_fkey"
            columns: ["prepaid_expense_id"]
            isOneToOne: false
            referencedRelation: "prepaid_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      prepaid_expenses: {
        Row: {
          amortized_amount: number
          category_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          end_date: string
          expense_account_id: string | null
          id: string
          monthly_amount: number
          notes: string | null
          number_of_months: number
          payment_date: string
          payment_method: string | null
          prepaid_asset_account_id: string | null
          remaining_amount: number
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amortized_amount?: number
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          end_date: string
          expense_account_id?: string | null
          id?: string
          monthly_amount: number
          notes?: string | null
          number_of_months?: number
          payment_date?: string
          payment_method?: string | null
          prepaid_asset_account_id?: string | null
          remaining_amount: number
          start_date: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          amortized_amount?: number
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string
          expense_account_id?: string | null
          id?: string
          monthly_amount?: number
          notes?: string | null
          number_of_months?: number
          payment_date?: string
          payment_method?: string | null
          prepaid_asset_account_id?: string | null
          remaining_amount?: number
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prepaid_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepaid_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepaid_expenses_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepaid_expenses_prepaid_asset_account_id_fkey"
            columns: ["prepaid_asset_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          current_fiscal_year_id: string | null
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          current_fiscal_year_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          current_fiscal_year_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_fiscal_year_id_fkey"
            columns: ["current_fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_billings: {
        Row: {
          advance_deduction: number | null
          approved_at: string | null
          approved_by: string | null
          billing_date: string
          billing_number: number
          company_id: string
          contract_id: string | null
          created_at: string
          fiscal_year_id: string | null
          id: string
          notes: string | null
          other_deductions: number | null
          payment_date: string | null
          period_end: string | null
          period_start: string | null
          previous_billings: number | null
          project_id: string | null
          retention_amount: number | null
          status: string | null
          updated_at: string
          vat_amount: number | null
          work_completed_value: number
        }
        Insert: {
          advance_deduction?: number | null
          approved_at?: string | null
          approved_by?: string | null
          billing_date?: string
          billing_number?: number
          company_id: string
          contract_id?: string | null
          created_at?: string
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          other_deductions?: number | null
          payment_date?: string | null
          period_end?: string | null
          period_start?: string | null
          previous_billings?: number | null
          project_id?: string | null
          retention_amount?: number | null
          status?: string | null
          updated_at?: string
          vat_amount?: number | null
          work_completed_value?: number
        }
        Update: {
          advance_deduction?: number | null
          approved_at?: string | null
          approved_by?: string | null
          billing_date?: string
          billing_number?: number
          company_id?: string
          contract_id?: string | null
          created_at?: string
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          other_deductions?: number | null
          payment_date?: string | null
          period_end?: string | null
          period_start?: string | null
          previous_billings?: number | null
          project_id?: string | null
          retention_amount?: number | null
          status?: string | null
          updated_at?: string
          vat_amount?: number | null
          work_completed_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "progress_billings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_billings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_billings_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_billings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_billings: {
        Row: {
          amount_received: number | null
          billing_date: string
          billing_number: number
          billing_type: string
          company_id: string
          created_at: string
          deductions: number | null
          gross_amount: number
          id: string
          invoice_id: string | null
          journal_entry_id: string | null
          net_amount: number
          notes: string | null
          payment_date: string | null
          project_id: string
          retention_held: number | null
          status: string | null
          vat_amount: number | null
        }
        Insert: {
          amount_received?: number | null
          billing_date?: string
          billing_number: number
          billing_type?: string
          company_id: string
          created_at?: string
          deductions?: number | null
          gross_amount: number
          id?: string
          invoice_id?: string | null
          journal_entry_id?: string | null
          net_amount: number
          notes?: string | null
          payment_date?: string | null
          project_id: string
          retention_held?: number | null
          status?: string | null
          vat_amount?: number | null
        }
        Update: {
          amount_received?: number | null
          billing_date?: string
          billing_number?: number
          billing_type?: string
          company_id?: string
          created_at?: string
          deductions?: number | null
          gross_amount?: number
          id?: string
          invoice_id?: string | null
          journal_entry_id?: string | null
          net_amount?: number
          notes?: string | null
          payment_date?: string | null
          project_id?: string
          retention_held?: number | null
          status?: string | null
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_billings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billings_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billings_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_billings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_costs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          cost_date: string
          cost_type: string
          created_at: string
          description: string
          expense_id: string | null
          id: string
          is_approved: boolean | null
          journal_entry_id: string | null
          notes: string | null
          project_id: string
          quantity: number | null
          supplier_id: string | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          cost_date?: string
          cost_type: string
          created_at?: string
          description: string
          expense_id?: string | null
          id?: string
          is_approved?: boolean | null
          journal_entry_id?: string | null
          notes?: string | null
          project_id: string
          quantity?: number | null
          supplier_id?: string | null
          total_cost: number
          unit_cost: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          cost_date?: string
          cost_type?: string
          created_at?: string
          description?: string
          expense_id?: string | null
          id?: string
          is_approved?: boolean | null
          journal_entry_id?: string | null
          notes?: string | null
          project_id?: string
          quantity?: number | null
          supplier_id?: string | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          billed_amount: number | null
          client_contact: string | null
          client_id: string | null
          client_name: string | null
          collected_amount: number | null
          company_id: string
          completion_percentage: number | null
          contract_date: string | null
          contract_number: string | null
          contract_value: number
          cost_account_id: string | null
          cost_to_date: number | null
          created_at: string
          created_by: string | null
          description: string | null
          expected_end_date: string | null
          fiscal_year_id: string | null
          id: string
          location: string | null
          notes: string | null
          profit_to_date: number | null
          project_code: string | null
          project_name: string
          project_number: number
          retention_amount: number | null
          retention_percentage: number | null
          revenue_account_id: string | null
          revenue_to_date: number | null
          site_address: string | null
          start_date: string | null
          status: string
          updated_at: string
          wip_account_id: string | null
        }
        Insert: {
          actual_end_date?: string | null
          billed_amount?: number | null
          client_contact?: string | null
          client_id?: string | null
          client_name?: string | null
          collected_amount?: number | null
          company_id: string
          completion_percentage?: number | null
          contract_date?: string | null
          contract_number?: string | null
          contract_value?: number
          cost_account_id?: string | null
          cost_to_date?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_end_date?: string | null
          fiscal_year_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          profit_to_date?: number | null
          project_code?: string | null
          project_name: string
          project_number?: number
          retention_amount?: number | null
          retention_percentage?: number | null
          revenue_account_id?: string | null
          revenue_to_date?: number | null
          site_address?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          wip_account_id?: string | null
        }
        Update: {
          actual_end_date?: string | null
          billed_amount?: number | null
          client_contact?: string | null
          client_id?: string | null
          client_name?: string | null
          collected_amount?: number | null
          company_id?: string
          completion_percentage?: number | null
          contract_date?: string | null
          contract_number?: string | null
          contract_value?: number
          cost_account_id?: string | null
          cost_to_date?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_end_date?: string | null
          fiscal_year_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          profit_to_date?: number | null
          project_code?: string | null
          project_name?: string
          project_number?: number
          retention_amount?: number | null
          retention_percentage?: number | null
          revenue_account_id?: string | null
          revenue_to_date?: number | null
          site_address?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          wip_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_cost_account_id_fkey"
            columns: ["cost_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_wip_account_id_fkey"
            columns: ["wip_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_batches: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          purchase_date: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_batches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          car_id: string | null
          created_at: string
          description: string
          id: string
          quantity: number
          quotation_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          car_id?: string | null
          created_at?: string
          description: string
          id?: string
          quantity?: number
          quotation_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          car_id?: string | null
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quotation_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          final_amount: number
          id: string
          notes: string | null
          quotation_number: number
          status: string
          tax_amount: number | null
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          final_amount?: number
          id?: string
          notes?: string | null
          quotation_number?: number
          status?: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          final_amount?: number
          id?: string
          notes?: string | null
          quotation_number?: number
          status?: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
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
          company_id: string | null
          created_at: string
          customer_id: string
          fiscal_year_id: string | null
          id: string
          other_expenses: number | null
          payment_account_id: string | null
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
          company_id?: string | null
          created_at?: string
          customer_id: string
          fiscal_year_id?: string | null
          id?: string
          other_expenses?: number | null
          payment_account_id?: string | null
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
          company_id?: string | null
          created_at?: string
          customer_id?: string
          fiscal_year_id?: string | null
          id?: string
          other_expenses?: number | null
          payment_account_id?: string | null
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
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          average_cost_after: number | null
          balance_after: number | null
          batch_number: string | null
          company_id: string
          created_at: string
          created_by: string | null
          expiry_date: string | null
          from_location: string | null
          id: string
          invoice_id: string | null
          item_id: string
          journal_entry_id: string | null
          movement_date: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          serial_number: string | null
          to_location: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          average_cost_after?: number | null
          balance_after?: number | null
          batch_number?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          from_location?: string | null
          id?: string
          invoice_id?: string | null
          item_id: string
          journal_entry_id?: string | null
          movement_date?: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          serial_number?: string | null
          to_location?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          average_cost_after?: number | null
          balance_after?: number | null
          batch_number?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          from_location?: string | null
          id?: string
          invoice_id?: string | null
          item_id?: string
          journal_entry_id?: string | null
          movement_date?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          serial_number?: string | null
          to_location?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
          created_at?: string
          id?: string
          id_number?: string | null
          name?: string
          notes?: string | null
          phone?: string
          registration_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings: {
        Row: {
          apply_to_purchases: boolean
          apply_to_sales: boolean
          building_number: string | null
          city: string | null
          commercial_register: string | null
          company_id: string
          company_name_ar: string | null
          created_at: string
          id: string
          is_active: boolean
          national_address: string | null
          postal_code: string | null
          tax_name: string
          tax_number: string | null
          tax_rate: number
          updated_at: string
        }
        Insert: {
          apply_to_purchases?: boolean
          apply_to_sales?: boolean
          building_number?: string | null
          city?: string | null
          commercial_register?: string | null
          company_id: string
          company_name_ar?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          national_address?: string | null
          postal_code?: string | null
          tax_name?: string
          tax_number?: string | null
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          apply_to_purchases?: boolean
          apply_to_sales?: boolean
          building_number?: string | null
          city?: string | null
          commercial_register?: string | null
          company_id?: string
          company_name_ar?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          national_address?: string | null
          postal_code?: string | null
          tax_name?: string
          tax_number?: string | null
          tax_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_balance_imports: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          data: Json
          file_name: string | null
          id: string
          name: string
          period_from: string | null
          period_to: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          data: Json
          file_name?: string | null
          id?: string
          name: string
          period_from?: string | null
          period_to?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          file_name?: string | null
          id?: string
          name?: string
          period_from?: string | null
          period_to?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_balance_imports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean | null
          secret_encrypted: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret_encrypted: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret_encrypted?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
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
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          company_id: string | null
          country: string | null
          device_type: string | null
          ended_at: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          is_suspicious: boolean | null
          last_activity: string
          os: string | null
          risk_score: number | null
          session_token: string | null
          started_at: string
          termination_reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_suspicious?: boolean | null
          last_activity?: string
          os?: string | null
          risk_score?: number | null
          session_token?: string | null
          started_at?: string
          termination_reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          is_suspicious?: boolean | null
          last_activity?: string
          os?: string | null
          risk_score?: number | null
          session_token?: string | null
          started_at?: string
          termination_reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          journal_entry_id: string | null
          payment_method: string | null
          related_id: string | null
          related_to: string | null
          updated_at: string
          voucher_date: string
          voucher_number: number
          voucher_type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          journal_entry_id?: string | null
          payment_method?: string | null
          related_id?: string | null
          related_to?: string | null
          updated_at?: string
          voucher_date?: string
          voucher_number?: number
          voucher_type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          journal_entry_id?: string | null
          payment_method?: string | null
          related_id?: string | null
          related_to?: string | null
          updated_at?: string
          voucher_date?: string
          voucher_number?: number
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          manager: string | null
          phone: string | null
          updated_at: string
          warehouse_code: string
          warehouse_name: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          manager?: string | null
          phone?: string | null
          updated_at?: string
          warehouse_code: string
          warehouse_name: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          manager?: string | null
          phone?: string | null
          updated_at?: string
          warehouse_code?: string
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bank_accounts_safe: {
        Row: {
          account_category_id: string | null
          account_name: string | null
          account_number_masked: string | null
          bank_name: string | null
          company_id: string | null
          created_at: string | null
          current_balance: number | null
          iban_masked: string | null
          id: string | null
          is_active: boolean | null
          notes: string | null
          opening_balance: number | null
          swift_code_masked: string | null
          updated_at: string | null
        }
        Insert: {
          account_category_id?: string | null
          account_name?: string | null
          account_number_masked?: never
          bank_name?: string | null
          company_id?: string | null
          created_at?: string | null
          current_balance?: number | null
          iban_masked?: never
          id?: string | null
          is_active?: boolean | null
          notes?: string | null
          opening_balance?: number | null
          swift_code_masked?: never
          updated_at?: string | null
        }
        Update: {
          account_category_id?: string | null
          account_name?: string | null
          account_number_masked?: never
          bank_name?: string | null
          company_id?: string | null
          created_at?: string | null
          current_balance?: number | null
          iban_masked?: never
          id?: string | null
          is_active?: boolean | null
          notes?: string | null
          opening_balance?: number | null
          swift_code_masked?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_category_id_fkey"
            columns: ["account_category_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers_safe: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string | null
          id: string | null
          id_number_masked: string | null
          name: string | null
          phone: string | null
          registration_number_masked: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          id_number_masked?: never
          name?: string | null
          phone?: string | null
          registration_number_masked?: never
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          id_number_masked?: never
          name?: string | null
          phone?: string | null
          registration_number_masked?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees_safe: {
        Row: {
          bank_name: string | null
          base_salary: number | null
          company_id: string | null
          created_at: string | null
          employee_number: number | null
          hire_date: string | null
          housing_allowance: number | null
          iban_masked: string | null
          id: string | null
          id_number_masked: string | null
          is_active: boolean | null
          job_title: string | null
          name: string | null
          notes: string | null
          phone: string | null
          transport_allowance: number | null
          updated_at: string | null
        }
        Insert: {
          bank_name?: string | null
          base_salary?: number | null
          company_id?: string | null
          created_at?: string | null
          employee_number?: number | null
          hire_date?: string | null
          housing_allowance?: number | null
          iban_masked?: never
          id?: string | null
          id_number_masked?: never
          is_active?: boolean | null
          job_title?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          transport_allowance?: number | null
          updated_at?: string | null
        }
        Update: {
          bank_name?: string | null
          base_salary?: number | null
          company_id?: string | null
          created_at?: string | null
          employee_number?: number | null
          hire_date?: string | null
          housing_allowance?: number | null
          iban_masked?: never
          id?: string | null
          id_number_masked?: never
          is_active?: boolean | null
          job_title?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          transport_allowance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_companies_safe: {
        Row: {
          api_endpoint: string | null
          bank_name: string | null
          commission_rate: number | null
          company_id: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          bank_name?: string | null
          commission_rate?: number | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          bank_name?: string | null
          commission_rate?: number | null
          company_id?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_default_settings_to_company: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      apply_defaults_to_existing_companies: { Args: never; Returns: Json }
      calculate_car_net_profit: {
        Args: {
          p_car_id: string
          p_purchase_price: number
          p_sale_price: number
        }
        Returns: number
      }
      calculate_depreciation: {
        Args: {
          p_accumulated_depreciation?: number
          p_depreciation_method: string
          p_depreciation_rate?: number
          p_purchase_price: number
          p_salvage_value: number
          p_useful_life_years: number
        }
        Returns: number
      }
      can_access_company_data: {
        Args: { _company_id: string }
        Returns: boolean
      }
      can_access_with_permission: {
        Args: { _company_id: string; required_permission: string }
        Returns: boolean
      }
      create_default_accounts: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      create_default_expense_categories: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      create_immutable_audit_log: {
        Args: {
          _action: string
          _company_id: string
          _entity_id?: string
          _entity_type: string
          _ip_address?: string
          _new_data?: Json
          _old_data?: Json
          _user_agent?: string
          _user_id: string
        }
        Returns: string
      }
      decrypt_sensitive_data: {
        Args: { encrypted_text: string; encryption_key: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { encryption_key: string; plain_text: string }
        Returns: string
      }
      fix_missing_cogs_entries: {
        Args: never
        Returns: {
          fixed: boolean
          message: string
          sale_id: string
          sale_number: number
        }[]
      }
      get_car_expenses: { Args: { p_car_id: string }; Returns: number }
      get_current_company_id: { Args: never; Returns: string }
      get_next_invoice_number: {
        Args: { _company_id: string; _invoice_type: string }
        Returns: string
      }
      get_next_project_number: {
        Args: { _company_id: string }
        Returns: number
      }
      get_strict_company_id: { Args: never; Returns: string }
      get_user_company_id:
        | { Args: never; Returns: string }
        | { Args: { _user_id: string }; Returns: string }
      has_permission:
        | { Args: { _permission: string }; Returns: boolean }
        | {
            Args: {
              _permission: Database["public"]["Enums"]["user_permission"]
              _user_id: string
            }
            Returns: boolean
          }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_company_id: string
          p_entity_id?: string
          p_entity_type: string
          p_new_data?: Json
          p_old_data?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      process_prepaid_expense_amortizations: { Args: never; Returns: number }
      rbac_check: { Args: { required_permission: string }; Returns: boolean }
      regenerate_journal_entries: {
        Args: { p_company_id: string }
        Returns: string
      }
      secure_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      secure_has_permission: {
        Args: { _permission: Database["public"]["Enums"]["user_permission"] }
        Returns: boolean
      }
      strict_company_check: { Args: { _company_id: string }; Returns: boolean }
      sync_accounting_settings_to_all_companies: {
        Args: never
        Returns: undefined
      }
      sync_all_settings_to_all_companies: { Args: never; Returns: Json }
      sync_app_settings_to_all_companies: { Args: never; Returns: undefined }
      sync_invoice_settings_to_all_companies: {
        Args: never
        Returns: undefined
      }
      user_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      verify_audit_log_integrity: {
        Args: { _company_id: string }
        Returns: {
          broken_at_id: string
          broken_at_sequence: number
          is_valid: boolean
          message: string
        }[]
      }
    }
    Enums: {
      company_activity_type:
        | "car_dealership"
        | "construction"
        | "general_trading"
      transfer_status: "pending" | "sold" | "returned"
      transfer_type: "outgoing" | "incoming"
      user_permission:
        | "sales"
        | "purchases"
        | "reports"
        | "admin"
        | "users"
        | "super_admin"
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
      company_activity_type: [
        "car_dealership",
        "construction",
        "general_trading",
      ],
      transfer_status: ["pending", "sold", "returned"],
      transfer_type: ["outgoing", "incoming"],
      user_permission: [
        "sales",
        "purchases",
        "reports",
        "admin",
        "users",
        "super_admin",
      ],
    },
  },
} as const
