import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loading from "../student/Loading";


const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white">
            <Loading />
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading course...</p>
        </div>);

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Render children if logged in
    return <Outlet />;
};

export default ProtectedRoute;
