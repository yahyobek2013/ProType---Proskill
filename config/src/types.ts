export type Role = 'user' | 'admin';

export interface User {
  id: string;
  login: string;
  ism: string;
  familiya: string;
  avatar?: string;
  role: Role;
  created_at: string;
  wpm_max: number;
  accuracy_avg: number;
  tests_completed: number;
  badges?: string[];
  total_words_typed?: number;
  rating?: number;
}

export interface OnlineUser {
  id: string;
  login: string;
  ism: string;
  familiya: string;
  avatar?: string;
  rating: number;
  status: 'Online' | 'In Battle' | 'Offline';
  isOnline: boolean;
}

export interface BattlePlayerState {
  wpm: number;
  accuracy: number;
  progress: number;
  errors: number;
  timeSec: number;
  netWpm: number;
  finished: boolean;
  charCount?: number;
  combo?: number;
}

export interface OnlineBattleRoom {
  id: string;
  inviterId: string;
  inviterName: string;
  inviterAvatar?: string;
  inviterRating: number;
  inviterReady: boolean;
  inviterState: BattlePlayerState;

  inviteeId: string;
  inviteeName: string;
  inviteeAvatar?: string;
  inviteeRating: number;
  inviteeReady: boolean;
  inviteeState: BattlePlayerState;

  status: 'pending' | 'waiting' | 'countdown' | 'racing' | 'finished' | 'declined' | 'cancelled';
  text: string;
  textId?: string;
  duration: number; // fixed 30s
  startTime?: number;
  winnerId?: string | 'tie';
  winnerReason?: string;
  ratingChanges?: Record<string, number>;
  createdAt: number;
}

export type TestMode = 'practice' | 'battle' | 'competition';

export interface TestResult {
  id: string;
  user_id: string;
  user_name: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  errors: number;
  test_type: TestMode;
  date: string;
  text_title?: string;
}

export interface SpeedHistorySample {
  second: number;
  wpm: number;
  netWpm: number;
  accuracy: number;
}

export interface MistakeDetailItem {
  expectedChar: string;
  typedChar: string;
  count: number;
  percentage: number;
}

export interface CompetitionParticipant {
  user_id: string;
  user_name: string;
  avatar?: string;
  wpm: number;
  net_wpm?: number;
  accuracy: number;
  cpm?: number;
  errors?: number;
  correct_chars?: number;
  incorrect_chars?: number;
  total_chars_typed?: number;
  total_words_typed?: number;
  completed_percentage?: number;
  completion_time?: number;
  duration?: number;
  remaining_time?: number;
  rating_points?: number;
  total_participants?: number;
  speed_history?: SpeedHistorySample[];
  mistake_keyboard_heatmap?: Record<string, number>;
  mistake_details?: MistakeDetailItem[];
  score: number;
  rank?: number;
  joined_at: string;
}

export interface CompetitionTextItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  language?: string;
}

export type CertificatePolicy = 'none' | 'winner_only' | 'top_3' | 'all_participants';

export interface Competition {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'upcoming' | 'finished';
  text: string;
  duration: number; // 15, 30, 60, 120, 300 seconds
  selected_text_ids?: string[];
  texts_pool?: CompetitionTextItem[];
  reward_points: number;
  certificate_policy?: CertificatePolicy;
  participants: CompetitionParticipant[];
  created_by?: string;
}

export interface SystemStats {
  total_users: number;
  total_tests: number;
  avg_wpm: number;
  active_competitions: number;
  top_typist: {
    name: string;
    wpm: number;
  };
}

export type ActiveTab =
  | 'home'
  | 'mashq'
  | 'jang'
  | 'musobaqalar'
  | 'statistika'
  | 'reyting'
  | 'profil'
  | 'admin';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  soundType: 'mechanical' | 'soft' | 'click';
}

export type TextCategory =
  | 'mashq'
  | 'jang'
  | 'musobaqalar'
  | 'bosh_sahifa'
  | 'profil'
  | 'sertifikat'
  | 'tugmalar'
  | 'xabarlar'
  | 'barchasi';

export type TextLanguage = 'uz' | 'en' | 'ru';

export interface SystemText {
  id: string;
  title: string;
  content: string;
  category: TextCategory;
  language: TextLanguage;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
