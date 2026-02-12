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
      characteristics: {
        Row: {
          active: boolean
          created_at: string
          device_image_path: string | null
          drawing_image_path: string | null
          id: string
          limit_max: number
          limit_min: number
          name: string
          nominal: number
          product_id: string
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          device_image_path?: string | null
          drawing_image_path?: string | null
          id?: string
          limit_max?: number
          limit_min?: number
          name: string
          nominal?: number
          product_id: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          device_image_path?: string | null
          drawing_image_path?: string | null
          id?: string
          limit_max?: number
          limit_min?: number
          name?: string
          nominal?: number
          product_id?: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characteristics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      lines: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          active: boolean
          created_at: string
          id: string
          line_id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          line_id: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          line_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "lines"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_cycles: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          line_id: string
          machine_id: string
          operator_badge: string
          overall_result: string | null
          product_id: string
          started_at: string
          status: string
          txt_path: string | null
          user_id: string
          week_cast: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          line_id: string
          machine_id: string
          operator_badge: string
          overall_result?: string | null
          product_id: string
          started_at?: string
          status?: string
          txt_path?: string | null
          user_id: string
          week_cast: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          line_id?: string
          machine_id?: string
          operator_badge?: string
          overall_result?: string | null
          product_id?: string
          started_at?: string
          status?: string
          txt_path?: string | null
          user_id?: string
          week_cast?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_cycles_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_cycles_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_cycles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          characteristic_id: string
          cycle_id: string
          deviation: number | null
          id: string
          measured_value: number | null
          updated_at: string
          updated_by: string | null
          within_limits: boolean | null
        }
        Insert: {
          characteristic_id: string
          cycle_id: string
          deviation?: number | null
          id?: string
          measured_value?: number | null
          updated_at?: string
          updated_by?: string | null
          within_limits?: boolean | null
        }
        Update: {
          characteristic_id?: string
          cycle_id?: string
          deviation?: number | null
          id?: string
          measured_value?: number | null
          updated_at?: string
          updated_by?: string | null
          within_limits?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_characteristic_id_fkey"
            columns: ["characteristic_id"]
            isOneToOne: false
            referencedRelation: "characteristics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "measurement_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          cav: string
          created_at: string
          formatted_name: string | null
          id: string
          ks: string
          maq: string
          pb: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cav: string
          created_at?: string
          formatted_name?: string | null
          id?: string
          ks: string
          maq: string
          pb: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cav?: string
          created_at?: string
          formatted_name?: string | null
          id?: string
          ks?: string
          maq?: string
          pb?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operador"
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
      app_role: ["admin", "operador"],
    },
  },
} as const
