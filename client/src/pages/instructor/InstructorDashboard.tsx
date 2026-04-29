import React, { useEffect, useState } from 'react'
import Loading from '../../components/student/Loading'

const InstrcutorDashboard = () => {

  const [dashboardData, setDashboardData] = useState<string>('')

  const fetchDashboardData = async () => {
    setDashboardData("lorem ipsum")
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return dashboardData ? (
    <div className='min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='space-y-5'>
        <h1>Instructor Dashboard Data goes here, ex: recent enrollments, upcoming due dates, all courses, etc.</h1>
      </div>
    </div>
  ) : <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white">
    <Loading />
    <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading...</p>
  </div>
}

export default InstrcutorDashboard
