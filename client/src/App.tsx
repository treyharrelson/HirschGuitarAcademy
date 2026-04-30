import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppContextProvider } from './context/AppContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Forum from './pages/Forum';
import ThreadDetail from './pages/ThreadDetail';
import AllCourses from './pages/student/AllCourses';
import MyCourses from './pages/MyCourses';
import ThreadFollows from './pages/ThreadFollows';
import ThreadManager from './pages/ThreadManager';
// import Metronome from './pages/student/metronome-tool/js/metronome';
// import Timer from './pages/student/metronome-tool/js/timer';
import MainLayout from './pages/MainLayout';
import MyEnrollments from './pages/student/MyEnrollments';
import CourseView from './pages/student/CourseView';
import Loading from './components/student/Loading';
import StudentsEnrolled from './pages/instructor/StudentsEnrolled'
import AddCourse from './pages/instructor/AddCourse'
import InstructorMyCourses from './pages/instructor/MyCourses'
import Instructor from './pages/instructor/Instructor'
import InstrcutorDashboard from './pages/instructor/InstructorDashboard'
import EditCourse from './pages/instructor/EditCourse'
import { ProfilePage } from './pages/Profile';

import "quill/dist/quill.snow.css";
import EnrollmentGuard from './components/student/EnrollmentGuard';

function App() {
  //const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <AppContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/** THIS IS THE MAIN RENDERED PAGE */}
            <Route element={<MainLayout />}>
              <Route path="/student-dashboard" element={<Dashboard />} />
              <Route path="/admin-dashboard" element={<Dashboard />} />
              <Route path="/manage/threads" element={<ThreadManager />} />

              <Route path="/home" element={<Dashboard />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/thread/:threadId" element={<ThreadDetail />} />
              <Route path="/follows" element={<ThreadFollows />} />
              <Route path="/all-courses" element={<AllCourses />} />
              <Route path="/courses" element={<MyCourses />} />
              {/* elements set to this so it won't crash */}
              <Route path="/metronome" element={<MyCourses />} />
              <Route path="/timer" element={<MyCourses />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />

              {/**<Route path='/home' element={<Home />} /> */}
              <Route path='/my-enrollments' element={<MyEnrollments />} />
              <Route path='/course' element={<EnrollmentGuard />}>
                <Route path=':courseId' element={<CourseView />} />
              </Route>

              <Route path='/loading/:path' element={<Loading />} />

              <Route path='/instructor' element={<Instructor />}>
                <Route path='/instructor' element={<InstrcutorDashboard />} />
                <Route path='add-course' element={<AddCourse />} />
                <Route path='my-courses' element={<InstructorMyCourses />} />
                <Route path='students-enrolled' element={<StudentsEnrolled />} />
                <Route path='edit-course/:courseId' element={<EditCourse />} />
              </Route>
            </Route>
        </Routes>
      </BrowserRouter>
    </AppContextProvider>
    </AuthProvider >
  );
}

export default App;
