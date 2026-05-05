class lobby:
    def __init__(self):
        self.lobbies = {}

    def create_lobby(self, user_id, lobby_id):
        self.lobbies[lobby_id] = {
            players = [user_id],
            host = [user_id]
        }

    def join_lobby(self, user_id, lobby_id):
        self.lobbies[lobby_id][]
