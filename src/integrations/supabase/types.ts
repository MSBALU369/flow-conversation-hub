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
      call_history: {
        Row: {
          created_at: string
          duration: number
          id: string
          partner_name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number
          id?: string
          partner_name?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          partner_name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          caller_id: string
          created_at: string
          duration_sec: number
          ended_at: string | null
          id: string
          receiver_id: string | null
          status: string
        }
        Insert: {
          caller_id: string
          created_at?: string
          duration_sec?: number
          ended_at?: string | null
          id?: string
          receiver_id?: string | null
          status?: string
        }
        Update: {
          caller_id?: string
          created_at?: string
          duration_sec?: number
          ended_at?: string | null
          id?: string
          receiver_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string
          deleted_for: string[] | null
          deleted_for_everyone: boolean | null
          edited_at: string | null
          id: string
          is_read: boolean
          media_url: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_for?: string[] | null
          deleted_for_everyone?: boolean | null
          edited_at?: string | null
          id?: string
          is_read?: boolean
          media_url?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_for?: string[] | null
          deleted_for_everyone?: boolean | null
          edited_at?: string | null
          id?: string
          is_read?: boolean
          media_url?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          energy_deducted: boolean | null
          id: string
          started_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          energy_deducted?: boolean | null
          id?: string
          started_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          energy_deducted?: boolean | null
          id?: string
          started_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          created_at: string
          gender_preference: string | null
          id: string
          level_preference: string | null
          matched_with: string | null
          room_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gender_preference?: string | null
          id?: string
          level_preference?: string | null
          matched_with?: string | null
          room_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gender_preference?: string | null
          id?: string
          level_preference?: string | null
          matched_with?: string | null
          room_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      muted_users: {
        Row: {
          created_at: string
          id: string
          muted_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muted_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muted_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          from_user_id: string | null
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          duration: Database["public"]["Enums"]["plan_duration"]
          id: string
          price: number
          region: Database["public"]["Enums"]["region_tier"]
        }
        Insert: {
          created_at?: string
          currency?: string
          duration: Database["public"]["Enums"]["plan_duration"]
          id?: string
          price: number
          region: Database["public"]["Enums"]["region_tier"]
        }
        Update: {
          created_at?: string
          currency?: string
          duration?: Database["public"]["Enums"]["plan_duration"]
          id?: string
          price?: number
          region?: Database["public"]["Enums"]["region_tier"]
        }
        Relationships: []
      }
      premium_content: {
        Row: {
          author: string
          category: string
          created_at: string
          id: string
          title: string
          type: string
          url: string
        }
        Insert: {
          author: string
          category?: string
          created_at?: string
          id?: string
          title: string
          type?: string
          url: string
        }
        Update: {
          author?: string
          category?: string
          created_at?: string
          id?: string
          title?: string
          type?: string
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: string[] | null
          battery_bars: number | null
          coins: number | null
          country: string | null
          created_at: string
          description: string | null
          early_end_count: number | null
          email: string | null
          energy_bars: number | null
          followers_count: number | null
          following_count: number | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          gender_locked: boolean | null
          id: string
          is_banned: boolean | null
          is_online: boolean | null
          is_premium: boolean | null
          last_avatar_change: string | null
          last_location_change: string | null
          last_refill_time: string | null
          last_username_change: string | null
          level: number | null
          location_city: string | null
          premium_expires_at: string | null
          referred_by: string | null
          region: string | null
          reports_count: number | null
          streak_count: number | null
          unique_id: string | null
          username: string | null
          wrong_gender_reports: number | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[] | null
          battery_bars?: number | null
          coins?: number | null
          country?: string | null
          created_at?: string
          description?: string | null
          early_end_count?: number | null
          email?: string | null
          energy_bars?: number | null
          followers_count?: number | null
          following_count?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gender_locked?: boolean | null
          id: string
          is_banned?: boolean | null
          is_online?: boolean | null
          is_premium?: boolean | null
          last_avatar_change?: string | null
          last_location_change?: string | null
          last_refill_time?: string | null
          last_username_change?: string | null
          level?: number | null
          location_city?: string | null
          premium_expires_at?: string | null
          referred_by?: string | null
          region?: string | null
          reports_count?: number | null
          streak_count?: number | null
          unique_id?: string | null
          username?: string | null
          wrong_gender_reports?: number | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          badges?: string[] | null
          battery_bars?: number | null
          coins?: number | null
          country?: string | null
          created_at?: string
          description?: string | null
          early_end_count?: number | null
          email?: string | null
          energy_bars?: number | null
          followers_count?: number | null
          following_count?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          gender_locked?: boolean | null
          id?: string
          is_banned?: boolean | null
          is_online?: boolean | null
          is_premium?: boolean | null
          last_avatar_change?: string | null
          last_location_change?: string | null
          last_refill_time?: string | null
          last_username_change?: string | null
          level?: number | null
          location_city?: string | null
          premium_expires_at?: string | null
          referred_by?: string | null
          region?: string | null
          reports_count?: number | null
          streak_count?: number | null
          unique_id?: string | null
          username?: string | null
          wrong_gender_reports?: number | null
          xp?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          coins_awarded: boolean | null
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          coins_awarded?: boolean | null
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          coins_awarded?: boolean | null
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          host_id: string
          id: string
          is_private: boolean
          language: string
          max_members: number
          room_code: string
          title: string
        }
        Insert: {
          created_at?: string
          host_id: string
          id?: string
          is_private?: boolean
          language?: string
          max_members?: number
          room_code: string
          title: string
        }
        Update: {
          created_at?: string
          host_id?: string
          id?: string
          is_private?: boolean
          language?: string
          max_members?: number
          room_code?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_likes: {
        Row: {
          created_at: string
          id: string
          talent_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          talent_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          talent_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_likes_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_permissions: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          talent_owner_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          talent_owner_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          talent_owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_permissions_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_permissions_talent_owner_id_fkey"
            columns: ["talent_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_uploads: {
        Row: {
          audio_url: string
          created_at: string
          description: string | null
          duration_sec: number | null
          id: string
          is_private: boolean
          language: string
          likes_count: number
          plays_count: number
          title: string | null
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          description?: string | null
          duration_sec?: number | null
          id?: string
          is_private?: boolean
          language?: string
          likes_count?: number
          plays_count?: number
          title?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          description?: string | null
          duration_sec?: number | null
          id?: string
          is_private?: boolean
          language?: string
          likes_count?: number
          plays_count?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      check_premium_expiration: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_reference_id: { Args: { ref_id: string }; Returns: boolean }
      find_match: { Args: { p_user_id: string }; Returns: Json }
      get_my_role: { Args: never; Returns: string }
      get_public_profile_columns: {
        Args: never
        Returns: {
          avatar_url: string
          badges: string[]
          country: string
          created_at: string
          description: string
          followers_count: number
          following_count: number
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          is_online: boolean
          is_premium: boolean
          level: number
          location_city: string
          region: string
          streak_count: number
          unique_id: string
          username: string
          xp: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_matchmaking: {
        Args: {
          p_gender_pref?: string
          p_level_pref?: string
          p_user_id: string
        }
        Returns: undefined
      }
      leave_matchmaking: { Args: { p_user_id: string }; Returns: undefined }
      sync_test_role: { Args: never; Returns: Json }
      transfer_coins: {
        Args: { p_amount: number; p_receiver_id: string; p_sender_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "root"
        | "master"
        | "node"
        | "test"
      gender_type: "male" | "female" | "unknown"
      plan_duration: "1_day" | "1_week" | "1_month" | "6_month" | "1_year"
      region_tier: "INDIA" | "GULF_RICH" | "WEST_TIER2" | "POOR_TIER4"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "root",
        "master",
        "node",
        "test",
      ],
      gender_type: ["male", "female", "unknown"],
      plan_duration: ["1_day", "1_week", "1_month", "6_month", "1_year"],
      region_tier: ["INDIA", "GULF_RICH", "WEST_TIER2", "POOR_TIER4"],
    },
  },
} as const
