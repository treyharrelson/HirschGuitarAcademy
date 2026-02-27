import React, { useEffect, useState } from 'react'
import Loading from '../../components/student/Loading'

const Dashboard = () => {

  const [dashboardData, setDashboardData] = useState(null)

  const fetchDashboardData = async ()=> {
    setDashboardData("lorem ipsum")
  }

  useEffect(()=>{
    fetchDashboardData()
  },[])

  return dashboardData ? (
    <div className='min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='space-y-5'>
      <h1>Instructor Dashboard Data goes here, ex: recent enrollments, upcoming due dates, all courses, etc.</h1>
      </div>
    </div>
  ) : <Loading />
}

export default Dashboard
