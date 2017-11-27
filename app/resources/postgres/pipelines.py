from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify

from app.models.models import Pipeline, Workflow, Process
from flask_security import current_user, login_required, roles_required
import datetime

'''
Postgres pipeline resources:
	- add pipeline
	- remove pipeline
	- get all pipelines
'''

#Defining post arguments parser
pipeline_post_parser = reqparse.RequestParser()
pipeline_post_parser.add_argument('strain_id', dest='strain_id', type=str, required=True, help="Strain id")
pipeline_post_parser.add_argument('parent_pipeline_id', dest='parent_pipeline_id', type=str, required=False, help="Parent Pipeline id")
pipeline_post_parser.add_argument('parent_project_id', dest='parent_project_id', type=str, required=False, help="Parent Project id")


#Defining post arguments parser
pipeline_delete_parser = reqparse.RequestParser()
pipeline_delete_parser.add_argument('strain_id', dest='strain_id', type=str, required=True, help="Strain id")
pipeline_delete_parser.add_argument('tag_remove', dest='tag_remove', type=str, required=True, help="Remove Tag")

#Pipeline get parameters
pipeline_get_parser = reqparse.RequestParser()
pipeline_get_parser.add_argument('strain_id', dest='strain_id', type=str, required=False, help="Strain id")
pipeline_get_parser.add_argument('strain_id_all', dest='strain_id_all', type=str, required=False, help="Strain id")
pipeline_get_parser.add_argument('all', dest='all', type=bool, required=False, help="show all")
pipeline_get_parser.add_argument('parent_project_id', dest='parent_project_id', type=str, required=False, help="Parent Project id")

#Defining response fields

workflow_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'timestamp': fields.DateTime,
	'order': fields.String
}

pipeline_fields = {
	'id': fields.Integer,
	'project_id': fields.String,
	'strain_id': fields.String,
	'parent_pipeline_id': fields.String,
	'parent_project_id': fields.String,
	'removed': fields.String,
	'timestamp': fields.DateTime
}


class PipelineResource(Resource):

	@login_required
	@marshal_with(workflow_fields)
	def get(self, id): 
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		pipeline = db.session.query(Pipeline).filter(Pipeline.id == id).first()
		if not pipeline:
			abort(404, message="No pipelines are available")
		return pipeline, 200


class PipelineListResource(Resource):

	#@login_required
	@marshal_with(pipeline_fields)
	def get(self, id): #project_id
		args=pipeline_get_parser.parse_args()

		if args.strain_id_all:
			pipelines = db.session.query(Pipeline).filter(Pipeline.strain_id == args.strain_id_all).all()
		elif args.strain_id and args.parent_project_id:
			pipelines = db.session.query(Pipeline).filter(Pipeline.strain_id == args.strain_id, Pipeline.parent_project_id == args.parent_project_id).all()
		elif args.strain_id:
			pipelines = db.session.query(Pipeline).filter(Pipeline.strain_id == args.strain_id, Pipeline.project_id == id, Pipeline.removed == None).all()
		elif args.all:
			pipelines = db.session.query(Pipeline).all()
		else:
			pipelines = db.session.query(Pipeline).filter(Pipeline.project_id == id, Pipeline.removed == None).all()

		if not pipelines:
			abort(404, message="No pipelines are available")

		return pipelines, 200

	@login_required
	@marshal_with(pipeline_fields)  
	def post(self, id): #project_id
		args=pipeline_post_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")
		pipeline = Pipeline(timestamp=datetime.datetime.utcnow(), project_id=id, strain_id=args.strain_id, parent_pipeline_id=args.parent_pipeline_id, parent_project_id=args.parent_project_id)
		if not pipeline:
			abort(404, message="An error as occurried")
		db.session.add(pipeline)
		db.session.commit()
		return pipeline, 201

	@login_required
	@marshal_with(pipeline_fields)
	def delete(self, id):
		args=pipeline_delete_parser.parse_args()
		if not current_user.is_authenticated:
				abort(403, message="No permissions")
		print args.strain_id
		pipeline = db.session.query(Pipeline).filter(Pipeline.strain_id == args.strain_id, Pipeline.project_id == id).first()
		if not pipeline:
			abort(404, message="Pipeline {} doesn't exist".format(id))
		print args.tag_remove
		if args.tag_remove == "true":
			print "REAL REMOVE"
			db.session.delete(pipeline)
		db.session.commit()
		return pipeline, 204

	@login_required
	@marshal_with(pipeline_fields)
	def put(self, id):
		args=pipeline_delete_parser.parse_args()
		if not current_user.is_authenticated:
				abort(403, message="No permissions")
		pipeline = db.session.query(Pipeline).filter(Pipeline.strain_id == args.strain_id, Pipeline.project_id == id).first()
		if not pipeline:
			abort(404, message="Pipeline {} doesn't exist".format(id))
		print args.tag_remove
		if args.tag_remove == "true":
			pipeline.removed = "true"
		elif args.tag_remove == "false":
			pipeline.removed = None
		elif args.tag_remove == "remove_parent":
			pipeline.parent_pipeline_id = None
			pipeline.parent_project_id = None
		
		db.session.commit()
		return pipeline, 204
