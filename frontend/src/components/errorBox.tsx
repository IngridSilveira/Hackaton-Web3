import { AlertCircle } from 'lucide-react'
import type React from 'react';


interface ErrorBoxProps {
    message: string;
    children?: React.ReactNode;
}

export function ErrorBox({ message, children }: ErrorBoxProps) {

    return (
        <div className="w-full border-2 border-red-400 bg-red-200 p-5 rounded-2xl my-5">
            <div className="flex items-center gap-4">
                <AlertCircle />
                <p className="font-bold text-base">{ message }</p>
            </div>

            { children }
        </div>
    );

}
