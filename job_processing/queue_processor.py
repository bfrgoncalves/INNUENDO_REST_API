from rq import Queue #Queue
from rq.job import Job #Queue
from redis import Redis
import subprocess
import os
import shlex
import json
import random
import string

#IMPORTING REDIS QUEUE CONNECTION
from app import q

import database_functions
import phyloviz_functions

from worker import conn

'''
Queue Processor functions:
	- Defining the Queue Processor class.
	- Defining the methods that send jobs to the redis queue. (send_to_phyloviz, classify_profile, fetch_job)
'''

#READ CONFIG FILE
config = {}
execfile("config.py", config)

class Queue_Processor:

	def send_to_phyloviz(self, job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest, user_id, species_id, missing_data, missing_char):
		job = q.enqueue_call(
			func=phyloviz_functions.send_to_phyloviz, args=(job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest, user_id,species_id,missing_data, missing_char,), result_ttl=5000
		)
		return job.get_id()

	def classify_profile(self, job_id, database_to_include):
		job = q.enqueue_call(
			func=database_functions.classify_profile, args=(job_id, database_to_include, ), result_ttl=5000
		)
		return job.get_id()

	#Fetch a job from the queue to get their status later
	def fetch_job(self, job_key):
		job = Job.fetch(job_key, connection=conn)
		return job
		