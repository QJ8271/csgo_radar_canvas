import logging, sys, ctypes,json
sys.path.append("..")
from flask import Flask, render_template, request
from flask_socketio import SocketIO
from threading import Lock
from cheeto.globals import memory, offsets
from cheeto.objects.engine import Engine
from cheeto.objects.entity import Entity
from internal.memwrapper.exceptions import NullPointerError
from cheeto.models.packet import Packet
from cheeto.models.player import Player
from cheeto.models.map import Map
from cheeto.models.status import Status

"""
disables logging
"""
logging.getLogger("werkzeug").disabled = False

"""
Background Thread
"""
thread = None
thread_lock = Lock()

app = Flask(__name__)
# Don't hard code this if you are making this public
app.config['SECRET_KEY'] = 'donsky!'
socketio = SocketIO(app, cors_allowed_origins='*')

def main_game_thread():

    def log(*args):
        print(' '.join(map(str, args)))
    offsets.client = memory.module_from_name("client.dll")
    offsets.engine = memory.module_from_name("engine.dll")

    previously_in_game = False
    players = {
        #: steam_id: Player
    }
    
    while True:
        
        socketio.sleep(0.0025) 
        engine = Engine()
        if engine.is_in_game():
            try:
                x = engine.get_view_angle()
            except Exception as e:
                print(e)
            if not previously_in_game:
                log("[+] Game started!")
                previously_in_game = True

                data = Packet(map=Map(name=engine.get_map_name()),status=Status(status="game_started")).json()
                socketio.emit('updateData', {'data': data})

            try:
                localPlayer = engine.get_local_player()
            except NullPointerError:
                log("[-] Local player is null")
                continue

            #: Get all players in game
            players_to_send = []
            for index in range(0, engine.get_max_clients()):
                try:
                    player = Entity.get_client_entity(index)
                except NullPointerError:
                    continue

                if player.address == 0:
                    continue

                isLocalPlayer = player.address == localPlayer.address

                is_dormant = player.is_dormant()

                name = str(memory.read(engine.get_player_info(index) + 0x10, ctypes.create_string_buffer(128)))
                steam_id = str(memory.read(engine.get_player_info(index) + 0x94, ctypes.create_string_buffer(20)))
                health = player.get_health()

                if steam_id == "BOT":
                    name = ' '.join([steam_id, name])
                    steam_id = name

                try:
                    weapon_id = player.get_weapon_id()
                except NullPointerError:
                    weapon_id = 0

                team = player.get_team_number()

                try:
                    position = player.get_bone_pos(10)
                except NullPointerError:
                    position = None

                packet_player = Player(
                        steam_id=steam_id,
                        name=name,
                        team=team,
                        health=health,
                        position=position,
                        weapon_id=weapon_id,
                        isLocalPlayer=isLocalPlayer,
                        is_dormant=is_dormant
                    )
                
                if steam_id not in players.keys():
                    #log("[+] Found player: 0x%X, health: %d, position: %s, name: %s" % (
                    #    player.address, health, position, name))

                    players[steam_id] = packet_player
                    players_to_send.append(packet_player)
                else:
                    previous_player = players[steam_id].copy()
                    players[steam_id].health = health
                    players[steam_id].name = name
                    players[steam_id].team = packet_player.team
                    players[steam_id].position = packet_player.position
                    players[steam_id].weapon_id = weapon_id
                    players[steam_id].is_dormant = is_dormant

                    if previous_player.dict() != players[steam_id].dict():
                        #log("[+] Player updated: 0x%X, health: %d, position: %s, name: %s" % (
                        #    player.address, health, position, name))
                        players_to_send.append(players[steam_id])
                
            if len(players_to_send) > 0:
                data = Packet(players=players_to_send,status=Status(status="players_updated")).json()
                local_y = engine.get_view_angle()
                socketio.emit('updateData', {"data":data,"local_yaw":local_y.y})
        else:
            if previously_in_game:
                log("[+] Game ended!")
                previously_in_game = False
                players = {}

            socketio.sleep(3)
            log("[+] Waiting for game to start...")
            continue



"""
Serve root index file
"""
@app.route('/')
def index():
    return render_template('index.html')

"""
Decorator for connect
"""
@socketio.on('connect')
def connect():
    print(f'Client connected at {request.remote_addr}')
    global thread
    with thread_lock:
        if thread is None:
            socketio.start_background_task(main_game_thread)

"""
Decorator for disconnect
"""
@socketio.on('disconnect')
def disconnect():
    print('Client disconnected',  request.sid)

if __name__ == '__main__':
    socketio.run(app, port=8080, host='0.0.0.0', debug=False, use_reloader=False)



