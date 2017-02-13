from app import app, db
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify

from job_processing.queue_processor import Queue_Processor

from flask.ext.security import current_user, login_required, roles_required, auth_token_required
import datetime

from rq import Queue #Queue
from redis import Redis

from config import CURRENT_ROOT, JOBS_ROOT

from app.models.models import Protocol
from app.models.models import Strain
import json
import requests

job_post_parser = reqparse.RequestParser()
job_post_parser.add_argument('protocol_ids', dest='protocol_ids', type=str, required=True, help="Protocols Ids")
job_post_parser.add_argument('strain_id', dest='strain_id', type=str, required=True, help="Protocols Ids")
#parameters -> workflow_id

job_get_parser = reqparse.RequestParser()
job_get_parser.add_argument('job_id', dest='job_id', type=str, required=True, help="Job id")

#get workflow, get protocols, get protocol parameters, run process


class Job_queue(Resource):
	
	@login_required
	def post(self):
		args = job_post_parser.parse_args()
		protocol_ids = args.protocol_ids.split(',')
		strain_id = args.strain_id
		data = []

		for protocol_id in protocol_ids:
			protocol = db.session.query(Protocol).filter(Protocol.id == protocol_id).first()
			strain = db.session.query(Strain).filter(Strain.id == strain_id).first()
			protocol.steps = protocol.steps.replace("'", '"')

			steps = json.loads(protocol.steps)
			fields = json.loads(strain.fields)
			metadata = json.loads(strain.strain_metadata)

			files = {}

			for x in fields['metadata_fields']:
				if 'File_' in x:
					files[x] = metadata[x]


			if 'used Parameter' in steps:
				data.append({'parameters':json.dumps(steps), 'username':str(current_user.username), 'files': json.dumps(files)})
				#print data
		request = requests.post(JOBS_ROOT, data={'data':json.dumps(data)})
		#print request.json()['jobID']
		return request.json()['jobID'], 200

	@login_required
	def get(self):
		args = job_get_parser.parse_args()
		request = requests.get(JOBS_ROOT, params={'job_id':args.job_id})
		results = request.json()
		if results != '':
			job_status = request.json().split('\t')
			job_status[1] = job_status[1].strip('\n')
			return job_status, 200
		else:
			return False

		


