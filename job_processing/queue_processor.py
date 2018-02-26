from rq.job import Job  # Queue


# IMPORTING REDIS QUEUE CONNECTION
from app import q

import database_functions
import phyloviz_functions

from worker import conn

'''
Queue Processor functions:
    - Defining the Queue Processor class.
    - Defining the methods that send jobs to the redis queue. (send_to_phyloviz, classify_profile, fetch_job)
'''

# READ CONFIG FILE
config = {}
execfile("config.py", config)


class Queue_Processor:
    def send_to_phyloviz(self, job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest, user_id, species_id, missing_data, missing_char, phyloviz_user, phyloviz_pass, makePublic):
        job = q.enqueue_call(
            func=phyloviz_functions.send_to_phyloviz, args=(
            job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest, user_id,
            species_id, missing_data, missing_char, phyloviz_user, phyloviz_pass, makePublic,), result_ttl=5000
            )
        return job.get_id()

    def classify_profile(self, results, database_to_include, sample, new_job_id):
        job = q.enqueue_call(
        func=database_functions.classify_profile, args=(results, database_to_include, sample, new_job_id,), result_ttl=5000
        )
        return job.get_id()

    # Fetch a job from the queue to get their status later
    def fetch_job(self, job_key):
        job = Job.fetch(job_key, connection=conn)
        return job
