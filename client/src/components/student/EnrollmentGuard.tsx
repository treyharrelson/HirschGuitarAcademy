import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../api/axiosInstance';
import Loading from '../student/Loading';

const EnrollmentGuard: React.FC = () => {
  const { courseId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      if (user && user.role !== 'student') {
        setIsEnrolled(true);
        return;
      }

      try {
        const res = await api.get('/api/courses/my-enrollments');
        const enrolled = res.data.some((e: any) => e.courseId === Number(courseId));
        setIsEnrolled(enrolled);
      } catch (err) {
        setIsEnrolled(false);
      }
    };

    if (!authLoading && courseId) {
      verifyAccess();
    }
  }, [courseId, user, authLoading]);

  if (authLoading || isEnrolled === null) return <Loading />;

  if (!isEnrolled) {
    return <Navigate to="/all-courses" replace />;
  }

  return <Outlet />;
};

export default EnrollmentGuard;