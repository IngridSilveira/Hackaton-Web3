import { createBrowserRouter } from 'react-router-dom';

import { Home } from './pages/home';
import { SignUp } from './pages/signUp';



export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/sign-up',
        element: <SignUp />,
    },
]);
