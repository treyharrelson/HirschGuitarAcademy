import React, { useEffect, useState } from 'react'
import { createContext } from "react";
import { dummyCourses } from '../dummydata/dummy';

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const [allCourses, setAllCourses] = useState([])
    // Fetch all courses
    const fetchAllCourses = async ()=>{
        setAllCourses(dummyCourses)
    }

    // 

    useEffect(()=>{
        fetchAllCourses()
    },[])
    
    const value = {
        allCourses
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );

}
