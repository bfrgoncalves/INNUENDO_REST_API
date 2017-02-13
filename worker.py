#!flask/bin/python
import os
import redis
from rq import Worker, Queue, Connection
from config import REDIS_URL 

listen = ['innuendo_jobs']

redis_url = os.getenv('REDISTOGO_URL', REDIS_URL)

conn = redis.from_url(redis_url)

if __name__ == '__main__':
    with Connection(conn):
        worker = Worker(map(Queue, listen))
        worker.work()