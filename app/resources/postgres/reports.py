from app import app, db
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify

from app.models.models import Pipeline
from flask.ext.security import current_user, login_required, roles_required
import datetime

############################################ NOT BEING USED #######################################################

"""
Processes are being defined in the ngsonto resources
"""

#Defining post arguments parser
process_post_parser = reqparse.RequestParser()
process_post_parser.add_argument('messages', dest='messages', type=str, required=True, help="Process messages")

#Defining response fields


class ReportsResource(Resource):

	@login_required
	def get(self, user_id, study_id, pipeline_id, process_id):
		if not current_user.is_authenticated or current_user.id != user_id:
			abort(403, message="No permissions")
		process = db.session.query(Process).filter(Process.id == id).first()
		if not process:
			abort(404, message="No process available")
		return process, 200

