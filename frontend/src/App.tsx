
import { SignUp } from "./pages/SignUp";


import { ModalConnectWallet } from "./components/modal";



export default function App() {



    return (
        <div className="w-screen min-h-screen">
            <ModalConnectWallet />
            <SignUp />
        </div>
    );
} 
