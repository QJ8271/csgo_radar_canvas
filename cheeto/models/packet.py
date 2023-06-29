from pydantic import BaseModel
from cheeto.models.player import Player
from cheeto.models.map import Map
from cheeto.models.status import Status
from typing import List


class Packet(BaseModel):
    players: List[Player] = []
    map: Map = None
    status: Status


