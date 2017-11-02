from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify
import json
from app.models.models import Protocol
from flask_security import current_user, login_required, roles_required
import datetime

#Defining post arguments parser
protocol_post_parser = reqparse.RequestParser()
protocol_post_parser.add_argument('name', dest='name', type=str, required=True, help="Workflow name")
protocol_post_parser.add_argument('steps', dest='steps', type=str, required=True, help="Protocol steps")

"""
STEPS -> Parameters which define the protocol
"""

#Defining get arguments parser
protocol_get_parser = reqparse.RequestParser()
protocol_get_parser.add_argument('type', dest='type', type=str, required=False, help="Protocol Type")

#Defining get arguments parser
protocol_get_ids_parser = reqparse.RequestParser()
protocol_get_ids_parser.add_argument('protocol_ids', dest='protocol_ids', type=str, required=False, help="Protocol IDs")

#Defining response fields

protocol_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'timestamp': fields.DateTime,
	'steps': fields.String
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

class ProtocolByIDResource(Resource):

	@login_required
	@marshal_with(protocol_fields)
	def get(self): #id=user_id
		args = protocol_get_ids_parser.parse_args()
		protocol_ids = args.protocol_ids.split(',')
		#data = []
		to_send = []

		for protocol_id in protocol_ids:
			protocol = db.session.query(Protocol).filter(Protocol.id == protocol_id).first()
			protocol.steps = protocol.steps.replace("'", '"')

			#steps = json.loads(protocol.steps)
			to_send.append(protocol)

		return to_send, 200


class ProtocolListResource(Resource):

	@login_required
	@marshal_with(protocol_fields)
	def get(self): #id=user_id
		args=protocol_get_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		protocols = db.session.query(Protocol).all()

		if not protocols:
			abort(404, message="No protocols available")
		
		if args.type:
			filteredProtocols = []
			for i in protocols:
				protocol = json.loads(i.steps.replace("u'", "'").replace("'", '"'))
				if protocol["protocol_type"] == args.type.replace('"',''):
					filteredProtocols.append(i)
			return filteredProtocols
		return protocols, 200

	@login_required
	@marshal_with(protocol_fields)  
	def post(self): #id=user_id
		args=protocol_post_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")
		jsonToLoad = json.loads('"' + args.steps.replace("u'", "'").replace("u\"","").replace("\"","")+'"')
		print jsonToLoad
		'''protocol = Protocol(name=args.name, steps=jsonToLoad, timestamp=datetime.datetime.utcnow())
		if not protocol:
			abort(404, message="An error as occurried")
		db.session.add(protocol)
		db.session.commit()'''
		return protocol, 201

