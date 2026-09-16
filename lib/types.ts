export type UserRole = "OWNER" | "TRAINER" | "MEMBER";
export type MemberType = "NORMAL" | "PT";
export type MemberStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "FROZEN";
export type MembershipStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type PaymentMethod = "CASH" | "UPI" | "RAZORPAY";
export type PaymentStatus = "PAID" | "PENDING" | "OVERDUE" | "FAILED";
export type AttendanceStatus = "PRESENT" | "ABSENT";
export type PtSessionStatus = "SCHEDULED" | "COMPLETED" | "MISSED" | "CANCELLED" | "RESCHEDULED";
export type PtPackageStatus = "ACTIVE" | "COMPLETED" | "EXPIRED";
export type ExerciseCategory = "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "LEGS" | "CORE" | "CARDIO";
export type DietGoal = "MUSCLE_GAIN" | "FAT_LOSS" | "MAINTENANCE";
export type NoteStatus = "OPEN" | "RESOLVED";

export interface Gym {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  gym_id: string;
  role: UserRole;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trainer {
  id: string;
  gym_id: string;
  profile_id: string;
  specialization?: string | null;
  bio?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Member {
  id: string;
  gym_id: string;
  profile_id: string;
  member_type: MemberType;
  assigned_trainer_id?: string | null;
  status: MemberStatus;
  membership_expiry?: string | null;
  emergency_contact?: string | null;
  medical_conditions?: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  assigned_trainer?: Trainer & { profile?: Profile };
}

export interface Membership {
  id: string;
  gym_id: string;
  member_id: string;
  plan_name: string;
  amount: number;
  start_date: string;
  expiry_date: string;
  status: MembershipStatus;
  created_at: string;
}

export interface PtPackage {
  id: string;
  gym_id: string;
  member_id: string;
  trainer_id: string;
  package_name: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  price: number;
  start_date: string;
  expiry_date: string;
  status: PtPackageStatus;
  created_at: string;
  trainer?: Trainer & { profile?: Profile };
  member?: Member & { profile?: Profile };
}

export interface PtSession {
  id: string;
  gym_id: string;
  package_id: string;
  member_id: string;
  trainer_id: string;
  session_number: number;
  session_date: string;
  session_time: string;
  status: PtSessionStatus;
  workout_notes?: string | null;
  trainer_notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  member?: Member & { profile?: Profile };
  trainer?: Trainer & { profile?: Profile };
}

export interface Attendance {
  id: string;
  gym_id: string;
  member_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string | null;
  created_at: string;
  member?: Member & { profile?: Profile };
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  membership_id?: string | null;
  pt_package_id?: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  due_date?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  created_at: string;
  member?: Member & { profile?: Profile };
}

export interface Exercise {
  id: string;
  gym_id?: string | null;
  name: string;
  category: ExerciseCategory;
  instructions?: string | null;
  video_url?: string | null;
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  gym_id: string;
  member_id: string;
  trainer_id?: string | null;
  title: string;
  days: {
    day: string;
    focus: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      rest: string;
      notes?: string;
      video_url?: string;
    }[];
  }[];
  is_pt_workout: boolean;
  status: "ACTIVE" | "ARCHIVED";
  created_at: string;
}

export interface DietPlan {
  id: string;
  gym_id: string;
  member_id: string;
  trainer_id?: string | null;
  goal: DietGoal;
  calories: number;
  protein_grams: number;
  meals: {
    name: string; // e.g., "Breakfast", "Lunch"
    time: string;
    items: string[];
  }[];
  status: "ACTIVE" | "ARCHIVED";
  created_at: string;
}

export interface ProgressRecord {
  id: string;
  gym_id: string;
  member_id: string;
  recorded_at: string;
  weight_kg?: number | null;
  chest_inches?: number | null;
  waist_inches?: number | null;
  arms_inches?: number | null;
  thighs_inches?: number | null;
  bench_press_kg?: number | null;
  squat_kg?: number | null;
  deadlift_kg?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  gym_id: string;
  member_id: string;
  photo_url: string;
  view_type: "FRONT" | "SIDE" | "BACK";
  taken_at: string;
  created_at: string;
}

export interface MemberNote {
  id: string;
  gym_id: string;
  member_id: string;
  trainer_id?: string | null;
  title: string;
  content: string;
  status: NoteStatus;
  created_at: string;
  updated_at: string;
  trainer?: Trainer & { profile?: Profile };
}
