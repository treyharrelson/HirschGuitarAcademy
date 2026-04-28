import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { type Course } from '../types/course';
import { CourseCard } from '../components/student/CourseCard';
import Loading from '../components/student/Loading';

export const ProfilePage: React.FC = () => {
	const { user } = useAuth();
	const role = user?.role;

};