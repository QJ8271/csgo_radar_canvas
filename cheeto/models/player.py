from pydantic import BaseModel
from internal.objects.vector3 import Vector3


class Player(BaseModel):
    steam_id: str
    name: str
    team: str
    health: int
    position: Vector3 | None
    isLocalPlayer: bool
    #is_dormant: bool
