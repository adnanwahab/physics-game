# HappyBearLandia
a multiplayer game plus tooling for visualing logs


# Schema
- participants = initial coordinates
- state_updates = observed value at point in time


CREATE TABLE game_logs (
    id INTEGER PRIMARY KEY AUTOTION,
    session_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL, -- e.g., "player_death", "match_end", "cheat_detection"
    player_id TEXT,           -- Indexed for quick player history lookups
    payload JSON NOT NULL     -- The dynamic JSON data
);

# hypothesis
game + tools for adding more data to functions

because game_Data can render future / dream / unseen states

Game_Data can give us key_frames we didnt have to interpolate to wherever we want to go

this helps answer questions: more data = more probability of prediction

draw => infinite data => sample
everytime you draw, you get more data

after completing task, play game to sim next task to add circuit
that lowers activation energy to complete that task

to make this function, have to ally with everyone - because more
shared data = good


Assign to everyone in world
1. quest/task for each person (vision board)
2. 6 spells for each person
3. inventory for each person
4. character
5. account
Ambient sensors can bind these to various zones

Periodic Review ensures all data
is accurate as needed or possible

Periodic Audits keep everything on track.

to solve lock contention, we distribute to both, if complaint then zoom
this ensures policies usually lower lock contention and have tools for resolving any instances


before saving scene_data
   make sure other people's views
   on scene_data verify the info
   if not 100% consensus predicted
     add more observers till 100% of votes - record update means new global discussions are novel

https://www.edx.org/xseries/stanfordonline-introduction-to-sql-databases

all game_data available via inspector / api / map
