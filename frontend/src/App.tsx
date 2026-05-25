import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';


import { ModalConnect } from './components/modalConnect';

import { routes } from './routes';



export default function App() {

    return (
        <div className="w-screen min-h-screen">
            <Toaster />
            <ModalConnect />

            <RouterProvider router={routes} />
        </div>
    );
} 
