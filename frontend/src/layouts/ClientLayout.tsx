import { Outlet } from 'react-router-dom';import Header from '../components/Header.tsx';import CartToast from '../components/CartToast.tsx';
export default function ClientLayout(){return <><Header/><main className="page"><Outlet/></main><CartToast/></>}
