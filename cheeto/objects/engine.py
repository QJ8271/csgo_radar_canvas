import ctypes

from cheeto.globals import memory, offsets
from ctypes import c_uint32, c_int8
from cheeto.objects.entity import Entity
from internal.objects.vector3 import Vector3
from ctypes import c_float

class Engine:
    def __init__(self):
        self.clientState = memory.read_ptr(offsets.engine + offsets.dwClientState)

    def get_local_player(self):
        localPlayerIndex = memory.read_ptr(self.clientState + offsets.dwClientState_GetLocalPlayer, ignore_null=True)
        return Entity.get_client_entity(localPlayerIndex)

    def get_player_info(self, index):
        player_info_table = memory.read_ptr(self.clientState + offsets.dwClientState_PlayerInfo)
        x = memory.read_ptr_chain(player_info_table, [0x40, 0xC])
        return memory.read_ptr(x + 0x28 + 0x34 * index)
        
    def get_view_angle(self):
        vec_angle = memory.read_ptr(self.clientState + offsets.dwClientState_ViewAngles)
        return Vector3(
            float(memory.read(vec_angle, c_float)),
            float(memory.read(vec_angle + 0x4, c_float)),
            float(memory.read(vec_angle + 0x8, c_float))
        )

    def get_map_name(self):
        return str(memory.read(self.clientState + offsets.dwClientState_Map, ctypes.create_string_buffer(128)))

    """@staticmethod
    def get_view_angles():
        return mem.read_vec3(nv.dwClientState + nv.dwViewAngles)"""

    def get_max_clients(self):
        return memory.read_ptr(self.clientState + offsets.dwClientState_MaxPlayer)

    def is_in_game(self):
        return int(memory.read(self.clientState + offsets.dwClientState_State, c_int8)) >> 2
