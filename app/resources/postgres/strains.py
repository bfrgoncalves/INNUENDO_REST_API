from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify, request
import json

from app.models.models import Strain, Project, projects_strains
from flask_security import current_user, login_required, roles_required
import datetime

#Defining post arguments parser
strain_post_parser = reqparse.RequestParser()
#strain_post_parser.add_argument('strainID', type=str, required=True, help="Strain identifier")
#strain_post_parser.add_argument('species_id', type=int, required=True, help="Species identifier")
#strain_post_parser.add_argument('Location', type=str, required=True, help="Strain location")
#strain_post_parser.add_argument('ST', type=str, required=True, help="Strain ST")
#strain_post_parser.add_argument('CC', type=str, required=True, help="Strain CC")
#strain_post_parser.add_argument('fileselector', type=str, required=True, help="Strain sequencing file")

strain_project_parser = reqparse.RequestParser()
strain_project_parser.add_argument('strainID', dest='strainID', type=str, required=False, help="Strain identifier")
strain_project_parser.add_argument('speciesID', dest='speciesID', type=str, required=False, help="Species identifier")

#Defining response fields

strain_fields = {
	'id': fields.Integer,
	'strainID': fields.String(attribute='name'),
	'fields': fields.String,
	'strain_metadata': fields.String,
	'species_id': fields.String,
	'file_1': fields.String,
	'file_2': fields.String
}

#Defining metadata fields

nottoStore = ["fileselector"]


class StrainResource(Resource):

	@login_required
	@marshal_with(strain_fields)
	def get(self, name): #id=user_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		strain = db.session.query(Strain).filter(Strain.name == name).first()
		if not strain:
			abort(404, message="No strain available")
		return strain, 200


class StrainListResource(Resource):

	@login_required
	@marshal_with(strain_fields)
	def get(self): #id=user_id
		args=strain_project_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		if args.speciesID:
			strains = db.session.query(Strain).filter(Strain.species_id == args.speciesID).all()
		else:
			strains = db.session.query(Strain).all()
		if not strains:
			abort(404, message="No strain available")
		return strains, 200

	@login_required
	@marshal_with(strain_fields)  
	def post(self): #id=user_id
		args=request.form
		#print args
		metadata_fields = []
		metadata = {}
		for i in args:
			if i not in nottoStore:
				metadata_fields.append(i)
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")

		if not args["Food-Bug"]:
			s_name = args["Primary"]
		else:
			s_name = args["Primary"] + " " + args["Food-Bug"]

		strain = db.session.query(Strain).filter(Strain.name == s_name).first()

		if strain:
			file_1 = ""
			file_2 = ""
			if args["File_1"] and json.loads(strain.strain_metadata)["File_1"] == args["File_1"]:
				strain.file_1 = json.loads(strain.strain_metadata)["File_1"]
			if args["File_2"] and json.loads(strain.strain_metadata)["File_2"] == args["File_2"]:
				strain.file_2 = json.loads(strain.strain_metadata)["File_2"]
			return strain, 200		
		
		try:
			print 'AQUI'
			strain = Strain(name=s_name, species_id=args["species_id"], fields=json.dumps({"metadata_fields": metadata_fields}), strain_metadata=json.dumps(args), timestamp=datetime.datetime.utcnow(), user_id=current_user.id)
			print strain
			if not strain:
				abort(404, message="An error as occurried")

			db.session.add(strain)
			db.session.commit()
		except Exception as erro:
			print erro
			db.session.rollback()
			strain = db.session.query(Strain).filter(Strain.name == s_name).first()
		return strain, 201


class StrainProjectListResource(Resource):

	@login_required
	@marshal_with(strain_fields) 
	def get(self, id): #id=project_id
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		project = db.session.query(Project).filter(Project.id == id).first()
		if not project:
			abort(404, message="No project available")
		strains = project.project_strains()
		if not strains:
			abort(404, message="No strain available")
		return strains, 200

	@login_required
	@marshal_with(strain_fields)
	def put(self, id): #id=project_id
		args=strain_project_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		project = db.session.query(Project).filter(Project.id == id).first()
		if not project:
			abort(404, message="No project available")
		strain = db.session.query(Strain).filter(Strain.name == args.strainID).first()
		if not strain:
			abort(404, message="No strain available")

		
		put_status = project.add_Strain(strain)
		
		if not put_status:
			return abort(404, message="Strain already on project")
		
		db.session.commit()

		return strain, 200

	@login_required
	@marshal_with(strain_fields)
	def delete(self, id): #id=project_id
		args=strain_project_parser.parse_args()
		if not current_user.is_authenticated:
			abort(403, message="No permissions")
		project = db.session.query(Project).filter(Project.id == id).first()
		if not project:
			abort(404, message="No project available")
		strain = db.session.query(Strain).filter(Strain.name == args.strainID).first()
		if not strain:
			abort(404, message="No strain available")

		project.remove_Strain(strain)
		db.session.commit()

		return strain, 200


