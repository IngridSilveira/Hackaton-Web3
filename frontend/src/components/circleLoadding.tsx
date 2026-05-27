
interface CircleLoaddingProps {
    description: string;
}


export function CircleLoadding({ description }: CircleLoaddingProps) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-5 border-t-primary animate-spin">
            </div>
            
            <p className="font-normal">
                { description }
            </p>
        </div>
    );
}
