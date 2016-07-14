from app import app, db
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify

from app.models.models import Study
from flask.ext.security import current_user, login_required, roles_required

#Defining post arguments parser
study_post_parser = reqparse.RequestParser()
study_post_parser.add_argument('description', dest='description', type=str, required=True, help="The study description")
study_post_parser.add_argument('timestamp', dest='timestamp', type=str, required=True, help="Study date of creation")
study_post_parser.add_argument('user_id', dest='user_id', type=str, required=True, help="User identifier")

#Defining response fields

author_fields = {
	'id': fields.Integer,
	'uri': fields.Url('single_user', absolute=True)
}

all_study_fields = {
	'id': fields.Integer,
	'description': fields.String,
	'timestamp': fields.DateTime,
	'uri': fields.Url('study', absolute=True),
	'author': fields.Nested(author_fields)
	#'owner': fields.Url('user')
}

study_fields = {
	'id': fields.Integer,
	'description': fields.String,
	'timestamp': fields.DateTime,
	'author': fields.Nested(author_fields)
}

#Define studies resources

class StudyListResource(Resource):

	@login_required
	@marshal_with(all_study_fields)
	def get(self): #id=user_id
		studies = db.session.query(Study).all()
		if not studies:
			abort(404, message="No studies are available".format(id))
		return studies, 200

	@login_required
	@marshal_with(all_study_fields)  
	def post(self): #id=user_id
		args=study_post_parser.parse_args()
		if current_user.id != args.user_id:
			abort(403, message="No permissions to POST to ".format(args.user_id))
		study = Study(description=args.description, user_id=args.user_id, timestamp=args.timestamp)
		if not study:
			abort(404, message="An error as occurried when uploading the data".format(id))
		db.session.add(study)
		db.session.commit()
		return study, 201


class StudyResource(Resource):

	@login_required
	@marshal_with(study_fields)
	def get(self, id):
		study = db.session.query(Study).filter(Study.id == id).first()
		if not study:
			abort(404, message="Study {} doesn't exist".format(id))
		return study, 200

	@login_required
	@marshal_with(study_fields)
	def put(self, id):
		pass

	@login_required
	@roles_required('admin')
	@marshal_with(study_fields)
	def delete(self, id):
		study = db.session.query(Study).filter(Study.id == id).first()
		if not study:
			abort(404, message="Study {} doesn't exist".format(id))
		db.session.delete(study)
		db.session.commit()
		return study, 200


class StudyUserResource(Resource):

	@login_required
	@marshal_with(study_fields)
	def get(self, user_id, id): #id=user_id
		studies = db.session.query(Study).filter(Study.user_id == user_id, Study.id == id)
		if not studies:
			abort(404, message="Study {} for user {} doesn't exist".format(id, user_id))
		return studies, 200


class StudyListUserResource(Resource):

	@login_required
	@marshal_with(study_fields)
	def get(self, id): #id=user_id
		studies = db.session.query(Study).filter(Study.user_id == id).all()
		if not studies:
			abort(404, message="No studies for user {}".format(id, user_id))
		return studies, 200