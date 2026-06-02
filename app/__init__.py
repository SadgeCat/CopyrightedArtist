from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from flask_socketio import SocketIO, join_room, leave_room
from .build_db import *
from werkzeug.security import generate_password_hash, check_password_hash
from .lobby import *
from .game_logic import *
import uuid
import random
import time

app = Flask(__name__)
app.secret_key = "secret"
socketio.init_app(app)

game_lobbies = lobby()

@socketio.on('join')
def on_join(data):
    lobby_id = data['lobby_id']
    join_room(lobby_id)
    acc = get_user(session["username"])
    if acc and lobby_id in game_lobbies.get_lobbies():
        lobby_data = game_lobbies.get_lobbies()[lobby_id]
        if acc["id"] not in game_lobbies.get_lobbies()[lobby_id]['players']:
            if len(lobby_data['players']) >= lobby_data['max_players']:
                emit('lobby_full', {})
                return
            game_lobbies.join_lobby(acc["id"], lobby_id)
            emit('player_joined', {'username': session["username"]}, to=lobby_id)

@socketio.on('start')
def on_start(data):
    lobby_id = data['lobby_id']
    if len(game_lobbies.get_lobbies()[lobby_id]['players']) < 3:
        return
    join_room(lobby_id)
    game_lobbies.start_lobby(lobby_id)
    emit('game_started', {'game_id': lobby_id}, to=lobby_id)
    game_lobbies.delete_lobby(lobby_id)

@socketio.on('disconnect')
def on_disconnect():
    username = session.get("username")
    if not username: # in case disconnect occurs bc user logs out rather than just closing the tab
        return
    acc = get_user(username)
    if not acc:
        return

    for lobby_id, lobby_data in list(game_lobbies.get_lobbies().items()):
        if acc["id"] in lobby_data['players']:
            lobby_data['players'].remove(acc["id"])
            emit('player_left', {'username': username}, to=lobby_id)

            # if lobby is empty, delete it
            if not lobby_data['players']:
                game_lobbies.delete_lobby(lobby_id)
            # if host left, assign new host
            elif lobby_data['host'] == acc["id"]:
                lobby_data['host'] = lobby_data['players'][0]
                emit('new_host', {'host_id': lobby_data['host']}, to=lobby_id)
            break
    for game_id, game_data in list(game_lobbies.get_games().items()):
        if acc["id"] in game_data['players']:
            game_data['players'].remove(acc["id"])
            emit('game_player_left', {'username': username}, to=game_id)

            # if too few players, delete for now
            if len(game_data['players']) < 3:
                game_lobbies.end_game(game_id)
            # if host left, assign new host
            elif game_data['host'] == acc["id"]:
                game_data['host'] = game_data['players'][0]
                emit('new_host', {'host_id': game_data['host']}, to=game_id)
            break

# @socketio.on('join_game')
# def on_join_game(data):
#     game_id = data['game_id']
#     acc = get_user(session["username"])
#     if not acc:
#         return
#     session["timer"][game_id] = 60
#     join_room(game_id)
#     join_room(str(acc['id'])) # personal room, i.e. for when it's time to draw

# @socketio.on('image')
# def get_image(data):
#     game_lobbies.add_image(data['game_id'], data['prompt'], data['username'], data['image'])

@socketio.on('join_game')
def join_game(data):
    game_id = data['game_id']
    user_id = get_user(session['username'])['id']
    join_room(game_id)
    join_room(str(user_id))

@socketio.on('sync_game')
def sync_game(data):
    game_id = data['game_id']
    game = game_lobbies.get_games()[game_id]
    acc = get_user(session["username"])
    if not acc:
        return
    time_left = int(game['duration'] - (time.time() - game['start_time']))
    phase = game['phase']

    response = {
        "phase" : phase,
        "time_left": time_left
    }

    if phase == "copying":
        response['copy_state'] = game['copy_state']
        assigments = game['copy_assignments'][acc['id']]
        to_copy = []
        for target in assigments:
            submission = game['submissions'][target]
            to_copy.append({
                "target": target,
                "prompt": submission['prompt'],
                "image": submission['original']
            })
        response['to_copy'] = to_copy
    
    emit("restore_game", response)

@socketio.on('submit_original')
def submit_original(data):
    game_id = data['game_id']
    prompt = data['prompt']
    image = data['image']
    username = data['username']
    acc = get_user(session["username"])

    game = game_lobbies.get_games()[game_id]
    game['submissions'][acc['id']] = {
        "prompt": prompt,
        "original": image,
        "copies": {}
    }

    players = game['players']
    player_cnt = len(players)

    print("submitted:", username)
    print("submission count:", len(game['submissions']))
    print("player count:", player_cnt)

    # everyone submitted so we move on to copy phase
    if len(game['submissions']) == player_cnt:
        assignemnts = {}
        shuffled_players = players[:]
        random.shuffle(shuffled_players)
        for i, player in enumerate(shuffled_players):
            assignemnts[player] = [shuffled_players[(i+1) % player_cnt], shuffled_players[(i+2) % player_cnt]]
        game['copy_assignments'] = assignemnts

        # update timer
        game["phase"] = "copying"
        game["copy_state"] = "memorizing"
        game["duration"] = 10
        game["start_time"] = time.time()

        for player in shuffled_players:
            targets = assignemnts[player]       # contains randomized 2 player id's drawings to copy
            to_copy = []
            for target in targets:
                submission = game['submissions'][target]
                to_copy.append({
                    "target": target,
                    "prompt": submission['prompt'],
                    "image": submission['original']
                })

            emit('start_copying', {'to_copy': to_copy}, to=str(player))
        
        socketio.start_background_task(start_copying_phase, game_id)

def start_copying_phase(game_id):
    socketio.sleep(10)

    game = game_lobbies.get_games()[game_id]
    game["copy_state"] = "drawing"
    game["duration"] = 60
    game["start_time"] = time.time()

    socketio.emit("start_copy_real", {}, to=game_id)


@socketio.on('submit_copy')
def submit_copy(data):
    game_id = data['game_id']
    task = data['task']
    image = data['image']
    username = data['username']
    acc = get_user(session["username"])

    game = game_lobbies.get_games()[game_id]
    game['submissions'][task['target']]["copies"][acc['id']] = image

    players = game['players']
    player_cnt = len(players)
    drawings_copied = 0
    for submission in game['submissions'].values():
        drawings_copied += len(submission["copies"])
        # print(submission["copies"])

    print("submitted copy:", username)
    print("copy submission count:", drawings_copied)
    print("player count:", player_cnt)

    # if everyone finished copying, move on to voting phase
    if drawings_copied == player_cnt * 2:
        print('everyone copied')
        voting_sets = []
        for user, submission in game['submissions'].items():
            drawings = []
            drawings.append({
                "type": "original",
                "image": submission['original'],
                "user": user
            })
            for copier_id, copied_image in submission['copies'].items():
                drawings.append({
                "type": "copy",
                "image": copied_image,
                "user": copier_id
            })

            # randomizes order
            random.shuffle(drawings)

            original_idx = None
            cant_vote = set()
            for i, drawing in enumerate(drawings):
                if drawing['type'] == "original": original_idx = i
                cant_vote.add(drawing['user'])           

            # drawingsList = []
            # for drawing in drawings:
            #     drawingsList.append({
            #         "image": drawings['image']
            #     })

            voting_sets.append({
                "prompt": submission['prompt'],
                "original_artist": user,
                "drawings": drawings,
                "original_idx": original_idx,
                "cant_vote": list(cant_vote),
                "votes": {}
            })

        game["voting_sets"] = voting_sets
        game["current_vote_round"] = 0

        game["phase"] = "voting"
        game["duration"] = 30
        game["start_time"] = time.time()

        socketio.emit('start_voting', {'voting_set': voting_sets[0], 'round_idx': 0}, to=game_id)

    # everyone submitted so we move on to copy phase
    # if len(game['submissions'] == player_cnt):
    #     assignemnts = {}
    #     random.shuffle(players)
    #     for i, player in enumerate(players):
    #         assignemnts[player] = [players[(i+1) % player_cnt], players[(i+2) % player_cnt]]
    #     game['copy_assignments'] = assignemnts

    #     for player in players:
    #         targets = assignemnts[player]       # contains randomized 2 player id's drawings to copy
    #         to_copy = []
    #         for target in targets:
    #             submission = game['submissions'][target]
    #             to_copy.append({
    #                 "target": target,
    #                 "prompt": submission['prompt'],
    #                 "image": submission['original']
    #             })

    #         emit('start_copying', {'to_copy': to_copy}, to=player)

@socketio.on('submit_vote')
def submit_vote(data):
    game_id = data['game_id']
    username = data['username']
    selected_idx = data['selected_idx']

    acc = get_user(session["username"])
    game = game_lobbies.get_games()[game_id]
    round_idx = game['current_vote_round']
    voting_set = game['voting_sets'][round_idx]

    if acc['id'] in voting_set['votes']: return
    # if 'votes' not in game:
    #     game['votes'] = {}
    # if voting_idx not in game['votes']:
    #     game['votes'][voting_idx] = {}

    # game['votes'][voting_idx][acc['id']] = chosen_idx

    # # check if all eligible voters have voted
    # cant_vote = set(voting_set['cant_vote'])
    # eligible = [p for p in game['players'] if p not in cant_vote]
    
    # if all(p in game['votes'][voting_idx] for p in eligible):
    #     correct = voting_set['original_idx']
    #     results = {}
    #     for voter, choice in game['votes'][voting_idx].items():
    #         results[voter] = choice == correct
    #     emit('vote_results', {
    #         'voting_idx': voting_idx,
    #         'results': results,
    #         'correct_idx': correct,
    #         'original_artist': voting_set['original_artist']
    #     }, to=game_id)


    voting_set['votes'][acc['id']] = selected_idx


    num_votes = len(voting_set['votes'])
    player_cnt = len(game['players'])
    print("submitted vote:", username)
    print("vote count:", num_votes)
    print("player count:", player_cnt)

    expected_votes = player_cnt - len(voting_set['cant_vote'])
    # when everyone voted, we show results
    if num_votes >= expected_votes:
        vote_cnt = [0,0,0]
        for vote in voting_set['votes'].values():
            vote_cnt[vote-1] += 1

        # calculate scores earned by each player
        original_idx = voting_set['original_idx']
        drawings = voting_set['drawings']
        for voter_id, vote in voting_set['votes'].items():
            if vote-1 == original_idx:
                game['scores'][voter_id] += 1000
            chosen_drawing = drawings[vote-1]
            if chosen_drawing['type'] == "copy":
                game['scores'][chosen_drawing['user']] += 500

        socketio.emit('show_vote_results', 
                        {'vote_cnt': vote_cnt, 
                        'original_idx': original_idx}, 
                        to=game_id)
    
        socketio.sleep(6)
        game['current_vote_round'] += 1
        next_round = game['current_vote_round']
        if next_round < len(game['voting_sets']):
            next_set = game['voting_sets'][next_round]
            game["duration"] = 30
            game["start_time"] = time.time()

            socketio.emit('start_voting', {'voting_set': next_set, 'round_idx': next_round}, to=game_id)
        else:
            #game over
            leaderboard = []
            for player_id, score in game['scores'].items():
                player_name = get_user_by_id(player_id)['name']
                leaderboard.append({
                    "name": player_name,
                    "score": score
                })
                leaderboard.sort(key=lambda x: x['score'], reverse=True)
            socketio.emit('game_over', {'leaderboard': leaderboard}, to=game_id)


@app.route("/", methods=['GET', 'POST'])
def index():
    if 'username' in session:
        return redirect(url_for("home"))

    return redirect(url_for("login"))
    #return "<h1 style='color:blue'>CPArtist</h1>"

@app.route("/logout")
def logout():
    session.pop('username', None)
    return redirect(url_for("login"))

@app.route("/register", methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username').strip().lower()
        password = request.form.get('password').strip()

        if not username or not password:
            return render_template("register.html", error="No username or password inputted")

        acc = get_user(username)
        if acc:
            return render_template("register.html", error="Username already exists")

        hashed_password = generate_password_hash(password)
        insert_acc(username, hashed_password)

        # Check if user is successfully created in database
        acc = get_user(username)
        if not acc:
            return render_template("register.html", error="User could not be created in the database")

        session['username'] = username
        return redirect(url_for("home"))
    return render_template("register.html")

@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # store username and password as a variable
        username = request.form.get('username').strip().lower()
        password = request.form.get('password').strip()

        if not username or not password:
            return render_template('login.html', error="No username or password inputted")

        acc = get_user(username)

        if acc is None:
            return render_template("login.html", error="Username or password is incorrect")

        if check_password_hash(acc["password"], password):
            session["username"] = username
            return redirect(url_for("home"))
        else:
            return render_template("login.html", error="Username or password is incorrect")

    return render_template('login.html')

@app.route("/home", methods=['GET', 'POST'])
def home():
    if not "username" in session:
        return redirect(url_for("/login"))
    lobbies = game_lobbies.get_lobbies()
    return render_template('home.html',
                           username = session["username"],
                           lobbies = lobbies)

@app.route("/create_lobby", methods=['GET', 'POST'])
def create_lobby():
    if not "username" in session:
        return redirect(url_for("/login"))
    username = session["username"]
    # print(f"Session username: {username}")
    acc = get_user(username)
    # print(f"DB result: {acc}")
    lobby_id = str(uuid.uuid4().int)[:6]
    game_lobbies.create_lobby(acc["id"], username, lobby_id)
    return redirect(f"/lobby/{lobby_id}")

@app.route("/lobby/<lobby_id>", methods=['GET', 'POST'])
def lobby_route(lobby_id):
    if not "username" in session:
        return redirect(url_for("/login"))
    lobbies = game_lobbies.get_lobbies()
    if lobby_id not in lobbies:
        return redirect(url_for("home") + "?error=invalid_code")
    lobby_data = lobbies[lobby_id]
    players_ids = lobby_data['players']
    players = get_all_user(players_ids)
    acc = get_user(session["username"])
    is_host = acc["id"] == lobby_data["host"]
    return render_template('lobby.html',
                           lobby_id = lobby_id,
                           players_ids = players_ids,
                           players = players,
                           is_host = is_host)


@app.route("/profile", methods=['GET', 'POST'])
def profile():
    user = get_user(session["username"])
    return render_template('profile.html',
                           user = user)

@app.route("/game/<game_id>", methods=['GET', 'POST'])
def game(game_id):
    # session still per client gng
    # if not "timer" in session:
    #     session['timer'] = {}
    #     session["timer"][game_id]=60
        
    # timer = session['timer'][game_id]
    
    if not "username" in session:
        return redirect(url_for("/login"))
    username = session['username']
    acc = get_user(username)
    user_id = acc['id']

    game = game_lobbies.get_games()[game_id]
    time_left = int(game['duration'] - (time.time() - game['start_time']))
    phase = game['phase']
    return render_template('game.html',
                           username = username,
                           user_id = user_id,
                           game_id = game_id,
                           timer = time_left,
                           phase = phase,
                           prompt = game_lobbies.get_prompt(game_id, get_user(session["username"])["id"]))

@app.route("/error", methods=['GET', 'POST'])
def error():
    return render_template('error.html')

if __name__ == "__main__":
    app.debug = False
    host = "127.0.0.1"
    port = "5001"
    print(f"Flask app starting, served at http://{host}:{port}", flush=True)
    socketio.run(app, host = "0.0.0.0", port = 5001, debug=True, use_reloader=False)
