import type { ethers } from "ethers";
import { useState } from "react";

import { SignUpContract } from "../contracts/SignUp";
import type { UserType } from "../types/user";



export const State = {
    LOADDING: 0,
    SUCESS: 1,
    ERROR: 2,
} as const;

type StateType = (typeof State)[keyof typeof State]


export function useUser() {
    const [state, setState] = useState<StateType>(State.LOADDING);
    const [error, setError] = useState<string>('');


    const getUserData = async (signer: ethers.Signer): Promise<UserType | null> => {
        setState(State.LOADDING);

        const signUpContract = new SignUpContract(signer);
        const address = await signer.getAddress();

        const [user, err] = await signUpContract.getUser(address);

        if (err) {
            setError(err.reason);
            setState(State.ERROR);

            return null;
        }
        
        setState(State.SUCESS);
        return user;
    }


    return {
        state,
        error,
        getUserData,
    }

}
