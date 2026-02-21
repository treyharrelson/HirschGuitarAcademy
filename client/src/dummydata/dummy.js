/*  Dummy Course Data Template:

    The course data is formated as an array of objects

    {
        "_id": "",
        "courseTitle": "",
        "courseDescription": "",
        "isPrivate": false, //boolean
        "courseContent": [
            {
                "moduleID": "",
                "moduleOrder": 1,
                "moduleTitle": "",
                "moduleContent": [
                    {
                        "lectureID": "",
                        "lectureTitle": "",
                        "lectureOrder": 1,
                        "lectureContent": ""
                    }
                ]
            }
        ],
        "instructor": "", // instructor id
        "enrolledStudents": [
            "studentID"
        ]
    }

*/


export const dummyCourses = [
    {
        "_id": "347034760473607460",
        "courseTitle": "Intro to Guitar",
        "courseDescription": "<h2>Learn the Fundamentals of Guitar</h2><p>This course is designed for begninners to learn what a guitar is and how to start playing</p>",
        "isPrivate": false,
        "courseContent": [
            {
                "moduleID": "1",
                "moduleOrder": 1,
                "moduleTitle": "Basic Notes",
                "moduleContent": [
                    {
                        "lectureID": "1",
                        "lectureTitle": "The 6th String",
                        "lectureOrder": 1,
                        "lectureContent": [
                            "<p>The 6th string (also known as the Lower E string) can play 3 basic note sin the first position: E (just strumming), F (first finger on the first fret), and G (third finger on the third fret).</p>"
                        ]
                    }
                ]
            }
        ],
        "instructor": "09376703760467093", // instructor id
        "enrolledStudents": [
            "087680736734876"
        ]
    }
]