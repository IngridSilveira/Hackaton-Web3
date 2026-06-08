import { create } from "zustand";

import type { UserType } from '../types/user';


interface UserStore extends UserType {
    isLoadding: boolean;
    setUser: (user: UserType) => void;
    setIsLoadding: (isLoadding: boolean) => void;
}


export const useUserStore = create<UserStore>((set) => ({
    username: '',
    userType: -1,
    isLoadding: false,

    setUser: (user: UserType) => set({ username: user.username, userType: user.userType }),
    setIsLoadding: (isLoadding: boolean) => set({ isLoadding }),
}));
