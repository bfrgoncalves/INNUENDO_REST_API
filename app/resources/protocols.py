from app import app, db
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify

from app.models.models import Protocol
from flask.ext.security import current_user, login_required, roles_required
import datetime

#Defining post arguments parser
protocol_post_parser = reqparse.RequestParser()
protocol_post_parser.add_argument('name', dest='name', type=str, required=True, help="Workflow name")
protocol_post_parser.add_argument('steps', dest='steps', type=str, required=True, help="Protocol steps")
#Lets accept multiple values for variables. -d "name=bob" -d "name=sue" -d "name=joe" ? ['bob', 'sue', 'joe']

#Defining response fields

protocol_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'timestamp': fields.DateTime,
	'steps': fields.String,
	'workflow_id': fields.Url('workflow', absolute=True)
	#'author': fields.Nested(author_fields)
}

class ProtocolResource(Resource):

	@login_required
	@marshal_with(protocol_fields)
	def get(self, id): #id=user_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		protocol = db.session.query(Protocol).filter(Protocol.id == id).first()
		if not protocol:
			abort(404, message="No protocol available")
		return protocol, 200


class ProtocolListResource(Resource):

	@login_required
	@marshal_with(protocol_fields)
	def get(self): #id=user_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		protocols = db.session.query(Protocol).all()
		if not protocols:
			abort(404, message="No protocols available")
		return protocols, 200

	@login_required
	@marshal_with(protocol_fields)  
	def post(self): #id=user_id
		args=protocol_post_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")
		protocol = Protocol(name=args.name, steps=jsonify(args.steps), timestamp=datetime.datetime.utcnow())
		if not protocol:
			abort(404, message="An error as occurried")
		db.session.add(protocol)
		db.session.commit()
		return protocol, 201

