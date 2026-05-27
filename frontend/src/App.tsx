import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';


import { ModalConnect } from './components/modalConnect';

import { routes } from './routes';
import { useWalletStore } from './stores/useWalletStore';



export default function App() {

    const connected = useWalletStore(state => state.connected);


    return (
        <div className="w-screen min-h-screen">
            <Toaster />
            <ModalConnect />

            {/* 
              * As rotas so seram montadas depois da conexão com a 
              * carteira terminar.
              */}
            { connected ? <RouterProvider router={routes} /> : null}
        </div>
    );
} 
