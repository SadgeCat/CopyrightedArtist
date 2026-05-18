from flask_socketio import SocketIO, join_room, emit

socketio = SocketIO()

class lobby:
    start = False
    game_count = 0

    def __init__(self):
        self.lobbies = {}
        self.games = {}

    def get_lobbies(self):
        return self.lobbies

    def get_games(self):
        return self.games

    def create_lobby(self, host_id, host_name, lobby_id):
        self.lobbies[lobby_id] = {
            'players': [host_id],
            'host': host_id,
            'host_name': host_name
        }

    def create_game(self, host_id, host_name, game_id):
        self.games[game_id] = {
            'players' : [host_id],
            'host' : host_id,
            'host_name': host_name
        }

    def join_lobby(self, user_id, lobby_id):
        if lobby_id in self.lobbies:
            if user_id not in self.lobbies[lobby_id]['players']:
                self.lobbies[lobby_id]['players'].append(user_id)

    def start_lobby(self, lobby_id):
        self.create_game(self.lobbies[lobby_id]['host'], self.lobbies[lobby_id]['host_name'], lobby_id)
        self.game_count += 1