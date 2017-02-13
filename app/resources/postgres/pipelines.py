from app import app, db
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify

from app.models.models import Pipeline, Workflow, Process
from flask.ext.security import current_user, login_required, roles_required
import datetime

#Defining post arguments parser
pipeline_post_parser = reqparse.RequestParser()
pipeline_post_parser.add_argument('strain_id', dest='strain_id', type=str, required=True, help="Strain id")

#Defining post arguments parser
pipeline_delete_parser = reqparse.RequestParser()
pipeline_delete_parser.add_argument('strain_id', dest='strain_id', type=str, required=True, help="Strain id")

#Pipeline get parameters
pipeline_get_parser = reqparse.RequestParser()
pipeline_get_parser.add_argument('strain_id', dest='strain_id', type=str, required=False, help="Strain id")

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

	@login_required
	@marshal_with(pipeline_fields)
	def get(self, id): #project_id
		args=pipeline_get_parser.parse_args()
		print args
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		if args.strain_id:
			pipelines = db.session.query(Pipeline).filter(Pipeline.strain_id == args.strain_id, Pipeline.project_id == id).first()
		else:
			pipelines = db.session.query(Pipeline).filter(Pipeline.project_id == id).all()
		print pipelines
		if not pipelines:
			abort(404, message="No pipelines are available")
		return pipelines, 200

	@login_required
	@marshal_with(pipeline_fields)  
	def post(self, id): #project_id
		args=pipeline_post_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")
		pipeline = Pipeline(timestamp=datetime.datetime.utcnow(), project_id=id, strain_id=args.strain_id)
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
		db.session.delete(pipeline)
		db.session.commit()
		return pipeline, 204
