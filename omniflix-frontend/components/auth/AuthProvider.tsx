"use client";

import {
    createContext,
    useContext,
    type ReactNode,
} from "react";

import {
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    getCurrentUser,
    logout as logoutRequest,
} from "@/service/user.service";

import type { UserResponse } from "@/service/types/auth.payload";

interface AuthContextType {
    user: UserResponse | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const {
        data: user = null,
        isLoading,
    } = useQuery({
        queryKey: ["currentUser"],
        queryFn: getCurrentUser,
        retry: false,
    });

    async function refreshUser() {
        await queryClient.invalidateQueries({
            queryKey: ["currentUser"],
        });
    }

    async function handleLogout() {
        await logoutRequest();

        queryClient.setQueryData(["currentUser"], null);
        queryClient.removeQueries({
            predicate: (query) => query.queryKey[0] === "profile",
        });
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: user !== null,
                refreshUser,
                logout: handleLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
