from flask_socketio import SocketIO

class lobby:
    start = False
    game_count = 0
    def __init__(self, socketIO):
        self.lobbies = {}
        self.games = {}

    def create_lobby(self, host_id, lobby_id):
        self.lobbies[lobby_id] = {
            players = [host_id],
            host = [host_id]
        }

    def create_game(self, host_id, game_id):
        self.games[game_id] = {
            players = [host_id],
            host = [host_id]
        }

    def join_lobby(self, user_id, lobby_id):
        if lobby_id in self.lobbies:
            self.lobbies[lobby_id][players].append(user_id)
            socketio.emit('join', {'data': {'userID': user_id, 'room': lobby_id}})

    def start_lobby(self, lobby_id):
        create_game(self, self.lobbies[lobby_id][host], lobby_id)
        game_count += 1
        game_id = game_count
        socketio.emit('start', {'data': {'userIDs': self.lobbies[lobby_id][players], 'room': game_id}})

    @socketio.on('start')
    def join_game(data):
        print("Game starting now "+str(id))
        room = data['room']
        for id in data['userIDs']:
            join_room(room)
            send(userID + ' has entered the game')

    @socketio.on('join')
    def on_join(data):
        userID = data['userID']
        room = data['room']
        join_room(room)
        send(userID + ' has entered the lobby.', to=room)
    #
    # @socketio.on('leave')
    # def on_leave(data):
    #     username = data['username']
    #     room = data['room']
    #     leave_room(room)
    #     send(username + ' has left the room.', to=room)
