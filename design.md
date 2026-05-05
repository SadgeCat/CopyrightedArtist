# P05: Le Fin  
## Design Doc by PortendedGreatness, pd. 5  
##### ⤷ Roster: Yuhang Pan (PM), Andrew Tsai, Owen Zeng, Zixi Qiao  
## PROJECT NAME:
Copyrighted Artists  
### DESCRIPTION:
The initial load page will lead you to register an account. Afterwards, you will be redirected to a homepage, from which you can join game lobbies. Upon joining a game lobby, you will be led to a game window where you can draw based on a prompt or based off of what other people have drawn. The site will award you elo points based on winning or losing.  
##### TARGET SHIP DATE: 06-07-2026

### Program Components:
- Flask App (Python)
  - \_\_init\_\_.py (main app + routes)
    - Creates Flask app, config, and session handling
    - Renders templates and connects frontend to backend logic
    - Initialize sockets for multiplayer
    - Routes:
        - /register adds a new user to the users table (data.py). Checks if the username is unique, hashes the password, stores it in session, then redirects to /home.
        - /login checks users (data.py), verifies password hash, stores session, and redirects to /home.
        - /logout clears session, redirects to /login.
        - /home lobby list where users can join or create a lobby
        - /lobby/<id> waiting room for players to fill up to start the game
        - /game/<id> the actual game
        - /profile uses data.py to load a user's stats
  - build_db.py
    - Connects to SQLite3 database and creates/maintains tables
  - Database (SQLite3) (stored in data.db)
    - users table stores all usernames and password hashes for authentication, and other stats like elo, #wins, #losses, etc.
    - games table stores the winner's id/name to be used for profile page
    - results table stores the a pair of game&user id to keep track of a user's game history like elo change in the game played
- Frontend Framework
  - ?
- JavaScript
  - lobby.js handles the lobbies
  - game.js handles the game stuff
  - canvas.js handles the drawing on js canvas
  - socket.js handles the sockets for multiplayer
- RESTful APIs
  - None
- External CSS (if needed)

### Component Map:

### Database Organization

|** USERS **|
|---|
|INTEGER|id|PK|Auto-increment|
|TEXT|name||Unique|
|TEXT|password||For authentication|
|REAL|elo|||
|DATE|created_at|||
|INTEGER|games_won|||
|INTEGER|games_played|||
|INTEGER|total_placement|||

|GAMES|
INTEGER
id
PK
Auto-increment
INTEGER
winner_id
FK
USERS(id)
DATE
timestamp






RESULTS
INTEGER
id
PK
Auto-increment
INTEGER
game_id
FK
GAMES(id)
INTEGER
user_id
FK
USERS(id)
REAL
elo_change






Site Map:
Templates (HTML)
(login.html) /login (username + password. Error message if login fails).
(register.html) /register (username + password. Error message if username is taken).
(home.html) /home (List of lobbies + button for users to create their own)
(lobby.html) /lobby/<id> (Waiting room, displays the users in the lobby and button to leave lobby)
(game.html) /game/<id> Needs a lot of things:
Canvas for drawing
Timer for all the phases (drawing, voting)
List of players and their current scores
Button for voting
(profile.html) /profile (shows username, elo, etc.).
error.html (invalid id’s or permission errors).



Tasks & Assignments
TASK BREAKDOWN

Task
Devo(s)
JS & DB stuff
Andrew Tsai
JS & HTML stuff
Owen Zeng
JS & SOCKET stuff
Zixi Qiao
Game Logic and stuffs
Yuhang Pan
