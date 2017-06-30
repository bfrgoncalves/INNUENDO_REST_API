from rq import Queue #Queue
from redis import Redis
import subprocess
import os
import shlex
import json
import random
import string

from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella

#READ CONFIG FILE
config = {}
execfile("config.py", config)

redis_conn = Redis()
q = Queue('database_jobs', connection=redis_conn)

class Queue_Processor:

	def search_on_db(self, strain_id, closest_number):
		#PERFORM QUERY ON DATABSE FOR THE PROFILE AND RUN ALEXANDREs SEARCHES
		#RETURN IDS OF CLOSEST
		return "SEARCH"

	def add_to_db(self, strain_id, profile_object, classifier):
		#ADD PROFILE TO DATABASE
		return "ADD"

	def classify_profile(self, strain_id, profile_object):
		#RETURNS THE CLASSIFIER FOR A GIVEN PROFILE
		return "CLASSIFY"
		