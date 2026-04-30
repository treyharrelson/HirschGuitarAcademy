import React, { useEffect, useState } from 'react';
import Loading from '../../components/student/Loading';
import api from '../../api/axiosInstance';
import { type Course } from '../../types/course';
import type { User } from '../../types/user';

type EnrolledCourse = { id: string | number; name: string };
type Student = User & {
  enrolledCourses: EnrolledCourse[];
};

export default function InstructorDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'courses' | 'students'>('courses');
  const [selectedCourseId, setSelectedCourseId] = useState<string | number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const [studentSearch, setStudentSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        api.get('/api/courses/instructor/students'),
        api.get('/api/courses')
      ]);
      setStudents(studentsRes.data ?? []);
      setCourses(coursesRes.data ?? []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err?.response?.data ?? err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleEnroll = async (courseId: string | number, studentId: number) => {
    try {
      await api.post(`/api/courses/${courseId}/enroll/${studentId}`);
      fetchData(); // refresh data
    } catch (err) {
      console.error('Error enrolling student:', err);
      alert('Failed to enroll student');
    }
  };

  const handleUnenroll = async (courseId: string | number, studentId: number) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    try {
      await api.delete(`/api/courses/${courseId}/enroll/${studentId}`);
      fetchData(); // refresh data
    } catch (err) {
      console.error('Error removing student:', err);
      alert('Failed to remove student');
    }
  };


  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading />
    </div>);

  // Render helpers
  const filteredStudents = students.filter(s =>
    (s.name + s.email).toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className='min-h-screen p-8'>
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Enrollment Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b pb-2">
        <button
          onClick={() => { setView('courses'); setSelectedCourseId(null); }}
          className={`font-semibold px-4 py-2 ${view === 'courses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          View By Course
        </button>
        <button
          onClick={() => { setView('students'); setSelectedStudentId(null); }}
          className={`font-semibold px-4 py-2 ${view === 'students' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          View By Student
        </button>
      </div>

      {view === 'courses' && (
        <div className="flex gap-8">
          <div className="w-1/3 border-r pr-6">
            <h2 className="text-xl font-bold mb-4">All Courses</h2>
            <div className="flex flex-col gap-2">
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${String(selectedCourseId) === String(course.id) ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <p className="font-semibold text-gray-800">{course.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="w-2/3">
            {selectedCourseId !== null ? (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Students enrolled in {courses.find(c => String(c.id) === String(selectedCourseId))?.name}
                </h2>
                <div className="flex flex-col gap-3">
                  {students.filter(s => s.enrolledCourses.some(ec => String(ec.id) === String(selectedCourseId!))).map(student => (
                    <div key={student.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center bg-white shadow-sm">
                      <div>
                        <p className="font-bold">{student.name} <span className="text-sm font-normal text-gray-500"></span></p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <button
                        onClick={() => handleUnenroll(selectedCourseId!, student.id)}
                        className="text-red-500 font-semibold px-3 py-1 border border-red-200 rounded hover:bg-red-50"
                      >
                        Remove Student
                      </button>
                    </div>
                  ))}
                  {students.filter(s => s.enrolledCourses.some(ec => String(ec.id) === String(selectedCourseId!))).length === 0 && (
                    <p className="text-gray-500 italic">No students are currently enrolled in this course.</p>
                  )}
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="font-bold mb-4 text-lg">Enroll a Student</h3>
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                  />
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                    {filteredStudents.filter(s => !s.enrolledCourses.some(ec => String(ec.id) === String(selectedCourseId!))).map(student => (
                      <div key={student.id} className="flex justify-between items-center p-3 border border-gray-100 rounded hover:bg-gray-50">
                        <span>{student.name} ({student.email})</span>
                        <button
                          onClick={() => handleEnroll(selectedCourseId!, student.id)}
                          className="text-blue-600 font-semibold text-sm px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                        >
                          Enroll
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 mt-10 text-center">
                Select a course to view and manage its students
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'students' && (
        <div className="flex gap-8">
          <div className="w-1/3 border-r pr-6">
            <h2 className="text-xl font-bold mb-4">All Students</h2>
            <input
              type="text"
              placeholder="Search students..."
              className="w-full p-2 border border-gray-300 rounded mb-4"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
            <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
              {filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${selectedStudentId === student.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <p className="font-semibold text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-500">@{student.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="w-2/3">
            {selectedStudentId ? (() => {
              const student = students.find(s => s.id === selectedStudentId);
              if (!student) return null;

              const unenrolledCourses = courses.filter(c => !student.enrolledCourses.some(ec => String(ec.id) === String(c.id)));

              return (
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    Courses for {student.name}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {student.enrolledCourses.map(course => (
                      <div key={course.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center bg-white shadow-sm">
                        <span className="font-bold text-gray-800">{course.name}</span>
                        <button
                          onClick={() => handleUnenroll(course.id, student.id)}
                          className="text-red-500 font-semibold px-3 py-1 border border-red-200 rounded hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {student.enrolledCourses.length === 0 && (
                      <p className="text-gray-500 italic">This student is not enrolled in any courses.</p>
                    )}
                  </div>

                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-bold mb-4 text-lg">Enroll in Course</h3>
                    <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                      {unenrolledCourses.map(course => (
                        <div key={course.id} className="flex justify-between items-center p-3 border border-gray-100 rounded hover:bg-gray-50">
                          <span className="font-medium text-gray-700">{course.name}</span>
                          <button
                            onClick={() => handleEnroll(course.id, student.id)}
                            className="text-blue-600 font-semibold text-sm px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                          >
                            Enroll
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="text-gray-400 mt-10 text-center">
                Select a student to view and manage their courses
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
