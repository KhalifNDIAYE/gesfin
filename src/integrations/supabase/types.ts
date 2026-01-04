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
      accounting_settings: {
        Row: {
          auto_numbering_enabled: boolean
          chart_of_accounts: string
          created_at: string
          current_fiscal_year: string
          default_currency: string
          default_vat_rate: number
          id: string
          two_step_validation_enabled: boolean
          updated_at: string
        }
        Insert: {
          auto_numbering_enabled?: boolean
          chart_of_accounts?: string
          created_at?: string
          current_fiscal_year?: string
          default_currency?: string
          default_vat_rate?: number
          id?: string
          two_step_validation_enabled?: boolean
          updated_at?: string
        }
        Update: {
          auto_numbering_enabled?: boolean
          chart_of_accounts?: string
          created_at?: string
          current_fiscal_year?: string
          default_currency?: string
          default_vat_rate?: number
          id?: string
          two_step_validation_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_correlated_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          ai_reasoning: string | null
          alert_code: string
          auto_responses_applied: string[] | null
          correlated_event_ids: string[] | null
          correlated_events: Json | null
          correlation_type: Database["public"]["Enums"]["correlation_type"]
          created_at: string | null
          description: string | null
          detection_confidence: number | null
          event_count: number | null
          first_event_at: string | null
          id: string
          last_event_at: string | null
          pattern_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_factors: Json | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          severity: string
          status: string | null
          time_span_minutes: number | null
          title: string
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          ai_reasoning?: string | null
          alert_code: string
          auto_responses_applied?: string[] | null
          correlated_event_ids?: string[] | null
          correlated_events?: Json | null
          correlation_type: Database["public"]["Enums"]["correlation_type"]
          created_at?: string | null
          description?: string | null
          detection_confidence?: number | null
          event_count?: number | null
          first_event_at?: string | null
          id?: string
          last_event_at?: string | null
          pattern_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_factors?: Json | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          severity?: string
          status?: string | null
          time_span_minutes?: number | null
          title: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          ai_reasoning?: string | null
          alert_code?: string
          auto_responses_applied?: string[] | null
          correlated_event_ids?: string[] | null
          correlated_events?: Json | null
          correlation_type?: Database["public"]["Enums"]["correlation_type"]
          created_at?: string | null
          description?: string | null
          detection_confidence?: number | null
          event_count?: number | null
          first_event_at?: string | null
          id?: string
          last_event_at?: string | null
          pattern_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_factors?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_score?: number
          severity?: string
          status?: string | null
          time_span_minutes?: number | null
          title?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_correlated_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_correlated_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_correlated_alerts_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "ai_correlation_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_correlated_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_correlated_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_correlated_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_correlated_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_correlation_events: {
        Row: {
          correlated_alert_id: string | null
          created_at: string | null
          event_data: Json | null
          event_id: string | null
          event_source: string
          event_timestamp: string
          event_type: string
          id: string
          ip_address: string | null
          risk_contribution: number | null
          sequence_order: number | null
          user_id: string | null
        }
        Insert: {
          correlated_alert_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_id?: string | null
          event_source: string
          event_timestamp: string
          event_type: string
          id?: string
          ip_address?: string | null
          risk_contribution?: number | null
          sequence_order?: number | null
          user_id?: string | null
        }
        Update: {
          correlated_alert_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_id?: string | null
          event_source?: string
          event_timestamp?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          risk_contribution?: number | null
          sequence_order?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_correlation_events_correlated_alert_id_fkey"
            columns: ["correlated_alert_id"]
            isOneToOne: false
            referencedRelation: "ai_correlated_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_correlation_patterns: {
        Row: {
          code: string
          correlation_type: Database["public"]["Enums"]["correlation_type"]
          created_at: string | null
          description: string | null
          detection_logic: Json | null
          event_types: string[]
          id: string
          is_ai_learned: boolean | null
          is_enabled: boolean | null
          min_events_threshold: number | null
          name: string
          risk_weight: number | null
          time_window_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          correlation_type: Database["public"]["Enums"]["correlation_type"]
          created_at?: string | null
          description?: string | null
          detection_logic?: Json | null
          event_types?: string[]
          id?: string
          is_ai_learned?: boolean | null
          is_enabled?: boolean | null
          min_events_threshold?: number | null
          name: string
          risk_weight?: number | null
          time_window_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          correlation_type?: Database["public"]["Enums"]["correlation_type"]
          created_at?: string | null
          description?: string | null
          detection_logic?: Json | null
          event_types?: string[]
          id?: string
          is_ai_learned?: boolean | null
          is_enabled?: boolean | null
          min_events_threshold?: number | null
          name?: string
          risk_weight?: number | null
          time_window_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_decisions_audit: {
        Row: {
          ai_model: string | null
          ai_response: Json | null
          auto_response_executed: boolean | null
          auto_response_result: Json | null
          auto_response_type:
            | Database["public"]["Enums"]["auto_response_type"]
            | null
          compliance_tags: string[] | null
          confidence_score: number | null
          created_at: string | null
          decision_made: string
          decision_reasoning: string | null
          decision_type: Database["public"]["Enums"]["ai_decision_type"]
          id: string
          input_data: Json
          is_explainable: boolean | null
          processing_time_ms: number | null
          related_alert_id: string | null
          related_user_id: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_response?: Json | null
          auto_response_executed?: boolean | null
          auto_response_result?: Json | null
          auto_response_type?:
            | Database["public"]["Enums"]["auto_response_type"]
            | null
          compliance_tags?: string[] | null
          confidence_score?: number | null
          created_at?: string | null
          decision_made: string
          decision_reasoning?: string | null
          decision_type: Database["public"]["Enums"]["ai_decision_type"]
          id?: string
          input_data?: Json
          is_explainable?: boolean | null
          processing_time_ms?: number | null
          related_alert_id?: string | null
          related_user_id?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_response?: Json | null
          auto_response_executed?: boolean | null
          auto_response_result?: Json | null
          auto_response_type?:
            | Database["public"]["Enums"]["auto_response_type"]
            | null
          compliance_tags?: string[] | null
          confidence_score?: number | null
          created_at?: string | null
          decision_made?: string
          decision_reasoning?: string | null
          decision_type?: Database["public"]["Enums"]["ai_decision_type"]
          id?: string
          input_data?: Json
          is_explainable?: boolean | null
          processing_time_ms?: number | null
          related_alert_id?: string | null
          related_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_decisions_audit_related_alert_id_fkey"
            columns: ["related_alert_id"]
            isOneToOne: false
            referencedRelation: "ai_correlated_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decisions_audit_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decisions_audit_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_engine_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_critical: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_critical?: boolean | null
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_critical?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_engine_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_engine_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "analytical_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "asset_depreciations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "asset_disposals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "asset_disposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "asset_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "asset_movements_from_assigned_to_fkey"
            columns: ["from_assigned_to"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "asset_movements_to_assigned_to_fkey"
            columns: ["to_assigned_to"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "asset_reconciliations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          {
            foreignKeyName: "asset_reconciliations_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
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
            foreignKeyName: "assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          {
            foreignKeyName: "budget_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "budget_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
      budget_transfer_history: {
        Row: {
          action: string
          comment: string | null
          from_status: string
          id: string
          performed_at: string | null
          performed_by: string | null
          snapshot: Json | null
          to_status: string
          transfer_id: string
        }
        Insert: {
          action: string
          comment?: string | null
          from_status: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          snapshot?: Json | null
          to_status: string
          transfer_id: string
        }
        Update: {
          action?: string
          comment?: string | null
          from_status?: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          snapshot?: Json | null
          to_status?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_transfer_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfer_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfer_history_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "budget_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_transfers: {
        Row: {
          admin_comment: string | null
          admin_validated_at: string | null
          admin_validated_by: string | null
          amount: number
          amount_local: number | null
          code: string
          created_at: string | null
          description: string | null
          destination_budget_line_id: string
          director_comment: string | null
          director_validated_at: string | null
          director_validated_by: string | null
          executed_at: string | null
          id: string
          reason: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_by: string | null
          source_budget_line_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_comment?: string | null
          admin_validated_at?: string | null
          admin_validated_by?: string | null
          amount: number
          amount_local?: number | null
          code: string
          created_at?: string | null
          description?: string | null
          destination_budget_line_id: string
          director_comment?: string | null
          director_validated_at?: string | null
          director_validated_by?: string | null
          executed_at?: string | null
          id?: string
          reason: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          source_budget_line_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_comment?: string | null
          admin_validated_at?: string | null
          admin_validated_by?: string | null
          amount?: number
          amount_local?: number | null
          code?: string
          created_at?: string | null
          description?: string | null
          destination_budget_line_id?: string
          director_comment?: string | null
          director_validated_at?: string | null
          director_validated_by?: string | null
          executed_at?: string | null
          id?: string
          reason?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          source_budget_line_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_transfers_admin_validated_by_fkey"
            columns: ["admin_validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_admin_validated_by_fkey"
            columns: ["admin_validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_destination_budget_line_id_fkey"
            columns: ["destination_budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_director_validated_by_fkey"
            columns: ["director_validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_director_validated_by_fkey"
            columns: ["director_validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transfers_source_budget_line_id_fkey"
            columns: ["source_budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
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
          {
            foreignKeyName: "budget_validation_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "budgets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "budgets_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "budgets_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "budgets_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_operations: {
        Row: {
          amount: number
          amount_local: number | null
          attachments: Json | null
          bailleur_id: string | null
          budget_id: string | null
          budget_line_id: string | null
          cash_account_id: string
          code: string
          convention_id: string | null
          counterpart_account_id: string
          created_at: string | null
          created_by: string | null
          currency_id: string | null
          description: string
          exchange_rate: number | null
          fiscal_year_id: string
          id: string
          journal_entry_id: string | null
          journal_id: string | null
          operation_date: string
          operation_type: string
          payment_method: string
          payment_method_other: string | null
          project_id: string | null
          status: string
          third_party_id: string | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount: number
          amount_local?: number | null
          attachments?: Json | null
          bailleur_id?: string | null
          budget_id?: string | null
          budget_line_id?: string | null
          cash_account_id: string
          code: string
          convention_id?: string | null
          counterpart_account_id: string
          created_at?: string | null
          created_by?: string | null
          currency_id?: string | null
          description: string
          exchange_rate?: number | null
          fiscal_year_id: string
          id?: string
          journal_entry_id?: string | null
          journal_id?: string | null
          operation_date: string
          operation_type: string
          payment_method?: string
          payment_method_other?: string | null
          project_id?: string | null
          status?: string
          third_party_id?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount?: number
          amount_local?: number | null
          attachments?: Json | null
          bailleur_id?: string | null
          budget_id?: string | null
          budget_line_id?: string | null
          cash_account_id?: string
          code?: string
          convention_id?: string | null
          counterpart_account_id?: string
          created_at?: string | null
          created_by?: string | null
          currency_id?: string | null
          description?: string
          exchange_rate?: number | null
          fiscal_year_id?: string
          id?: string
          journal_entry_id?: string | null
          journal_id?: string | null
          operation_date?: string
          operation_type?: string
          payment_method?: string
          payment_method_other?: string | null
          project_id?: string | null
          status?: string
          third_party_id?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_operations_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "bailleur_stats"
            referencedColumns: ["bailleur_id"]
          },
          {
            foreignKeyName: "cash_operations_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "bailleurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["bailleur_id"]
          },
          {
            foreignKeyName: "cash_operations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
          },
          {
            foreignKeyName: "cash_operations_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_counterpart_account_id_fkey"
            columns: ["counterpart_account_id"]
            isOneToOne: false
            referencedRelation: "plan_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_third_party_id_fkey"
            columns: ["third_party_id"]
            isOneToOne: false
            referencedRelation: "third_parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_operations_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_controls: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          evidence_description: string | null
          evidence_document_path: string | null
          id: string
          last_verification_date: string | null
          name: string
          next_verification_date: string | null
          notes: string | null
          responsible_id: string | null
          standard: Database["public"]["Enums"]["compliance_standard"]
          status: Database["public"]["Enums"]["compliance_status"]
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          evidence_description?: string | null
          evidence_document_path?: string | null
          id?: string
          last_verification_date?: string | null
          name: string
          next_verification_date?: string | null
          notes?: string | null
          responsible_id?: string | null
          standard: Database["public"]["Enums"]["compliance_standard"]
          status?: Database["public"]["Enums"]["compliance_status"]
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          evidence_description?: string | null
          evidence_document_path?: string | null
          id?: string
          last_verification_date?: string | null
          name?: string
          next_verification_date?: string | null
          notes?: string | null
          responsible_id?: string | null
          standard?: Database["public"]["Enums"]["compliance_standard"]
          status?: Database["public"]["Enums"]["compliance_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_controls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_controls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_controls_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_controls_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_bailleurs: {
        Row: {
          bailleur_id: string
          contract_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          bailleur_id: string
          contract_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          bailleur_id?: string
          contract_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_bailleurs_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "bailleur_stats"
            referencedColumns: ["bailleur_id"]
          },
          {
            foreignKeyName: "contract_bailleurs_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "bailleurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_bailleurs_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["bailleur_id"]
          },
          {
            foreignKeyName: "contract_bailleurs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_conventions: {
        Row: {
          contract_id: string
          convention_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          contract_id: string
          convention_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          contract_id?: string
          convention_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_conventions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_conventions_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
          },
          {
            foreignKeyName: "contract_conventions_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
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
            foreignKeyName: "contract_decomptes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          {
            foreignKeyName: "contract_decomptes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
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
            foreignKeyName: "contract_engagements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          {
            foreignKeyName: "contract_guarantees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_payment_schedule: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          milestone_number: number
          paid_at: string | null
          percentage: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          contract_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_number: number
          paid_at?: string | null
          percentage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_number?: number
          paid_at?: string | null
          percentage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_payment_schedule_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
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
            foreignKeyName: "contract_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          amount_ht: number | null
          attributaire: string | null
          budget_line_id: string | null
          closed_at: string | null
          closed_by: string | null
          code: string
          contract_number: string | null
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
          payment_method: string | null
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
          tva_amount: number | null
          tva_rate: number | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          warranty_end_date: string | null
        }
        Insert: {
          actual_end_date?: string | null
          amount_ht?: number | null
          attributaire?: string | null
          budget_line_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          code: string
          contract_number?: string | null
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
          payment_method?: string | null
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
          tva_amount?: number | null
          tva_rate?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          warranty_end_date?: string | null
        }
        Update: {
          actual_end_date?: string | null
          amount_ht?: number | null
          attributaire?: string | null
          budget_line_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          code?: string
          contract_number?: string | null
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
          payment_method?: string | null
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
          tva_amount?: number | null
          tva_rate?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
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
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
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
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
          },
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
      convention_documents: {
        Row: {
          convention_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          mime_type: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          convention_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          mime_type: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          convention_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          mime_type?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convention_documents_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
          },
          {
            foreignKeyName: "convention_documents_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
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
            referencedRelation: "bailleur_stats"
            referencedColumns: ["bailleur_id"]
          },
          {
            foreignKeyName: "conventions_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "bailleurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conventions_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["bailleur_id"]
          },
          {
            foreignKeyName: "conventions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conventions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          code_iso2: string | null
          code_iso3: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          code_iso2?: string | null
          code_iso3?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          code_iso2?: string | null
          code_iso3?: string | null
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
            foreignKeyName: "direct_payments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
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
            foreignKeyName: "direct_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "direct_payments_daf_validated_by_fkey"
            columns: ["daf_validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "direct_payments_dg_validated_by_fkey"
            columns: ["dg_validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "direct_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "direct_payments_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "direct_payments_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_payments_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          {
            foreignKeyName: "disbursement_validation_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          checksum: string | null
          created_at: string
          description: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity_type"]
          file_name: string
          file_size: number
          file_type: string
          id: string
          is_active: boolean
          mime_type: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          checksum?: string | null
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity_type"]
          file_name: string
          file_size?: number
          file_type: string
          id?: string
          is_active?: boolean
          mime_type: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          checksum?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["document_entity_type"]
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          is_active?: boolean
          mime_type?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
      exceptional_overrides_log: {
        Row: {
          admin_comment: string | null
          admin_decided_at: string | null
          admin_decided_by: string | null
          admin_decision: string | null
          budget_available: number
          budget_id: string | null
          budget_line_id: string | null
          created_at: string | null
          director_comment: string | null
          director_decided_at: string | null
          director_decided_by: string | null
          director_decision: string | null
          final_status: string | null
          id: string
          journal_entry_id: string
          override_amount: number
          override_percentage: number
          override_reason: string
          project_id: string | null
          requested_amount: number
          requested_at: string | null
          requested_by: string | null
        }
        Insert: {
          admin_comment?: string | null
          admin_decided_at?: string | null
          admin_decided_by?: string | null
          admin_decision?: string | null
          budget_available: number
          budget_id?: string | null
          budget_line_id?: string | null
          created_at?: string | null
          director_comment?: string | null
          director_decided_at?: string | null
          director_decided_by?: string | null
          director_decision?: string | null
          final_status?: string | null
          id?: string
          journal_entry_id: string
          override_amount: number
          override_percentage: number
          override_reason: string
          project_id?: string | null
          requested_amount: number
          requested_at?: string | null
          requested_by?: string | null
        }
        Update: {
          admin_comment?: string | null
          admin_decided_at?: string | null
          admin_decided_by?: string | null
          admin_decision?: string | null
          budget_available?: number
          budget_id?: string | null
          budget_line_id?: string | null
          created_at?: string | null
          director_comment?: string | null
          director_decided_at?: string | null
          director_decided_by?: string | null
          director_decision?: string | null
          final_status?: string | null
          id?: string
          journal_entry_id?: string
          override_amount?: number
          override_percentage?: number
          override_reason?: string
          project_id?: string | null
          requested_amount?: number
          requested_at?: string | null
          requested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exceptional_overrides_log_admin_decided_by_fkey"
            columns: ["admin_decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_admin_decided_by_fkey"
            columns: ["admin_decided_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_director_decided_by_fkey"
            columns: ["director_decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_director_decided_by_fkey"
            columns: ["director_decided_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptional_overrides_log_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "expense_validation_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "financial_reports_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_reports_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
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
          {
            foreignKeyName: "financial_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
      interface_settings: {
        Row: {
          created_at: string
          date_format: string
          id: string
          language: string
          number_format: string
          sidebar_collapsed: boolean
          timezone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_format?: string
          id?: string
          language?: string
          number_format?: string
          sidebar_collapsed?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_format?: string
          id?: string
          language?: string
          number_format?: string
          sidebar_collapsed?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          admin_override_approved: boolean | null
          admin_override_approved_at: string | null
          admin_override_approved_by: string | null
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
          director_override_approved: boolean | null
          director_override_approved_at: string | null
          director_override_approved_by: string | null
          dt_validated_at: string | null
          dt_validated_by: string | null
          entry_date: string
          entry_number: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          exchange_rate: number | null
          expense_workflow_status: string | null
          fiscal_year_id: string
          id: string
          is_exceptional_override: boolean | null
          journal_id: string
          override_amount: number | null
          override_reason: string | null
          override_requested_at: string | null
          override_requested_by: string | null
          override_status: string | null
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
          admin_override_approved?: boolean | null
          admin_override_approved_at?: string | null
          admin_override_approved_by?: string | null
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
          director_override_approved?: boolean | null
          director_override_approved_at?: string | null
          director_override_approved_by?: string | null
          dt_validated_at?: string | null
          dt_validated_by?: string | null
          entry_date: string
          entry_number: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          exchange_rate?: number | null
          expense_workflow_status?: string | null
          fiscal_year_id: string
          id?: string
          is_exceptional_override?: boolean | null
          journal_id: string
          override_amount?: number | null
          override_reason?: string | null
          override_requested_at?: string | null
          override_requested_by?: string | null
          override_status?: string | null
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
          admin_override_approved?: boolean | null
          admin_override_approved_at?: string | null
          admin_override_approved_by?: string | null
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
          director_override_approved?: boolean | null
          director_override_approved_at?: string | null
          director_override_approved_by?: string | null
          dt_validated_at?: string | null
          dt_validated_by?: string | null
          entry_date?: string
          entry_number?: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          exchange_rate?: number | null
          expense_workflow_status?: string | null
          fiscal_year_id?: string
          id?: string
          is_exceptional_override?: boolean | null
          journal_id?: string
          override_amount?: number | null
          override_reason?: string | null
          override_requested_at?: string | null
          override_requested_by?: string | null
          override_status?: string | null
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
            foreignKeyName: "journal_entries_admin_override_approved_by_fkey"
            columns: ["admin_override_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_admin_override_approved_by_fkey"
            columns: ["admin_override_approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "journal_entries_daf_validated_by_fkey"
            columns: ["daf_validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "journal_entries_dg_validated_by_fkey"
            columns: ["dg_validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_director_override_approved_by_fkey"
            columns: ["director_override_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_director_override_approved_by_fkey"
            columns: ["director_override_approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "journal_entries_dt_validated_by_fkey"
            columns: ["dt_validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "journal_entries_override_requested_by_fkey"
            columns: ["override_requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_override_requested_by_fkey"
            columns: ["override_requested_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "journal_entries_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "journal_entries_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          {
            foreignKeyName: "journal_entries_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "notifications_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          acronym: string | null
          address: string | null
          city: string | null
          country_id: string | null
          created_at: string | null
          email: string | null
          favicon_url: string | null
          id: string
          legal_mentions: string | null
          logo_url: string | null
          name: string
          phone: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          acronym?: string | null
          address?: string | null
          city?: string | null
          country_id?: string | null
          created_at?: string | null
          email?: string | null
          favicon_url?: string | null
          id?: string
          legal_mentions?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          acronym?: string | null
          address?: string | null
          city?: string | null
          country_id?: string | null
          created_at?: string | null
          email?: string | null
          favicon_url?: string | null
          id?: string
          legal_mentions?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "bailleur_stats"
            referencedColumns: ["bailleur_id"]
          },
          {
            foreignKeyName: "project_bailleurs_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "bailleurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_bailleurs_bailleur_id_fkey"
            columns: ["bailleur_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["bailleur_id"]
          },
          {
            foreignKeyName: "project_bailleurs_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
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
      project_conventions: {
        Row: {
          convention_id: string
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          convention_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          convention_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_conventions_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
          },
          {
            foreignKeyName: "project_conventions_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "conventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_conventions_project_id_fkey"
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
          mime_type: string | null
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
          mime_type?: string | null
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
          mime_type?: string | null
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
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          latitude: number | null
          location_name: string | null
          longitude: number | null
          name: string
          notes: string | null
          region_id: string | null
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
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          name: string
          notes?: string | null
          region_id?: string | null
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
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          name?: string
          notes?: string | null
          region_id?: string | null
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
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "projects_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
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
            foreignKeyName: "projects_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "user_names"
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
      regions: {
        Row: {
          code: string
          country_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
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
            foreignKeyName: "replenishments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replenishments_convention_id_fkey"
            columns: ["convention_id"]
            isOneToOne: false
            referencedRelation: "convention_project_stats"
            referencedColumns: ["convention_id"]
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
          {
            foreignKeyName: "replenishments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      rgpd_registry: {
        Row: {
          created_at: string | null
          created_by: string | null
          cross_border_transfers: boolean | null
          data_categories: string[]
          data_controller_id: string | null
          data_subjects: string | null
          id: string
          is_active: boolean | null
          legal_basis: string
          notes: string | null
          purpose: string
          retention_period: string
          security_measures: string | null
          subprocessors: string[] | null
          transfer_details: string | null
          treatment_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cross_border_transfers?: boolean | null
          data_categories: string[]
          data_controller_id?: string | null
          data_subjects?: string | null
          id?: string
          is_active?: boolean | null
          legal_basis: string
          notes?: string | null
          purpose: string
          retention_period: string
          security_measures?: string | null
          subprocessors?: string[] | null
          transfer_details?: string | null
          treatment_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cross_border_transfers?: boolean | null
          data_categories?: string[]
          data_controller_id?: string | null
          data_subjects?: string | null
          id?: string
          is_active?: boolean | null
          legal_basis?: string
          notes?: string | null
          purpose?: string
          retention_period?: string
          security_measures?: string | null
          subprocessors?: string[] | null
          transfer_details?: string | null
          treatment_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rgpd_registry_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rgpd_registry_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rgpd_registry_data_controller_id_fkey"
            columns: ["data_controller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rgpd_registry_data_controller_id_fkey"
            columns: ["data_controller_id"]
            isOneToOne: false
            referencedRelation: "user_names"
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
            foreignKeyName: "role_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          is_active: boolean
          is_system: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_alert_auto_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["alert_action_type"]
          alert_id: string
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          id: string
          result: Json | null
          reverted_at: string | null
          reverted_by: string | null
          rule_id: string | null
          status: string | null
          target_resource_id: string | null
          target_resource_type: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["alert_action_type"]
          alert_id: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          result?: Json | null
          reverted_at?: string | null
          reverted_by?: string | null
          rule_id?: string | null
          status?: string | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["alert_action_type"]
          alert_id?: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          result?: Json | null
          reverted_at?: string | null
          reverted_by?: string | null
          rule_id?: string | null
          status?: string | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alert_auto_actions_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "security_alert_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_auto_actions_reverted_by_fkey"
            columns: ["reverted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_auto_actions_reverted_by_fkey"
            columns: ["reverted_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_auto_actions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "security_alert_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_auto_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_auto_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alert_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actions_taken: string[] | null
          assigned_to: string | null
          category: Database["public"]["Enums"]["alert_category"]
          correlation_id: string | null
          country_code: string | null
          created_at: string | null
          description: string
          escalated_at: string | null
          escalated_to: string | null
          event_data: Json | null
          event_type: string
          evidence: Json | null
          id: string
          ip_address: string | null
          location: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number | null
          rule_id: string | null
          severity: Database["public"]["Enums"]["alert_severity_level"]
          source_module: string | null
          status: Database["public"]["Enums"]["alert_status"] | null
          title: string
          triggered_conditions: Json | null
          updated_at: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actions_taken?: string[] | null
          assigned_to?: string | null
          category: Database["public"]["Enums"]["alert_category"]
          correlation_id?: string | null
          country_code?: string | null
          created_at?: string | null
          description: string
          escalated_at?: string | null
          escalated_to?: string | null
          event_data?: Json | null
          event_type: string
          evidence?: Json | null
          id?: string
          ip_address?: string | null
          location?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          rule_id?: string | null
          severity: Database["public"]["Enums"]["alert_severity_level"]
          source_module?: string | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          title: string
          triggered_conditions?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actions_taken?: string[] | null
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["alert_category"]
          correlation_id?: string | null
          country_code?: string | null
          created_at?: string | null
          description?: string
          escalated_at?: string | null
          escalated_to?: string | null
          event_data?: Json | null
          event_type?: string
          evidence?: Json | null
          id?: string
          ip_address?: string | null
          location?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          rule_id?: string | null
          severity?: Database["public"]["Enums"]["alert_severity_level"]
          source_module?: string | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          title?: string
          triggered_conditions?: Json | null
          updated_at?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alert_events_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "security_alert_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alert_history: {
        Row: {
          action: string
          alert_id: string
          comment: string | null
          from_status: Database["public"]["Enums"]["alert_status"] | null
          id: string
          metadata: Json | null
          performed_at: string | null
          performed_by: string | null
          to_status: Database["public"]["Enums"]["alert_status"] | null
        }
        Insert: {
          action: string
          alert_id: string
          comment?: string | null
          from_status?: Database["public"]["Enums"]["alert_status"] | null
          id?: string
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          to_status?: Database["public"]["Enums"]["alert_status"] | null
        }
        Update: {
          action?: string
          alert_id?: string
          comment?: string | null
          from_status?: Database["public"]["Enums"]["alert_status"] | null
          id?: string
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          to_status?: Database["public"]["Enums"]["alert_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "security_alert_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alert_notifications: {
        Row: {
          alert_id: string
          channel: string
          created_at: string | null
          error_message: string | null
          id: string
          recipient_email: string | null
          recipient_id: string | null
          response_data: Json | null
          sent_at: string | null
          status: string | null
          webhook_url: string | null
        }
        Insert: {
          alert_id: string
          channel: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          response_data?: Json | null
          sent_at?: string | null
          status?: string | null
          webhook_url?: string | null
        }
        Update: {
          alert_id?: string
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          response_data?: Json | null
          sent_at?: string | null
          status?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alert_notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "security_alert_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alert_rules: {
        Row: {
          auto_action_config: Json | null
          auto_actions:
            | Database["public"]["Enums"]["alert_action_type"][]
            | null
          blacklist_ips: string[] | null
          blacklist_users: string[] | null
          category: Database["public"]["Enums"]["alert_category"]
          code: string
          conditions: Json | null
          cooldown_minutes: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          is_enabled: boolean | null
          name: string
          notify_channels: string[] | null
          notify_roles: string[] | null
          risk_score: number | null
          severity: Database["public"]["Enums"]["alert_severity_level"]
          threshold_count: number | null
          threshold_window_minutes: number | null
          updated_at: string | null
          whitelist_ips: string[] | null
          whitelist_users: string[] | null
        }
        Insert: {
          auto_action_config?: Json | null
          auto_actions?:
            | Database["public"]["Enums"]["alert_action_type"][]
            | null
          blacklist_ips?: string[] | null
          blacklist_users?: string[] | null
          category: Database["public"]["Enums"]["alert_category"]
          code: string
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          is_enabled?: boolean | null
          name: string
          notify_channels?: string[] | null
          notify_roles?: string[] | null
          risk_score?: number | null
          severity?: Database["public"]["Enums"]["alert_severity_level"]
          threshold_count?: number | null
          threshold_window_minutes?: number | null
          updated_at?: string | null
          whitelist_ips?: string[] | null
          whitelist_users?: string[] | null
        }
        Update: {
          auto_action_config?: Json | null
          auto_actions?:
            | Database["public"]["Enums"]["alert_action_type"][]
            | null
          blacklist_ips?: string[] | null
          blacklist_users?: string[] | null
          category?: Database["public"]["Enums"]["alert_category"]
          code?: string
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_enabled?: boolean | null
          name?: string
          notify_channels?: string[] | null
          notify_roles?: string[] | null
          risk_score?: number | null
          severity?: Database["public"]["Enums"]["alert_severity_level"]
          threshold_count?: number | null
          threshold_window_minutes?: number | null
          updated_at?: string | null
          whitelist_ips?: string[] | null
          whitelist_users?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alert_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alert_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string
          email_sent: boolean | null
          id: string
          is_resolved: boolean | null
          notification_sent: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description: string
          email_sent?: boolean | null
          id?: string
          is_resolved?: boolean | null
          notification_sent?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string
          email_sent?: boolean | null
          id?: string
          is_resolved?: boolean | null
          notification_sent?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "security_blocked_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_engine_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "security_engine_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_engine_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_event_counters: {
        Row: {
          counter: number | null
          event_type: string
          id: string
          ip_address: string | null
          last_event_at: string | null
          metadata: Json | null
          rule_id: string
          user_id: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          counter?: number | null
          event_type: string
          id?: string
          ip_address?: string | null
          last_event_at?: string | null
          metadata?: Json | null
          rule_id: string
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          counter?: number | null
          event_type?: string
          id?: string
          ip_address?: string | null
          last_event_at?: string | null
          metadata?: Json | null
          rule_id?: string
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_event_counters_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "security_alert_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_event_counters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_event_counters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_incident_history: {
        Row: {
          action: string
          comment: string | null
          from_status: Database["public"]["Enums"]["incident_status"] | null
          id: string
          incident_id: string
          performed_at: string | null
          performed_by: string | null
          to_status: Database["public"]["Enums"]["incident_status"] | null
        }
        Insert: {
          action: string
          comment?: string | null
          from_status?: Database["public"]["Enums"]["incident_status"] | null
          id?: string
          incident_id: string
          performed_at?: string | null
          performed_by?: string | null
          to_status?: Database["public"]["Enums"]["incident_status"] | null
        }
        Update: {
          action?: string
          comment?: string | null
          from_status?: Database["public"]["Enums"]["incident_status"] | null
          id?: string
          incident_id?: string
          performed_at?: string | null
          performed_by?: string | null
          to_status?: Database["public"]["Enums"]["incident_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "security_incident_history_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "security_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incident_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incident_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_incidents: {
        Row: {
          affected_systems: string[] | null
          affected_users_count: number | null
          assigned_to: string | null
          closed_at: string | null
          closed_by: string | null
          code: string
          corrective_actions: string | null
          created_at: string | null
          description: string
          detection_date: string
          id: string
          impact: string | null
          notes: string | null
          notifications_sent: boolean | null
          preventive_actions: string | null
          reported_by: string | null
          resolution_date: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_systems?: string[] | null
          affected_users_count?: number | null
          assigned_to?: string | null
          closed_at?: string | null
          closed_by?: string | null
          code: string
          corrective_actions?: string | null
          created_at?: string | null
          description: string
          detection_date?: string
          id?: string
          impact?: string | null
          notes?: string | null
          notifications_sent?: boolean | null
          preventive_actions?: string | null
          reported_by?: string | null
          resolution_date?: string | null
          root_cause?: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_systems?: string[] | null
          affected_users_count?: number | null
          assigned_to?: string | null
          closed_at?: string | null
          closed_by?: string | null
          code?: string
          corrective_actions?: string | null
          created_at?: string | null
          description?: string
          detection_date?: string
          id?: string
          impact?: string | null
          notes?: string | null
          notifications_sent?: boolean | null
          preventive_actions?: string | null
          reported_by?: string | null
          resolution_date?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_metrics: {
        Row: {
          active_users_count: number | null
          blocked_actions_count: number | null
          compliance_score: number | null
          created_at: string | null
          failed_login_attempts: number | null
          id: string
          metric_date: string
          security_incidents_count: number | null
        }
        Insert: {
          active_users_count?: number | null
          blocked_actions_count?: number | null
          compliance_score?: number | null
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          metric_date: string
          security_incidents_count?: number | null
        }
        Update: {
          active_users_count?: number | null
          blocked_actions_count?: number | null
          compliance_score?: number | null
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          metric_date?: string
          security_incidents_count?: number | null
        }
        Relationships: []
      }
      security_policies: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          effective_date: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          name: string
          policy_type: Database["public"]["Enums"]["security_policy_type"]
          requires_acknowledgment: boolean | null
          updated_at: string | null
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_date: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          policy_type: Database["public"]["Enums"]["security_policy_type"]
          requires_acknowledgment?: boolean | null
          updated_at?: string | null
          version?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          effective_date?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          policy_type?: Database["public"]["Enums"]["security_policy_type"]
          requires_acknowledgment?: boolean | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_policies_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_policies_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_policy_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          id: string
          ip_address: string | null
          policy_id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          id?: string
          ip_address?: string | null
          policy_id: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          id?: string
          ip_address?: string | null
          policy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_policy_acknowledgments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "security_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_policy_acknowledgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_policy_acknowledgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      security_policy_versions: {
        Row: {
          changes_summary: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          policy_id: string
          version: string
        }
        Insert: {
          changes_summary?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          policy_id: string
          version: string
        }
        Update: {
          changes_summary?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          policy_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_policy_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_policy_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_policy_versions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "security_policies"
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
      user_behavioral_baselines: {
        Row: {
          baseline_data: Json
          baseline_type: string
          created_at: string | null
          id: string
          last_updated: string | null
          sample_count: number | null
          user_id: string | null
        }
        Insert: {
          baseline_data?: Json
          baseline_type: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          sample_count?: number | null
          user_id?: string | null
        }
        Update: {
          baseline_data?: Json
          baseline_type?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          sample_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_behavioral_baselines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_behavioral_baselines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
      }
      user_risk_scores: {
        Row: {
          anomalies_detected: number | null
          auto_responses_triggered: number | null
          created_at: string | null
          current_score: number | null
          id: string
          last_calculated_at: string | null
          last_events: Json | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          score_factors: Json | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anomalies_detected?: number | null
          auto_responses_triggered?: number | null
          created_at?: string | null
          current_score?: number | null
          id?: string
          last_calculated_at?: string | null
          last_events?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          score_factors?: Json | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anomalies_detected?: number | null
          auto_responses_triggered?: number | null
          created_at?: string | null
          current_score?: number | null
          id?: string
          last_calculated_at?: string | null
          last_events?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          score_factors?: Json | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_risk_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_risk_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_names"
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
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_names"
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
      bailleur_stats: {
        Row: {
          bailleur_code: string | null
          bailleur_id: string | null
          bailleur_name: string | null
          convention_count: number | null
          global_execution_rate: number | null
          is_active: boolean | null
          project_count: number | null
          short_name: string | null
          total_committed: number | null
          total_disbursed: number | null
          total_remaining: number | null
        }
        Relationships: []
      }
      convention_project_stats: {
        Row: {
          bailleur_id: string | null
          bailleur_name: string | null
          convention_code: string | null
          convention_id: string | null
          convention_name: string | null
          disbursed_amount: number | null
          execution_rate: number | null
          linked_projects_count: number | null
          project_names: string[] | null
          remaining_amount: number | null
          status: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      user_names: {
        Row: {
          full_name: string | null
          id: string | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_cancel_record: {
        Args: { p_reason: string; p_record_id: string; p_table_name: string }
        Returns: Json
      }
      calculate_asset_depreciation: {
        Args: { _asset_id: string; _period_end: string }
        Returns: number
      }
      calculate_user_risk_score: { Args: { p_user_id: string }; Returns: Json }
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
      check_separation_of_duties: {
        Args: {
          _action_type: string
          _created_by: string
          _submitted_by: string
          _user_id: string
        }
        Returns: Json
      }
      check_treasury_availability: {
        Args: { _amount: number }
        Returns: boolean
      }
      create_budget_transfer: {
        Args: {
          _amount: number
          _description?: string
          _destination_budget_line_id: string
          _reason: string
          _source_budget_line_id: string
        }
        Returns: Json
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
      create_security_alert: {
        Args: {
          p_event_data?: Json
          p_evidence?: Json
          p_ip_address?: string
          p_rule_code: string
          p_user_agent?: string
          p_user_email?: string
          p_user_id?: string
        }
        Returns: string
      }
      generate_cash_operation_code: { Args: never; Returns: string }
      generate_entity_code: {
        Args: { _code_column?: string; _prefix: string; _table_name: string }
        Returns: string
      }
      generate_entry_number: {
        Args: { _fiscal_year_id: string; _journal_code: string }
        Returns: string
      }
      get_project_kpis: { Args: { _project_id: string }; Returns: Json }
      get_public_branding: { Args: never; Returns: Json }
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
      log_critical_action: {
        Args: {
          _action: string
          _details?: Json
          _module: string
          _resource_id: string
          _resource_type: string
          _user_id: string
        }
        Returns: string
      }
      log_document_action: {
        Args: {
          _action: string
          _convention_id: string
          _document_id: string
          _file_name: string
          _user_id?: string
        }
        Returns: undefined
      }
      log_document_action_unified: {
        Args: {
          p_action: string
          p_document_id: string
          p_entity_id: string
          p_entity_type: string
          p_file_name: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_sync_action: {
        Args: {
          _action: string
          _details: string
          _new_values?: Json
          _old_values?: Json
          _project_id: string
        }
        Returns: undefined
      }
      log_validation_action: {
        Args: {
          _comment?: string
          _entity_id: string
          _entity_type: string
          _from_status: string
          _to_status: string
          _user_id: string
          _validation_type: string
        }
        Returns: string
      }
      process_admin_override_decision: {
        Args: {
          _comment: string
          _decision: string
          _override_log_id: string
          _user_id: string
        }
        Returns: Json
      }
      process_director_override_decision: {
        Args: {
          _comment: string
          _decision: string
          _override_log_id: string
          _user_id: string
        }
        Returns: Json
      }
      recalculate_project_kpis: {
        Args: { _project_id: string }
        Returns: undefined
      }
      request_exceptional_override: {
        Args: {
          _budget_line_id: string
          _entry_id: string
          _override_reason: string
          _requested_amount: number
          _user_id: string
        }
        Returns: Json
      }
      reset_failed_login: { Args: { _user_id: string }; Returns: undefined }
      sync_project_bailleurs_from_conventions: {
        Args: { _project_id: string }
        Returns: undefined
      }
      update_alert_status: {
        Args: {
          p_alert_id: string
          p_comment?: string
          p_new_status: Database["public"]["Enums"]["alert_status"]
          p_user_id?: string
        }
        Returns: boolean
      }
      validate_budget_transfer_admin: {
        Args: { _comment?: string; _decision: string; _transfer_id: string }
        Returns: Json
      }
      validate_budget_transfer_director: {
        Args: { _comment?: string; _decision: string; _transfer_id: string }
        Returns: Json
      }
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
      ai_decision_type:
        | "alert_created"
        | "risk_score_updated"
        | "auto_response_triggered"
        | "baseline_updated"
        | "pattern_detected"
      alert_action_type:
        | "block_account"
        | "force_logout"
        | "reset_password"
        | "disable_access"
        | "send_notification"
        | "send_email"
        | "send_webhook"
        | "escalate"
        | "log_only"
      alert_category:
        | "authentication"
        | "authorization"
        | "data_access"
        | "system"
        | "compliance"
      alert_severity_level: "info" | "low" | "medium" | "high" | "critical"
      alert_status:
        | "new"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "ignored"
        | "escalated"
      auto_response_type:
        | "account_lock"
        | "force_logout"
        | "mfa_required"
        | "rssi_alert"
        | "quarantine"
      compliance_standard: "SOC2" | "HIPAA" | "RGPD" | "FedRAMP" | "ISO27001"
      compliance_status:
        | "conforme"
        | "non_conforme"
        | "a_ameliorer"
        | "en_cours"
      correlation_type:
        | "temporal"
        | "behavioral"
        | "contextual"
        | "data_sensitive"
      document_category:
        | "contract"
        | "budget"
        | "annex"
        | "report"
        | "invoice"
        | "correspondence"
        | "other"
      document_entity_type:
        | "project"
        | "convention"
        | "contract"
        | "budget"
        | "expense"
        | "asset"
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
      incident_severity: "mineur" | "majeur" | "critique"
      incident_status: "ouvert" | "en_cours" | "clos"
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
      risk_level: "low" | "medium" | "high" | "critical"
      security_policy_type:
        | "mot_de_passe"
        | "acces"
        | "sauvegarde"
        | "conservation_donnees"
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
      ai_decision_type: [
        "alert_created",
        "risk_score_updated",
        "auto_response_triggered",
        "baseline_updated",
        "pattern_detected",
      ],
      alert_action_type: [
        "block_account",
        "force_logout",
        "reset_password",
        "disable_access",
        "send_notification",
        "send_email",
        "send_webhook",
        "escalate",
        "log_only",
      ],
      alert_category: [
        "authentication",
        "authorization",
        "data_access",
        "system",
        "compliance",
      ],
      alert_severity_level: ["info", "low", "medium", "high", "critical"],
      alert_status: [
        "new",
        "acknowledged",
        "in_progress",
        "resolved",
        "ignored",
        "escalated",
      ],
      auto_response_type: [
        "account_lock",
        "force_logout",
        "mfa_required",
        "rssi_alert",
        "quarantine",
      ],
      compliance_standard: ["SOC2", "HIPAA", "RGPD", "FedRAMP", "ISO27001"],
      compliance_status: [
        "conforme",
        "non_conforme",
        "a_ameliorer",
        "en_cours",
      ],
      correlation_type: [
        "temporal",
        "behavioral",
        "contextual",
        "data_sensitive",
      ],
      document_category: [
        "contract",
        "budget",
        "annex",
        "report",
        "invoice",
        "correspondence",
        "other",
      ],
      document_entity_type: [
        "project",
        "convention",
        "contract",
        "budget",
        "expense",
        "asset",
      ],
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
      incident_severity: ["mineur", "majeur", "critique"],
      incident_status: ["ouvert", "en_cours", "clos"],
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
      risk_level: ["low", "medium", "high", "critical"],
      security_policy_type: [
        "mot_de_passe",
        "acces",
        "sauvegarde",
        "conservation_donnees",
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
