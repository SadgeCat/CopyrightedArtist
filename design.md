# System Blueprint

## TNPG: PortendedGreatness
## Project: Copyrighted Artist
## Target ship date: 2026-06-01

---

#### Roster:


| Name | Email | Primary Role | Secondary Role |
|---|---|---|---|
|Yuhang Pan|yuhangp@nycstudents.net|Project Manager|Game logic/Flask|
|Andrew Tsai|andrewt194@nycstudents.net|DB Manager|JS Canvas|
|Zixi Qiao|zixiq@nycstudents.net|Socket|JS Lead|
|Owen Zeng|owenz20@nycstudents.net|HTML/CSS|JS Sub|

---


# Summary
A website hosting a drawing guessing game commonly known as Copyrighted Artists. Upon joining a game lobby, you will be led to a game window where you can draw based on a prompt or based off of what other people have drawn. Then, you will go through the voting phase where you have to determine which one is the real drawing. Score is earned by guessing the real drawing or by fooling others into voting your fake drawings. The site will award you elo points based on winning or losing.

## Problem Being Solved
Boredom

## Target Users

- Fun-seekers
- Friend-havers
- Unem*loyed-artists


## Why This Project Matters
It will help alleviate boredom and train discerning eyes for distinguishing between real and fake drawings


# Minimum Viable Product (MVP) Scope
Website with socket lobbies and functioning game

## Core Features (Required for Final Submission)
Features that **must** be completed:
1. Socket Lobbies: Users can join different rooms and start separate games; they can also create their own rooms
2. Working Game: Drawing & Voting phases
3. Login DB


## Stretch Features (Only if MVP is Complete)
1. Elo System: Gain/lose elo from games. Different elos will be separated into different ranks (i.e. iron, bronze, silver, gold, plat, diamond, etc.)
2. Matchmaking System: Uses the elo system to put you into lobbies of similar player elo.
3. Game history: Be able to review the results of past games, maybe even look at the drawings from those past games.

## Explicit Non-Goals

Features intentionally excluded:
- Pay to win
- Unfiltered prompts

---

# Technology Stack

| Layer | Selected Tool |
|---|---|
| Backend Framework | Flask |
| Frontend Framework | tailwind |
| Database | SQLite |
| Authentication | Flask sessions |
| ORM / DB Library | none |

## Why This Stack Was Chosen
Flask and SQLite for simplicity since all the devos knows very well on how to use it.  

---

# Team Ownership Plan

Each member must own meaningful deliverables.

| Team Member | Primary Ownership | Secondary Ownership | Specific Deliverables |
|---|---|---|---|
|Yuhang Pan|Project Manager|Flask + Game Logic|Implement different phases of the game + ensure that they work|
|Andrew Tsai|DB Manager|JS Canvas|Designing drawing interface of the game using Canvas and send game data to database|
|Zixi Qiao|Flask Socket|JS Lead|Creating separate lobbies and facilitate displaying updates to users in lobby during the game|
|Owen Zeng|HTML + CSS|JS Sub|Creating base HTML templates to render pages|

---

# Component map
![Component Map](https://raw.githubusercontent.com/SadgeCat/graphics_mesh_files/refs/heads/main/images/CPArtist_ComponentMap.png)

# Site map
![Site Map](https://raw.githubusercontent.com/SadgeCat/graphics_mesh_files/refs/heads/main/images/CPArtist_SiteMap2.png)

## Key User Stories
### Aspiring Artist
As an aspiring artist, I want to train my ability to emulate art styles so that I can become better at drawing. At the same time, I can improve my ability to discern fake/copied arts.

### Friend-Havers
As a person with many friends, I want to play a party game so that we can all have fun.

### Lone Wolf
As a person with no friends, I want to obsessively play a multiplayer game so that I can beat everyone else and prove my own self-worth.



# Database Design
<table>
<tr>
  <th colspan="4"><strong>USERS</strong></th>
</tr>
<tr><td>INTEGER</td><td>id</td><td>PK</td><td>Auto-increment</td></tr>
<tr><td>TEXT</td><td>name</td><td></td><td>Unique</td></tr>
<tr><td>TEXT</td><td>password</td><td></td><td>For authentication</td></tr>
<tr><td>REAL</td><td>elo</td><td></td><td></td></tr>
<tr><td>DATE</td><td>created_at</td><td></td><td></td></tr>
<tr><td>INTEGER</td><td>games_won</td><td></td><td></td></tr>
<tr><td>INTEGER</td><td>games_played</td><td></td><td></td></tr>
<tr><td>INTEGER</td><td>total_placement</td><td></td><td></td></tr>
</table>

<table>
<tr>
  <th colspan="4"><strong>GAMES</strong></th>
</tr>
<tr><td>INTEGER</td><td>id</td><td>PK</td><td>Auto-increment</td></tr>
<tr><td>INTEGER</td><td>winner_id</td><td>FK</td><td>USERS(id)</td></tr>
<tr><td>DATE</td><td>timestamp</td><td></td><td></td></tr>
</table>

<table>
<tr>
  <th colspan="4"><strong>RESULTS</strong></th>
</tr>
<tr><td>INTEGER</td><td>id</td><td>PK</td><td>Auto-increment</td></tr>
<tr><td>INTEGER</td><td>game_id</td><td>FK</td><td>GAMES(id)</td></tr>
<tr><td>INTEGER</td><td>user_id</td><td>FK</td><td>USERS(id)</td></tr>
<tr><td>REAL</td><td>elo_change</td><td></td><td></td></tr>
</table>


# Testing Plan
- First we will check that data storage works properly and authentication is secure by preventing sql injection using `?`
- Then we will make sure all the routes to the web pages work.
- Create lobbies to test socket connections and test sending images drawn on JS canvas
- Test game logic independently by creating a testable lobby connecting all the users to it
- Play through a game and check that user data is updated properly
- Work on extra functions and features

# Timeline
## Week 1 Goals:
- Authentication
- Working lobbies
- Basic site infrastructure
## Week 2 Goals:
- Game logic completed (timer, scoring points)
- Database complete, saving user stats
- JS Canvas working
## Week 3 Goals:
- Full game completed (all phases: drawing, voting)
- Using user elo for matchmaking system
- Profile complete
- CSS to make pages look nice
## Internal Deadlines:
- Figure out JS canvas and set it up by 5/15
- Flask sockets for lobbies by 5/18
- Add start button for lobby host that directs players to the game page by 5/19
- Set up different phases of the game:
  - Phase 1: all players are given a prompt and 60s to draw and save the sketch by 5/21
  - Phase 2: given an original sketch to copy and save the copied sketch by 5/22
  - Phase 3: go through each drawn prompt, display the 3 sketches and let users vote by 5/23
  - Finally: sum the scores and display leaderboard by 5/26 for live demo

# Completion Criteria (_a.k.a._ "Definition of 'Done'")
Project is considered complete when all of the following are true:
1. Socket/lobby system working
2. Game logic + graphics completed
3. User profile data and db secured

# Open Questions
Implement really extra features like being able to save certain drawings?

# Appendix
Based off of this Roblox game: https://www.roblox.com/games/4353458311/Copyrighted-Artists
