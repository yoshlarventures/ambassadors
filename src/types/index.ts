// User roles
export type UserRole = 'admin' | 'regional_leader' | 'ambassador' | 'member';

// Status enums
export type EventStatus = 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled';
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// Database types
export interface Region {
  id: string;
  name: string;
  name_uz: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  region_id: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  region_id: string;
  address: string | null;
  social_links: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface ClubAmbassador {
  id: string;
  club_id: string;
  ambassador_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  status: MemberStatus;
  joined_at: string | null;
  approval_screenshot_url: string | null;
  approval_notes: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface ClubGallery {
  id: string;
  club_id: string;
  image_url: string;
  caption: string | null;
  session_id: string | null;
  event_id: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  organizer_id: string;
  region_id: string;
  club_id: string | null;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  max_attendees: number | null;
  status: EventStatus;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  confirmed_attendees: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventCollaborator {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
}

export interface EventPhoto {
  id: string;
  event_id: string;
  image_url: string;
  created_at: string;
}

export interface EventLog {
  id: string;
  event_id: string;
  action: 'created' | 'approved' | 'rejected' | 'cancelled' | 'confirmed' | 'edited';
  actor_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Session {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  is_confirmed: boolean;
  notes: string | null;
  attendance_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface SessionAttendance {
  id: string;
  session_id: string;
  member_id: string;
  attended: boolean;
  notes: string | null;
  created_at: string;
}

// Snapshot types for static report data
export interface SessionSnapshot {
  id: string;
  title: string;
  session_date: string;
  attendance_count: number;
  attendance_rate: number | null;
}

export interface EventSnapshot {
  id: string;
  title: string;
  event_date: string;
  location: string;
  confirmed_attendees: number | null;
}

export interface MemberSnapshot {
  id: string;
  user_name: string;
  user_email: string;
  joined_at: string | null;
}

export interface PointSnapshot {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface Report {
  id: string;
  ambassador_id: string;
  club_id: string;
  month: number;
  year: number;
  sessions_count: number;
  total_attendance: number;
  events_count: number;
  events_attendance: number;
  new_members_count: number;
  points_earned: number;
  attendance_rate: number | null;
  session_ids: string[] | null;
  event_ids: string[] | null;
  member_ids: string[] | null;
  point_ids: string[] | null;
  sessions_data: SessionSnapshot[] | null;
  events_data: EventSnapshot[] | null;
  members_data: MemberSnapshot[] | null;
  points_data: PointSnapshot[] | null;
  highlights: string | null;
  challenges: string | null;
  goals: string | null;
  status: ReportStatus;
  reviewer_id: string | null;
  review_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Points {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  points_required: number | null;
  condition_type: string;
  condition_value: number | null;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  points: number;
  deadline: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  proof_url: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  file_url: string | null;
  category_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Extended types with relations
export interface ClubWithRelations extends Club {
  ambassadors?: (ClubAmbassador & { ambassador?: User })[];
  region?: Region;
  members_count?: number;
}

export interface EventWithRelations extends Event {
  organizer?: User;
  region?: Region;
  club?: Club;
  collaborators?: User[];
  registrations_count?: number;
}

export interface SessionWithRelations extends Session {
  club?: Club;
  attendance?: SessionAttendance[];
}
