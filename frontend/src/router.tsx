import { createBrowserRouter } from 'react-router-dom';

import { Home } from './pages/Home';
import { SignUp } from './pages/SignUp';

import { useWalletStore } from './stores/useWalletStore';


function authGuard() {
    const isConnectedWallet = useWalletStore((state) => state.connected);

    /**
     * Se a carteira do usuário já estiver conectadas. Vamos
     * pegar suas informações na blockchain.
     */
    if (!isConnectedWallet) {

    }

    return true;
}


export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
        loader: authGuard,
    },
    {
        path: '/sign-up',
        element: <SignUp />,
    },
]);
