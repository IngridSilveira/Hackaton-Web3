import type React from 'react';
import { CircleCheckBig } from 'lucide-react'


interface SuccessBoxProps {
    message: string;
    children?: React.ReactNode;
}

export function SuccessBox({ message, children }: SuccessBoxProps) {

    return (
        <div className="w-full border-2 border-green-400 bg-green-200 p-5 rounded-2xl my-5">
            <div className="flex items-center gap-4">
                <CircleCheckBig />
                <p className="font-bold text-base">{ message }</p>
            </div>

            { children }
        </div>
    );

}
