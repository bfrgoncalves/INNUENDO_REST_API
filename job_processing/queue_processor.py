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

#READ CONFIG FILE
config = {}
execfile("config.py", config)

class Queue_Processor:

	def search_on_db(self, strain_id, closest_number):
		#PERFORM QUERY ON DATABSE FOR THE PROFILE AND RUN ALEXANDREs SEARCHES
		#RETURN IDS OF CLOSEST
		job = q.enqueue_call(
            func=database_functions.search_on_database, args=(strain_id, closest_number), result_ttl=5000
        )

		return job.get_id()

	def send_to_phyloviz(self, job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest, user_id, species_id):
		#PERFORM QUERY ON DATABSE FOR THE PROFILE AND RUN ALEXANDREs SEARCHES
		#RETURN IDS OF CLOSEST
		print "PASSOU"
		print job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest
		job = q.enqueue_call(
			func=phyloviz_functions.send_to_phyloviz, args=(job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest, user_id,species_id,), result_ttl=5000
		)
		print job.get_id()
		return job.get_id()

	def add_to_db(self, strain_id, profile_object, classifier):
		#ADD PROFILE TO DATABASE
		job = q.enqueue_call(
            func=database_functions.add_to_database, args=(strain_id, profile_object, classifier), result_ttl=5000
        )
		return job.get_id()

	def classify_profile(self, strain_id, profile_object):
		#RETURNS THE CLASSIFIER FOR A GIVEN PROFILE
		job = q.enqueue_call(
            func=database_functions.classify_profile, args=(strain_id, profile_object), result_ttl=5000
        )
		return job.get_id()

	def fetch_job(self, job_key):
		#GETS THE JOB STATUS
		job = Job.fetch(job_key, connection=conn)
		return job
		