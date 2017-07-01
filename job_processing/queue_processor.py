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

from job_processing.database_functions import search_on_database, add_to_database, classify_profile
from job_processing.phyloviz_functions import send_to_phyloviz

from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella

from worker import conn

#READ CONFIG FILE
config = {}
execfile("config.py", config)

class Queue_Processor:

	def search_on_db(self, strain_id, closest_number):
		#PERFORM QUERY ON DATABSE FOR THE PROFILE AND RUN ALEXANDREs SEARCHES
		#RETURN IDS OF CLOSEST
		job = q.enqueue_call(
            func=search_on_database, args=(strain_id, closest_number), result_ttl=5000
        )

		return job.get_id()

	def send_to_phyloviz(self, job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest):
		#PERFORM QUERY ON DATABSE FOR THE PROFILE AND RUN ALEXANDREs SEARCHES
		#RETURN IDS OF CLOSEST
		print "PASSOU"
		print job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest
		job = q.enqueue(func=send_to_phyloviz, args=(job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest,))
		print job.get_id()
		return job.get_id()

	def add_to_db(self, strain_id, profile_object, classifier):
		#ADD PROFILE TO DATABASE
		job = q.enqueue_call(
            func=add_to_database, args=(strain_id, profile_object, classifier), result_ttl=5000
        )
		return job.get_id()

	def classify_profile(self, strain_id, profile_object):
		#RETURNS THE CLASSIFIER FOR A GIVEN PROFILE
		job = q.enqueue_call(
            func=classify_profile, args=(strain_id, profile_object), result_ttl=5000
        )
		return job.get_id()

	def fetch_job(self, job_key):
		#GETS THE JOB STATUS
		job = Job.fetch(job_key, connection=conn)
		if job.is_finished:
			return str(job.result), 200
		elif job.is_failed:
			return str(job.result), 200
		else:
			return "Nay!", 202
		