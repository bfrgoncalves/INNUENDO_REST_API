from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify

from app.models.models import Workflow
from flask_security import current_user, login_required, roles_required
import datetime

#Defining post arguments parser
workflow_post_parser = reqparse.RequestParser()
workflow_post_parser.add_argument('name', dest='name', type=str, required=True, help="Workflow name")
workflow_post_parser.add_argument('classifier', dest='classifier', type=str, required=True, help="Workflow classifier")
workflow_post_parser.add_argument('species', dest='species', type=str, required=True, help="Workflow species")

workflow_list_get_parser = reqparse.RequestParser()
workflow_list_get_parser.add_argument('classifier', dest='classifier', type=str, required=True, help="Workflow classifier")
workflow_list_get_parser.add_argument('species', dest='species', type=str, required=True, help="Workflow species")

workflow_set_availability_put_parser = reqparse.RequestParser()
workflow_set_availability_put_parser.add_argument('identifier', dest='identifier', type=str, required=True, help="Workflow id")
workflow_set_availability_put_parser.add_argument('state', dest='state', type=str, required=True, help="Workflow state")

#Defining response fields

workflow_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'timestamp': fields.DateTime
}

workflow_all_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'timestamp': fields.DateTime,
	'classifier': fields.String,
	'species': fields.String,
	'availability': fields.String,

}


class WorkflowResource(Resource):

	@login_required
	@marshal_with(workflow_fields)
	def get(self, id): #id=user_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		workflows = db.session.query(Workflow).filter(Workflow.id == id).first()
		if not workflows:
			abort(404, message="No workflows are available".format(id))
		return workflows, 200

class WorkflowAllResource(Resource):

	@login_required
	@marshal_with(workflow_all_fields)
	def get(self): #id=user_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		workflows = db.session.query(Workflow).all()
		if not workflows:
			abort(404, message="No workflows are available".format(id))
		return workflows, 200

class WorkflowSetAvailabilityResource(Resource):

	@login_required
	@marshal_with(workflow_all_fields)
	def put(self): #id=user_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")

		args = workflow_set_availability_put_parser.parse_args()
		workflow = db.session.query(Workflow).filter(Workflow.id == args.id).first()
		if not workflow:
			abort(404, message="No workflows are available".format(id))

		workflow.availability = args.state
		db.session.commit()

		return workflows, 200


class WorkflowListResource(Resource):

	@login_required
	@marshal_with(workflow_fields)
	def get(self): #id=user_id
		args = workflow_list_get_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		workflow = db.session.query(Workflow).filter(Workflow.classifier == args.classifier, Workflow.species == args.species).all()
		if not workflow:
			abort(404, message="No workflows are available".format(id))
		return workflow, 200

	@login_required
	@marshal_with(workflow_fields)  
	def post(self): #id=user_id
		args=workflow_post_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")
		workflow = Workflow(classifier=args.classifier, name=args.name, timestamp=datetime.datetime.utcnow(), species=args.species)
		if not workflow:
			abort(404, message="An error as occurried")
		db.session.add(workflow)
		db.session.commit()
		return workflow, 201