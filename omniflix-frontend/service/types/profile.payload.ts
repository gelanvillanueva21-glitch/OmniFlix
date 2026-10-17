
export type EntertainmentType =
    | "COMIC"
    | "MANGA"
    | "MANHWA"
    | "MANHUA"
    | "NOVEL"
    | "SERIES"
    | "MOVIE";


export type EntertainmentListType =
    | "FAVORITE"
    | "WATCHLIST"
    | "COMPLETED"
    | "ON_HOLD"
    | "PLAN_TO_WATCH"
    | "PLAN_TO_READ"
    | "DROPPED";


export interface ProfileResponse {
    id: number;
    displayName: string | null;
    profilePicture: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface UserEntertainmentItem {
    externalId: string;
    apiSource: string;
    purpose: EntertainmentListType;
    entertainmentType: EntertainmentType;
    createdAt: string;
}

export interface UserEntertainmentList {
    purpose: EntertainmentListType;
    items: UserEntertainmentItem[];
}

export interface UserHistoryItem {
  externalId: number;
  apiSource: string;
  type: EntertainmentType
  hasRead: boolean;
  hasWatch: boolean;
  createdAt: string
}


export interface UserSearch {
  title?: string;
  genre?: string;
  type: EntertainmentType;
  isGlobal: boolean;
  createdAt: string;
}

