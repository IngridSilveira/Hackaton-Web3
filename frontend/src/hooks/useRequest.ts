import { useState } from "react";


export const RequestState = {
    LOADDING: 0,
    SUCESS: 1,
    ERROR: 2,
} as const;

type StateType = (typeof RequestState)[keyof typeof RequestState]



export function useRequest<T>(callback: () => Promise<[T | null, Error | null]>) {

    const [data, setData] = useState<T | null>(null);
    const [state, setState] = useState<StateType>(RequestState.LOADDING);
    const [error, setError] = useState<Error | null>(null);


    const fetchData = async () => {
        setState(RequestState.LOADDING);

        const [tx, err] = await callback();

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
