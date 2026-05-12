from flask_socketio import SocketIO

class lobby:
    def __init__(self, socketIO):
        self.lobbies = {}

    def create_lobby(self, user_id, lobby_id):
        self.lobbies[lobby_id] = {
            players = [user_id],
            host = [user_id]
        }

    def join_lobby(self, user_id, lobby_id):
        self.lobbies[lobby_id][]

    @socketio.on('lobby')
    def lobby(id):
    print("We are in new lobby maybe "+str(id))
    emit('chat', lobby['id'], broadcast=True, to=lobby['id'])

    @socketio.on('join')
    def on_join(data):
        username = data['username']
        room = data['room']
        join_room(room)
        send(username + ' has entered the room.', to=room)

    @socketio.on('leave')
    def on_leave(data):
        username = data['username']
        room = data['room']
        leave_room(room)
        send(username + ' has left the room.', to=room)
