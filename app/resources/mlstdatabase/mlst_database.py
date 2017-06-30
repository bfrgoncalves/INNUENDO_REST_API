from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask import jsonify

from flask_security import current_user, login_required, roles_required
import datetime

from job_processing.queue_processor import Queue_Processor

#Defining post arguments parser
project_post_search_parser = reqparse.RequestParser()
project_post_search_parser.add_argument('name', dest='name', type=str, required=True, help="strain name")
project_post_search_parser.add_argument('classifier', dest='classifier', type=str, required=True, help="lineage classification")
project_post_search_parser.add_argument('allelic_profile', dest='allelic_profile', type=str, required=True, help="allelic profile")

#Defining get arguments parser
project_post_search_parser = reqparse.RequestParser()
project_post_search_parser.add_argument('mlst_search_id', dest='mlst_search_id', type=str, required=True, help="id of queue search")

#Defining post arguments parser
project_post_add_parser = reqparse.RequestParser()
project_post_add_parser.add_argument('name', dest='name', type=str, required=True, help="strain name")
project_post_add_parser.add_argument('classifier', dest='classifier', type=str, required=True, help="lineage classification")
project_post_add_parser.add_argument('max_closest', dest='max_closest', type=str, required=True, help="Number of closest strains")

#Defining get arguments parser
project_post_add_parser = reqparse.RequestParser()
project_post_add_parser.add_argument('mlst_search_id', dest='mlst_search_id', type=str, required=True, help="id of queue search")

database_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'classifier': fields.String
}

class DatabaseSearchResource(Resource):

	#@marshal_with(workflow_fields)
	def get(self): 
		return 200

	#@marshal_with(workflow_fields)
	def post(self): 
		args=project_post_search_parser.parse_args()

		database_processor = Queue_Processor()
		jobID = innuendo_processor.search_on_db(args.name, args.max_closest)

		return jobID, 201

	#@marshal_with(workflow_fields)
	def put(self): 
		return 202

class DatabaseAddResource(Resource):

	#@marshal_with(workflow_fields)
	def get(self): 
		return 200

	#@marshal_with(workflow_fields)
	def post(self): 
		args=project_post_parser.parse_args()

		database_processor = Queue_Processor()
		jobID = innuendo_processor.add_to_db(args.name, args.allelic_profile, args.classifier)

		return jobID, 201

	#@marshal_with(workflow_fields)
	def put(self): 
		return 202