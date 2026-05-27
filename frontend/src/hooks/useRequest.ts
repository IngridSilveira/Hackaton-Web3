import { useState } from "react";


export const RequestState = {
    NONE: 0,
    LOADDING: 1,
    SUCESS: 2,
    ERROR: 3,
} as const;

type StateType = (typeof RequestState)[keyof typeof RequestState]



export function useRequest<T>(callback: (...params: any) => Promise<[T | null, Error | null]>) {

    const [data, setData] = useState<T | null>(null);
    const [state, setState] = useState<StateType>(RequestState.NONE);
    const [error, setError] = useState<Error | null>(null);


    const fetchData = async (...params: any) => {
        setState(RequestState.LOADDING);
        setError(null);

        const [tx, err] = await callback(...params);

        if (err) {
            setState(RequestState.ERROR);
            setError(err);
            return;
        }

        setState(RequestState.SUCESS);
        setData(tx);
    }


    return {
        data, 
        state,
        error,
        fetchData,
    }
}
