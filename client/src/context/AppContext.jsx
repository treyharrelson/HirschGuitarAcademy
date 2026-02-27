import React, { useEffect, useState } from 'react'
import { createContext } from "react";
import axios from 'axios';

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const [allCourses, setAllCourses] = useState([])
    const [isCoursesLoaded, setIsCoursesLoaded] = useState(false)

    // Fetch all courses
    const fetchAllCourses = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/courses', {
                withCredentials: true
            });
            setAllCourses(response.data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setIsCoursesLoaded(true);
        }
    }

    // 

    useEffect(() => {
        fetchAllCourses()
    }, [])

    const value = {
        allCourses,
        isCoursesLoaded,
        fetchAllCourses  // exposed so components can trigger a refresh
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );

}
