from app import app, db
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user
from flask import jsonify, request
import json

from app.models.models import Strain, Project, projects_strains
from flask_security import current_user, login_required, roles_required
import datetime

#Defining post arguments parser
#strain_put_parser = reqparse.RequestParser()
#strain_put_parser.add_argument('strain_id', dest='strain_id', type=str, required=False, help="Strain identifier")

strain_project_parser = reqparse.RequestParser()
strain_project_parser.add_argument('strainID', dest='strainID', type=str, required=False, help="Strain identifier")
strain_project_parser.add_argument('speciesID', dest='speciesID', type=str, required=False, help="Species identifier")
strain_project_parser.add_argument('from_user', dest='from_user', type=str, required=False, help="Get strains submitter only by user")

strain_update_parser = reqparse.RequestParser()
strain_update_parser.add_argument('strain_id', dest='strain_id', type=str, required=False, help="Strain identifier")
strain_update_parser.add_argument('key', dest='key', type=str, required=False, help="Key to change on metadata")
strain_update_parser.add_argument('value', dest='value', type=str, required=False, help="Value to change")

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
		print args.from_user
		if args.speciesID and args.from_user == "true":
			strains = db.session.query(Strain).filter(Strain.species_id == args.speciesID, Strain.user_id == current_user.id).all()
		elif args.speciesID and args.from_user == "false":
			strains = db.session.query(Strain).filter(Strain.species_id == args.speciesID).all()
		else:
			strains = db.session.query(Strain).all()
		
		for strain in strains:
			strain.file_1 = json.loads(strain.strain_metadata)["File_1"]
			strain.file_2 = json.loads(strain.strain_metadata)["File_2"]
			
		if not strains:
			abort(404, message="No strain available")
		return strains, 200

	@login_required
	@marshal_with(strain_fields)  
	def post(self): #id=user_id
		args=request.form

		metadata_fields = []
		metadata = {}
		for i in args:
			if i not in nottoStore:
				metadata_fields.append(i)
		if not current_user.is_authenticated:
			abort(403, message="No permissions to POST")

		print args
		if not args["Food-Bug"]:
			s_name = args["Primary"].replace(" ", "-").replace(".", "-").replace("#", "-")
		else:
			s_name = args["Primary"].replace(" ", "-").replace(".", "-").replace("#", "-") + "-" + args["Food-Bug"].replace(" ", "-").replace(".", "-").replace("#", "-")

		strain = db.session.query(Strain).filter(Strain.name == s_name).first()

		if strain:
			file_1 = ""
			file_2 = ""
			print args
			try:
				if args["File_1"] and json.loads(strain.strain_metadata)["File_1"] == args["File_1"]:
					strain.file_1 = json.loads(strain.strain_metadata)["File_1"]
				if args["File_2"] and json.loads(strain.strain_metadata)["File_2"] == args["File_2"]:
					strain.file_2 = json.loads(strain.strain_metadata)["File_2"]
			except KeyError as e:
				print e
				strain.strain_metadata = json.dumps(args)
				db.session.commit()
			return strain, 200		
		
		try:
			strain = Strain(name=s_name, species_id=args["species_id"], fields=json.dumps({"metadata_fields": metadata_fields}), strain_metadata=json.dumps(args), timestamp=datetime.datetime.utcnow(), user_id=current_user.id)

			if not strain:
				abort(404, message="An error as occurried")

			db.session.add(strain)
			db.session.commit()
		except Exception as erro:
			print erro
			db.session.rollback()
			strain = db.session.query(Strain).filter(Strain.name == s_name).first()
		return strain, 201

	@login_required
	@marshal_with(strain_fields)
	def put(self):
		args=request.form
		print args

		strain = db.session.query(Strain).filter(Strain.id == args["strain_id"]).first()

		print strain
		
		if not strain:
			abort(404, message="An error as occurried")
		else:
			strain_metadata = json.loads(strain.strain_metadata)
			#strain_fields = json.loads(strain.fields)
			#print strain_metadata
			for key, val in args.iteritems():
				strain_metadata[key] = val

			print strain_metadata

			strain.strain_metadata = json.dumps(strain_metadata)
			db.session.commit()

			return strain, 201
			#print strain_fields
			#new_metadata_fields = []

			#for x in strain_fields["metadata_fields"]:
				#if x != args.key:
					#new_metadata_fields.append(x)

			#strain_metadata[args.key] = args.value




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

		strain.file_1 = json.loads(strain.strain_metadata)["File_1"]
		strain.file_2 = json.loads(strain.strain_metadata)["File_2"]

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


