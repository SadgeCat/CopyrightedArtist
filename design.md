# System Blueprint

## TNPG: PortendedGreatness
## project: Copyrighted Artist
## Target ship date: {2026-06-xx}

---

#### roster:


| Name | Email | Primary Role | Secondary Role |
|---|---|---|---|
|Yuhang Pan|yuhangp@nycstudents.net|Project Manager|Game logic + CSS|
|Andrew Tsai|andrewt194@nycstudents.net|DB Manager|JS|
|Zixi Qiao|zixiq@nycstudents.net|Socket|JS|
|Owen Zeng|owenz20@nycstudents.net|HTML|JS|

---


# Summary
A website hosting a drawing guessing game commonly known as Copyrighted Artists.

## Problem Being Solved
Boredom

## Target Users

- Fun-seekers
- Friend-havers


## Why This Project Matters
It will help alleviate boredom and train discerning eyes for distinguishing between real and fake drawings


# Minimum Viable Product (MVP) Scope
Website with socket lobbies and functioning game

## Core Features (Required for Final Submission)
Features that **must** be completed:
1. Socket Lobbies
2. Working Game
3. Login DB


## Stretch Features (Only if MVP is Complete)
1. Elo System
2. Matchmaking System
3. Game history

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
{your summary/recap of team discussions here}
Flask and SQLite for simplicity since all the devos knows very well on how to use it.  
---

# Team Ownership Plan

Each member must own meaningful deliverables.

| Team Member | Primary Ownership | Secondary Ownership | Specific Deliverables |
|---|---|---|---|
|Yuhang Pan|yuhangp@nycstudents.net|Project Manager|Game logic + CSS|
|Andrew Tsai|andrewt194@nycstudents.net|DB Manager|JS|
|Zixi Qiao|zixiq@nycstudents.net|Socket|JS|
|Owen Zeng|owenz20@nycstudents.net|HTML|JS|

---

# Component map

{Insert your mermaid(or equivalent)-generated diagram here}

# Site map

{Insert your mermaid(or equivalent)-generated diagram here}
eg...
```
Landing Page
   ↓
Login / Register
   ↓
Dashboard
   ├── Feature A
   ├── Feature B
   └── Profile
```

## Key User Stories
### eg0
As a __________, I want to __________ so that...

### eg1
As a __________, I want to __________ so that...

### eg2
As a __________, I want to __________ so that...



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
{Delineate here your plan for testing each component}

# Timeline
## Week 1 Goals:
## Week 2 Goals:
## Week 3 Goals:
## Internal Deadlines:
{List milestones your team has identified, in the order they must be completed. Set a target completion date for each.}


# Completion Criteria (_a.k.a._ "Definition of 'Done'")
Project is considered complete when all of the following are true:
1.
1.
1.

# Open Questions
{Delineate anything undecided here}

# Appendix
{Any relevant info that is useful but would have interrupted narrative flow above, or cluttered the information portrayed}

# Other
{Put here anything that did not sensibly fit under above headings. This section will inform evolution of SoftDev.}
