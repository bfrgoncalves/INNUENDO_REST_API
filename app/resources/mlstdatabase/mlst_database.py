from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask import jsonify

from flask_security import current_user, login_required, roles_required
import datetime

from job_processing.queue_processor import Queue_Processor

#Defining post arguments parser
database_get_search_parser = reqparse.RequestParser()
database_get_search_parser.add_argument('name', dest='name', type=str, required=True, help="strain name")
database_get_search_parser.add_argument('classifier', dest='classifier', type=str, required=True, help="lineage classification")
database_get_search_parser.add_argument('allelic_profile', dest='allelic_profile', type=str, required=True, help="allelic profile")

#Defining get arguments parser
job_get_search_parser = reqparse.RequestParser()
job_get_search_parser.add_argument('job_id', dest='job_id', type=str, required=True, help="redis job id")

#Defining post arguments parser
database_post_add_parser = reqparse.RequestParser()
database_post_add_parser.add_argument('name', dest='name', type=str, required=True, help="strain name")
database_post_add_parser.add_argument('classifier', dest='classifier', type=str, required=True, help="lineage classification")
database_post_add_parser.add_argument('max_closest', dest='max_closest', type=str, required=True, help="Number of closest strains")

#Defining get arguments parser
database_post_add_parser = reqparse.RequestParser()
database_post_add_parser.add_argument('mlst_search_id', dest='mlst_search_id', type=str, required=True, help="id of queue search")

database_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'classifier': fields.String
}

database_processor = Queue_Processor()

class DatabaseSearchResource(Resource):

	@login_required
	@marshal_with(database_fields)
	def get(self): 
		args=database_get_search_parser.parse_args()

		jobID = database_processor.search_on_db(args.name, args.max_closest)

		return jobID, 201


class DatabaseAddResource(Resource):

	@login_required
	@marshal_with(database_fields)
	def post(self): 
		args=database_post_add_parser.parse_args()

		jobID = database_processor.add_to_db(args.name, args.allelic_profile, args.classifier)

		return jobID, 201


class FetchJobResource(Resource):

	@login_required
	@marshal_with(database_fields)
	def get(self): 
		args=job_get_search_parser.parse_args()

		jobID = database_processor.fetch_job(args.job_id)

		return jobID, 201

