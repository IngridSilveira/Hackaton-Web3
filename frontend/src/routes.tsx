
import { createBrowserRouter } from 'react-router-dom';


import { Home } from './pages/Home';
import { SignUp } from './pages/SignUp';


export const routes = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/sign-up',
        element: <SignUp />
    }
]);
