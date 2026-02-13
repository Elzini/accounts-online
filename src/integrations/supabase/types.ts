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
      api_keys: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_preview: string
          last_used_at: string | null
          name: string
          permissions: string[] | null
          rate_limit: number | null
          request_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_preview: string
          last_used_at?: string | null
          name: string
          permissions?: string[] | null
          rate_limit?: number | null
          request_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_preview?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[] | null
          rate_limit?: number | null
          request_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      approval_actions: {
        Row: {
          acted_at: string
          acted_by: string
          action: string
          comments: string | null
          id: string
          request_id: string
          step_id: string
        }
        Insert: {
          acted_at?: string
          acted_by: string
          action: string
          comments?: string | null
          id?: string
          request_id: string
          step_id: string
        }
        Update: {
          acted_at?: string
          acted_by?: string
          action?: string
          comments?: string | null
          id?: string
          request_id?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_actions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          company_id: string
          completed_at: string | null
          current_step: number | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          requested_at: string
          requested_by: string
          status: string
          workflow_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          current_step?: number | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          requested_at?: string
          requested_by: string
          status?: string
          workflow_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          current_step?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          requested_at?: string
          requested_by?: string
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          approver_role: string | null
          approver_user_id: string | null
          created_at: string
          id: string
          is_mandatory: boolean | null
          step_order: number
          workflow_id: string
        }
        Insert: {
          approver_role?: string | null
          approver_user_id?: string | null
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          step_order: number
          workflow_id: string
        }
        Update: {
          approver_role?: string | null
          approver_user_id?: string | null
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          step_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          company_id: string
          created_at: string
          entity_type: string
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_company_id_fkey"
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
          backup_hour: number
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
          backup_hour?: number
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
          backup_hour?: number
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
          checksum: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          encryption_algorithm: string | null
          encryption_key_version: number | null
          error_message: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_encrypted: boolean | null
          name: string
          records_count: Json | null
          restore_test_status: string | null
          restore_tested_at: string | null
          status: string
          tables_included: string[]
        }
        Insert: {
          backup_data?: Json | null
          backup_type?: string
          checksum?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          encryption_algorithm?: string | null
          encryption_key_version?: number | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_encrypted?: boolean | null
          name: string
          records_count?: Json | null
          restore_test_status?: string | null
          restore_tested_at?: string | null
          status?: string
          tables_included?: string[]
        }
        Update: {
          backup_data?: Json | null
          backup_type?: string
          checksum?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          encryption_algorithm?: string | null
          encryption_key_version?: number | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_encrypted?: boolean | null
          name?: string
          records_count?: Json | null
          restore_test_status?: string | null
          restore_tested_at?: string | null
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
          account_number_encrypted: string | null
          bank_name: string
          company_id: string
          created_at: string
          current_balance: number | null
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
          account_number_encrypted?: string | null
          bank_name: string
          company_id: string
          created_at?: string
          current_balance?: number | null
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
          account_number_encrypted?: string | null
          bank_name?: string
          company_id?: string
          created_at?: string
          current_balance?: number | null
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
      bom_lines: {
        Row: {
          created_at: string
          id: string
          material_name: string
          notes: string | null
          product_id: string
          quantity: number
          total_cost: number | null
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          material_name: string
          notes?: string | null
          product_id: string
          quantity: number
          total_cost?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          material_name?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          total_cost?: number | null
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bom_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "manufacturing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_name: string
          customer_phone: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          service_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_name: string
          customer_phone?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_name?: string
          customer_phone?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bookkeeping_clients: {
        Row: {
          client_name: string
          company_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          monthly_fee: number | null
          notes: string | null
          phone: string | null
          status: string
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          client_name: string
          company_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          phone?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string
          company_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          phone?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookkeeping_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bookkeeping_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          status: string
          task_name: string
          task_type: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          task_name: string
          task_type?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          task_name?: string
          task_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookkeeping_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "bookkeeping_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookkeeping_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_main: boolean | null
          manager_name: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          manager_name?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_main?: boolean | null
          manager_name?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          account_id: string
          budget_id: string
          company_id: string
          created_at: string
          id: string
          month_1: number | null
          month_10: number | null
          month_11: number | null
          month_12: number | null
          month_2: number | null
          month_3: number | null
          month_4: number | null
          month_5: number | null
          month_6: number | null
          month_7: number | null
          month_8: number | null
          month_9: number | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          budget_id: string
          company_id: string
          created_at?: string
          id?: string
          month_1?: number | null
          month_10?: number | null
          month_11?: number | null
          month_12?: number | null
          month_2?: number | null
          month_3?: number | null
          month_4?: number | null
          month_5?: number | null
          month_6?: number | null
          month_7?: number | null
          month_8?: number | null
          month_9?: number | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          budget_id?: string
          company_id?: string
          created_at?: string
          id?: string
          month_1?: number | null
          month_10?: number | null
          month_11?: number | null
          month_12?: number | null
          month_2?: number | null
          month_3?: number | null
          month_4?: number | null
          month_5?: number | null
          month_6?: number | null
          month_7?: number | null
          month_8?: number | null
          month_9?: number | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string
          fiscal_year_id: string | null
          id: string
          name: string
          notes: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date: string
          fiscal_year_id?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          fiscal_year_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
            foreignKeyName: "cars_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
          {
            foreignKeyName: "cars_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      checks: {
        Row: {
          account_id: string | null
          amount: number
          bank_account_id: string | null
          bank_name: string | null
          check_number: string
          check_type: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          customer_id: string | null
          drawer_name: string | null
          due_date: string
          fiscal_year_id: string | null
          id: string
          issue_date: string
          journal_entry_id: string | null
          notes: string | null
          payee_name: string | null
          status: string
          status_date: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          bank_account_id?: string | null
          bank_name?: string | null
          check_number: string
          check_type: string
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          drawer_name?: string | null
          due_date: string
          fiscal_year_id?: string | null
          id?: string
          issue_date: string
          journal_entry_id?: string | null
          notes?: string | null
          payee_name?: string | null
          status?: string
          status_date?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          bank_account_id?: string | null
          bank_name?: string | null
          check_number?: string
          check_type?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          customer_id?: string | null
          drawer_name?: string | null
          due_date?: string
          fiscal_year_id?: string | null
          id?: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          payee_name?: string | null
          status?: string
          status_date?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_safe"
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
          subdomain: string | null
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
          subdomain?: string | null
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
          subdomain?: string | null
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
      company_encryption_keys: {
        Row: {
          algorithm: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_version: number
          rotated_at: string | null
        }
        Insert: {
          algorithm?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_version?: number
          rotated_at?: string | null
        }
        Update: {
          algorithm?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_version?: number
          rotated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_encryption_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
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
            foreignKeyName: "contracts_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
      cost_centers: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_debit_note_lines: {
        Row: {
          created_at: string
          id: string
          item_name: string
          note_id: string
          notes: string | null
          quantity: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          note_id: string
          notes?: string | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          note_id?: string
          notes?: string | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_debit_note_lines_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "credit_debit_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_debit_notes: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          fiscal_year_id: string | null
          id: string
          note_date: string
          note_number: string
          note_type: string
          reason: string | null
          related_invoice_id: string | null
          status: string
          supplier_id: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          fiscal_year_id?: string | null
          id?: string
          note_date?: string
          note_number: string
          note_type?: string
          reason?: string | null
          related_invoice_id?: string | null
          status?: string
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          fiscal_year_id?: string | null
          id?: string
          note_date?: string
          note_number?: string
          note_type?: string
          reason?: string | null
          related_invoice_id?: string | null
          status?: string
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_debit_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
          title: string
        }
        Insert: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
          title: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          company_id: string
          converted_at: string | null
          created_at: string
          email: string | null
          expected_value: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          converted_at?: string | null
          created_at?: string
          email?: string | null
          expected_value?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          converted_at?: string | null
          created_at?: string
          email?: string | null
          expected_value?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          company_id: string
          created_at: string
          decimal_places: number | null
          id: string
          is_active: boolean | null
          is_base: boolean | null
          name_ar: string
          name_en: string | null
          symbol: string | null
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          decimal_places?: number | null
          id?: string
          is_active?: boolean | null
          is_base?: boolean | null
          name_ar: string
          name_en?: string | null
          symbol?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          decimal_places?: number | null
          id?: string
          is_active?: boolean | null
          is_base?: boolean | null
          name_ar?: string
          name_en?: string | null
          symbol?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "currencies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custodies: {
        Row: {
          advance_id: string | null
          cash_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          custody_account_id: string | null
          custody_amount: number
          custody_date: string
          custody_name: string
          custody_number: number
          custody_type: string
          employee_id: string | null
          fiscal_year_id: string | null
          id: string
          installment_amount: number | null
          installment_count: number | null
          journal_entry_id: string | null
          notes: string | null
          settlement_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          advance_id?: string | null
          cash_account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          custody_account_id?: string | null
          custody_amount?: number
          custody_date?: string
          custody_name: string
          custody_number?: number
          custody_type?: string
          employee_id?: string | null
          fiscal_year_id?: string | null
          id?: string
          installment_amount?: number | null
          installment_count?: number | null
          journal_entry_id?: string | null
          notes?: string | null
          settlement_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          advance_id?: string | null
          cash_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          custody_account_id?: string | null
          custody_amount?: number
          custody_date?: string
          custody_name?: string
          custody_number?: number
          custody_type?: string
          employee_id?: string | null
          fiscal_year_id?: string | null
          id?: string
          installment_amount?: number | null
          installment_count?: number | null
          journal_entry_id?: string | null
          notes?: string | null
          settlement_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custodies_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "employee_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodies_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodies_custody_account_id_fkey"
            columns: ["custody_account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodies_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodies_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodies_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodies_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custodies_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      custody_transactions: {
        Row: {
          account_id: string | null
          amount: number
          analysis_category: string | null
          company_id: string
          created_at: string
          created_by: string | null
          custody_id: string
          description: string
          employee_id: string | null
          id: string
          journal_entry_id: string | null
          notes: string | null
          transaction_date: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          analysis_category?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          custody_id: string
          description: string
          employee_id?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          analysis_category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          custody_id?: string
          description?: string
          employee_id?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custody_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custody_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custody_transactions_custody_id_fkey"
            columns: ["custody_id"]
            isOneToOne: false
            referencedRelation: "custodies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custody_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custody_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custody_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
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
          credit_limit: number | null
          id: string
          id_number: string | null
          id_number_encrypted: string | null
          managed_by: string | null
          name: string
          phone: string
          registration_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          id_number?: string | null
          id_number_encrypted?: string | null
          managed_by?: string | null
          name: string
          phone: string
          registration_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          id_number?: string | null
          id_number_encrypted?: string | null
          managed_by?: string | null
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
      departments: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          manager_name: string | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_name?: string | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_name?: string | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
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
      document_attachments: {
        Row: {
          company_id: string
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          custody_id: string | null
          deducted_in_payroll_id: string | null
          deducted_installments: number | null
          employee_id: string
          id: string
          is_deducted: boolean
          monthly_deduction: number | null
          notes: string | null
          reason: string | null
          remaining_amount: number | null
          total_installments: number | null
        }
        Insert: {
          advance_date?: string
          amount: number
          company_id: string
          created_at?: string
          custody_id?: string | null
          deducted_in_payroll_id?: string | null
          deducted_installments?: number | null
          employee_id: string
          id?: string
          is_deducted?: boolean
          monthly_deduction?: number | null
          notes?: string | null
          reason?: string | null
          remaining_amount?: number | null
          total_installments?: number | null
        }
        Update: {
          advance_date?: string
          amount?: number
          company_id?: string
          created_at?: string
          custody_id?: string | null
          deducted_in_payroll_id?: string | null
          deducted_installments?: number | null
          employee_id?: string
          id?: string
          is_deducted?: boolean
          monthly_deduction?: number | null
          notes?: string | null
          reason?: string | null
          remaining_amount?: number | null
          total_installments?: number | null
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
            foreignKeyName: "employee_advances_custody_id_fkey"
            columns: ["custody_id"]
            isOneToOne: false
            referencedRelation: "custodies"
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
      employee_attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          company_id: string
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          overtime_hours: number | null
          status: string
          updated_at: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          company_id: string
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          company_id?: string
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contracts: {
        Row: {
          allowances: number | null
          company_id: string
          contract_type: string
          created_at: string
          department: string | null
          employee_id: string | null
          employee_name: string
          end_date: string | null
          id: string
          notes: string | null
          position: string | null
          salary: number | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          allowances?: number | null
          company_id: string
          contract_type?: string
          created_at?: string
          department?: string | null
          employee_id?: string | null
          employee_name: string
          end_date?: string | null
          id?: string
          notes?: string | null
          position?: string | null
          salary?: number | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          allowances?: number | null
          company_id?: string
          contract_type?: string
          created_at?: string
          department?: string | null
          employee_id?: string | null
          employee_name?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          position?: string | null
          salary?: number | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_insurance: {
        Row: {
          company_contribution: number | null
          company_id: string
          created_at: string
          employee_contribution: number | null
          employee_id: string
          end_date: string | null
          id: string
          insurance_number: string | null
          insurance_type: string
          is_active: boolean | null
          notes: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          company_contribution?: number | null
          company_id: string
          created_at?: string
          employee_contribution?: number | null
          employee_id: string
          end_date?: string | null
          id?: string
          insurance_number?: string | null
          insurance_type?: string
          is_active?: boolean | null
          notes?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          company_contribution?: number | null
          company_id?: string
          created_at?: string
          employee_contribution?: number | null
          employee_id?: string
          end_date?: string | null
          id?: string
          insurance_number?: string | null
          insurance_type?: string
          is_active?: boolean | null
          notes?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_insurance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_insurance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_insurance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leaves: {
        Row: {
          approved_by: string | null
          company_id: string
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          notes: string | null
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          created_at?: string
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          notes?: string | null
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          notes?: string | null
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_leaves_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_rewards: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string | null
          date: string
          employee_id: string
          id: string
          reason: string | null
          type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id: string
          id?: string
          reason?: string | null
          type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id?: string
          id?: string
          reason?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_rewards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_rewards_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_rewards_employee_id_fkey"
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
      encryption_key_registry: {
        Row: {
          algorithm: string
          company_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_version: number
          rotated_at: string | null
          rotation_reason: string | null
          status: string
        }
        Insert: {
          algorithm?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_version?: number
          rotated_at?: string | null
          rotation_reason?: string | null
          status?: string
        }
        Update: {
          algorithm?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_version?: number
          rotated_at?: string | null
          rotation_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "encryption_key_registry_company_id_fkey"
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
      exchange_rates: {
        Row: {
          company_id: string
          created_at: string
          effective_date: string
          from_currency_id: string
          id: string
          rate: number
          to_currency_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          effective_date?: string
          from_currency_id: string
          id?: string
          rate: number
          to_currency_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          effective_date?: string
          from_currency_id?: string
          id?: string
          rate?: number
          to_currency_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_rates_from_currency_id_fkey"
            columns: ["from_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_rates_to_currency_id_fkey"
            columns: ["to_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
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
          {
            foreignKeyName: "expenses_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
            referencedRelation: "financing_companies_admin"
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
      goods_receipt_lines: {
        Row: {
          created_at: string
          goods_receipt_id: string
          id: string
          item_name: string
          notes: string | null
          ordered_qty: number | null
          received_qty: number
          unit: string | null
        }
        Insert: {
          created_at?: string
          goods_receipt_id: string
          id?: string
          item_name: string
          notes?: string | null
          ordered_qty?: number | null
          received_qty?: number
          unit?: string | null
        }
        Update: {
          created_at?: string
          goods_receipt_id?: string
          id?: string
          item_name?: string
          notes?: string | null
          ordered_qty?: number | null
          received_qty?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_lines_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          purchase_order_id: string | null
          receipt_date: string
          receipt_number: string
          received_by: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number: string
          received_by?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number?: string
          received_by?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          bank_name: string | null
          base_salary: number | null
          company_id: string
          contract_type: string | null
          created_at: string
          department: string | null
          email: string | null
          employee_number: string | null
          full_name: string
          full_name_en: string | null
          hire_date: string | null
          housing_allowance: number | null
          iban: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          national_id: string | null
          notes: string | null
          other_allowances: number | null
          phone: string | null
          transport_allowance: number | null
          updated_at: string
        }
        Insert: {
          bank_name?: string | null
          base_salary?: number | null
          company_id: string
          contract_type?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          full_name: string
          full_name_en?: string | null
          hire_date?: string | null
          housing_allowance?: number | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          national_id?: string | null
          notes?: string | null
          other_allowances?: number | null
          phone?: string | null
          transport_allowance?: number | null
          updated_at?: string
        }
        Update: {
          bank_name?: string | null
          base_salary?: number | null
          company_id?: string
          contract_type?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string
          full_name_en?: string | null
          hire_date?: string | null
          housing_allowance?: number | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          national_id?: string | null
          notes?: string | null
          other_allowances?: number | null
          phone?: string | null
          transport_allowance?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hr_evaluations: {
        Row: {
          company_id: string
          created_at: string
          criteria: Json | null
          employee_id: string
          evaluation_date: string | null
          evaluation_period: string | null
          evaluator_name: string | null
          goals: string | null
          id: string
          overall_score: number | null
          status: string | null
          strengths: string | null
          updated_at: string
          weaknesses: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          criteria?: Json | null
          employee_id: string
          evaluation_date?: string | null
          evaluation_period?: string | null
          evaluator_name?: string | null
          goals?: string | null
          id?: string
          overall_score?: number | null
          status?: string | null
          strengths?: string | null
          updated_at?: string
          weaknesses?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          criteria?: Json | null
          employee_id?: string
          evaluation_date?: string | null
          evaluation_period?: string | null
          evaluator_name?: string | null
          goals?: string | null
          id?: string
          overall_score?: number | null
          status?: string | null
          strengths?: string | null
          updated_at?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_insurance_records: {
        Row: {
          company_id: string
          contribution_rate: number | null
          created_at: string
          employee_id: string
          employer_share: number | null
          gosi_number: string | null
          id: string
          notes: string | null
          registration_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          contribution_rate?: number | null
          created_at?: string
          employee_id: string
          employer_share?: number | null
          gosi_number?: string | null
          id?: string
          notes?: string | null
          registration_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          contribution_rate?: number | null
          created_at?: string
          employee_id?: string
          employer_share?: number | null
          gosi_number?: string | null
          id?: string
          notes?: string | null
          registration_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_insurance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_training_attendees: {
        Row: {
          attendance_status: string | null
          certificate_issued: boolean | null
          company_id: string
          course_id: string
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          score: number | null
        }
        Insert: {
          attendance_status?: string | null
          certificate_issued?: boolean | null
          company_id: string
          course_id: string
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          score?: number | null
        }
        Update: {
          attendance_status?: string | null
          certificate_issued?: boolean | null
          company_id?: string
          course_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_training_attendees_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "hr_training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_training_attendees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_training_courses: {
        Row: {
          company_id: string
          cost: number | null
          course_date: string | null
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          location: string | null
          max_attendees: number | null
          name: string
          name_en: string | null
          provider: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          cost?: number | null
          course_date?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          name: string
          name_en?: string | null
          provider?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          cost?: number | null
          course_date?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          location?: string | null
          max_attendees?: number | null
          name?: string
          name_en?: string | null
          provider?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      immutable_baselines: {
        Row: {
          baseline_key: string
          baseline_type: string
          baseline_value: Json
          created_at: string | null
          description: string | null
          id: string
        }
        Insert: {
          baseline_key: string
          baseline_type: string
          baseline_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
        }
        Update: {
          baseline_key?: string
          baseline_type?: string
          baseline_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
        }
        Relationships: []
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
      integration_configs: {
        Row: {
          api_key_encrypted: string | null
          company_id: string
          config_data: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          notes: string | null
          platform: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          company_id: string
          config_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          notes?: string | null
          platform: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          company_id?: string
          config_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          notes?: string | null
          platform?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_safe"
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
            foreignKeyName: "invoices_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      item_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          barcode: string | null
          category_id: string | null
          commission_rate: number | null
          company_id: string
          cost_price: number
          created_at: string
          current_quantity: number
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          item_number: number
          item_type: string
          max_quantity: number | null
          min_quantity: number | null
          name: string
          notes: string | null
          opening_quantity: number
          purchase_discount: number | null
          reorder_level: number | null
          sale_price_1: number
          sale_price_2: number | null
          sale_price_3: number | null
          unit_id: string | null
          updated_at: string
          warehouse_id: string | null
          wholesale_price: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          commission_rate?: number | null
          company_id: string
          cost_price?: number
          created_at?: string
          current_quantity?: number
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_number?: number
          item_type?: string
          max_quantity?: number | null
          min_quantity?: number | null
          name: string
          notes?: string | null
          opening_quantity?: number
          purchase_discount?: number | null
          reorder_level?: number | null
          sale_price_1?: number
          sale_price_2?: number | null
          sale_price_3?: number | null
          unit_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
          wholesale_price?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          commission_rate?: number | null
          company_id?: string
          cost_price?: number
          created_at?: string
          current_quantity?: number
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_number?: number
          item_type?: string
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string
          notes?: string | null
          opening_quantity?: number
          purchase_discount?: number | null
          reorder_level?: number | null
          sale_price_1?: number
          sale_price_2?: number | null
          sale_price_3?: number | null
          unit_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_attachments: {
        Row: {
          company_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          journal_entry_id: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          journal_entry_id: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          journal_entry_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_attachments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
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
          {
            foreignKeyName: "journal_entries_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          cost_center_id: string | null
          created_at: string
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          cost_center_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          cost_center_id?: string | null
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
            foreignKeyName: "journal_entry_lines_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
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
      letters_of_credit: {
        Row: {
          amount: number
          beneficiary_bank: string | null
          beneficiary_name: string | null
          company_id: string
          created_at: string
          currency: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_bank: string | null
          lc_number: string
          notes: string | null
          shipment_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          beneficiary_bank?: string | null
          beneficiary_name?: string | null
          company_id: string
          created_at?: string
          currency?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_bank?: string | null
          lc_number: string
          notes?: string | null
          shipment_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          beneficiary_bank?: string | null
          beneficiary_name?: string | null
          company_id?: string
          created_at?: string
          currency?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_bank?: string | null
          lc_number?: string
          notes?: string | null
          shipment_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_of_credit_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_of_credit_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          points: number
          program_id: string | null
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          points?: number
          program_id?: string | null
          reference_id?: string | null
          transaction_type?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          points?: number
          program_id?: string | null
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "loyalty_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          points_per_unit: number | null
          unit_value: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          points_per_unit?: number | null
          unit_value?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points_per_unit?: number | null
          unit_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturing_products: {
        Row: {
          code: string | null
          company_id: string
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          is_active: boolean | null
          name: string
          selling_price: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          selling_price?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          selling_price?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturing_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      network_access_log: {
        Row: {
          allowed: boolean
          block_reason: string | null
          created_at: string | null
          id: string
          ip_address: string
          request_method: string | null
          request_path: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          allowed: boolean
          block_reason?: string | null
          created_at?: string | null
          id?: string
          ip_address: string
          request_method?: string | null
          request_path?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          allowed?: boolean
          block_reason?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string
          request_method?: string | null
          request_path?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
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
      payment_transactions: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          gateway: string | null
          id: string
          notes: string | null
          payment_method: string
          status: string
          transaction_ref: string
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          gateway?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          status?: string
          transaction_ref: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          gateway?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          status?: string
          transaction_ref?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_company_id_fkey"
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
      penetration_test_results: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          passed: boolean
          severity: string | null
          target_tenant_id: string | null
          test_description: string
          test_type: string
          tested_by: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          passed: boolean
          severity?: string | null
          target_tenant_id?: string | null
          test_description: string
          test_type: string
          tested_by?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          passed?: boolean
          severity?: string | null
          target_tenant_id?: string | null
          test_description?: string
          test_type?: string
          tested_by?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean | null
          level: string | null
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
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
      production_orders: {
        Row: {
          actual_cost: number | null
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          order_number: number
          product_id: string
          quantity: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          product_id: string
          quantity: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          product_id?: string
          quantity?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "manufacturing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_stages: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          labor_cost: number | null
          material_cost: number | null
          notes: string | null
          production_order_id: string
          stage_name: string
          stage_order: number
          start_time: string | null
          status: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          labor_cost?: number | null
          material_cost?: number | null
          notes?: string | null
          production_order_id: string
          stage_name: string
          stage_order?: number
          start_time?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          labor_cost?: number | null
          material_cost?: number | null
          notes?: string | null
          production_order_id?: string
          stage_name?: string
          stage_order?: number
          start_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_stages_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
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
          {
            foreignKeyName: "profiles_current_fiscal_year_id_fkey"
            columns: ["current_fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
            foreignKeyName: "progress_billings_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
            foreignKeyName: "project_billings_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_safe"
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
          {
            foreignKeyName: "project_costs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_safe"
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
            foreignKeyName: "projects_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
          {
            foreignKeyName: "purchase_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          created_at: string
          id: string
          item_name: string
          notes: string | null
          purchase_order_id: string
          quantity: number
          total_price: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          notes?: string | null
          purchase_order_id: string
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          notes?: string | null
          purchase_order_id?: string
          quantity?: number
          total_price?: number | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          expected_delivery: string | null
          fiscal_year_id: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          supplier_id: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_safe"
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
      rate_limit_config: {
        Row: {
          block_duration_seconds: number | null
          company_id: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean | null
          max_requests: number
          updated_at: string
          window_seconds: number
        }
        Insert: {
          block_duration_seconds?: number | null
          company_id: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean | null
          max_requests?: number
          updated_at?: string
          window_seconds?: number
        }
        Update: {
          block_duration_seconds?: number | null
          company_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean | null
          max_requests?: number
          updated_at?: string
          window_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          company_id: string
          created_at: string
          endpoint: string
          id: string
          request_count: number
          window_start: string
        }
        Insert: {
          company_id: string
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          window_start?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_contracts: {
        Row: {
          company_id: string
          created_at: string
          deposit: number | null
          end_date: string | null
          id: string
          monthly_rent: number
          notes: string | null
          start_date: string
          status: string
          tenant_name: string
          tenant_phone: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deposit?: number | null
          end_date?: string | null
          id?: string
          monthly_rent?: number
          notes?: string | null
          start_date: string
          status?: string
          tenant_name: string
          tenant_phone?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deposit?: number | null
          end_date?: string | null
          id?: string
          monthly_rent?: number
          notes?: string | null
          start_date?: string
          status?: string
          tenant_name?: string
          tenant_phone?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "rental_units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_units: {
        Row: {
          area: number | null
          company_id: string
          created_at: string
          id: string
          location: string | null
          monthly_rent: number | null
          notes: string | null
          status: string
          unit_name: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          area?: number | null
          company_id: string
          created_at?: string
          id?: string
          location?: string | null
          monthly_rent?: number | null
          notes?: string | null
          status?: string
          unit_name: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          area?: number | null
          company_id?: string
          created_at?: string
          id?: string
          location?: string | null
          monthly_rent?: number | null
          notes?: string | null
          status?: string
          unit_name?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_menu_items: {
        Row: {
          category: string
          company_id: string
          cost: number
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string
          company_id: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menu_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          notes: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          notes?: string | null
          order_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "restaurant_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_orders: {
        Row: {
          company_id: string
          created_at: string
          customer_name: string | null
          id: string
          notes: string | null
          order_number: number
          order_type: string
          status: string
          table_number: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_name?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          order_type?: string
          status?: string
          table_number?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_name?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          order_type?: string
          status?: string
          table_number?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number
          company_id: string
          created_at: string
          id: string
          notes: string | null
          status: string
          table_number: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          table_number: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          table_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          due_date: string | null
          fiscal_year_id: string | null
          id: string
          other_expenses: number | null
          payment_account_id: string | null
          payment_status: string | null
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
          due_date?: string | null
          fiscal_year_id?: string | null
          id?: string
          other_expenses?: number | null
          payment_account_id?: string | null
          payment_status?: string | null
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
          due_date?: string | null
          fiscal_year_id?: string | null
          id?: string
          other_expenses?: number | null
          payment_account_id?: string | null
          payment_status?: string | null
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
            foreignKeyName: "sales_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
      sales_targets: {
        Row: {
          achieved_amount: number | null
          company_id: string
          created_at: string
          employee_id: string | null
          employee_name: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: string
          target_amount: number
          updated_at: string
        }
        Insert: {
          achieved_amount?: number | null
          company_id: string
          created_at?: string
          employee_id?: string | null
          employee_name: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string
          target_amount?: number
          updated_at?: string
        }
        Update: {
          achieved_amount?: number | null
          company_id?: string
          created_at?: string
          employee_id?: string | null
          employee_name?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string
          target_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          company_id: string
          created_at: string
          event_data: Json | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          severity: string
          title: string
          triggered_by: string | null
        }
        Insert: {
          alert_type: string
          company_id: string
          created_at?: string
          event_data?: Json | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          severity?: string
          title: string
          triggered_by?: string | null
        }
        Update: {
          alert_type?: string
          company_id?: string
          created_at?: string
          event_data?: Json | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          severity?: string
          title?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      security_anomalies: {
        Row: {
          anomaly_type: string
          company_id: string
          created_at: string
          description: string
          detection_source: string
          event_data: Json | null
          id: string
          is_resolved: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          anomaly_type: string
          company_id: string
          created_at?: string
          description: string
          detection_source?: string
          event_data?: Json | null
          id?: string
          is_resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          anomaly_type?: string
          company_id?: string
          created_at?: string
          description?: string
          detection_source?: string
          event_data?: Json | null
          id?: string
          is_resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_anomalies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_trail: {
        Row: {
          blocked: boolean | null
          created_at: string | null
          db_user: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          operation: string | null
          schema_name: string | null
          severity: string
          table_name: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          created_at?: string | null
          db_user?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          operation?: string | null
          schema_name?: string | null
          severity?: string
          table_name?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          created_at?: string | null
          db_user?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          operation?: string | null
          schema_name?: string | null
          severity?: string
          table_name?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          company_id: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          operation: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_schema: string | null
          table_name: string | null
          target_schema: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          operation?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_schema?: string | null
          table_name?: string | null
          target_schema?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          operation?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_schema?: string | null
          table_name?: string | null
          target_schema?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_items: {
        Row: {
          created_at: string
          hs_code: string | null
          id: string
          notes: string | null
          product_name: string
          quantity: number
          shipment_id: string
          total_price: number
          unit_price: number
          weight: number | null
        }
        Insert: {
          created_at?: string
          hs_code?: string | null
          id?: string
          notes?: string | null
          product_name: string
          quantity?: number
          shipment_id: string
          total_price?: number
          unit_price?: number
          weight?: number | null
        }
        Update: {
          created_at?: string
          hs_code?: string | null
          id?: string
          notes?: string | null
          product_name?: string
          quantity?: number
          shipment_id?: string
          total_price?: number
          unit_price?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          arrival_date: string | null
          bill_of_lading: string | null
          clearance_fees: number | null
          company_id: string
          container_number: string | null
          created_at: string
          currency: string
          customer_name: string | null
          customs_fees: number | null
          departure_date: string | null
          destination_country: string | null
          id: string
          insurance_cost: number | null
          notes: string | null
          origin_country: string | null
          shipment_number: number
          shipment_type: string
          shipping_cost: number | null
          shipping_method: string | null
          status: string
          supplier_name: string | null
          total_value: number
          updated_at: string
        }
        Insert: {
          arrival_date?: string | null
          bill_of_lading?: string | null
          clearance_fees?: number | null
          company_id: string
          container_number?: string | null
          created_at?: string
          currency?: string
          customer_name?: string | null
          customs_fees?: number | null
          departure_date?: string | null
          destination_country?: string | null
          id?: string
          insurance_cost?: number | null
          notes?: string | null
          origin_country?: string | null
          shipment_number?: number
          shipment_type?: string
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          supplier_name?: string | null
          total_value?: number
          updated_at?: string
        }
        Update: {
          arrival_date?: string | null
          bill_of_lading?: string | null
          clearance_fees?: number | null
          company_id?: string
          container_number?: string | null
          created_at?: string
          currency?: string
          customer_name?: string | null
          customs_fees?: number | null
          departure_date?: string | null
          destination_country?: string | null
          id?: string
          insurance_cost?: number | null
          notes?: string | null
          origin_country?: string | null
          shipment_number?: number
          shipment_type?: string
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          supplier_name?: string | null
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      siem_integrations: {
        Row: {
          api_key_hash: string | null
          created_at: string | null
          endpoint_url: string
          event_types: string[] | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          name: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_hash?: string | null
          created_at?: string | null
          endpoint_url: string
          event_types?: string[] | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          name: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_hash?: string | null
          created_at?: string | null
          endpoint_url?: string
          event_types?: string[] | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siem_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
            foreignKeyName: "stock_movements_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_safe"
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
      stock_voucher_lines: {
        Row: {
          created_at: string
          id: string
          item_name: string
          notes: string | null
          quantity: number
          stock_voucher_id: string
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          notes?: string | null
          quantity?: number
          stock_voucher_id: string
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          notes?: string | null
          quantity?: number
          stock_voucher_id?: string
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_voucher_lines_stock_voucher_id_fkey"
            columns: ["stock_voucher_id"]
            isOneToOne: false
            referencedRelation: "stock_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_vouchers: {
        Row: {
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          status: string
          to_warehouse_id: string | null
          updated_at: string
          voucher_date: string
          voucher_number: string
          voucher_type: string
          warehouse_id: string | null
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          to_warehouse_id?: string | null
          updated_at?: string
          voucher_date?: string
          voucher_number: string
          voucher_type?: string
          warehouse_id?: string | null
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          to_warehouse_id?: string | null
          updated_at?: string
          voucher_date?: string
          voucher_number?: string
          voucher_type?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_vouchers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktaking_lines: {
        Row: {
          actual_qty: number | null
          created_at: string
          difference: number | null
          id: string
          item_name: string
          notes: string | null
          session_id: string
          system_qty: number | null
          unit: string | null
        }
        Insert: {
          actual_qty?: number | null
          created_at?: string
          difference?: number | null
          id?: string
          item_name: string
          notes?: string | null
          session_id: string
          system_qty?: number | null
          unit?: string | null
        }
        Update: {
          actual_qty?: number | null
          created_at?: string
          difference?: number | null
          id?: string
          item_name?: string
          notes?: string | null
          session_id?: string
          system_qty?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stocktaking_lines_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "stocktaking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktaking_sessions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          session_name: string
          start_date: string
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          session_name: string
          start_date?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          session_name?: string
          start_date?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stocktaking_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_access_log: {
        Row: {
          allowed: boolean
          block_reason: string | null
          bucket_name: string | null
          created_at: string | null
          file_path: string | null
          id: string
          operation: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          allowed?: boolean
          block_reason?: string | null
          bucket_name?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          operation: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          allowed?: boolean
          block_reason?: string | null
          bucket_name?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          operation?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          company_id: string
          created_at: string
          customer_id: string | null
          end_date: string | null
          id: string
          next_billing_date: string | null
          notes: string | null
          plan_name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          company_id: string
          created_at?: string
          customer_id?: string | null
          end_date?: string | null
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          plan_name: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          company_id?: string
          created_at?: string
          customer_id?: string | null
          end_date?: string | null
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          plan_name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          company_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      tenant_backups: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          initiated_by: string | null
          schema_name: string
          started_at: string | null
          status: string
          tables_included: string[] | null
          tenant_id: string
        }
        Insert: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          initiated_by?: string | null
          schema_name: string
          started_at?: string | null
          status?: string
          tables_included?: string[] | null
          tenant_id: string
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          initiated_by?: string | null
          schema_name?: string
          started_at?: string | null
          status?: string
          tables_included?: string[] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_backups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_db_roles: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          role_name: string
          schema_name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_name: string
          schema_name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role_name?: string
          schema_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_db_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_encryption_config: {
        Row: {
          company_id: string
          created_at: string | null
          encrypted_columns: string[]
          encryption_algorithm: string | null
          id: string
          is_active: boolean | null
          key_rotation_days: number | null
          last_key_rotation: string | null
          next_key_rotation: string | null
          schema_name: string
          table_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          encrypted_columns?: string[]
          encryption_algorithm?: string | null
          id?: string
          is_active?: boolean | null
          key_rotation_days?: number | null
          last_key_rotation?: string | null
          next_key_rotation?: string | null
          schema_name: string
          table_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          encrypted_columns?: string[]
          encryption_algorithm?: string | null
          id?: string
          is_active?: boolean | null
          key_rotation_days?: number | null
          last_key_rotation?: string | null
          next_key_rotation?: string | null
          schema_name?: string
          table_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_encryption_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_encryption_keys: {
        Row: {
          algorithm: string | null
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          key_encrypted: string
          key_version: number | null
          rotated_at: string | null
          updated_at: string | null
        }
        Insert: {
          algorithm?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_encrypted: string
          key_version?: number | null
          rotated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          algorithm?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_encrypted?: string
          key_version?: number | null
          rotated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_encryption_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_ip_whitelist: {
        Row: {
          cidr_range: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cidr_range?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cidr_range?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_ip_whitelist_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_network_config: {
        Row: {
          allowed_countries: string[] | null
          block_foreign_ips: boolean | null
          created_at: string | null
          id: string
          ip_whitelist_enabled: boolean | null
          max_requests_per_ip_per_minute: number | null
          tenant_id: string
          updated_at: string | null
          vpn_required: boolean | null
        }
        Insert: {
          allowed_countries?: string[] | null
          block_foreign_ips?: boolean | null
          created_at?: string | null
          id?: string
          ip_whitelist_enabled?: boolean | null
          max_requests_per_ip_per_minute?: number | null
          tenant_id: string
          updated_at?: string | null
          vpn_required?: boolean | null
        }
        Update: {
          allowed_countries?: string[] | null
          block_foreign_ips?: boolean | null
          created_at?: string | null
          id?: string
          ip_whitelist_enabled?: boolean | null
          max_requests_per_ip_per_minute?: number | null
          tenant_id?: string
          updated_at?: string | null
          vpn_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_network_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_rate_limits: {
        Row: {
          company_id: string
          endpoint: string | null
          id: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          company_id: string
          endpoint?: string | null
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          company_id?: string
          endpoint?: string | null
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_rate_limits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_resource_quotas: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_records_per_table: number | null
          max_requests_per_minute: number | null
          max_storage_mb: number | null
          max_users: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_records_per_table?: number | null
          max_requests_per_minute?: number | null
          max_storage_mb?: number | null
          max_users?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_records_per_table?: number | null
          max_requests_per_minute?: number | null
          max_storage_mb?: number | null
          max_users?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_resource_quotas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_storage_config: {
        Row: {
          bucket_name: string
          created_at: string | null
          encryption_enabled: boolean | null
          id: string
          immutable_snapshots_enabled: boolean | null
          storage_quota_mb: number | null
          tenant_id: string
          updated_at: string | null
          used_storage_mb: number | null
        }
        Insert: {
          bucket_name: string
          created_at?: string | null
          encryption_enabled?: boolean | null
          id?: string
          immutable_snapshots_enabled?: boolean | null
          storage_quota_mb?: number | null
          tenant_id: string
          updated_at?: string | null
          used_storage_mb?: number | null
        }
        Update: {
          bucket_name?: string
          created_at?: string | null
          encryption_enabled?: boolean | null
          id?: string
          immutable_snapshots_enabled?: boolean | null
          storage_quota_mb?: number | null
          tenant_id?: string
          updated_at?: string | null
          used_storage_mb?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_storage_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_storage_snapshots: {
        Row: {
          bucket_name: string
          checksum: string | null
          created_at: string | null
          created_by: string | null
          file_count: number | null
          file_paths: string[]
          id: string
          is_immutable: boolean | null
          locked_at: string | null
          snapshot_name: string
          tenant_id: string
          total_size_bytes: number | null
        }
        Insert: {
          bucket_name: string
          checksum?: string | null
          created_at?: string | null
          created_by?: string | null
          file_count?: number | null
          file_paths?: string[]
          id?: string
          is_immutable?: boolean | null
          locked_at?: string | null
          snapshot_name: string
          tenant_id: string
          total_size_bytes?: number | null
        }
        Update: {
          bucket_name?: string
          checksum?: string | null
          created_at?: string | null
          created_by?: string | null
          file_count?: number | null
          file_paths?: string[]
          id?: string
          is_immutable?: boolean | null
          locked_at?: string | null
          snapshot_name?: string
          tenant_id?: string
          total_size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_storage_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billable: boolean | null
          company_id: string
          created_at: string
          employee_id: string | null
          entry_date: string
          hourly_rate: number | null
          hours: number
          id: string
          notes: string | null
          project_name: string | null
          task_name: string | null
          updated_at: string
        }
        Insert: {
          billable?: boolean | null
          company_id: string
          created_at?: string
          employee_id?: string | null
          entry_date?: string
          hourly_rate?: number | null
          hours?: number
          id?: string
          notes?: string | null
          project_name?: string | null
          task_name?: string | null
          updated_at?: string
        }
        Update: {
          billable?: boolean | null
          company_id?: string
          created_at?: string
          employee_id?: string | null
          entry_date?: string
          hourly_rate?: number | null
          hours?: number
          id?: string
          notes?: string | null
          project_name?: string | null
          task_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
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
      trip_passengers: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          passenger_name: string
          passenger_phone: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          passenger_name: string
          passenger_phone?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          passenger_name?: string
          passenger_phone?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_passengers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_name: string
          customer_phone: string
          departure_point: string
          destination: string
          fiscal_year_id: string | null
          id: string
          notes: string | null
          price: number | null
          reminder_datetime: string | null
          reminder_enabled: boolean | null
          reminder_hours_before: number | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          status: string | null
          trip_date: string
          trip_number: number
          trip_time: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_name: string
          customer_phone: string
          departure_point: string
          destination: string
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          reminder_datetime?: string | null
          reminder_enabled?: boolean | null
          reminder_hours_before?: number | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          status?: string | null
          trip_date: string
          trip_number?: number
          trip_time: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_name?: string
          customer_phone?: string
          departure_point?: string
          destination?: string
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          reminder_datetime?: string | null
          reminder_enabled?: boolean | null
          reminder_hours_before?: number | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          status?: string | null
          trip_date?: string
          trip_number?: number
          trip_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
            referencedColumns: ["id"]
          },
        ]
      }
      units_of_measure: {
        Row: {
          abbreviation: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          abbreviation?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          abbreviation?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_of_measure_company_id_fkey"
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
          phone_number: string | null
          secret_encrypted: string
          sms_pin_id: string | null
          two_fa_type: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          phone_number?: string | null
          secret_encrypted: string
          sms_pin_id?: string | null
          two_fa_type?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          phone_number?: string | null
          secret_encrypted?: string
          sms_pin_id?: string | null
          two_fa_type?: string | null
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
      work_orders: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          company_id: string
          completed_date: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          order_number: string
          priority: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          company_id: string
          completed_date?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          order_number: string
          priority?: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          company_id?: string
          completed_date?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          priority?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_accounting_rules: {
        Row: {
          amount_field_name: string | null
          amount_fixed: number | null
          amount_formula: string | null
          amount_source: string | null
          cost_center_id: string | null
          created_at: string
          credit_account_id: string | null
          debit_account_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          stage_id: string
          trigger_on: string
        }
        Insert: {
          amount_field_name?: string | null
          amount_fixed?: number | null
          amount_formula?: string | null
          amount_source?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit_account_id?: string | null
          debit_account_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          stage_id: string
          trigger_on?: string
        }
        Update: {
          amount_field_name?: string | null
          amount_fixed?: number | null
          amount_formula?: string | null
          amount_source?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit_account_id?: string | null
          debit_account_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          stage_id?: string
          trigger_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_accounting_rules_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_instance_stages: {
        Row: {
          approval_at: string | null
          approval_by: string | null
          approval_notes: string | null
          approval_status: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          entered_at: string | null
          id: string
          instance_id: string
          journal_entry_ids: string[] | null
          notes: string | null
          stage_data: Json | null
          stage_id: string
          status: string
        }
        Insert: {
          approval_at?: string | null
          approval_by?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          entered_at?: string | null
          id?: string
          instance_id: string
          journal_entry_ids?: string[] | null
          notes?: string | null
          stage_data?: Json | null
          stage_id: string
          status?: string
        }
        Update: {
          approval_at?: string | null
          approval_by?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          entered_at?: string | null
          id?: string
          instance_id?: string
          journal_entry_ids?: string[] | null
          notes?: string | null
          stage_data?: Json | null
          stage_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instance_stages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instance_stages_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_instances: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          current_stage_id: string | null
          id: string
          metadata: Json | null
          reference_number: string | null
          started_at: string
          started_by: string | null
          status: string
          title: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          current_stage_id?: string | null
          id?: string
          metadata?: Json | null
          reference_number?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
          title: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          current_stage_id?: string | null
          id?: string
          metadata?: Json | null
          reference_number?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_stage_fields: {
        Row: {
          created_at: string
          default_value: string | null
          field_label: string
          field_label_en: string | null
          field_name: string
          field_options: Json | null
          field_order: number
          field_type: string
          id: string
          is_required: boolean | null
          stage_id: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          field_label: string
          field_label_en?: string | null
          field_name: string
          field_options?: Json | null
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean | null
          stage_id: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          default_value?: string | null
          field_label?: string
          field_label_en?: string | null
          field_name?: string
          field_options?: Json | null
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean | null
          stage_id?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_stage_fields_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_stages: {
        Row: {
          approval_roles: string[] | null
          auto_advance: boolean | null
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          name_en: string | null
          requires_approval: boolean | null
          stage_order: number
          stage_type: string
          time_limit_hours: number | null
          workflow_id: string
        }
        Insert: {
          approval_roles?: string[] | null
          auto_advance?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          name_en?: string | null
          requires_approval?: boolean | null
          stage_order?: number
          stage_type?: string
          time_limit_hours?: number | null
          workflow_id: string
        }
        Update: {
          approval_roles?: string[] | null
          auto_advance?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_en?: string | null
          requires_approval?: boolean | null
          stage_order?: number
          stage_type?: string
          time_limit_hours?: number | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_stages_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      workflow_transitions: {
        Row: {
          condition_config: Json | null
          condition_type: string | null
          created_at: string
          from_stage_id: string | null
          id: string
          label: string | null
          label_en: string | null
          to_stage_id: string
          workflow_id: string
        }
        Insert: {
          condition_config?: Json | null
          condition_type?: string | null
          created_at?: string
          from_stage_id?: string | null
          id?: string
          label?: string | null
          label_en?: string | null
          to_stage_id: string
          workflow_id: string
        }
        Update: {
          condition_config?: Json | null
          condition_type?: string | null
          created_at?: string
          from_stage_id?: string | null
          id?: string
          label?: string | null
          label_en?: string | null
          to_stage_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transitions_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      zatca_config: {
        Row: {
          api_base_url: string | null
          certificate: string | null
          company_id: string
          compliance_csid: string | null
          created_at: string
          environment: string | null
          id: string
          last_sync_at: string | null
          otp: string | null
          private_key: string | null
          production_csid: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          certificate?: string | null
          company_id: string
          compliance_csid?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          last_sync_at?: string | null
          otp?: string | null
          private_key?: string | null
          production_csid?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          certificate?: string | null
          company_id?: string
          compliance_csid?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          last_sync_at?: string | null
          otp?: string | null
          private_key?: string | null
          production_csid?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      zatca_invoices: {
        Row: {
          clearance_status: string | null
          company_id: string
          created_at: string
          error_messages: Json | null
          id: string
          invoice_hash: string | null
          invoice_id: string | null
          invoice_type: string | null
          qr_code: string | null
          reporting_status: string | null
          submission_status: string | null
          submitted_at: string | null
          uuid: string | null
          warning_messages: Json | null
          xml_content: string | null
          zatca_response: Json | null
        }
        Insert: {
          clearance_status?: string | null
          company_id: string
          created_at?: string
          error_messages?: Json | null
          id?: string
          invoice_hash?: string | null
          invoice_id?: string | null
          invoice_type?: string | null
          qr_code?: string | null
          reporting_status?: string | null
          submission_status?: string | null
          submitted_at?: string | null
          uuid?: string | null
          warning_messages?: Json | null
          xml_content?: string | null
          zatca_response?: Json | null
        }
        Update: {
          clearance_status?: string | null
          company_id?: string
          created_at?: string
          error_messages?: Json | null
          id?: string
          invoice_hash?: string | null
          invoice_id?: string | null
          invoice_type?: string | null
          qr_code?: string | null
          reporting_status?: string | null
          submission_status?: string | null
          submitted_at?: string | null
          uuid?: string | null
          warning_messages?: Json | null
          xml_content?: string | null
          zatca_response?: Json | null
        }
        Relationships: []
      }
      zatca_sandbox_tests: {
        Row: {
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          invoice_type: string | null
          request_payload: Json | null
          response_payload: Json | null
          status: string
          test_name: string
          tested_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_type?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          test_name: string
          tested_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_type?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          test_name?: string
          tested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zatca_sandbox_tests_company_id_fkey"
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
          credit_limit: number | null
          id: string | null
          id_number: string | null
          managed_by: string | null
          name: string | null
          phone: string | null
          registration_number: string | null
          updated_at: string | null
        }
        Insert: {
          address?: never
          company_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          id?: string | null
          id_number?: never
          managed_by?: string | null
          name?: string | null
          phone?: never
          registration_number?: never
          updated_at?: string | null
        }
        Update: {
          address?: never
          company_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          id?: string | null
          id_number?: never
          managed_by?: string | null
          name?: string | null
          phone?: never
          registration_number?: never
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
      financing_companies_admin: {
        Row: {
          api_endpoint: string | null
          api_key_status: string | null
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
          api_key_status?: never
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
          api_key_status?: never
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
      fiscal_years_public: {
        Row: {
          end_date: string | null
          id: string | null
          is_current: boolean | null
          name: string | null
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          id?: string | null
          is_current?: boolean | null
          name?: string | null
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          id?: string | null
          is_current?: boolean | null
          name?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      invoices_safe: {
        Row: {
          amount_paid: number | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          customer_address: string | null
          customer_id: string | null
          customer_name: string | null
          customer_vat_number: string | null
          discount_amount: number | null
          due_date: string | null
          fiscal_year_id: string | null
          id: string | null
          internal_notes: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_type: string | null
          journal_entry_id: string | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          sale_id: string | null
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          taxable_amount: number | null
          total: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
          zatca_invoice_hash: string | null
          zatca_qr: string | null
          zatca_status: string | null
          zatca_uuid: string | null
        }
        Insert: {
          amount_paid?: number | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: never
          customer_id?: string | null
          customer_name?: string | null
          customer_vat_number?: never
          discount_amount?: number | null
          due_date?: string | null
          fiscal_year_id?: string | null
          id?: string | null
          internal_notes?: never
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          journal_entry_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          sale_id?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          taxable_amount?: number | null
          total?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          zatca_invoice_hash?: string | null
          zatca_qr?: string | null
          zatca_status?: string | null
          zatca_uuid?: string | null
        }
        Update: {
          amount_paid?: number | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_address?: never
          customer_id?: string | null
          customer_name?: string | null
          customer_vat_number?: never
          discount_amount?: number | null
          due_date?: string | null
          fiscal_year_id?: string | null
          id?: string | null
          internal_notes?: never
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          journal_entry_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          sale_id?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          taxable_amount?: number | null
          total?: number | null
          updated_at?: string | null
          vat_amount?: number | null
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
            foreignKeyName: "invoices_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years_public"
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
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers_safe: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string | null
          id: string | null
          id_number_masked: string | null
          name: string | null
          notes: string | null
          phone_masked: string | null
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
          notes?: string | null
          phone_masked?: never
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
          notes?: string | null
          phone_masked?: never
          registration_number_masked?: never
          updated_at?: string | null
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
    }
    Functions: {
      apply_default_settings_to_company: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      apply_defaults_to_existing_companies: { Args: never; Returns: Json }
      apply_tenant_schema_rls: {
        Args: { p_schema_name: string }
        Returns: undefined
      }
      backfill_tenant_schema: {
        Args: { p_company_id: string }
        Returns: undefined
      }
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
      check_and_throttle_tenant: {
        Args: { p_company_id: string }
        Returns: Json
      }
      check_rate_limit:
        | {
            Args: {
              _company_id: string
              _endpoint: string
              _max_requests?: number
              _window_seconds?: number
            }
            Returns: boolean
          }
        | {
            Args: { p_company_id: string; p_endpoint?: string }
            Returns: boolean
          }
      check_tenant_ip_access: {
        Args: {
          p_ip_address: string
          p_request_method?: string
          p_request_path?: string
          p_tenant_id: string
          p_user_agent?: string
        }
        Returns: Json
      }
      check_tenant_schema_exists: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      cleanup_rate_limit_logs: { Args: never; Returns: undefined }
      configure_tenant_encryption: {
        Args: { p_company_id: string }
        Returns: undefined
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
      create_tenant_db_role: { Args: { p_company_id: string }; Returns: string }
      create_tenant_schema: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      decrypt_sensitive_data: {
        Args: { encrypted_text: string; encryption_key: string }
        Returns: string
      }
      decrypt_tenant_data: {
        Args: { _ciphertext: string; _company_id: string }
        Returns: string
      }
      detect_security_anomalies: {
        Args: { p_company_id: string }
        Returns: Json
      }
      encrypt_sensitive_data: {
        Args: { encryption_key: string; plain_text: string }
        Returns: string
      }
      encrypt_tenant_data: {
        Args: { _company_id: string; _plaintext: string }
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
      generate_tenant_encryption_key: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      get_car_expenses: { Args: { p_car_id: string }; Returns: number }
      get_current_company_id: { Args: never; Returns: string }
      get_my_company_id: { Args: never; Returns: string }
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
      get_user_company_id_safe: { Args: { uid: string }; Returns: string }
      get_user_company_ids: { Args: { _user_id: string }; Returns: string[] }
      has_admin_or_super_admin: { Args: never; Returns: boolean }
      has_company_admin_role: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      has_permission:
        | { Args: { _permission: string }; Returns: boolean }
        | {
            Args: {
              _permission: Database["public"]["Enums"]["user_permission"]
              _user_id: string
            }
            Returns: boolean
          }
      insert_audit_log: {
        Args: {
          _action: string
          _company_id: string
          _entity_id: string
          _entity_type: string
          _ip_address?: string
          _new_data?: Json
          _old_data?: Json
          _user_agent?: string
          _user_id: string
        }
        Returns: string
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
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
      log_security_audit: {
        Args: {
          p_blocked?: boolean
          p_details?: Json
          p_event_type: string
          p_operation?: string
          p_schema_name?: string
          p_severity: string
          p_table_name?: string
          p_tenant_id?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_company_id?: string
          p_details?: Json
          p_event_type: string
          p_operation?: string
          p_severity: string
          p_source_schema?: string
          p_table_name?: string
          p_target_schema?: string
          p_user_id?: string
        }
        Returns: string
      }
      mask_phone: { Args: { phone: string }; Returns: string }
      process_prepaid_expense_amortizations: { Args: never; Returns: number }
      provision_tenant_complete: {
        Args: { p_company_id: string }
        Returns: Json
      }
      provision_tenant_final: { Args: { p_company_id: string }; Returns: Json }
      provision_tenant_storage: {
        Args: { p_company_id: string }
        Returns: string
      }
      rbac_check: { Args: { required_permission: string }; Returns: boolean }
      regenerate_journal_entries: {
        Args: { p_company_id: string }
        Returns: string
      }
      request_tenant_backup: { Args: { p_company_id: string }; Returns: string }
      resolve_company_by_subdomain: {
        Args: { p_subdomain: string }
        Returns: {
          company_type: Database["public"]["Enums"]["company_activity_type"]
          id: string
          logo_url: string
          name: string
        }[]
      }
      rotate_company_encryption_key: {
        Args: { _company_id: string }
        Returns: undefined
      }
      rotate_tenant_encryption_key:
        | { Args: { p_company_id: string }; Returns: undefined }
        | { Args: { p_company_id: string; p_reason?: string }; Returns: Json }
      run_all_tenants_pentest: { Args: never; Returns: Json }
      run_tenant_isolation_pentest: {
        Args: { p_tenant_id: string }
        Returns: Json
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
      tenant_decrypt: {
        Args: { p_company_id: string; p_encrypted: string }
        Returns: string
      }
      tenant_decrypt_column: {
        Args: { p_company_id: string; p_encrypted: string }
        Returns: string
      }
      tenant_encrypt: {
        Args: { p_company_id: string; p_data: string }
        Returns: string
      }
      tenant_encrypt_column: {
        Args: { p_company_id: string; p_value: string }
        Returns: string
      }
      user_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      validate_tenant_complete: {
        Args: { p_company_id: string }
        Returns: Json
      }
      validate_tenant_schema: { Args: { p_company_id: string }; Returns: Json }
      verify_audit_log_integrity: {
        Args: { _company_id: string }
        Returns: {
          broken_at_id: string
          broken_at_sequence: number
          is_valid: boolean
          message: string
        }[]
      }
      verify_company_permission: {
        Args: { _company_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      verify_tenant_data_integrity: {
        Args: { p_company_id: string }
        Returns: {
          is_matching: boolean
          public_count: number
          table_name: string
          tenant_count: number
        }[]
      }
      verify_user_company_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      company_activity_type:
        | "car_dealership"
        | "construction"
        | "general_trading"
        | "restaurant"
        | "export_import"
      transfer_status: "pending" | "sold" | "returned"
      transfer_type: "outgoing" | "incoming"
      user_permission:
        | "sales"
        | "purchases"
        | "reports"
        | "admin"
        | "users"
        | "super_admin"
        | "financial_accounting"
        | "sales_invoices"
        | "purchase_invoices"
        | "control_center"
        | "accounting_audit"
        | "theme_settings"
        | "app_settings"
        | "branches"
        | "approvals"
        | "currencies"
        | "financial_kpis"
        | "budgets"
        | "checks"
        | "aging_report"
        | "medad_import"
        | "cost_centers"
        | "fixed_assets"
        | "financial_statements"
        | "trial_balance"
        | "zakat_reports"
        | "financial_reports"
        | "vat_return"
        | "account_statement"
        | "general_ledger"
        | "journal_entries"
        | "chart_of_accounts"
        | "tax_settings"
        | "fiscal_years"
        | "all_reports"
        | "warehouses"
        | "integrations"
        | "manufacturing"
        | "tasks"
        | "custody"
        | "banking"
        | "financing"
        | "vouchers"
        | "installments"
        | "quotations"
        | "prepaid_expenses"
        | "expenses"
        | "leaves"
        | "attendance"
        | "payroll"
        | "employees"
        | "car_transfers"
        | "partner_dealerships"
        | "customers"
        | "suppliers"
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
        "restaurant",
        "export_import",
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
        "financial_accounting",
        "sales_invoices",
        "purchase_invoices",
        "control_center",
        "accounting_audit",
        "theme_settings",
        "app_settings",
        "branches",
        "approvals",
        "currencies",
        "financial_kpis",
        "budgets",
        "checks",
        "aging_report",
        "medad_import",
        "cost_centers",
        "fixed_assets",
        "financial_statements",
        "trial_balance",
        "zakat_reports",
        "financial_reports",
        "vat_return",
        "account_statement",
        "general_ledger",
        "journal_entries",
        "chart_of_accounts",
        "tax_settings",
        "fiscal_years",
        "all_reports",
        "warehouses",
        "integrations",
        "manufacturing",
        "tasks",
        "custody",
        "banking",
        "financing",
        "vouchers",
        "installments",
        "quotations",
        "prepaid_expenses",
        "expenses",
        "leaves",
        "attendance",
        "payroll",
        "employees",
        "car_transfers",
        "partner_dealerships",
        "customers",
        "suppliers",
      ],
    },
  },
} as const
