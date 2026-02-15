import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: number;
    userId: string;
    name: string;
    role: string;
    teamId?: number;
}

interface UserState {
    token: string | null;
    user: User | null;
    lastUserId: string | null;
    setToken: (token: string) => void;
    setUser: (user: User) => void;
    login: (token: string, user: User) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            lastUserId: null,
            setToken: (token) => set({ token }),
            setUser: (user) => set({ user }),
            login: (token, user) =>
                set({
                    token,
                    user,
                    lastUserId: user.userId,
                }),
            logout: () => set({ token: null, user: null, lastUserId: null }),
        }),
        {
            name: 'owms-user-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
