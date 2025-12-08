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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytical_allocations: {
        Row: {
          activity_id: string | null
          allocation_method: string
          allocation_type: string
          amount: number
          component_id: string | null
          cost_center_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          fiscal_year_id: string | null
          geographic_zone_id: string | null
          id: string
          journal_entry_line_id: string | null
          percentage: number | null
          updated_at: string | null
        }
        Insert: {
          activity_id?: string | null
          allocation_method: string
          allocation_type: string
          amount?: number
          component_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fiscal_year_id?: string | null
          geographic_zone_id?: string | null
          id?: string
          journal_entry_line_id?: string | null
          percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string | null
          allocation_method?: string
          allocation_type?: string
          amount?: number
          component_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fiscal_year_id?: string | null
          geographic_zone_id?: string | null
          id?: string
          journal_entry_line_id?: string | null
          percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytical_allocations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "tracking_axes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytical_allocations_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytical_allocations_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytical_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytical_allocations_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytical_allocations_geographic_zone_id_fkey"
            columns: ["geographic_zone_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytical_allocations_journal_entry_line_id_fkey"
            columns: ["journal_entry_line_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          account_id: string | null
          code: string
          created_at: string | null
          depreciation_account_id: string | null
          depreciation_method: string | null
          depreciation_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          useful_life_years: number | null
        }
        Insert: {
          account_id?: string | null
          code: string
          created_at?: string | null
          depreciation_account_id?: string | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          useful_life_years?: number | null
        }
        Update: {
          account_id?: string | null
          code?: string
          created_at?: string | null
          depreciation_account_id?: string | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          useful_life_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_categories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_categories_depreciation_account_id_fkey"
            columns: ["depreciation_account_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_depreciations: {
        Row: {
          accumulated_amount: number
          asset_id: string
          created_at: string | null
          created_by: string | null
          depreciation_amount: number
          fiscal_year_id: string | null
          id: string
          journal_entry_id: string | null
          net_book_value: number
          period_end: string
          period_start: string
          status: string | null
        }
        Insert: {
          accumulated_amount?: number
          asset_id: string
          created_at?: string | null
          created_by?: string | null
          depreciation_amount?: number
          fiscal_year_id?: string | null
          id?: string
          journal_entry_id?: string | null
          net_book_value?: number
          period_end: string
          period_start: string
          status?: string | null
        }
        Update: {
          accumulated_amount?: number
          asset_id?: string
          created_at?: string | null
          created_by?: string | null
          depreciation_amount?: number
          fiscal_year_id?: string | null
          id?: string
          journal_entry_id?: string | null
          net_book_value?: number
          period_end?: string
          period_start?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_depreciations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_depreciations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_depreciations_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_depreciations_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_disposals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          asset_id: string
          buyer_name: string | null
          created_at: string | null
          created_by: string | null
          disposal_date: string
          disposal_type: string
          disposal_value: number | null
          document_reference: string | null
          gain_loss: number | null
          id: string
          journal_entry_id: string | null
          net_book_value_at_disposal: number | null
          notes: string | null
          reason: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          asset_id: string
          buyer_name?: string | null
          created_at?: string | null
          created_by?: string | null
          disposal_date: string
          disposal_type: string
          disposal_value?: number | null
          document_reference?: string | null
          gain_loss?: number | null
          id?: string
          journal_entry_id?: string | null
          net_book_value_at_disposal?: number | null
          notes?: string | null
          reason?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          asset_id?: string
          buyer_name?: string | null
          created_at?: string | null
          created_by?: string | null
          disposal_date?: string
          disposal_type?: string
          disposal_value?: number | null
          document_reference?: string | null
          gain_loss?: number | null
          id?: string
          journal_entry_id?: string | null
          net_book_value_at_disposal?: number | null
          notes?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_disposals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_disposals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_disposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_disposals_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_movements: {
        Row: {
          asset_id: string
          created_at: string | null
          created_by: string | null
          document_reference: string | null
          from_assigned_to: string | null
          from_location_id: string | null
          id: string
          movement_date: string
          movement_type: string
          notes: string | null
          reason: string | null
          to_assigned_to: string | null
          to_location_id: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          created_by?: string | null
          document_reference?: string | null
          from_assigned_to?: string | null
          from_location_id?: string | null
          id?: string
          movement_date: string
          movement_type: string
          notes?: string | null
          reason?: string | null
          to_assigned_to?: string | null
          to_location_id?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          created_by?: string | null
          document_reference?: string | null
          from_assigned_to?: string | null
          from_location_id?: string | null
          id?: string
          movement_date?: string
          movement_type?: string
          notes?: string | null
          reason?: string | null
          to_assigned_to?: string | null
          to_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_movements_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_from_assigned_to_fkey"
            columns: ["from_assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_to_assigned_to_fkey"
            columns: ["to_assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_reconciliations: {
        Row: {
          created_at: string | null
          created_by: string | null
          fiscal_year_id: string | null
          id: string
          notes: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_date: string
          status: string | null
          total_assets_count: number | null
          total_book_value: number | null
          total_physical_count: number | null
          variance_count: number | null
          variance_value: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_date: string
          status?: string | null
          total_assets_count?: number | null
          total_book_value?: number | null
          total_physical_count?: number | null
          variance_count?: number | null
          variance_value?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          fiscal_year_id?: string | null
          id?: string
          notes?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_date?: string
          status?: string | null
          total_assets_count?: number | null
          total_book_value?: number | null
          total_physical_count?: number | null
          variance_count?: number | null
          variance_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_reconciliations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_reconciliations_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_reconciliations_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          accumulated_depreciation: number | null
          acquisition_date: string
          acquisition_value: number
          assigned_to: string | null
          brand: string | null
          category_id: string | null
          code: string
          convention_id: string | null
          created_at: string | null
          created_by: string | null
          current_value: number | null
          depreciation_method: string | null
          depreciation_rate: number | null
          depreciation_start_date: string | null
          description: string | null
          designation: string
          id: string
          invoice_reference: string | null
          journal_entry_id: string | null
          location_id: string | null
          model: string | null
          net_book_value: number | null
          notes: string | null
          project_id: string | null
          residual_value: number | null
          serial_number: string | null
          site_id: string | null
          status: string
          supplier_id: string | null
          updated_at: string | null
          useful_life_years: number | null
        }
        Insert: {
          accumulated_depreciation?: number | null
          acquisition_date: string
          acquisition_value?: number
          assigned_to?: string | null
          brand?: string | null
          category_id?: string | null
          code: string
          convention_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          depreciation_start_date?: string | null
          description?: string | null
          designation: string
          id?: string
          invoice_reference?: string | null
          journal_entry_id?: string | null
          location_id?: string | null
          model?: string | null
          net_book_value?: number | null
          notes?: string | null
          project_id?: string | null
          residual_value?: number | null
          serial_number?: string | null
          site_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
        }
        Update: {
          accumulated_depreciation?: number | null
          acquisition_date?: string
          acquisition_value?: number
          assigned_to?: string | null
          brand?: string | null
          category_id?: string | null
          code?: string
          convention_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          depreciation_start_date?: string | null
          description?: string | null
          designation?: string
          id?: string
          invoice_reference?: string | null
          journal_entry_id?: string | null
          location_id?: string | null
          model?: string | null
          net_book_value?: number | null
          notes?: string | null
          project_id?: string | null
          residual_value?: number | null
          serial_number?: string | null
          site_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          module: Database["public"]["Enums"]["module_name"] | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module?: Database["public"]["Enums"]["module_name"] | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module?: Database["public"]["Enums"]["module_name"] | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bailleurs: {
        Row: {
          address: string | null
          bailleur_type: string
          code: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country_id: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          short_name: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          bailleur_type?: string
          code: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          short_name?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          bailleur_type?: string
          code?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          short_name?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bailleurs_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alert_recipients: {
        Row: {
          alert_setting_id: string
          created_at: string | null
          id: string
          role_id: string
        }
        Insert: {
          alert_setting_id: string
          created_at?: string | null
          id?: string
          role_id: string
        }
        Update: {
          alert_setting_id?: string
          created_at?: string | null
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_alert_recipients_alert_setting_id_fkey"
            columns: ["alert_setting_id"]
            isOneToOne: false
            referencedRelation: "budget_alert_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_alert_recipients_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alert_settings: {
        Row: {
          block_operations: boolean
          created_at: string | null
          id: string
          is_enabled: boolean
          label: string
          level: string
          log_to_audit: boolean
          send_email: boolean
          send_notification: boolean
          threshold_percentage: number
          updated_at: string | null
        }
        Insert: {
          block_operations?: boolean
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          label: string
          level: string
          log_to_audit?: boolean
          send_email?: boolean
          send_notification?: boolean
          threshold_percentage?: number
          updated_at?: string | null
        }
        Update: {
          block_operations?: boolean
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          label?: string
          level?: string
          log_to_audit?: boolean
          send_email?: boolean
          send_notification?: boolean
          threshold_percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      budget_alerts: {
        Row: {
          alert_type: string
          budget_id: string
          budget_line_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          threshold_reached: number | null
        }
        Insert: {
          alert_type: string
          budget_id: string
          budget_line_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          threshold_reached?: number | null
        }
        Update: {
          alert_type?: string
          budget_id?: string
          budget_line_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          threshold_reached?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_alerts_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          account_id: string | null
          alert_threshold: number | null
          budget_id: string
          committed_amount: number | null
          committed_amount_local: number | null
          cost_center_id: string | null
          created_at: string | null
          description: string | null
          forecast_amount: number | null
          forecast_amount_local: number | null
          id: string
          is_over_budget: boolean | null
          line_number: number
          realized_amount: number | null
          realized_amount_local: number | null
          tracking_axis_id: string | null
          updated_at: string | null
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          account_id?: string | null
          alert_threshold?: number | null
          budget_id: string
          committed_amount?: number | null
          committed_amount_local?: number | null
          cost_center_id?: string | null
          created_at?: string | null
          description?: string | null
          forecast_amount?: number | null
          forecast_amount_local?: number | null
          id?: string
          is_over_budget?: boolean | null
          line_number: number
          realized_amount?: number | null
          realized_amount_local?: number | null
          tracking_axis_id?: string | null
          updated_at?: string | null
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          account_id?: string | null
          alert_threshold?: number | null
          budget_id?: string
          committed_amount?: number | null
          committed_amount_local?: number | null
          cost_center_id?: string | null
          created_at?: string | null
          description?: string | null
          forecast_amount?: number | null
          forecast_amount_local?: number | null
          id?: string
          is_over_budget?: boolean | null
          line_number?: number
          realized_amount?: number | null
          realized_amount_local?: number | null
          tracking_axis_id?: string | null
          updated_at?: string | null
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
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
            foreignKeyName: "budget_lines_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_tracking_axis_id_fkey"
            columns: ["tracking_axis_id"]
            isOneToOne: false
            referencedRelation: "tracking_axes"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_movements: {
        Row: {
          amount: number
          amount_local: number
          budget_line_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          journal_entry_id: string | null
          movement_date: string
          movement_type: string
          reference: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_local: number
          budget_line_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
          movement_date: string
          movement_type: string
          reference?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_local?: number
          budget_line_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
          movement_date?: string
          movement_type?: string
          reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_movements_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_movements_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_validation_history: {
        Row: {
          action: string
          budget_id: string
          comment: string | null
          from_status: string
          id: string
          performed_at: string | null
          performed_by: string | null
          to_status: string
        }
        Insert: {
          action: string
          budget_id: string
          comment?: string | null
          from_status: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          to_status: string
        }
        Update: {
          action?: string
          budget_id?: string
          comment?: string | null
          from_status?: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_validation_history_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_validation_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          closed_at: string | null
          closed_by: string | null
          code: string
          created_at: string | null
          created_by: string | null
          currency_id: string
          description: string | null
          end_date: string | null
          exchange_rate: number | null
          fiscal_year_id: string
          frozen_at: string | null
          frozen_reason: string | null
          id: string
          is_frozen: boolean | null
          name: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          start_date: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          total_amount: number | null
          total_amount_local: number | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          currency_id: string
          description?: string | null
          end_date?: string | null
          exchange_rate?: number | null
          fiscal_year_id: string
          frozen_at?: string | null
          frozen_reason?: string | null
          id?: string
          is_frozen?: boolean | null
          name: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_amount?: number | null
          total_amount_local?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          closed_by?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          currency_id?: string
          description?: string | null
          end_date?: string | null
          exchange_rate?: number | null
          fiscal_year_id?: string
          frozen_at?: string | null
          frozen_reason?: string | null
          id?: string
          is_frozen?: boolean | null
          name?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_amount?: number | null
          total_amount_local?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
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
            foreignKeyName: "budgets_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_decomptes: {
        Row: {
          amount: number
          amount_local: number | null
          approval_date: string | null
          approved_by: string | null
          code: string
          contract_id: string
          created_at: string | null
          created_by: string | null
          cumulative_amount: number | null
          decompte_number: number
          decompte_type: string
          deduction_amount: number | null
          description: string | null
          id: string
          net_amount: number | null
          notes: string | null
          payment_date: string | null
          previous_amount: number | null
          progress_percentage: number | null
          status: string
          submission_date: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          amount_local?: number | null
          approval_date?: string | null
          approved_by?: string | null
          code: string
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          cumulative_amount?: number | null
          decompte_number: number
          decompte_type?: string
          deduction_amount?: number | null
          description?: string | null
          id?: string
          net_amount?: number | null
          notes?: string | null
          payment_date?: string | null
          previous_amount?: number | null
          progress_percentage?: number | null
          status?: string
          submission_date: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_local?: number | null
          approval_date?: string | null
          approved_by?: string | null
          code?: string
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          cumulative_amount?: number | null
          decompte_number?: number
          decompte_type?: string
          deduction_amount?: number | null
          description?: string | null
          id?: string
          net_amount?: number | null
          notes?: string | null
          payment_date?: string | null
          previous_amount?: number | null
          progress_percentage?: number | null
          status?: string
          submission_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_decomptes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_decomptes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_decomptes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_engagements: {
        Row: {
          amount: number
          amount_local: number | null
          budget_line_id: string | null
          code: string
          consumed_amount: number | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          engagement_date: string
          engagement_type: string
          fiscal_year_id: string | null
          id: string
          journal_entry_id: string | null
          reference: string | null
          remaining_amount: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          amount_local?: number | null
          budget_line_id?: string | null
          code: string
          consumed_amount?: number | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          engagement_date: string
          engagement_type?: string
          fiscal_year_id?: string | null
          id?: string
          journal_entry_id?: string | null
          reference?: string | null
          remaining_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_local?: number | null
          budget_line_id?: string | null
          code?: string
          consumed_amount?: number | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          engagement_date?: string
          engagement_type?: string
          fiscal_year_id?: string | null
          id?: string
          journal_entry_id?: string | null
          reference?: string | null
          remaining_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_engagements_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_engagements_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_engagements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_engagements_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_engagements_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_guarantees: {
        Row: {
          amount: number
          amount_local: number | null
          code: string
          contract_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expiry_date: string | null
          guarantee_type: string
          id: string
          issue_date: string
          issuer_name: string | null
          notes: string | null
          percentage: number | null
          reference_number: string | null
          release_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          amount_local?: number | null
          code: string
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          guarantee_type?: string
          id?: string
          issue_date: string
          issuer_name?: string | null
          notes?: string | null
          percentage?: number | null
          reference_number?: string | null
          release_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_local?: number | null
          code?: string
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiry_date?: string | null
          guarantee_type?: string
          id?: string
          issue_date?: string
          issuer_name?: string | null
          notes?: string | null
          percentage?: number | null
          reference_number?: string | null
          release_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_guarantees_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_guarantees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_payments: {
        Row: {
          amount: number
          amount_local: number | null
          bank_reference: string | null
          beneficiary_account: string | null
          beneficiary_name: string | null
          code: string
          contract_id: string
          created_at: string | null
          created_by: string | null
          decompte_id: string | null
          description: string | null
          id: string
          journal_entry_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          amount_local?: number | null
          bank_reference?: string | null
          beneficiary_account?: string | null
          beneficiary_name?: string | null
          code: string
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          decompte_id?: string | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_local?: number | null
          bank_reference?: string | null
          beneficiary_account?: string | null
          beneficiary_name?: string | null
          code?: string
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          decompte_id?: string | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_decompte_id_fkey"
            columns: ["decompte_id"]
            isOneToOne: false
            referencedRelation: "contract_decomptes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          actual_end_date: string | null
          budget_line_id: string | null
          code: string
          contract_type: string
          convention_id: string | null
          created_at: string | null
          created_by: string | null
          currency_id: string | null
          description: string | null
          end_date: string | null
          engaged_amount: number | null
          exchange_rate: number | null
          id: string
          notes: string | null
          object: string
          paid_amount: number | null
          progress_percentage: number | null
          project_id: string | null
          remaining_amount: number | null
          signing_date: string | null
          start_date: string | null
          status: string
          supplier_id: string | null
          supplier_name: string | null
          total_amount: number
          total_amount_local: number | null
          updated_at: string | null
          warranty_end_date: string | null
        }
        Insert: {
          actual_end_date?: string | null
          budget_line_id?: string | null
          code: string
          contract_type?: string
          convention_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_id?: string | null
          description?: string | null
          end_date?: string | null
          engaged_amount?: number | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          object: string
          paid_amount?: number | null
          progress_percentage?: number | null
          project_id?: string | null
          remaining_amount?: number | null
          signing_date?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number
          total_amount_local?: number | null
          updated_at?: string | null
          warranty_end_date?: string | null
        }
        Update: {
          actual_end_date?: string | null
          budget_line_id?: string | null
          code?: string
          contract_type?: string
          convention_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_id?: string | null
          description?: string | null
          end_date?: string | null
          engaged_amount?: number | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          object?: string
          paid_amount?: number | null
          progress_percentage?: number | null
          project_id?: string | null
          remaining_amount?: number | null
          signing_date?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number
          total_amount_local?: number | null
          updated_at?: string | null
          warranty_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      convention_categories: {
        Row: {
          budget_amount: number | null
          budget_amount_local: number | null
          committed_amount: number | null
          convention_id: string
          created_at: string | null
          disbursed_amount: number | null
          expense_category_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          budget_amount?: number | null
          budget_amount_local?: number | null
          committed_amount?: number | null
          convention_id: string
          created_at?: string | null
          disbursed_amount?: number | null
          expense_category_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          budget_amount?: number | null
          budget_amount_local?: number | null
          committed_amount?: number | null
          convention_id?: string
          created_at?: string | null
          disbursed_amount?: number | null
          expense_category_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convention_categories_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convention_categories_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conventions: {
        Row: {
          bailleur_id: string
          closing_date: string | null
          code: string
          convention_type: string | null
          created_at: string | null
          created_by: string | null
          currency_id: string
          description: string | null
          disbursed_amount: number | null
          disbursed_amount_local: number | null
          effective_date: string | null
          exchange_rate: number | null
          id: string
          name: string
          objectives: string | null
          remaining_amount: number | null
          remaining_amount_local: number | null
          signing_date: string | null
          special_conditions: string | null
          status: string
          total_amount: number
          total_amount_local: number | null
          updated_at: string | null
        }
        Insert: {
          bailleur_id: string
          closing_date?: string | null
          code: string
          convention_type?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_id: string
          description?: string | null
          disbursed_amount?: number | null
          disbursed_amount_local?: number | null
          effective_date?: string | null
          exchange_rate?: number | null
          id?: string
          name: string
          objectives?: string | null
          remaining_amount?: number | null
          remaining_amount_local?: number | null
          signing_date?: string | null
          special_conditions?: string | null
          status?: string
          total_amount?: number
          total_amount_local?: number | null
          updated_at?: string | null
        }
        Update: {
          bailleur_id?: string
          closing_date?: string | null
          code?: string
          convention_type?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_id?: string
          description?: string | null
          disbursed_amount?: number | null
          disbursed_amount_local?: number | null
          effective_date?: string | null
          exchange_rate?: number | null
          id?: string
          name?: string
          objectives?: string | null
          remaining_amount?: number | null
          remaining_amount_local?: number | null
          signing_date?: string | null
          special_conditions?: string | null
          status?: string
          total_amount?: number
          total_amount_local?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conventions_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "bailleurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conventions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conventions_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string | null
          exchange_rate: number | null
          id: string
          is_default: boolean | null
          name: string
          symbol: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          exchange_rate?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          symbol?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          exchange_rate?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          symbol?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      direct_payments: {
        Row: {
          amount: number
          amount_local: number | null
          approved_by: string | null
          bank_reference: string | null
          beneficiary_account: string | null
          beneficiary_name: string
          code: string
          contract_reference: string | null
          convention_id: string
          created_at: string | null
          created_by: string | null
          daf_validated_at: string | null
          daf_validated_by: string | null
          description: string | null
          dg_validated_at: string | null
          dg_validated_by: string | null
          exchange_rate: number | null
          expense_category_id: string | null
          id: string
          invoice_reference: string | null
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          payment_date: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          related_expense_id: string | null
          request_date: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          workflow_status: string | null
        }
        Insert: {
          amount: number
          amount_local?: number | null
          approved_by?: string | null
          bank_reference?: string | null
          beneficiary_account?: string | null
          beneficiary_name: string
          code: string
          contract_reference?: string | null
          convention_id: string
          created_at?: string | null
          created_by?: string | null
          daf_validated_at?: string | null
          daf_validated_by?: string | null
          description?: string | null
          dg_validated_at?: string | null
          dg_validated_by?: string | null
          exchange_rate?: number | null
          expense_category_id?: string | null
          id?: string
          invoice_reference?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_date?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          related_expense_id?: string | null
          request_date: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          workflow_status?: string | null
        }
        Update: {
          amount?: number
          amount_local?: number | null
          approved_by?: string | null
          bank_reference?: string | null
          beneficiary_account?: string | null
          beneficiary_name?: string
          code?: string
          contract_reference?: string | null
          convention_id?: string
          created_at?: string | null
          created_by?: string | null
          daf_validated_at?: string | null
          daf_validated_by?: string | null
          description?: string | null
          dg_validated_at?: string | null
          dg_validated_by?: string | null
          exchange_rate?: number | null
          expense_category_id?: string | null
          id?: string
          invoice_reference?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_date?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          related_expense_id?: string | null
          request_date?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_payments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_daf_validated_by_fkey"
            columns: ["daf_validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_dg_validated_by_fkey"
            columns: ["dg_validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_related_expense_id_fkey"
            columns: ["related_expense_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disbursement_validation_history: {
        Row: {
          action: string
          comment: string | null
          disbursement_id: string
          from_status: string
          id: string
          performed_at: string | null
          performed_by: string | null
          to_status: string
        }
        Insert: {
          action: string
          comment?: string | null
          disbursement_id: string
          from_status: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          to_status: string
        }
        Update: {
          action?: string
          comment?: string | null
          disbursement_id?: string
          from_status?: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disbursement_validation_history_disbursement_id_fkey"
            columns: ["disbursement_id"]
            isOneToOne: false
            referencedRelation: "direct_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disbursement_validation_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_rule_lines: {
        Row: {
          created_at: string | null
          distribution_rule_id: string
          id: string
          percentage: number
          target_id: string
        }
        Insert: {
          created_at?: string | null
          distribution_rule_id: string
          id?: string
          percentage: number
          target_id: string
        }
        Update: {
          created_at?: string | null
          distribution_rule_id?: string
          id?: string
          percentage?: number
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_rule_lines_distribution_rule_id_fkey"
            columns: ["distribution_rule_id"]
            isOneToOne: false
            referencedRelation: "distribution_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_rules: {
        Row: {
          allocation_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          source_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          allocation_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          source_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allocation_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          source_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_rules_source_account_id_fkey"
            columns: ["source_account_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_alert_recipients: {
        Row: {
          alert_type_id: string | null
          created_at: string | null
          id: string
          role_id: string | null
        }
        Insert: {
          alert_type_id?: string | null
          created_at?: string | null
          id?: string
          role_id?: string | null
        }
        Update: {
          alert_type_id?: string | null
          created_at?: string | null
          id?: string
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_alert_recipients_alert_type_id_fkey"
            columns: ["alert_type_id"]
            isOneToOne: false
            referencedRelation: "email_alert_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_alert_recipients_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_alert_types: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          send_immediately: boolean | null
          severity: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          send_immediately?: boolean | null
          severity?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          send_immediately?: boolean | null
          severity?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          alert_type: string
          body_preview: string | null
          created_at: string | null
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          related_entity_id: string | null
          related_entity_name: string | null
          related_module: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          alert_type: string
          body_preview?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_module?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          alert_type?: string
          body_preview?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_module?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      email_notification_settings: {
        Row: {
          created_at: string | null
          from_email: string | null
          from_name: string | null
          id: string
          is_enabled: boolean | null
          organization_logo_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_logo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_logo_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_validation_history: {
        Row: {
          action: string
          comment: string | null
          from_status: string
          id: string
          journal_entry_id: string
          performed_at: string | null
          performed_by: string | null
          to_status: string
        }
        Insert: {
          action: string
          comment?: string | null
          from_status: string
          id?: string
          journal_entry_id: string
          performed_at?: string | null
          performed_by?: string | null
          to_status: string
        }
        Update: {
          action?: string
          comment?: string | null
          from_status?: string
          id?: string
          journal_entry_id?: string
          performed_at?: string | null
          performed_by?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_validation_history_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_validation_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_report_lines: {
        Row: {
          amount: number | null
          amount_local: number | null
          budget_amount: number | null
          created_at: string | null
          cumulative_amount: number | null
          description: string | null
          expense_category_id: string | null
          financial_report_id: string
          id: string
          line_number: number | null
          variance_amount: number | null
        }
        Insert: {
          amount?: number | null
          amount_local?: number | null
          budget_amount?: number | null
          created_at?: string | null
          cumulative_amount?: number | null
          description?: string | null
          expense_category_id?: string | null
          financial_report_id: string
          id?: string
          line_number?: number | null
          variance_amount?: number | null
        }
        Update: {
          amount?: number | null
          amount_local?: number | null
          budget_amount?: number | null
          created_at?: string | null
          cumulative_amount?: number | null
          description?: string | null
          expense_category_id?: string | null
          financial_report_id?: string
          id?: string
          line_number?: number | null
          variance_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_report_lines_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_report_lines_financial_report_id_fkey"
            columns: ["financial_report_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          closing_balance: number | null
          code: string
          convention_id: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          opening_balance: number | null
          period_end: string
          period_start: string
          replenishment_requested: number | null
          report_data: Json | null
          report_type: string
          status: string
          submission_date: string | null
          total_expenses: number | null
          total_expenses_local: number | null
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          closing_balance?: number | null
          code: string
          convention_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          period_end: string
          period_start: string
          replenishment_requested?: number | null
          report_data?: Json | null
          report_type: string
          status?: string
          submission_date?: string | null
          total_expenses?: number | null
          total_expenses_local?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          closing_balance?: number | null
          code?: string
          convention_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          period_end?: string
          period_start?: string
          replenishment_requested?: number | null
          report_data?: Json | null
          report_type?: string
          status?: string
          submission_date?: string | null
          total_expenses?: number | null
          total_expenses_local?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          is_open: boolean | null
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          is_open?: boolean | null
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          is_open?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          attachment_url: string | null
          budget_line_id: string | null
          created_at: string | null
          created_by: string | null
          currency_id: string
          daf_validated_at: string | null
          daf_validated_by: string | null
          description: string
          dg_validated_at: string | null
          dg_validated_by: string | null
          dt_validated_at: string | null
          dt_validated_by: string | null
          entry_date: string
          entry_number: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          exchange_rate: number | null
          expense_workflow_status: string | null
          fiscal_year_id: string
          id: string
          journal_id: string
          paid_at: string | null
          paid_by: string | null
          project_id: string | null
          reference: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_amount: number | null
          status: Database["public"]["Enums"]["entry_status"]
          third_party_id: string | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          attachment_url?: string | null
          budget_line_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_id: string
          daf_validated_at?: string | null
          daf_validated_by?: string | null
          description: string
          dg_validated_at?: string | null
          dg_validated_by?: string | null
          dt_validated_at?: string | null
          dt_validated_by?: string | null
          entry_date: string
          entry_number: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          exchange_rate?: number | null
          expense_workflow_status?: string | null
          fiscal_year_id: string
          id?: string
          journal_id: string
          paid_at?: string | null
          paid_by?: string | null
          project_id?: string | null
          reference?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_amount?: number | null
          status?: Database["public"]["Enums"]["entry_status"]
          third_party_id?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          attachment_url?: string | null
          budget_line_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_id?: string
          daf_validated_at?: string | null
          daf_validated_by?: string | null
          description?: string
          dg_validated_at?: string | null
          dg_validated_by?: string | null
          dt_validated_at?: string | null
          dt_validated_by?: string | null
          entry_date?: string
          entry_number?: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          exchange_rate?: number | null
          expense_workflow_status?: string | null
          fiscal_year_id?: string
          id?: string
          journal_id?: string
          paid_at?: string | null
          paid_by?: string | null
          project_id?: string | null
          reference?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_amount?: number | null
          status?: Database["public"]["Enums"]["entry_status"]
          third_party_id?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_daf_validated_by_fkey"
            columns: ["daf_validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_dg_validated_by_fkey"
            columns: ["dg_validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_dt_validated_by_fkey"
            columns: ["dt_validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "journal_entries_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_third_party_id_fkey"
            columns: ["third_party_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string | null
          credit_amount: number | null
          credit_amount_currency: number | null
          debit_amount: number | null
          debit_amount_currency: number | null
          description: string | null
          id: string
          is_lettered: boolean | null
          journal_entry_id: string
          lettering_code: string | null
          line_number: number
          third_party_id: string | null
          tracking_axis_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit_amount?: number | null
          credit_amount_currency?: number | null
          debit_amount?: number | null
          debit_amount_currency?: number | null
          description?: string | null
          id?: string
          is_lettered?: boolean | null
          journal_entry_id: string
          lettering_code?: string | null
          line_number: number
          third_party_id?: string | null
          tracking_axis_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit_amount?: number | null
          credit_amount_currency?: number | null
          debit_amount?: number | null
          debit_amount_currency?: number | null
          description?: string | null
          id?: string
          is_lettered?: boolean | null
          journal_entry_id?: string
          lettering_code?: string | null
          line_number?: number
          third_party_id?: string | null
          tracking_axis_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_third_party_id_fkey"
            columns: ["third_party_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_tracking_axis_id_fkey"
            columns: ["tracking_axis_id"]
            isOneToOne: false
            referencedRelation: "tracking_axes"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          journal_type: Database["public"]["Enums"]["journal_type"]
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          journal_type: Database["public"]["Enums"]["journal_type"]
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          journal_type?: Database["public"]["Enums"]["journal_type"]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          site_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          site_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          site_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          archived_at: string | null
          created_at: string | null
          direct_link: string | null
          id: string
          message: string
          module: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_name: string | null
          related_entity_type: string | null
          severity: string
          status: string
          title: string
          triggered_by: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          direct_link?: string | null
          id?: string
          message: string
          module?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          severity?: string
          status?: string
          title: string
          triggered_by?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          direct_link?: string | null
          id?: string
          message?: string
          module?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          severity?: string
          status?: string
          title?: string
          triggered_by?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          module: Database["public"]["Enums"]["module_name"]
          permission: Database["public"]["Enums"]["permission_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          module: Database["public"]["Enums"]["module_name"]
          permission: Database["public"]["Enums"]["permission_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          module?: Database["public"]["Enums"]["module_name"]
          permission?: Database["public"]["Enums"]["permission_type"]
        }
        Relationships: []
      }
      plan_accounts: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          level: number | null
          name: string
          parent_id: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name: string
          parent_id?: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name?: string
          parent_id?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          locked_until: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_bailleurs: {
        Row: {
          bailleur_id: string
          committed_amount: number | null
          convention_id: string | null
          created_at: string | null
          disbursed_amount: number | null
          execution_rate: number | null
          id: string
          notes: string | null
          project_id: string
          remaining_amount: number | null
          updated_at: string | null
        }
        Insert: {
          bailleur_id: string
          committed_amount?: number | null
          convention_id?: string | null
          created_at?: string | null
          disbursed_amount?: number | null
          execution_rate?: number | null
          id?: string
          notes?: string | null
          project_id: string
          remaining_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          bailleur_id?: string
          committed_amount?: number | null
          convention_id?: string | null
          created_at?: string | null
          disbursed_amount?: number | null
          execution_rate?: number | null
          id?: string
          notes?: string | null
          project_id?: string
          remaining_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_bailleurs_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "bailleurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_bailleurs_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_bailleurs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          budget_id: string | null
          committed_amount: number | null
          consumed_amount: number | null
          created_at: string | null
          fiscal_year_id: string | null
          forecast_amount: number | null
          id: string
          project_id: string
          remaining_amount: number | null
          updated_at: string | null
        }
        Insert: {
          budget_id?: string | null
          committed_amount?: number | null
          consumed_amount?: number | null
          created_at?: string | null
          fiscal_year_id?: string | null
          forecast_amount?: number | null
          id?: string
          project_id: string
          remaining_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          budget_id?: string | null
          committed_amount?: number | null
          consumed_amount?: number | null
          created_at?: string | null
          fiscal_year_id?: string | null
          forecast_amount?: number | null
          id?: string
          project_id?: string
          remaining_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budgets_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          code: string
          consumed_budget: number | null
          created_at: string | null
          created_by: string | null
          currency_id: string | null
          description: string | null
          end_date: string | null
          exchange_rate: number | null
          id: string
          name: string
          notes: string | null
          responsible_id: string | null
          site_id: string | null
          start_date: string | null
          status: string
          total_budget: number | null
          tracking_axis_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          consumed_budget?: number | null
          created_at?: string | null
          created_by?: string | null
          currency_id?: string | null
          description?: string | null
          end_date?: string | null
          exchange_rate?: number | null
          id?: string
          name: string
          notes?: string | null
          responsible_id?: string | null
          site_id?: string | null
          start_date?: string | null
          status?: string
          total_budget?: number | null
          tracking_axis_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          consumed_budget?: number | null
          created_at?: string | null
          created_by?: string | null
          currency_id?: string | null
          description?: string | null
          end_date?: string | null
          exchange_rate?: number | null
          id?: string
          name?: string
          notes?: string | null
          responsible_id?: string | null
          site_id?: string | null
          start_date?: string | null
          status?: string
          total_budget?: number | null
          tracking_axis_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tracking_axis_id_fkey"
            columns: ["tracking_axis_id"]
            isOneToOne: false
            referencedRelation: "tracking_axes"
            referencedColumns: ["id"]
          },
        ]
      }
      replenishments: {
        Row: {
          amount: number
          amount_local: number | null
          approved_by: string | null
          approved_date: string | null
          bank_reference: string | null
          code: string
          convention_id: string
          created_at: string | null
          created_by: string | null
          exchange_rate: number | null
          id: string
          notes: string | null
          received_date: string | null
          request_date: string
          status: string
          submitted_date: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_local?: number | null
          approved_by?: string | null
          approved_date?: string | null
          bank_reference?: string | null
          code: string
          convention_id: string
          created_at?: string | null
          created_by?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          received_date?: string | null
          request_date: string
          status?: string
          submitted_date?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_local?: number | null
          approved_by?: string | null
          approved_date?: string | null
          bank_reference?: string | null
          code?: string
          convention_id?: string
          created_at?: string | null
          created_by?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          received_date?: string | null
          request_date?: string
          status?: string
          submitted_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replenishments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replenishments_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replenishments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_blocked_actions: {
        Row: {
          action_attempted: string
          additional_context: Json | null
          block_source: string
          browser: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          module: string
          operating_system: string | null
          permission_required: string
          permissions_held: string[] | null
          request_method: string | null
          request_url: string | null
          resource_id: string | null
          resource_type: string | null
          severity: string
          status: string
          timestamp: string
          timezone: string | null
          user_agent: string | null
          user_email: string | null
          user_full_name: string | null
          user_id: string | null
          user_roles: string[] | null
        }
        Insert: {
          action_attempted: string
          additional_context?: Json | null
          block_source: string
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          module: string
          operating_system?: string | null
          permission_required: string
          permissions_held?: string[] | null
          request_method?: string | null
          request_url?: string | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          status?: string
          timestamp?: string
          timezone?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_full_name?: string | null
          user_id?: string | null
          user_roles?: string[] | null
        }
        Update: {
          action_attempted?: string
          additional_context?: Json | null
          block_source?: string
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          operating_system?: string | null
          permission_required?: string
          permissions_held?: string[] | null
          request_method?: string | null
          request_url?: string | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          status?: string
          timestamp?: string
          timezone?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_full_name?: string | null
          user_id?: string | null
          user_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "security_blocked_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          code: string
          country_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      third_parties: {
        Row: {
          account_code: string | null
          address: string | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          tax_id: string | null
          third_party_type: Database["public"]["Enums"]["third_party_type"]
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          address?: string | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          tax_id?: string | null
          third_party_type: Database["public"]["Enums"]["third_party_type"]
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          address?: string | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          tax_id?: string | null
          third_party_type?: Database["public"]["Enums"]["third_party_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      tracking_axes: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_units: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_asset_depreciation: {
        Args: { _asset_id: string; _period_end: string }
        Returns: number
      }
      check_budget_availability: {
        Args: { _amount: number; _budget_line_id: string }
        Returns: boolean
      }
      check_expense_allowed: {
        Args: { p_budget_id?: string; p_fiscal_year_id: string }
        Returns: Json
      }
      check_expense_fraud_rules: {
        Args: { _entry_id: string; _intended_action: string; _user_id: string }
        Returns: Json
      }
      check_treasury_availability: {
        Args: { _amount: number }
        Returns: boolean
      }
      create_notification: {
        Args: {
          _direct_link?: string
          _message: string
          _module: string
          _related_entity_id?: string
          _related_entity_name?: string
          _related_entity_type?: string
          _severity: string
          _title: string
          _triggered_by?: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      create_notification_for_permission: {
        Args: {
          _direct_link?: string
          _message: string
          _module: Database["public"]["Enums"]["module_name"]
          _notification_module: string
          _permission: Database["public"]["Enums"]["permission_type"]
          _related_entity_id?: string
          _related_entity_name?: string
          _related_entity_type?: string
          _severity: string
          _title: string
          _triggered_by?: string
          _type: string
        }
        Returns: undefined
      }
      generate_entity_code: {
        Args: { _code_column?: string; _prefix: string; _table_name: string }
        Returns: string
      }
      generate_entry_number: {
        Args: { _fiscal_year_id: string; _journal_code: string }
        Returns: string
      }
      has_permission: {
        Args: {
          _module: Database["public"]["Enums"]["module_name"]
          _permission: Database["public"]["Enums"]["permission_type"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: { _role_name: string; _user_id: string }
        Returns: boolean
      }
      has_validated_budget: {
        Args: { _fiscal_year_id: string }
        Returns: boolean
      }
      increment_failed_login: { Args: { _email: string }; Returns: undefined }
      is_account_locked: { Args: { _email: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_budget_frozen: { Args: { p_budget_id: string }; Returns: Json }
      is_expense_validated: { Args: { _expense_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          _action: string
          _module?: Database["public"]["Enums"]["module_name"]
          _new_values?: Json
          _old_values?: Json
          _resource_id?: string
          _resource_type?: string
        }
        Returns: string
      }
      log_blocked_action: {
        Args: {
          _action_attempted: string
          _additional_context?: Json
          _block_source: string
          _browser: string
          _device_type: string
          _ip_address: string
          _module: string
          _operating_system: string
          _permission_required: string
          _permissions_held: string[]
          _request_method: string
          _request_url: string
          _resource_id: string
          _resource_type: string
          _user_agent: string
          _user_email: string
          _user_full_name: string
          _user_id: string
          _user_roles: string[]
        }
        Returns: string
      }
      reset_failed_login: { Args: { _user_id: string }; Returns: undefined }
      validate_budget_transition: {
        Args: {
          _budget_id: string
          _comment?: string
          _new_status: string
          _user_id: string
        }
        Returns: Json
      }
      validate_disbursement_transition: {
        Args: {
          _comment?: string
          _disbursement_id: string
          _new_status: string
          _user_id: string
        }
        Returns: Json
      }
      validate_expense_transition: {
        Args: {
          _comment?: string
          _entry_id: string
          _new_status: string
          _user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      entry_status: "brouillon" | "valide" | "cloture"
      entry_type:
        | "depense"
        | "financement"
        | "decaissement"
        | "prise_en_charge"
        | "autre"
      expense_status:
        | "brouillon"
        | "soumise"
        | "en_validation_daf"
        | "en_validation_dt"
        | "en_validation_dg"
        | "validee"
        | "rejetee"
        | "payee"
      journal_type:
        | "achats"
        | "ventes"
        | "banque"
        | "caisse"
        | "operations_diverses"
        | "a_nouveaux"
      module_name:
        | "dashboard"
        | "projets"
        | "comptabilite"
        | "bailleurs"
        | "conventions"
        | "immobilisations"
        | "marches"
        | "decaissements"
        | "rapports"
        | "utilisateurs"
        | "securite"
        | "parametres"
      permission_type:
        | "read"
        | "create"
        | "update"
        | "delete"
        | "validate"
        | "export"
      plan_type:
        | "comptable"
        | "budgetaire"
        | "analytique"
        | "financier"
        | "geographique"
      third_party_type:
        | "fournisseur"
        | "client"
        | "employe"
        | "bailleur"
        | "autre"
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
      entry_status: ["brouillon", "valide", "cloture"],
      entry_type: [
        "depense",
        "financement",
        "decaissement",
        "prise_en_charge",
        "autre",
      ],
      expense_status: [
        "brouillon",
        "soumise",
        "en_validation_daf",
        "en_validation_dt",
        "en_validation_dg",
        "validee",
        "rejetee",
        "payee",
      ],
      journal_type: [
        "achats",
        "ventes",
        "banque",
        "caisse",
        "operations_diverses",
        "a_nouveaux",
      ],
      module_name: [
        "dashboard",
        "projets",
        "comptabilite",
        "bailleurs",
        "conventions",
        "immobilisations",
        "marches",
        "decaissements",
        "rapports",
        "utilisateurs",
        "securite",
        "parametres",
      ],
      permission_type: [
        "read",
        "create",
        "update",
        "delete",
        "validate",
        "export",
      ],
      plan_type: [
        "comptable",
        "budgetaire",
        "analytique",
        "financier",
        "geographique",
      ],
      third_party_type: [
        "fournisseur",
        "client",
        "employe",
        "bailleur",
        "autre",
      ],
    },
  },
} as const
