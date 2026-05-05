import React, { useEffect, useState, type ReactNode } from 'react'
import { createContext, useContext } from "react";
import api from '../api/axiosInstance';
import { type Course } from '../types/course'

interface AppContextInterface {
    allCourses: Course[];
    isCoursesLoaded: Boolean;
    fetchAllCourses: () => Promise<void>;
}

export const AppContext = createContext<AppContextInterface | undefined>(undefined);

interface AppContextProviderProps {
    children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = (props: any) => {

    const [allCourses, setAllCourses] = useState<Course[]>([])
    const [isCoursesLoaded, setIsCoursesLoaded] = useState<boolean>(false)

    // Fetch all courses
    const fetchAllCourses = async (): Promise<void> => {
        try {
            const response = await api.get<Course[]>('/api/courses');
            setAllCourses(response.data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setIsCoursesLoaded(true);
        }
    }

    

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

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined){
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
}
