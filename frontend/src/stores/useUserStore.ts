import { create } from "zustand";

import type { UserType } from '../types/user';


interface UserStore extends UserType {
    setUser: (user: UserType) => void;
}


export const useUserStore = create<UserStore>((set) => ({
    username: '',
    userType: 0,

    setUser: (user: UserType) => set({ username: user.username, userType: user.userType }),
}));
