from app import app, db
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify

from app.models.models import Pipeline, Workflow, Process
from flask.ext.security import current_user, login_required, roles_required
import datetime

#Defining post arguments parser

pipeline_post_parser = reqparse.RequestParser()
pipeline_post_parser.add_argument('name', dest='name', type=str, required=True, help="Pipeline name")

pipeline_put_parser = reqparse.RequestParser()
pipeline_put_parser.add_argument('workflows', dest='workflows', type=object, help="Workflow structure")
pipeline_put_parser.add_argument('workflows_order', dest='order', type=object, help="Workflow structure")
pipeline_put_parser.add_argument('processes', dest='processes', type=object, help="Process structure")
#Lets accept multiple values for variables. -d "name=bob" -d "name=sue" -d "name=joe" ? ['bob', 'sue', 'joe']

#Defining response fields

workflow_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'timestamp': fields.DateTime,
	'order': fields.String
	#'author': fields.Nested(author_fields)
}

pipeline_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'project_id': fields.String,
	'timestamp': fields.DateTime,
	'workflows': fields.Nested(workflow_fields),
	'workflows_order': fields.String
	#'author': fields.Nested(author_fields)
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

	def put(self, id):
		args=pipeline_put_parser.parse_args() 
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		pipeline = db.session.query(Pipeline).filter(Pipeline.id == id).first()
		
		if not pipeline:
			abort(404, message="No pipeline available")
		if args.workflows:
			workflow_args = jsonify(args.workflows)
			workflow = db.session.query(Workflow).filter(Workflow.id == workflow_args.id)
			if not workflow:
				abort(404, message="No workflow available")
			if not pipeline.is_workflow_added(workflow):
				pipeline.add_workflow(workflow)
		
		if args.workflows_order:
			pipeline.workflows_order = args.workflows_order
		
		db.session.commit()
		return pipeline, 200


class PipelineListResource(Resource):

	@login_required
	@marshal_with(pipeline_fields)
	def get(self, id): #project_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		pipelines = db.session.query(Pipeline).filter(Pipeline.project_id == id).all()
		if not pipelines:
			abort(404, message="No pipelines are available")
		return pipelines, 200

	@login_required
	@marshal_with(pipeline_fields)  
	def post(self, id): 
		args=pipeline_post_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")
		pipeline = Pipeline(name=args.name, timestamp=datetime.datetime.utcnow(), project_id=id)
		if not pipeline:
			abort(404, message="An error as occurried")
		db.session.add(pipeline)
		db.session.commit()
		return pipeline, 201