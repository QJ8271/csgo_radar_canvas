from cheeto.objects.player import Player
from cheeto.globals import memory, offsets


class Entity:
    @staticmethod
    def get_client_entity(index) -> Player:
        return Player(memory.read_ptr(offsets.client + offsets.dwEntityList + 0x10 * index))
