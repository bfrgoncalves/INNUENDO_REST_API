from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify

from app.models.models import Project, User
from flask_security import current_user, login_required, roles_required, auth_token_required
import datetime
import random
import string

#Defining post arguments parser
project_post_parser = reqparse.RequestParser()
project_post_parser.add_argument('description', dest='description', type=str, required=True, help="The project description")
project_post_parser.add_argument('name', dest='name', type=str, required=True, help="Project name")
project_post_parser.add_argument('species_id', dest='species_id', type=str, required=True, help="Species identifier")

project_get_parser = reqparse.RequestParser()
project_get_parser.add_argument('get_others', dest='get_others', type=bool, required=False, help="Get other projects")
project_get_parser.add_argument('all', dest='all', type=bool, required=False, help="Get all projects")

#Defining response fields

author_fields = {
	'id': fields.Integer,
	'uri': fields.Url('single_user', absolute=True)
}


all_project_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'description': fields.String,
	'timestamp': fields.DateTime,
	'uri': fields.Url('user_single_project', absolute=True),
	'species_id': fields.String,
	'is_removed': fields.String,
	'username': fields.String
}

project_fields = {
	'id': fields.Integer,
	'name': fields.String,
	'description': fields.String,
	'timestamp': fields.DateTime,
	'pipelines': fields.Url('pipelines', absolute=True),
	'strains': fields.Url('project_strains', absolute=True),
	'species_id': fields.String,
	'is_removed': fields.String
}

#Define projects resources

class ProjectUserResource(Resource):

	@login_required
	@marshal_with(project_fields)
	def get(self, id): #id=project_id
		if not current_user.is_authenticated:
				abort(403, message="No permissions")
		project = db.session.query(Project).filter(Project.id == id).first()
		if not project:
			abort(404, message="Project {} doesn't exist".format(id))
		return project, 200

	@login_required
	@marshal_with(project_fields)
	def delete(self, id):
		if not current_user.is_authenticated:
				abort(403, message="No permissions")
		project = db.session.query(Project).filter(Project.id == id, Project.user_id == current_user.id).first()
		project.name = project.name + "_" + ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(4))
		if not project:
			abort(404, message="Project {} doesn't exist".format(id))
		project.is_removed = True
		db.session.commit()
		return project, 204


class ProjectListUserResource(Resource):

	@login_required
	@marshal_with(all_project_fields)
	def get(self):
		args=project_get_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions")

		if args.get_others:
			projects = db.session.query(Project).filter(Project.user_id != current_user.id).all()
		else:
			projects = db.session.query(Project).filter(Project.user_id == current_user.id).all()
		if not projects:
			abort(404, message="No projects for user {}".format(current_user.id))

		for project in projects:
			user = db.session.query(User).filter(project.user_id == User.id).first()
			project.username = user.username

		return projects, 200

	@login_required
	@marshal_with(all_project_fields)  
	def post(self): #id=user_id
		args=project_post_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")
		project = Project(species_id=args.species_id, description=args.description, user_id=current_user.id, name=args.name, timestamp=datetime.datetime.utcnow())
		if not project:
			abort(404, message="An error as occurried when uploading the data".format(id))

		try:
			db.session.add(project)
			db.session.commit()
		except Exception as e:
			abort(409, message="Project name already exists.")
		return project, 201


class ProjectListUserSpecieResource(Resource):

	#@login_required
	@marshal_with(all_project_fields)
	def get(self, id):
		args=project_get_parser.parse_args()

		if args.all:
			projects = db.session.query(Project).filter(Project.species_id == id).all()
		elif args.get_others:
			projects = db.session.query(Project).filter(Project.user_id != current_user.id, Project.species_id == id).all()
		else:
			projects = db.session.query(Project).filter(Project.user_id == current_user.id, Project.species_id == id).all()
		if not projects:
			abort(404, message="No projects for specie {}".format(id))

		for project in projects:
			user = db.session.query(User).filter(project.user_id == User.id).first()
			project.username = user.username

		return projects, 200

class ProjectListAllResource(Resource):

	#@login_required
	@marshal_with(all_project_fields)
	def get(self):
		projects = db.session.query(Project).all()
		if not projects:
			abort(404, message="No projects for specie {}".format(id))
		return projects, 200
