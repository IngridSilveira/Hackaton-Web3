
import { createBrowserRouter } from 'react-router-dom';


import { Home } from './pages/home';
import { SignUp } from './pages/signUp';
import { GovernancePage } from './pages/governance';
import { Donate } from './pages/donate';


export const routes = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/sign-up',
        element: <SignUp />
    },
    {
        path: '/governance',
        element: <GovernancePage />
    },
    {
        path: '/campanha',
        element: <Donate />
    }
]);
