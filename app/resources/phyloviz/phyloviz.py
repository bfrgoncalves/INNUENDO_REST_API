from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify

from flask_security import current_user, login_required, roles_required, auth_token_required
import datetime

from config import CURRENT_ROOT, JOBS_ROOT

from app.models.models import Protocol
from app.models.models import Strain
from app.models.models import Report
from app.models.models import Tree
import json
import requests
import subprocess
import random
import string

from job_processing.queue_processor import Queue_Processor

'''
PHYLOViZ Online routes:
	- Send data to the redis queue to send to phyloviz
	- Get the available trees for a given user from the postgres database
'''

phyloviz_post_parser = reqparse.RequestParser()

phyloviz_post_parser.add_argument('job_ids', dest='job_ids', type=str, required=True, help="job ids of chewBBACA results from the platform")
phyloviz_post_parser.add_argument('dataset_name', dest='dataset_name', type=str, required=True, help="dataset name")
phyloviz_post_parser.add_argument('species_id', dest='species_id', type=str, required=True, help="sppecies id")
phyloviz_post_parser.add_argument('dataset_description', dest='dataset_description', type=str, required=True, help="dataset description")
phyloviz_post_parser.add_argument('additional_data', dest='additional_data', type=str, required=True, help="additional metadata")
phyloviz_post_parser.add_argument('database_to_include', dest='database_to_include', type=str, required=False, default="None", help="Database to include on the analysis if required")
phyloviz_post_parser.add_argument('max_closest', dest='max_closest', type=str, required=False, default="None", help="Maximum number of database strains to include")
phyloviz_post_parser.add_argument('missing_data', dest='missing_data', type=str, required=False, default="None", help="If has missing data")
phyloviz_post_parser.add_argument('missing_char', dest='missing_char', type=str, required=False, default="None", help="missing character")
phyloviz_post_parser.add_argument('phyloviz_user', dest='phyloviz_user', type=str, required=True, default="None", help="phyloviz_user")
phyloviz_post_parser.add_argument('phyloviz_pass', dest='phyloviz_pass', type=str, required=True, default="None", help="phyloviz_pass")
phyloviz_post_parser.add_argument('makePublic', dest='makePublic', type=str, required=True, default="None", help="make public")
phyloviz_post_parser.add_argument('user_id', dest='user_id', type=str, required=False, default="None", help="user id")
#Load job results to display on graphical interface

#Defining get arguments parser
job_get_search_parser = reqparse.RequestParser()
job_get_search_parser.add_argument('job_id', dest='job_id', type=str, required=True, help="redis job id")

#Defining get arguments parser
trees_get_parser = reqparse.RequestParser()
trees_get_parser.add_argument('species_id', dest='species_id', type=str, required=True, help="redis job id")

#Defining delete arguments parser
trees_delete_parser = reqparse.RequestParser()
trees_delete_parser.add_argument('tree_name', dest='tree_name', type=str, required=True, help="tree name")

phyloviz_processor = Queue_Processor()


class PHYLOViZResource(Resource):

	#@login_required
	def post(self):
		args=phyloviz_post_parser.parse_args()
		if args.user_id:
			id_to_use = args.user_id
		else:
			id_to_use = current_user.id
		jobID = phyloviz_processor.send_to_phyloviz(args.job_ids, args.dataset_name, args.dataset_description, args.additional_data, args.database_to_include, args.max_closest, id_to_use, args.species_id, args.missing_data, args.missing_char, args.phyloviz_user, args.phyloviz_pass, args.makePublic)
		return jobID, 201

	@login_required
	def get(self):
		args=job_get_search_parser.parse_args()
		job = phyloviz_processor.fetch_job(args.job_id)

		if job.is_finished:
			return {"status": True, "result":job.result}, 200
		elif job.is_failed:
			return {"status": False, "result":"Failed"}, 200
		else:
			return {"status": "Pending"}, 200



class TreeResource(Resource):

	@login_required
	def get(self):
		args=trees_get_parser.parse_args()
		trees_to_send =[]

		trees = db.session.query(Tree).filter(Tree.user_id == current_user.id, Tree.species_id == args.species_id).all()
		if not trees:
			abort(404, message="No trees available")
		for tree in trees:
					trees_to_send.append({'name': tree.name, 'description': tree.description, 'timestamp': tree.timestamp.strftime("%Y-%m-%d %H:%M:%S"), 'uri': tree.uri, 'phyloviz_user':tree.phyloviz_user})
		return trees_to_send, 200

	@login_required
	def delete(self):
		args=trees_delete_parser.parse_args()

		tree = db.session.query(Tree).filter(Tree.user_id == current_user.id, Tree.name == args.tree_name).first()
		
		if not tree:
			abort(404, message="No trees available")

		db.session.delete(tree)
		db.session.commit()

		return 204
