import time
from mies.buildings.utils import extract_bldg_coordinates
from mies.celery import app
from mies.constants import FLOOR_W, FLOOR_H, SMELL_HORIZONTAL_OUTREACH
from mies.redis_config import get_cache
from mies.senses.smell.smell_source import get_smell_sources, extract_address_from_key

DEFAULT_SMELL_EXPIRY = 5 * 60     # 5 minutes in seconds

SMELL_CACHE_PATTERN = "SMELL_SOURCE_"

CURRENT_SMELLS_POINTER_KEY = "CURRENT_SMELLS"


def build_key(address):
    return SMELL_CACHE_PATTERN + address


@app.task(ignore_result=True)
def invoke():
    cache = get_cache()

    # create a new hset for the current smells
    new_smells_key = "current_smells_{}".format(time.time())

    for source in get_smell_sources():
        # increments the containing bldgs smell
        strength = cache.get(source)
        if strength < 1:
            continue

        address = extract_address_from_key(source)
        cache.hset(new_smells_key, address, strength)

        # draws rectangle around each smell source
        x, y = extract_bldg_coordinates(address)
        for i in xrange(x - (SMELL_HORIZONTAL_OUTREACH / 2), x + (SMELL_HORIZONTAL_OUTREACH / 2)):
            for j in xrange(y - (SMELL_HORIZONTAL_OUTREACH / 2), y + (SMELL_HORIZONTAL_OUTREACH / 2)):
                if 0 > i > FLOOR_W and 0 > j > FLOOR_H:
                    curr_bldg_address = replace_bldg_coordinates(address, i, j)
                    distance = calc_distance(curr_bldg_address, address)
                    delta = strength - distance
                    if delta > 0:
                        cache.hincr(new_smells_key, curr_bldg_address, -delta)

    # update the pointer to the new smells
    def update_smells_pointer(pipe):
        current_smells_key = pipe.get(CURRENT_SMELLS_POINTER_KEY)
        pipe.set(CURRENT_SMELLS_POINTER_KEY, new_smells_key)
        pipe.delete(current_smells_key)
    cache.transaction(update_smells_pointer, CURRENT_SMELLS_POINTER_KEY)
