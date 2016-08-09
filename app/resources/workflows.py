from app import app, db
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify

from app.models.models import Workflow
from flask.ext.security import current_user, login_required, roles_required
import datetime

#Defining post arguments parser
workflow_post_parser = reqparse.RequestParser()
workflow_post_parser.add_argument('name', dest='name', type=str, required=True, help="Workflow name")
workflow_post_parser.add_argument('protocols_order', dest='protocols_order', type=str, required=True, help="Protocol order", action='append')
#Lets accept multiple values for variables. -d "name=bob" -d "name=sue" -d "name=joe" ? ['bob', 'sue', 'joe']

#Defining response fields

workflow_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'timestamp': fields.DateTime,
	'order': fields.String
	#'author': fields.Nested(author_fields)
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


class WorkflowListResource(Resource):

	@login_required
	@marshal_with(workflow_fields)
	def get(self): #id=user_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		workflow = db.session.query(Workflow).all()
		if not workflow:
			abort(404, message="No workflows are available".format(id))
		return workflow, 200

	@login_required
	@marshal_with(workflow_fields)  
	def post(self): #id=user_id
		args=workflow_post_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")
		workflow = Workflow(protocols_order=jsonify(args.protocols_order), name=args.name, timestamp=datetime.datetime.utcnow())
		if not workflow:
			abort(404, message="An error as occurried")
		db.session.add(workflow)
		db.session.commit()
		return workflow, 201