import { create } from 'zustand';


interface User {
    username: string;
    userType: number;
    isLoadding: boolean;
}

interface StoreType extends User {
    setUser: (user: User) => void;
    setIsLoadding: (isLoadding: boolean) => void;
}


export const useUserStore = create<StoreType>((set) => ({
    username: '',
    userType: 0,
    isLoadding: false,

    setUser: (user: User) => set({ username: user.username, userType: user.userType }),
    setIsLoadding: (isLoadding: boolean) => set((state) => ({ ...state, isLoadding }) ),
}));
