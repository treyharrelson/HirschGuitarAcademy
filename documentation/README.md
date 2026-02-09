# HirshGuitarAcademy
# You must have Node.js and Docker Desktop installed for it to function
# In the directory of the main folder, open a command line (git bash)
# If the docker is unitialized, run "docker compose up"
# Run/Start the container
# If you do not have the packages installed, run "npm install"
# You can launch the webpage using the "npm run devStart" command
# It will launch the server on localhost using port 3000
# You can enter "localhost:3000" into your browser with ther server active to view the "index.html" page

First Time Setup:

    1. install backend dependencies in root folder (HirshGuitarAcademy)
        npm install
    2. install frontend dependencies
        cd client
        npm install
        cd ..
    3. Start Docker
        docker compose up

Daily Development:
    need to run two terminals simultaneously for frontend and backend
    
    1. backend
        docker compose up -d (-d runs in background (detached))
        npm run devStart (runs on http://localhost:3000)
    2. frontend
        cd client
        npm run dev
        # runs on http://localhost:5173

    