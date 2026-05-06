import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import Loading from '../../components/student/Loading';
import { assets } from '../../assets/assets';

interface EnrollmentData {
  id: number;
  courseId: number;
  name: string;
  thumbnail: string;
  completed: boolean;
  totalLectures: number;
  completedCount: number;
  progress: number;
}

const MyEnrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await api.get('/api/courses/my-enrollments');
        const rawData = res.data;
        const resolvedData = await Promise.all(
          rawData.map(async (enrol: EnrollmentData) => {
            try {
              if (!enrol.thumbnail) return enrol;

              const urlRes = await api.get('/api/upload/file-url', {
                params: { fileKey: enrol.thumbnail }
              });
              return { ...enrol, thumbnail: urlRes.data.presignedUrl };
            } catch (err) {
              console.error("Error resolving thumbnail for:", enrol.name);
              return enrol;
            }
          })
        );
        setEnrollments(resolvedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  if (loading) return (<div className="flex flex-col items-center justify-center min-h-screen w-full bg-white">
    <Loading />
    <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading course...</p>
  </div>);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Enrollments</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-500">Course</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-500">Progress</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrol) => (
              <tr key={enrol.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <img src={enrol.thumbnail || assets.defaultCourseThumbnail} className="w-16 h-10 object-cover rounded-md shadow-sm" alt="Course Thumbnail" />
                    <span className="font-bold text-slate-800">{enrol.name}</span>
                  </div>
                </td>
                <td className="p-5 w-64">
                  <div className="flex flex-col gap-2">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${enrol.progress === 100 ? 'bg-green-500' : 'bg-sky-500'}`}
                        style={{ width: `${enrol.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {enrol.completedCount} / {enrol.totalLectures} Lectures ({enrol.progress}%)
                    </span>
                  </div>
                </td>
                <td className="p-5">
                  {enrol.progress === 100 ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      🏆 Completed
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      ⏳ In Progress
                    </span>
                  )}
                </td>
                <td className="p-5 text-right">
                  <button
                    onClick={() => navigate(`/course/${enrol.courseId}`)}
                    className="bg-black text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    {enrol.completed ? 'Review Content' : 'Continue Learning'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-2 text-center text-slate-400">
          {enrollments.length === 0 && (<p className="text-lg mb-2">No active enrollments found.</p>)}
          <button onClick={() => navigate('/all-courses')} className="text-sky-600 font-bold hover:underline">
            Browse Courses
          </button>
        </div>

      </div>
    </div>
  );
};

export default MyEnrollments;