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
    4. if you get an error on Windows saying running scripts with npm isn't allowd try running this in powershell:
        Set-ExecutionPolicy Unrestricted -Scope CurrentUser

Daily Development:
    need to run two terminals simultaneously for frontend and backend
    
    1. backend
        docker compose up -d (-d runs in background (detached))
        npm run devStart (runs on http://localhost:3000)
    2. frontend
        cd client
        npm run dev
        # runs on http://localhost:5173 (GO HERE TO)

# Update as of Feb 18, 2026:
Tailwindcss has been implemented into the repository for ease of front end developement.
You will need to verify that your version of the repo/branch you are working on has it installed.
Instructions can be found at: https://tailwindcss.com/docs/installation/using-vite

It boils down to running this command in the "client" folder: npm install tailwindcss @tailwindcss/vite
This is to verify that the module has been installed/updated.
The command should be run with "npm install" everytime you boot up the server/client for the first time upon development for the timeframe.

# QoL To Do:
1. Make a script that runs both the front and back-end at the same time without the need for multiple command windows or excess file navigation.