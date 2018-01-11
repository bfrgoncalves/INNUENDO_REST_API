from app import app, db, dbconAg,dedicateddbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify, send_file, request
from app.utils.queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

from flask_security import current_user, login_required, roles_required, auth_token_required
import datetime

from rq import Queue #Queue
from redis import Redis

from config import CURRENT_ROOT, JOBS_ROOT, OUTPUT_URL
from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF
from franz.openrdf.vocabulary.xmlschema import XMLSchema
from franz.openrdf.query.query import QueryLanguage
from franz.openrdf.model import URI

from app.models.models import Protocol
from app.models.models import Strain
from app.models.models import Report
import json
import requests
import os
import string
import random
import subprocess

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
def add_data_to_db(results, sample, project_id, pipeline_id, process_position, username, user_id, procedure, species):

	report = db.session.query(Report).filter(Report.project_id == project_id, Report.pipeline_id == pipeline_id, Report.process_position == process_position).first()


	if "chewbbaca" in procedure:
		print "CLASSIFY"
		new_job_id = project_id + pipeline_id + process_position
		jobID = database_processor.classify_profile(results, species, sample, new_job_id)
	

	print procedure
	
	#job_id = 1

	if not report:
		report = Report(project_id=project_id, pipeline_id=pipeline_id, report_data=results, timestamp=datetime.datetime.utcnow(), user_id=user_id, username=username, sample_name=sample, process_position=process_position)
		if not report:
			abort(404, message="An error as occurried when uploading the data")

		db.session.add(report)
		db.session.commit()

		return True
	else:
		report.project_id=project_id
		report.pipeline_id=pipeline_id
		report.process_position=process_position
		report.report_data=results
		report.timestamp=datetime.datetime.utcnow()
		report.user_id=user_id
		report.username=username
		report.sample_name=sample

		db.session.commit()


	return True



class Job_Reports(Resource):

	def post(self):
		parameters = request.json
		try:
			parameters_json = json.loads(parameters.replace("'", '"'))
		except Exception as e:
			print e
			return 500
		
		json_data = parameters_json["report_json"]
		username = parameters_json["current_user_name"]
		user_id = parameters_json["current_user_id"]
		task = parameters_json["task"]
		workdir = parameters_json["workdir"]
		json_data["task"] = task
		json_data["workdir"] = workdir

		is_added = add_data_to_db(json_data, parameters_json["sample_name"], parameters_json["project_id"], parameters_json["pipeline_id"], parameters_json["process_id"],  username, user_id, json_data["task"], parameters_json["species"])

		return True


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

		job_ids = args.job_id.split(",")
		process_ids = args.process_id.split(",")
		store_jobs_in_db = []
		all_results = []
		all_std_out = []
		all_paths = []

		for k in range(0, len(job_ids)):

			job_id = job_ids[k]
			process_id = process_ids[k]
			from_process_controller = args.from_process_controller
			print "JOB", job_id

			go_to_pending = False

			results = [[],[]]
			store_in_db = False

			final_status = ""

			print '--project ' + args.project_id + ' --pipeline ' + args.pipeline_id + ' --process ' + process_id + ' -t status'

			try:
				procStr = localNSpace + "projects/" + str(args.project_id) + "/pipelines/" + str(args.pipeline_id) + "/processes/" + str(args.process_id)
				queryString = "SELECT (str(?typelabel) as ?label) (str(?file1) as ?file_1) (str(?file2) as ?file_2) (str(?file3) as ?file_3) (str(?status) as ?statusStr) WHERE{<"+procStr+"> obo:RO_0002234 ?in. ?in a ?type.?type rdfs:label ?typelabel. OPTIONAL { ?in obo:NGS_0000092 ?file1; obo:NGS_0000093 ?file2; obo:NGS_0000094 ?file3. } OPTIONAL {?in obo:NGS_0000097 ?status.} }"

				tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
				result = tupleQuery.evaluate()
				
				jsonResult=parseAgraphQueryRes(result,["statusStr"])

				result.close()

				if "pass" in jsonResult[0]["statusStr"]:
					#print "STATUS", jsonResult[0]["statusStr"]
					final_status = "COMPLETED"
					#sys.stdout.write("COMPLETED")
				elif "None" in jsonResult[0]["statusStr"]:
					final_status = "PD"
					#sys.stdout.write("PD")
				elif "running" in jsonResult[0]["statusStr"]:
					final_status = "R"
					#sys.stdout.write("R")
				elif "pending" in jsonResult[0]["statusStr"]:
					final_status = "PD"
					#sys.stdout.write("PD")
				elif "warning" in jsonResult[0]["statusStr"]:
					final_status = "WARNING"
					#sys.stdout.write("WARNING")
				elif "fail" in jsonResult[0]["statusStr"]:
					final_status = "FAILED"
					#sys.stdout.write("FAILED")
				elif "error" in jsonResult[0]["statusStr"]:
					final_status = "FAILED"
					#sys.stdout.write("FAILED")
			except Exception as e:
				final_status = "NEUTRAL"
				#sys.stdout.write("NEUTRAL")


			stdout = job_id + '\t' + final_status

			all_std_out.append(stdout)
			store_jobs_in_db.append(store_in_db)
			all_results.append(results[0])
			all_paths.append(results[1])

		print len(all_std_out), len(store_jobs_in_db), len(all_results), len(all_paths)

		results = {'stdout':all_std_out, 'store_in_db':store_jobs_in_db, 'results':all_results, 'paths':all_paths, 'job_id': job_ids}

		#request = requests.get(JOBS_ROOT, params={'job_id':args.job_id, 'username':str(username), 'pipeline_id':args.pipeline_id, 'project_id':args.project_id, 'process_id':args.process_position, 'from_process_controller':from_process_controller, 'homedir': homedir})
		#results = request.json()

		procedure_names = args.procedure_name.split(",")
		process_positions = args.process_position.split(",")
		all_jobs_status = []

		if results != '':

			for k in range(0, len(results['stdout'])):
				job_status = results['stdout'][k].split('\t')
				if len(job_status) == 1:
					return ["null", "null"]
				job_status[1] = job_status[1].strip('\n')
				job_status[0] = results['job_id'][k]

				if from_process_controller == 'true':
					job_status[1] = "COMPLETED"
					results['store_in_db'][k] = True

				'''if from_process_controller == 'true' and results['store_in_db'][k] == True:
					added, job_id = add_data_to_db(results['job_id'][k], results['results'][k], user_id, procedure_names[k], args.sample_name, args.pipeline_id, process_positions[k], args.project_id, args.database_to_include, username)
				'''
				#if results['store_in_db'] == True:
				#	added, job_id = add_data_to_db(results['job_id'], results['results'], user_id, args.procedure_name, args.sample_name, args.pipeline_id, args.process_position, args.project_id, args.database_to_include, username)
				all_jobs_status.append(job_status)

			return all_jobs_status, 200
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
		args = job_classify_chewbbaca_post_parser.parse_args()
		database_processor.classify_profile(args.job_id, args.database_to_include)


#Load job results to display on graphical interface
class Job_Result_Download(Resource):

	#@login_required
	def get(self):
		args = job_download_results_get_parser.parse_args()
		print JOBS_ROOT + 'results/download/'
		local_filename = 'app/results/'+''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(5)) + '.txt'
		response = requests.get(JOBS_ROOT + 'results/download/', params={'file_path':args.file_path}, stream=True)

		with open(local_filename, 'wb') as f:
			for chunk in response.iter_content(chunk_size=1024): 
				if chunk: # filter out keep-alive new chunks
					f.write(chunk)

		return local_filename


#Load job results to display on graphical interface
class Job_Result_Download_click(Resource):

	def get(self):
		args = job_download_results_get_parser.parse_args()
		try:
			local_filename = '/'.join(args.file_path.split('/')[-2:])
			response = send_file(local_filename, as_attachment=True)
			response.headers.add('Access-Control-Allow-Origin', '*')
			response.headers.add('Content-Type', 'application/force-download')
			#os.remove(local_filename)
			return response
		except Exception as e:
			print e
			#self.Error(400)
			return 404