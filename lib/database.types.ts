export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          email: string | null;
          name: string;
          date_of_birth: string;
          gender: 'man' | 'woman' | 'non_binary';
          looking_for: 'men' | 'women' | 'everyone';
          city: string;
          state: string;
          bio: string | null;
          occupation: string | null;
          education: string | null;
          income_range: string | null;
          religion: string | null;
          caste: string | null;
          mother_tongue: string | null;
          height_cm: number | null;
          smoking: string | null;
          drinking: string | null;
          children: string | null;
          relationship_goal: string;
          want_children: string | null;
          meeting_timeline: string | null;
          interests: string[];
          prompt_1_question: string | null;
          prompt_1_answer: string | null;
          prompt_2_question: string | null;
          prompt_2_answer: string | null;
          personality_answers: Json;
          trust_score: number;
          phone_verified: boolean;
          aadhaar_verified: boolean;
          selfie_verified: boolean;
          is_premium: boolean;
          premium_tier: string | null;
          premium_expires_at: string | null;
          profile_complete_pct: number;
          is_discoverable: boolean;
          allow_messages_from_strangers: boolean;
          is_suspended: boolean;
          suspension_reason: string | null;
          suspension_expires_at: string | null;
          strike_count: number;
          is_admin: boolean;
          onboarding_step: number;
          onboarding_complete: boolean;
          last_active_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']> & {
          phone: string;
          name: string;
          date_of_birth: string;
          gender: 'man' | 'woman' | 'non_binary';
          looking_for: 'men' | 'women' | 'everyone';
        };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      photos: {
        Row: {
          id: string;
          user_id: string;
          storage_url: string;
          cloudinary_id: string | null;
          is_primary: boolean;
          ai_approved: boolean;
          ai_rejection_reason: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['photos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['photos']['Row']>;
      };
      verifications: {
        Row: {
          id: string;
          user_id: string;
          verification_type: 'phone' | 'aadhaar' | 'selfie';
          status: 'pending' | 'approved' | 'failed' | 'expired';
          provider: string | null;
          provider_reference_id: string | null;
          failure_reason: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['verifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['verifications']['Row']>;
      };
      likes: {
        Row: {
          id: string;
          liker_id: string;
          liked_id: string;
          is_super_like: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['likes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['likes']['Row']>;
      };
      matches: {
        Row: {
          id: string;
          user_1_id: string;
          user_2_id: string;
          compatibility_score: number | null;
          compatibility_explanation: string | null;
          icebreakers: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['matches']['Row']>;
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string | null;
          message_type: string;
          media_url: string | null;
          is_read: boolean;
          is_blocked: boolean;
          block_reason: string | null;
          toxicity_score: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Row']>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          details: string | null;
          evidence_urls: string[];
          status: string;
          moderator_id: string | null;
          action_taken: string | null;
          moderator_note: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reports']['Row']>;
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blocks']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['blocks']['Row']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'basic' | 'standard' | 'trust';
          billing_period: 'weekly' | 'monthly';
          amount_paise: number;
          razorpay_subscription_id: string | null;
          razorpay_payment_id: string | null;
          status: 'active' | 'cancelled' | 'expired' | 'failed';
          starts_at: string;
          expires_at: string;
          auto_renew: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>;
      };
      boosts: {
        Row: {
          id: string;
          user_id: string;
          activated_at: string;
          expires_at: string;
        };
        Insert: Omit<Database['public']['Tables']['boosts']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['boosts']['Row']>;
      };
      otp_codes: {
        Row: {
          id: string;
          phone: string;
          code: string;
          otp_id: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['otp_codes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['otp_codes']['Row']>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          refresh_token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sessions']['Row']>;
      };
      transparency_reports: {
        Row: {
          id: string;
          report_month: string;
          total_messages_scanned: number;
          fake_profiles_removed: number;
          scam_accounts_banned: number;
          harassment_warnings: number;
          reports_assisted_law: number;
          avg_resolution_hours: number | null;
          new_users: number;
          aadhaar_verified_count: number;
          published_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transparency_reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transparency_reports']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
