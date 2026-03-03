Need 
    - docker
    - nodejs

From scratch:
    - pull from git
    - npm install in root folder
    - make .env files in root and /server
        - copy .env.example, rename to .env, and change username, password, db name to whatever
        - like this because bad practice to commit .env files to github
        - probably shouldn't need two .env files, but it works for now
    - docker compose up -d in root

Everything should be set up, do npm run dev in root to start client and server at once.

If messing with database files, can get away with in server/db/db.js in sequelize.authenticate change sequelize.sync({ alter: true }) to sequelize.sync({ force: true })
run db.js from /server folder, then change back to alter: true

For fake data, go to /server folder and run node db/dev.js
Can add fake data to individual tables, or just type all and a good bit of data will be added.


Project Structure:
/
├── client/          # React + Vite frontend
│   └── no clue what's going on in here, someone else will have to write it out
├── server/          # Node.js + Express backend
│   ├── db/          # Sequelize models and seeding script
│   ├── middleware/  # Auth middleware
│   ├── routes/      # API route handlers
│   ├── server.js    # starts server
│   └── compose.yaml # Docker Compose for Postgres + pgAdmin
├── pgdata/          # Postgres data
└── package.json     # npm scripts, runs client + server together