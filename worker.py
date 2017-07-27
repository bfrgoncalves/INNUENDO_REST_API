#!flask/bin/python

'''
Worker init file. 
Used to launch a default redis queue instance to listen when a classification or an addition to the profiles database is required
'''

import os
import redis
from rq import Worker, Queue, Connection
from config import REDIS_URL 

listen = ['default']

redis_url = os.getenv('REDISTOGO_URL', REDIS_URL)

conn = redis.from_url(redis_url)

if __name__ == '__main__':
    with Connection(conn):
    	#Launch the worker
        worker = Worker(map(Queue, listen))
        worker.work()