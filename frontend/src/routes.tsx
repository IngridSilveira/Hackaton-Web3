
import { createBrowserRouter } from 'react-router-dom';


import { Home } from './pages/home';
import { SignUp } from './pages/signUp';
import { Donate } from './pages/donate';
import GovernancePage from './pages/governance';


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
        path: '/campanha',
        element: <Donate />
    },
        {
        path: '/governance',
        element: <GovernancePage />
    },
]);
