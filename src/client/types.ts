export interface User {
  id: string;
  name: string;
  email: string;
}
export interface GroupSummary {
  id: string;
  name: string;
  city: string;
  description: string;
  teamCount: number;
  _count: { members: number; matches: number };
}
export interface MatchSummary {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  location: string;
  maxPlayers: number;
  minPlayers: number;
  priceCents: number;
  status: string;
  _count?: { presences: number };
}
export interface Group extends GroupSummary {
  inviteToken?: string;
  myRole: string;
  members: { user: { id: string; name: string }; role: string }[];
  matches: MatchSummary[];
}
export interface Presence {
  id: string;
  userId: string | null;
  guestName: string | null;
  user: { name: string } | null;
}
export interface Match extends MatchSummary {
  presenceToken: string;
  notes: string;
  presences: Presence[];
  teams: { id: string; name: string; players: { presence: Presence }[] }[];
}
export interface PublicMatch {
  title: string;
  groupName: string;
  scheduledAt: string;
  location: string;
  priceCents: number;
  maxPlayers: number;
  status: string;
  presences: { id: string; name: string }[];
  teams: { name: string; players: string[] }[];
}
