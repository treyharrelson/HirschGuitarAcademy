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
// import Metronome from './pages/student/metronome-tool/js/metronome';
// import Timer from './pages/student/metronome-tool/js/timer';
import MainLayout from './pages/MainLayout';
import './App.css';
import CourseDetails from './pages/student/CourseDetails';
import MyEnrollments from './pages/student/MyEnrollments';
import CourseView from './pages/student/CourseView';
import Loading from './components/student/Loading';
import StudentsEnrolled from './pages/instructor/StudentsEnrolled'
import AddCourse from './pages/instructor/AddCourse'
import InstructorMyCourses from './pages/instructor/MyCourses'
import Instructor from './pages/instructor/Instructor'
import InstrcutorDashboard from './pages/instructor/InstructorDashboard'

import "quill/dist/quill.snow.css";

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

          <Route path="/home" element={<Dashboard />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/thread/:threadId" element={<ThreadDetail />} />
          <Route path="/all-courses" element={<AllCourses />} />
          <Route path="/courses" element={<MyCourses />} />
          {/* elements set to this so it won't crash */}
          <Route path="/metronome" element={<MyCourses />} />
          <Route path="/timer" element={<MyCourses />} />

          {/**<Route path='/home' element={<Home />} /> */}
          <Route path='/course-info/:id' element={<CourseDetails />} />
          <Route path='/my-enrollments' element={<MyEnrollments />} />
          <Route path='/course/:courseId' element={<CourseView />} />
          <Route path='/loading/:path' element={<Loading />} />
          
          <Route path='/instructor' element={<Instructor />}>
            <Route path='/instructor' element={<InstrcutorDashboard />} />
            <Route path='add-course' element={<AddCourse />} />
            <Route path='my-courses' element={<InstructorMyCourses />} />
            <Route path='students-enrolled' element={<StudentsEnrolled />} />
          </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </AppContextProvider>
    </AuthProvider>
  );
}

export default App;
