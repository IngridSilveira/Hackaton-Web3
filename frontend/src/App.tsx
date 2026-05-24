import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';


import { ModalConnect } from './components/modalConnect';
import { ModalUser } from './components/modalUser';

import { router } from './router';


export default function App() {

    return (
        <div className="w-screen min-h-screen">
            <Toaster />

            <ModalConnect />
            <ModalUser />
            
            <RouterProvider router={router} />
        </div>
    );
} 
