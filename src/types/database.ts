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
      activity_logs: {
        Row: {
          action_category: string
          action_type: string
          created_at: string | null
          description: string
          description_en: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          proyecto_id: string | null
          proyecto_nombre: string | null
          user_email: string
          user_id: string | null
          user_role: string
        }
        Insert: {
          action_category: string
          action_type: string
          created_at?: string | null
          description: string
          description_en?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          proyecto_id?: string | null
          proyecto_nombre?: string | null
          user_email: string
          user_id?: string | null
          user_role: string
        }
        Update: {
          action_category?: string
          action_type?: string
          created_at?: string | null
          description?: string
          description_en?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          proyecto_id?: string | null
          proyecto_nombre?: string | null
          user_email?: string
          user_id?: string | null
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_email: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_email?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cached: boolean | null
          created_at: string | null
          feature: string
          id: string
          input_length: number
          output_length: number
          style: string | null
          user_id: string | null
        }
        Insert: {
          cached?: boolean | null
          created_at?: string | null
          feature: string
          id?: string
          input_length: number
          output_length: number
          style?: string | null
          user_id?: string | null
        }
        Update: {
          cached?: boolean | null
          created_at?: string | null
          feature?: string
          id?: string
          input_length?: number
          output_length?: number
          style?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          proyecto_id: string
          referrer: string | null
          screen_width: number | null
          session_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          proyecto_id: string
          referrer?: string | null
          screen_width?: number | null
          session_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          proyecto_id?: string
          referrer?: string | null
          screen_width?: number | null
          session_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          admin_notified: boolean | null
          confirmation_email_sent: boolean | null
          created_at: string | null
          duration_minutes: number | null
          email: string
          empresa: string | null
          ghl_appointment_id: string
          ghl_contact_id: string
          id: string
          meeting_link: string | null
          no_show_count: number | null
          no_show_followup_sent: boolean | null
          nombre: string
          referrer: string | null
          reminder_24h_sent: boolean | null
          reminder_2h_sent: boolean | null
          reminder_wa_sent: boolean | null
          scheduled_for: string
          sequence_emails_sent: number | null
          sequence_plan: Json | null
          status: string | null
          telefono: string | null
          thank_you_page_visited: boolean | null
          thank_you_page_visited_at: string | null
          timezone: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
          whatsapp_optin: boolean | null
        }
        Insert: {
          admin_notified?: boolean | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          email: string
          empresa?: string | null
          ghl_appointment_id: string
          ghl_contact_id: string
          id?: string
          meeting_link?: string | null
          no_show_count?: number | null
          no_show_followup_sent?: boolean | null
          nombre: string
          referrer?: string | null
          reminder_24h_sent?: boolean | null
          reminder_2h_sent?: boolean | null
          reminder_wa_sent?: boolean | null
          scheduled_for: string
          sequence_emails_sent?: number | null
          sequence_plan?: Json | null
          status?: string | null
          telefono?: string | null
          thank_you_page_visited?: boolean | null
          thank_you_page_visited_at?: string | null
          timezone?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
          whatsapp_optin?: boolean | null
        }
        Update: {
          admin_notified?: boolean | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          email?: string
          empresa?: string | null
          ghl_appointment_id?: string
          ghl_contact_id?: string
          id?: string
          meeting_link?: string | null
          no_show_count?: number | null
          no_show_followup_sent?: boolean | null
          nombre?: string
          referrer?: string | null
          reminder_24h_sent?: boolean | null
          reminder_2h_sent?: boolean | null
          reminder_wa_sent?: boolean | null
          scheduled_for?: string
          sequence_emails_sent?: number | null
          sequence_plan?: Json | null
          status?: string | null
          telefono?: string | null
          thank_you_page_visited?: boolean | null
          thank_you_page_visited_at?: string | null
          timezone?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
          whatsapp_optin?: boolean | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      avances_obra: {
        Row: {
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha: string
          id: string
          imagen_url: string | null
          orden: number | null
          proyecto_id: string
          titulo: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha: string
          id?: string
          imagen_url?: string | null
          orden?: number | null
          proyecto_id: string
          titulo: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string
          id?: string
          imagen_url?: string | null
          orden?: number | null
          proyecto_id?: string
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avances_obra_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_proyectos: {
        Row: {
          colaborador_id: string
          created_at: string | null
          id: string
          proyecto_id: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string | null
          id?: string
          proyecto_id: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string | null
          id?: string
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_proyectos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_proyectos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          activated_at: string | null
          admin_user_id: string
          colaborador_user_id: string | null
          created_at: string | null
          email: string
          estado: string
          id: string
          invited_at: string | null
          nombre: string | null
        }
        Insert: {
          activated_at?: string | null
          admin_user_id: string
          colaborador_user_id?: string | null
          created_at?: string | null
          email: string
          estado?: string
          id?: string
          invited_at?: string | null
          nombre?: string | null
        }
        Update: {
          activated_at?: string | null
          admin_user_id?: string
          colaborador_user_id?: string | null
          created_at?: string | null
          email?: string
          estado?: string
          id?: string
          invited_at?: string | null
          nombre?: string | null
        }
        Relationships: []
      }
      complementos: {
        Row: {
          area_m2: number | null
          created_at: string | null
          estado: string | null
          id: string
          identificador: string
          nivel: string | null
          notas: string | null
          orden: number | null
          precio: number | null
          proyecto_id: string
          subtipo: string | null
          tipo: string
          torre_id: string | null
          unidad_id: string | null
        }
        Insert: {
          area_m2?: number | null
          created_at?: string | null
          estado?: string | null
          id?: string
          identificador: string
          nivel?: string | null
          notas?: string | null
          orden?: number | null
          precio?: number | null
          proyecto_id: string
          subtipo?: string | null
          tipo: string
          torre_id?: string | null
          unidad_id?: string | null
        }
        Update: {
          area_m2?: number | null
          created_at?: string | null
          estado?: string | null
          id?: string
          identificador?: string
          nivel?: string | null
          notas?: string | null
          orden?: number | null
          precio?: number | null
          proyecto_id?: string
          subtipo?: string | null
          tipo?: string
          torre_id?: string | null
          unidad_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complementos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complementos_torre_id_fkey"
            columns: ["torre_id"]
            isOneToOne: false
            referencedRelation: "torres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complementos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          agente_id: string | null
          agente_nombre: string | null
          config_snapshot: Json
          created_at: string | null
          email: string
          id: string
          nombre: string
          pdf_url: string | null
          proyecto_id: string | null
          resultado: Json
          telefono: string | null
          unidad_id: string | null
          unidad_snapshot: Json
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          agente_id?: string | null
          agente_nombre?: string | null
          config_snapshot: Json
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          pdf_url?: string | null
          proyecto_id?: string | null
          resultado: Json
          telefono?: string | null
          unidad_id?: string | null
          unidad_snapshot: Json
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          agente_id?: string | null
          agente_nombre?: string | null
          config_snapshot?: Json
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          pdf_url?: string | null
          proyecto_id?: string | null
          resultado?: Json
          telefono?: string | null
          unidad_id?: string | null
          unidad_snapshot?: Json
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_analytics: {
        Row: {
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          screen_width: number | null
          session_id: string
          user_id: string | null
          user_role: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          screen_width?: number | null
          session_id: string
          user_id?: string | null
          user_role?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          screen_width?: number | null
          session_id?: string
          user_id?: string | null
          user_role?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string | null
          from_email: string
          id: string
          metadata: Json | null
          resend_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          to_email: string
        }
        Insert: {
          created_at?: string | null
          email_type?: string | null
          from_email: string
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          to_email: string
        }
        Update: {
          created_at?: string | null
          email_type?: string | null
          from_email?: string
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      email_report_config: {
        Row: {
          created_at: string | null
          daily_digest_enabled: boolean | null
          email_override: string | null
          id: string
          last_daily_sent: string | null
          last_monthly_sent: string | null
          last_weekly_sent: string | null
          monthly_enabled: boolean | null
          project_ids: string[] | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          weekly_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          daily_digest_enabled?: boolean | null
          email_override?: string | null
          id?: string
          last_daily_sent?: string | null
          last_monthly_sent?: string | null
          last_weekly_sent?: string | null
          monthly_enabled?: boolean | null
          project_ids?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          weekly_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          daily_digest_enabled?: boolean | null
          email_override?: string | null
          id?: string
          last_daily_sent?: string | null
          last_monthly_sent?: string | null
          last_weekly_sent?: string | null
          monthly_enabled?: boolean | null
          project_ids?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_enabled?: boolean | null
        }
        Relationships: []
      }
      fachadas: {
        Row: {
          amenidades: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          imagen_portada: string | null
          imagen_url: string
          nombre: string
          num_pisos: number | null
          orden: number | null
          piso_numero: number | null
          planta_tipo_nombre: string | null
          proyecto_id: string | null
          puntos_vacios: Json | null
          tipo: string | null
          torre_id: string | null
        }
        Insert: {
          amenidades?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_portada?: string | null
          imagen_url: string
          nombre: string
          num_pisos?: number | null
          orden?: number | null
          piso_numero?: number | null
          planta_tipo_nombre?: string | null
          proyecto_id?: string | null
          puntos_vacios?: Json | null
          tipo?: string | null
          torre_id?: string | null
        }
        Update: {
          amenidades?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_portada?: string | null
          imagen_url?: string
          nombre?: string
          num_pisos?: number | null
          orden?: number | null
          piso_numero?: number | null
          planta_tipo_nombre?: string | null
          proyecto_id?: string | null
          puntos_vacios?: Json | null
          tipo?: string | null
          torre_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fachadas_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fachadas_torre_id_fkey"
            columns: ["torre_id"]
            isOneToOne: false
            referencedRelation: "torres"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_blocked_emails: {
        Row: {
          feature: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          feature: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          feature?: string
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      galeria_categorias: {
        Row: {
          id: string
          nombre: string
          orden: number | null
          proyecto_id: string | null
          slug: string
          torre_id: string | null
        }
        Insert: {
          id?: string
          nombre: string
          orden?: number | null
          proyecto_id?: string | null
          slug: string
          torre_id?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          orden?: number | null
          proyecto_id?: string | null
          slug?: string
          torre_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "galeria_categorias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "galeria_categorias_torre_id_fkey"
            columns: ["torre_id"]
            isOneToOne: false
            referencedRelation: "torres"
            referencedColumns: ["id"]
          },
        ]
      }
      galeria_imagenes: {
        Row: {
          alt_text: string | null
          categoria_id: string | null
          id: string
          orden: number | null
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          categoria_id?: string | null
          id?: string
          orden?: number | null
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          categoria_id?: string | null
          id?: string
          orden?: number | null
          thumbnail_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "galeria_imagenes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "galeria_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          mensaje: string | null
          nombre: string
          pais: string | null
          proyecto_id: string | null
          status: string
          telefono: string | null
          tipologia_interes: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          mensaje?: string | null
          nombre: string
          pais?: string | null
          proyecto_id?: string | null
          status?: string
          telefono?: string | null
          tipologia_interes?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          mensaje?: string | null
          nombre?: string
          pais?: string | null
          proyecto_id?: string | null
          status?: string
          telefono?: string | null
          tipologia_interes?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          currency: string
          id: string
          invoice_url: string | null
          metadata: Json | null
          payment_method: string | null
          plan: string
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          currency?: string
          id?: string
          invoice_url?: string | null
          metadata?: Json | null
          payment_method?: string | null
          plan: string
          status: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          currency?: string
          id?: string
          invoice_url?: string | null
          metadata?: Json | null
          payment_method?: string | null
          plan?: string
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plano_puntos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          fachada_id: string | null
          id: string
          imagen_url: string | null
          orden: number | null
          plano_id: string | null
          render_url: string | null
          renders: Json | null
          titulo: string
          torre_id: string | null
          x: number
          y: number
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          fachada_id?: string | null
          id?: string
          imagen_url?: string | null
          orden?: number | null
          plano_id?: string | null
          render_url?: string | null
          renders?: Json | null
          titulo: string
          torre_id?: string | null
          x: number
          y: number
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          fachada_id?: string | null
          id?: string
          imagen_url?: string | null
          orden?: number | null
          plano_id?: string | null
          render_url?: string | null
          renders?: Json | null
          titulo?: string
          torre_id?: string | null
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "plano_puntos_fachada_id_fkey"
            columns: ["fachada_id"]
            isOneToOne: false
            referencedRelation: "fachadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_puntos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_interactivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_puntos_torre_id_fkey"
            columns: ["torre_id"]
            isOneToOne: false
            referencedRelation: "torres"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_interactivos: {
        Row: {
          amenidades_data: Json | null
          created_at: string | null
          descripcion: string | null
          id: string
          imagen_url: string
          nombre: string
          orden: number | null
          proyecto_id: string | null
          tipo: string
          visible: boolean | null
        }
        Insert: {
          amenidades_data?: Json | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url: string
          nombre: string
          orden?: number | null
          proyecto_id?: string | null
          tipo: string
          visible?: boolean | null
        }
        Update: {
          amenidades_data?: Json | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string
          nombre?: string
          orden?: number | null
          proyecto_id?: string | null
          tipo?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_interactivos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nombre: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          nombre?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_features: {
        Row: {
          created_at: string | null
          enabled: boolean
          feature: string
          id: string
          proyecto_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          feature: string
          id?: string
          proyecto_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          feature?: string
          id?: string
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_features_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_versiones: {
        Row: {
          id: string
          proyecto_id: string
          published_at: string | null
          published_by: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          id?: string
          proyecto_id: string
          published_at?: string | null
          published_by?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          id?: string
          proyecto_id?: string
          published_at?: string | null
          published_by?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_versiones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos: {
        Row: {
          background_audio_url: string | null
          brochure_url: string | null
          color_fondo: string | null
          color_primario: string | null
          color_secundario: string | null
          constructora_logo_url: string | null
          constructora_nombre: string | null
          constructora_website: string | null
          cotizador_config: Json | null
          cotizador_enabled: boolean | null
          created_at: string | null
          custom_domain: string | null
          depositos_mode: string | null
          depositos_precio_base: number | null
          descripcion: string | null
          disclaimer: string | null
          domain_verified: boolean | null
          estado: string | null
          etapa_label: string | null
          fachada_url: string | null
          favicon_url: string | null
          hero_video_url: string | null
          hide_noddo_badge: boolean
          id: string
          idioma: string | null
          inventory_columns: Json | null
          inventory_columns_by_type: Json | null
          inventory_columns_microsite: Json | null
          inventory_columns_microsite_by_type: Json | null
          logo_height: number | null
          logo_url: string | null
          mapa_ubicacion_url: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          moneda_base: string | null
          nombre: string
          og_image_url: string | null
          parqueaderos_mode: string | null
          parqueaderos_precio_base: number | null
          politica_privacidad_url: string | null
          precio_source: string | null
          render_principal_url: string | null
          slug: string
          storage_limit_bytes: number | null
          storage_media_bytes: number | null
          storage_tours_bytes: number | null
          storage_videos_bytes: number | null
          subdomain: string | null
          tipo_proyecto: string
          tipologia_mode: string
          tour_360_url: string | null
          ubicacion_direccion: string | null
          ubicacion_lat: number | null
          ubicacion_lng: number | null
          unidad_medida_base: string | null
          updated_at: string | null
          user_id: string | null
          webhook_config: Json | null
          whatsapp_numero: string | null
        }
        Insert: {
          background_audio_url?: string | null
          brochure_url?: string | null
          color_fondo?: string | null
          color_primario?: string | null
          color_secundario?: string | null
          constructora_logo_url?: string | null
          constructora_nombre?: string | null
          constructora_website?: string | null
          cotizador_config?: Json | null
          cotizador_enabled?: boolean | null
          created_at?: string | null
          custom_domain?: string | null
          depositos_mode?: string | null
          depositos_precio_base?: number | null
          descripcion?: string | null
          disclaimer?: string | null
          domain_verified?: boolean | null
          estado?: string | null
          etapa_label?: string | null
          fachada_url?: string | null
          favicon_url?: string | null
          hero_video_url?: string | null
          hide_noddo_badge?: boolean
          id?: string
          idioma?: string | null
          inventory_columns?: Json | null
          inventory_columns_by_type?: Json | null
          inventory_columns_microsite?: Json | null
          inventory_columns_microsite_by_type?: Json | null
          logo_height?: number | null
          logo_url?: string | null
          mapa_ubicacion_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          moneda_base?: string | null
          nombre: string
          og_image_url?: string | null
          parqueaderos_mode?: string | null
          parqueaderos_precio_base?: number | null
          politica_privacidad_url?: string | null
          precio_source?: string | null
          render_principal_url?: string | null
          slug: string
          storage_limit_bytes?: number | null
          storage_media_bytes?: number | null
          storage_tours_bytes?: number | null
          storage_videos_bytes?: number | null
          subdomain?: string | null
          tipo_proyecto?: string
          tipologia_mode?: string
          tour_360_url?: string | null
          ubicacion_direccion?: string | null
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
          unidad_medida_base?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_config?: Json | null
          whatsapp_numero?: string | null
        }
        Update: {
          background_audio_url?: string | null
          brochure_url?: string | null
          color_fondo?: string | null
          color_primario?: string | null
          color_secundario?: string | null
          constructora_logo_url?: string | null
          constructora_nombre?: string | null
          constructora_website?: string | null
          cotizador_config?: Json | null
          cotizador_enabled?: boolean | null
          created_at?: string | null
          custom_domain?: string | null
          depositos_mode?: string | null
          depositos_precio_base?: number | null
          descripcion?: string | null
          disclaimer?: string | null
          domain_verified?: boolean | null
          estado?: string | null
          etapa_label?: string | null
          fachada_url?: string | null
          favicon_url?: string | null
          hero_video_url?: string | null
          hide_noddo_badge?: boolean
          id?: string
          idioma?: string | null
          inventory_columns?: Json | null
          inventory_columns_by_type?: Json | null
          inventory_columns_microsite?: Json | null
          inventory_columns_microsite_by_type?: Json | null
          logo_height?: number | null
          logo_url?: string | null
          mapa_ubicacion_url?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          moneda_base?: string | null
          nombre?: string
          og_image_url?: string | null
          parqueaderos_mode?: string | null
          parqueaderos_precio_base?: number | null
          politica_privacidad_url?: string | null
          precio_source?: string | null
          render_principal_url?: string | null
          slug?: string
          storage_limit_bytes?: number | null
          storage_media_bytes?: number | null
          storage_tours_bytes?: number | null
          storage_videos_bytes?: number | null
          subdomain?: string | null
          tipo_proyecto?: string
          tipologia_mode?: string
          tour_360_url?: string | null
          ubicacion_direccion?: string | null
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
          unidad_medida_base?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_config?: Json | null
          whatsapp_numero?: string | null
        }
        Relationships: []
      }
      puntos_interes: {
        Row: {
          categoria: string
          ciudad: string | null
          created_at: string | null
          descripcion: string | null
          distancia_km: number | null
          id: string
          imagen_url: string | null
          lat: number
          lng: number
          nombre: string
          orden: number | null
          proyecto_id: string | null
          tiempo_minutos: number | null
        }
        Insert: {
          categoria?: string
          ciudad?: string | null
          created_at?: string | null
          descripcion?: string | null
          distancia_km?: number | null
          id?: string
          imagen_url?: string | null
          lat: number
          lng: number
          nombre: string
          orden?: number | null
          proyecto_id?: string | null
          tiempo_minutos?: number | null
        }
        Update: {
          categoria?: string
          ciudad?: string | null
          created_at?: string | null
          descripcion?: string | null
          distancia_km?: number | null
          id?: string
          imagen_url?: string | null
          lat?: number
          lng?: number
          nombre?: string
          orden?: number | null
          proyecto_id?: string | null
          tiempo_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "puntos_interes_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          orden: number | null
          proyecto_id: string | null
          tipo: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number | null
          proyecto_id?: string | null
          tipo?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          proyecto_id?: string | null
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "recursos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          status: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          status: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          status?: string
          value?: number
        }
        Relationships: []
      }
      tipologias: {
        Row: {
          area_balcon: number | null
          area_construida: number | null
          area_lote: number | null
          area_m2: number | null
          area_privada: number | null
          banos: number | null
          caracteristicas: string[] | null
          created_at: string | null
          depositos: number | null
          descripcion: string | null
          habitaciones: number | null
          hotspots: Json | null
          id: string
          nombre: string
          orden: number | null
          parqueaderos: number | null
          plano_url: string | null
          precio_desde: number | null
          proyecto_id: string | null
          renders: string[] | null
          tipo_tipologia: string | null
          torre_ids: string[] | null
          ubicacion_plano_url: string | null
        }
        Insert: {
          area_balcon?: number | null
          area_construida?: number | null
          area_lote?: number | null
          area_m2?: number | null
          area_privada?: number | null
          banos?: number | null
          caracteristicas?: string[] | null
          created_at?: string | null
          depositos?: number | null
          descripcion?: string | null
          habitaciones?: number | null
          hotspots?: Json | null
          id?: string
          nombre: string
          orden?: number | null
          parqueaderos?: number | null
          plano_url?: string | null
          precio_desde?: number | null
          proyecto_id?: string | null
          renders?: string[] | null
          tipo_tipologia?: string | null
          torre_ids?: string[] | null
          ubicacion_plano_url?: string | null
        }
        Update: {
          area_balcon?: number | null
          area_construida?: number | null
          area_lote?: number | null
          area_m2?: number | null
          area_privada?: number | null
          banos?: number | null
          caracteristicas?: string[] | null
          created_at?: string | null
          depositos?: number | null
          descripcion?: string | null
          habitaciones?: number | null
          hotspots?: Json | null
          id?: string
          nombre?: string
          orden?: number | null
          parqueaderos?: number | null
          plano_url?: string | null
          precio_desde?: number | null
          proyecto_id?: string | null
          renders?: string[] | null
          tipo_tipologia?: string | null
          torre_ids?: string[] | null
          ubicacion_plano_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipologias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      torres: {
        Row: {
          amenidades: string | null
          amenidades_data: Json | null
          caracteristicas: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          imagen_portada: string | null
          logo_url: string | null
          nombre: string
          num_pisos: number | null
          orden: number | null
          pisos_planta_baja: number | null
          pisos_podio: number | null
          pisos_residenciales: number | null
          pisos_rooftop: number | null
          pisos_sotano: number | null
          prefijo: string | null
          proyecto_id: string | null
          tipo: string
        }
        Insert: {
          amenidades?: string | null
          amenidades_data?: Json | null
          caracteristicas?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_portada?: string | null
          logo_url?: string | null
          nombre: string
          num_pisos?: number | null
          orden?: number | null
          pisos_planta_baja?: number | null
          pisos_podio?: number | null
          pisos_residenciales?: number | null
          pisos_rooftop?: number | null
          pisos_sotano?: number | null
          prefijo?: string | null
          proyecto_id?: string | null
          tipo?: string
        }
        Update: {
          amenidades?: string | null
          amenidades_data?: Json | null
          caracteristicas?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_portada?: string | null
          logo_url?: string | null
          nombre?: string
          num_pisos?: number | null
          orden?: number | null
          pisos_planta_baja?: number | null
          pisos_podio?: number | null
          pisos_residenciales?: number | null
          pisos_rooftop?: number | null
          pisos_sotano?: number | null
          prefijo?: string | null
          proyecto_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "torres_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      unidad_state_history: {
        Row: {
          area_m2_snapshot: number | null
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          estado_anterior: string | null
          estado_nuevo: string
          id: string
          identificador_snapshot: string | null
          metadata: Json | null
          precio_snapshot: number | null
          proyecto_id: string
          tipologia_snapshot: string | null
          unidad_id: string
        }
        Insert: {
          area_m2_snapshot?: number | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          estado_anterior?: string | null
          estado_nuevo: string
          id?: string
          identificador_snapshot?: string | null
          metadata?: Json | null
          precio_snapshot?: number | null
          proyecto_id: string
          tipologia_snapshot?: string | null
          unidad_id: string
        }
        Update: {
          area_m2_snapshot?: number | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          estado_anterior?: string | null
          estado_nuevo?: string
          id?: string
          identificador_snapshot?: string | null
          metadata?: Json | null
          precio_snapshot?: number | null
          proyecto_id?: string
          tipologia_snapshot?: string | null
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidad_state_history_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidad_state_history_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidad_tipologias: {
        Row: {
          created_at: string | null
          id: string
          proyecto_id: string
          tipologia_id: string
          unidad_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proyecto_id: string
          tipologia_id: string
          unidad_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proyecto_id?: string
          tipologia_id?: string
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidad_tipologias_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidad_tipologias_tipologia_id_fkey"
            columns: ["tipologia_id"]
            isOneToOne: false
            referencedRelation: "tipologias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidad_tipologias_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          area_construida: number | null
          area_lote: number | null
          area_m2: number | null
          area_privada: number | null
          banos: number | null
          created_at: string | null
          depositos: number | null
          estado: string | null
          etapa_nombre: string | null
          fachada_id: string | null
          fachada_x: number | null
          fachada_y: number | null
          habitaciones: number | null
          id: string
          identificador: string
          lote: string | null
          notas: string | null
          orden: number | null
          orientacion: string | null
          parqueaderos: number | null
          piso: number | null
          planta_id: string | null
          planta_x: number | null
          planta_y: number | null
          precio: number | null
          proyecto_id: string | null
          tipologia_id: string | null
          torre_id: string | null
          vista: string | null
          vista_piso_id: string | null
        }
        Insert: {
          area_construida?: number | null
          area_lote?: number | null
          area_m2?: number | null
          area_privada?: number | null
          banos?: number | null
          created_at?: string | null
          depositos?: number | null
          estado?: string | null
          etapa_nombre?: string | null
          fachada_id?: string | null
          fachada_x?: number | null
          fachada_y?: number | null
          habitaciones?: number | null
          id?: string
          identificador: string
          lote?: string | null
          notas?: string | null
          orden?: number | null
          orientacion?: string | null
          parqueaderos?: number | null
          piso?: number | null
          planta_id?: string | null
          planta_x?: number | null
          planta_y?: number | null
          precio?: number | null
          proyecto_id?: string | null
          tipologia_id?: string | null
          torre_id?: string | null
          vista?: string | null
          vista_piso_id?: string | null
        }
        Update: {
          area_construida?: number | null
          area_lote?: number | null
          area_m2?: number | null
          area_privada?: number | null
          banos?: number | null
          created_at?: string | null
          depositos?: number | null
          estado?: string | null
          etapa_nombre?: string | null
          fachada_id?: string | null
          fachada_x?: number | null
          fachada_y?: number | null
          habitaciones?: number | null
          id?: string
          identificador?: string
          lote?: string | null
          notas?: string | null
          orden?: number | null
          orientacion?: string | null
          parqueaderos?: number | null
          piso?: number | null
          planta_id?: string | null
          planta_x?: number | null
          planta_y?: number | null
          precio?: number | null
          proyecto_id?: string | null
          tipologia_id?: string | null
          torre_id?: string | null
          vista?: string | null
          vista_piso_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_fachada_id_fkey"
            columns: ["fachada_id"]
            isOneToOne: false
            referencedRelation: "fachadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_planta_id_fkey"
            columns: ["planta_id"]
            isOneToOne: false
            referencedRelation: "fachadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_tipologia_id_fkey"
            columns: ["tipologia_id"]
            isOneToOne: false
            referencedRelation: "tipologias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_torre_id_fkey"
            columns: ["torre_id"]
            isOneToOne: false
            referencedRelation: "torres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_vista_piso_id_fkey"
            columns: ["vista_piso_id"]
            isOneToOne: false
            referencedRelation: "vistas_piso"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          max_collaborators: number
          max_projects: number
          max_units_per_project: number | null
          notes: string | null
          plan: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          max_collaborators?: number
          max_projects?: number
          max_units_per_project?: number | null
          notes?: string | null
          plan?: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          max_collaborators?: number
          max_projects?: number
          max_units_per_project?: number | null
          notes?: string | null
          plan?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          locale: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          locale?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          locale?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          duration: number | null
          id: string
          orden: number | null
          proyecto_id: string | null
          size_bytes: number | null
          stream_status: string | null
          stream_uid: string | null
          thumbnail_url: string | null
          titulo: string | null
          url: string
        }
        Insert: {
          duration?: number | null
          id?: string
          orden?: number | null
          proyecto_id?: string | null
          size_bytes?: number | null
          stream_status?: string | null
          stream_uid?: string | null
          thumbnail_url?: string | null
          titulo?: string | null
          url: string
        }
        Update: {
          duration?: number | null
          id?: string
          orden?: number | null
          proyecto_id?: string | null
          size_bytes?: number | null
          stream_status?: string | null
          stream_uid?: string | null
          thumbnail_url?: string | null
          titulo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      vistas_piso: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          imagen_url: string
          nombre: string
          orden: number | null
          orientacion: string | null
          piso_max: number | null
          piso_min: number | null
          proyecto_id: string
          thumbnail_url: string | null
          tipologia_ids: string[] | null
          torre_id: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url: string
          nombre: string
          orden?: number | null
          orientacion?: string | null
          piso_max?: number | null
          piso_min?: number | null
          proyecto_id: string
          thumbnail_url?: string | null
          tipologia_ids?: string[] | null
          torre_id?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string
          nombre?: string
          orden?: number | null
          orientacion?: string | null
          piso_max?: number | null
          piso_min?: number | null
          proyecto_id?: string
          thumbnail_url?: string | null
          tipologia_ids?: string[] | null
          torre_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vistas_piso_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vistas_piso_torre_id_fkey"
            columns: ["torre_id"]
            isOneToOne: false
            referencedRelation: "torres"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          delivered: boolean
          error: string | null
          event_type: string
          id: string
          payload: Json
          proyecto_id: string
          response_body: string | null
          status_code: number | null
          url: string
        }
        Insert: {
          created_at?: string | null
          delivered?: boolean
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          proyecto_id: string
          response_body?: string | null
          status_code?: number | null
          url: string
        }
        Update: {
          created_at?: string | null
          delivered?: boolean
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          proyecto_id?: string
          response_body?: string | null
          status_code?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_financial_summary: {
        Args: { p_from: string; p_proyecto_id: string; p_to: string }
        Returns: Json
      }
      analytics_summary: {
        Args: { p_from: string; p_proyecto_id: string; p_to: string }
        Returns: Json
      }
      analytics_views_over_time: {
        Args: {
          p_from: string
          p_granularity?: string
          p_proyecto_id: string
          p_to: string
        }
        Returns: {
          bucket: string
          views: number
          visitors: number
        }[]
      }
      appointments_summary: {
        Args: never
        Returns: {
          attendance_rate: number
          attended: number
          cancelled: number
          confirmed: number
          no_shows: number
          this_week: number
          total_appointments: number
        }[]
      }
      batch_reorder_galeria_imagenes: {
        Args: { p_updates: Json }
        Returns: undefined
      }
      batch_update_orden: {
        Args: { p_table_name: string; p_updates: Json }
        Returns: undefined
      }
      check_storage_quota: { Args: never; Returns: Json }
      cleanup_old_feature_blocked_emails: { Args: never; Returns: undefined }
      get_available_units_count: {
        Args: { p_proyecto_id: string }
        Returns: Json
      }
      get_leads_with_project: {
        Args: { p_limit?: number; p_offset?: number; p_proyecto_id?: string }
        Returns: {
          created_at: string
          email: string
          lead_id: string
          mensaje: string
          nombre: string
          pais: string
          proyecto_id: string
          proyecto_nombre: string
          status: string
          telefono: string
          tipologia_interes: string
          utm_campaign: string
          utm_medium: string
          utm_source: string
        }[]
      }
      get_proyecto_completo: { Args: { p_proyecto_id: string }; Returns: Json }
      get_unidades_by_proyecto: {
        Args: { p_estado?: string; p_proyecto_id: string }
        Returns: {
          area_m2: number
          banos: number
          estado: string
          habitaciones: number
          identificador: string
          piso: number
          precio: number
          tipologia_nombre: string
          torre_nombre: string
          unidad_id: string
        }[]
      }
      get_user_proyectos: {
        Args: { p_user_id?: string }
        Returns: {
          background_audio_url: string | null
          brochure_url: string | null
          color_fondo: string | null
          color_primario: string | null
          color_secundario: string | null
          constructora_logo_url: string | null
          constructora_nombre: string | null
          constructora_website: string | null
          cotizador_config: Json | null
          cotizador_enabled: boolean | null
          created_at: string | null
          custom_domain: string | null
          depositos_mode: string | null
          depositos_precio_base: number | null
          descripcion: string | null
          disclaimer: string | null
          domain_verified: boolean | null
          estado: string | null
          etapa_label: string | null
          fachada_url: string | null
          favicon_url: string | null
          hero_video_url: string | null
          hide_noddo_badge: boolean
          id: string
          idioma: string | null
          inventory_columns: Json | null
          inventory_columns_by_type: Json | null
          inventory_columns_microsite: Json | null
          inventory_columns_microsite_by_type: Json | null
          logo_height: number | null
          logo_url: string | null
          mapa_ubicacion_url: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          moneda_base: string | null
          nombre: string
          og_image_url: string | null
          parqueaderos_mode: string | null
          parqueaderos_precio_base: number | null
          politica_privacidad_url: string | null
          precio_source: string | null
          render_principal_url: string | null
          slug: string
          storage_limit_bytes: number | null
          storage_media_bytes: number | null
          storage_tours_bytes: number | null
          storage_videos_bytes: number | null
          subdomain: string | null
          tipo_proyecto: string
          tipologia_mode: string
          tour_360_url: string | null
          ubicacion_direccion: string | null
          ubicacion_lat: number | null
          ubicacion_lng: number | null
          unidad_medida_base: string | null
          updated_at: string | null
          user_id: string | null
          webhook_config: Json | null
          whatsapp_numero: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "proyectos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_storage_limit_bytes: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_total_storage_bytes: {
        Args: { p_user_id: string }
        Returns: number
      }
      increment_storage_media_bytes: {
        Args: { p_bytes: number; p_id: string }
        Returns: undefined
      }
      is_project_authorized: {
        Args: { project_user_id: string }
        Returns: boolean
      }
      platform_analytics_summary: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      platform_leads_over_time: {
        Args: { p_from: string; p_granularity?: string; p_to: string }
        Returns: {
          bucket: string
          count: number
        }[]
      }
      platform_projects_over_time: {
        Args: { p_from: string; p_granularity?: string; p_to: string }
        Returns: {
          bucket: string
          count: number
        }[]
      }
      platform_users_over_time: {
        Args: { p_from: string; p_granularity?: string; p_to: string }
        Returns: {
          bucket: string
          count: number
        }[]
      }
      platform_views_over_time: {
        Args: { p_from: string; p_granularity?: string; p_to: string }
        Returns: {
          bucket: string
          views: number
          visitors: number
        }[]
      }
      public_can_read_galeria_imagen: {
        Args: { p_imagen_id: string }
        Returns: boolean
      }
      should_send_feature_blocked_email: {
        Args: { p_feature: string; p_throttle_days?: number; p_user_id: string }
        Returns: boolean
      }
      user_can_upload: { Args: never; Returns: boolean }
      user_owns_galeria_imagen: {
        Args: { p_imagen_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
