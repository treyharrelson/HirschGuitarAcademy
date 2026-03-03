import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Forum from './pages/Forum';
import ThreadDetail from './pages/ThreadDetail';
import AllCourses from './pages/AllCourses';
import MyCourses from './pages/MyCourses';
// import Metronome from './pages/student/metronome-tool/js/metronome';
// import Timer from './pages/student/metronome-tool/js/timer';

import './App.css';

function App() {
  //const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/student-dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/thread/:threadId" element={<ThreadDetail />} />
          <Route path="/all-courses" element={<AllCourses />} />
          <Route path="/courses" element={<MyCourses />} />
          {/* elements set to this so it won't crash */}
          <Route path="/metronome" element={<MyCourses />} />
          <Route path="/timer" element={<MyCourses />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
