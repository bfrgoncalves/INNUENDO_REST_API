from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify

from flask_security import current_user, login_required, roles_required, auth_token_required
import datetime

from rq import Queue #Queue
from redis import Redis

from config import CURRENT_ROOT, JOBS_ROOT, OUTPUT_URL

from app.models.models import Protocol
from app.models.models import Strain
from app.models.models import Report
import json
import requests
import os

from job_processing.queue_processor import Queue_Processor

'''
Jobs resources:
	- send job to slurm
	- add results to database
	- classify profile using fast-mlst
'''

job_post_parser = reqparse.RequestParser()
job_post_parser.add_argument('protocol_ids', dest='protocol_ids', type=str, required=True, help="Protocols Ids")
job_post_parser.add_argument('strain_id', dest='strain_id', type=str, required=True, help="Protocols Ids")
job_post_parser.add_argument('pipeline_id', dest='pipeline_id', type=str, required=True, help="Pipeline identifier")
job_post_parser.add_argument('project_id', dest='project_id', type=str, required=True, help="project id")
job_post_parser.add_argument('process_id', dest='process_id', type=str, required=True, help="process id")
job_post_parser.add_argument('strain_submitter', dest='strain_submitter', type=str, required=True, help="strain_submitter id")
job_post_parser.add_argument('current_specie', dest='current_specie', type=str, required=True, help="current specie")
job_post_parser.add_argument('sampleName', dest='sampleName', type=str, required=True, help="Sample Name")
#parameters -> workflow_id
job_get_parser = reqparse.RequestParser()
job_get_parser.add_argument('job_id', dest='job_id', type=str, required=True, help="Job id")
job_get_parser.add_argument('procedure_name', dest='procedure_name', type=str, required=True, help="Procedure name")
job_get_parser.add_argument('sample_name', dest='sample_name', type=str, required=True, help="Sample name")
job_get_parser.add_argument('process_position', dest='process_position', type=str, required=True, help="Position of the process")
job_get_parser.add_argument('pipeline_id', dest='pipeline_id', type=str, required=True, help="Pipeline identifier")
job_get_parser.add_argument('project_id', dest='project_id', type=str, required=True, help="project id")
job_get_parser.add_argument('process_id', dest='process_id', type=str, required=True, help="process id")
job_get_parser.add_argument('homedir', dest='homedir', type=str, required=True, help="home dir")
job_get_parser.add_argument('database_to_include', dest='database_to_include', type=str, required=True, help="Database to use if required")
job_get_parser.add_argument('current_user_name', dest='current_user_name', type=str, required=True, help="Current user name")
job_get_parser.add_argument('current_user_id', dest='current_user_id', type=str, required=True, help="current user id")
job_get_parser.add_argument('from_process_controller', dest='from_process_controller', type=str, required=True, help="is the request from the process controller?")

job_results_get_parser = reqparse.RequestParser()
job_results_get_parser.add_argument('job_id', dest='job_id', type=str, required=True, help="Job id")

job_download_results_get_parser = reqparse.RequestParser()
job_download_results_get_parser.add_argument('file_path', dest='file_path', type=str, required=True, help="Job Path")

job_classify_chewbbaca_post_parser = reqparse.RequestParser()
job_classify_chewbbaca_post_parser.add_argument('job_id', dest='job_id', type=str, required=True, help="Job ID")
job_classify_chewbbaca_post_parser.add_argument('database_to_include', dest='database_to_include', type=str, required=True, help="Database to include")


database_processor = Queue_Processor()

#Add job data to db
def add_data_to_db(job_id, results, user_id, procedure,sample, pipeline_id, process_position, project_id, database_to_include, username):

	report = db.session.query(Report).filter(Report.project_id == project_id, Report.pipeline_id == pipeline_id, Report.process_position == process_position).first()


	if "chewBBACA" in procedure:
		print "CLASSIFY"
		jobID = database_processor.classify_profile(job_id, database_to_include)


	if not report:
		report = Report(project_id=project_id, pipeline_id=pipeline_id, process_position=process_position, report_data=results, job_id=job_id, timestamp=datetime.datetime.utcnow(), user_id=user_id, username=username, procedure=procedure, sample_name=sample)
		if not report:
			abort(404, message="An error as occurried when uploading the data")

		db.session.add(report)
		db.session.commit()

		return True, job_id
	else:
		print report.job_id, job_id
		if report.job_id == job_id:
			if results:
				report.report_data=results
				db.session.commit()
			return False, job_id
		else:
			report.pipeline_id=pipeline_id
			report.process_position=process_position
			report.report_data=results
			report.job_id=job_id
			report.timestamp=datetime.datetime.utcnow()
			report.user_id=user_id
			report.username=username
			report.procedure=procedure
			report.sample_name=sample
			report.project_id=project_id

			db.session.commit()

			return True, job_id


#Run jobs using slurm and get job status
class Job_queue(Resource):

	@login_required
	def post(self):
		args = job_post_parser.parse_args()
		protocol_ids = args.protocol_ids.split(',')
		process_ids = args.process_id.split(',')
		strain_id = args.strain_id
		data = []
		to_send = []

		counter = 0;
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
				data.append({'parameters':json.dumps(steps), 'username':str(current_user.username), 'strain_submitter': args.strain_submitter,'files': json.dumps(files), 'project_id': args.project_id, 'pipeline_id': args.pipeline_id, 'process_id':process_ids[counter]})
			else:
				to_send.append("null")
				#print data
			counter += 1

		request = requests.post(JOBS_ROOT, data={'data':json.dumps(data), 'homedir':current_user.homedir, 'current_specie':args.current_specie, 'sampleName':args.sampleName, 'current_user_id':str(current_user.id), 'current_user_name':str(current_user.username)})
		to_send.append(request.json()['jobID'])

		return to_send, 200

	def get(self):
		args = job_get_parser.parse_args()
		username = args.current_user_name
		user_id = args.current_user_id
		from_process_controller = args.from_process_controller
		homedir = args.homedir
		request = requests.get(JOBS_ROOT, params={'job_id':args.job_id, 'username':str(username), 'pipeline_id':args.pipeline_id, 'project_id':args.project_id, 'process_id':args.process_position, 'from_process_controller':from_process_controller, 'homedir': homedir})
		results = request.json()

		if results != '':
			job_status = results['stdout'].split('\t')
			if len(job_status) == 1:
				return ["null", "null"]
			job_status[1] = job_status[1].strip('\n')
			job_status[0] = args.job_id

			if from_process_controller == 'true':
				job_status[1] = "COMPLETED"
				results['store_in_db'] = True

			if results['store_in_db'] == True:
				added, job_id = add_data_to_db(results['job_id'], results['results'], user_id, args.procedure_name, args.sample_name, args.pipeline_id, args.process_position, args.project_id, args.database_to_include, username)

			return job_status, 200
		else:
			return False

#Load job results to display on graphical interface
class Job_results(Resource):

	@login_required
	def get(self):
		args = job_results_get_parser.parse_args()
		report = db.session.query(Report).filter(Report.job_id == args.job_id).first()
		return report.report_data


#Load job results and classify it
class Job_classify_chewbbaca(Resource):

	def get(self):
		print "AQUI!!!! CLASSIFIER"
		args = job_classify_chewbbaca_post_parser.parse_args()
		print args.job_id, args.database_to_include
		database_processor.classify_profile(args.job_id, args.database_to_include)


#Load job results to display on graphical interface
class Job_Result_Download(Resource):

	@login_required
	def get(self):
		args = job_download_results_get_parser.parse_args()
		print JOBS_ROOT + 'results/download/'
		local_filename = file_path.split('/')[-1]
		response = requests.get(JOBS_ROOT + 'results/download/', params={'file_path':args.file_path}, stream=True)

		with open(local_filename, 'wb') as f:
	        for chunk in response.iter_content(chunk_size=1024): 
	            if chunk: # filter out keep-alive new chunks
	                f.write(chunk)
	                
		return 200