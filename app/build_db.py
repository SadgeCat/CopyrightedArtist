import sqlite3
import os

ABS_PATH = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(ABS_PATH, "data.db")

# conncects to db
def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# creates all the tables
def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    # create tables if it isn't there already
    c.execute("""CREATE TABLE IF NOT EXISTS users
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        elo REAL,
        games_won INTEGER,
        games_played INTEGER,
        total_placement INTEGER,
        UNIQUE(name))""")
    c.execute("""CREATE TABLE IF NOT EXISTS games
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner_id INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (winner_id) REFERENCES users(id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS results
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        game_id INTEGER,
        elo_change REAL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE)""")

    conn.commit()
    conn.close()

init_db()

def get_user(username):
    conn = get_db_connection()
    c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE name = ?", (username,)).fetchone()
    conn.close()
    return user

def get_user_by_id(id):
    conn = get_db_connection()
    c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE id = ?", (id,)).fetchone()
    conn.close()
    return user

def get_elo(id):
    return get_user_by_id(id)['elo']

def update_elo(id, value, win):
    conn = get_db_connection()
    c = conn.cursor()
    user = c.execute("UPDATE users SET elo = elo + ?, games_played = games_played + 1, games_won = games_won + ?, WHERE id = ?", (value,win,id))
    conn.close()


def get_all_user(ids):
    if not ids:
        return []
    conn = get_db_connection()
    c = conn.cursor()
    question_marks = ','.join(['?'] * len(ids))
    query = f"SELECT * FROM users WHERE id IN ({question_marks})"
    users = c.execute(query, tuple(ids)).fetchall()
    conn.close()
    return users

# add signed in acc to db
def insert_acc(username, password):
    conn = get_db_connection()
    conn.execute("""INSERT INTO users
        (name, password, created_at, elo, games_won, games_played, total_placement)
        VALUES
        (?, ?, CURRENT_TIMESTAMP, 0, 0, 0, 0)""",
        (username, password))
    conn.commit()
    conn.close()
