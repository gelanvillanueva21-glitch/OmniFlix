
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
    | "READLIST"
    | "COMPLETED"
    | "ON_HOLD"
    | "DROPPED";


export interface ProfileResponse {
    id: number;
    userId: number;
    displayName: string | null;
    profileUrlPicture: string | null;
    createdAt: string;
    updateAt: string | null;
}

export interface UserEntertainmentItem {
    id: number;
    profileId: number;
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
    id: number;
    externalId: string;
    apiSource: string;
    type: EntertainmentType;
    hasRead: boolean;
    hasWatch: boolean;
    createdAt: string;
}


export interface UserSearch {
    id: number;
    title: string | null;
    genre: string | null;
    type: EntertainmentType;
    isGlobal: boolean;
    createdAt: string;
}

