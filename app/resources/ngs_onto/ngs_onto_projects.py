from app import app, dbconAg,dedicateddbconAg
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user, login_required
from flask import jsonify
from app.utils.queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

#from app.models.models import Study
from flask.ext.security import current_user, login_required, roles_required
from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF
from franz.openrdf.vocabulary.xmlschema import XMLSchema
from franz.openrdf.query.query import QueryLanguage
from franz.openrdf.model import URI

#Defining post arguments parser
project_post_parser = reqparse.RequestParser()
project_post_parser.add_argument('study_id', dest='study_id', type=str, required=True, help="The project id")


class NGSOnto_ProjectListResource(Resource): # no post? only get all studies from all users?

	@login_required
	def get(self): #id=user_id
		
		#Agraph
		studyType = dbcon.createURI(namespace=obo, localname="OBI_0000066")
		statements = dbcon.getStatements(None, RDF.TYPE, studyType)
		jsonResult=parseAgraphStatementsRes(statements)
		statements.close()	
		
		return studies,jsonResult, 200



class NGSOnto_ProjectUserResource(Resource):

	@login_required
	def get(self, id): #id=study_id			
		#Agraph
		studyURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id))
		statements = dbconAg.getStatements(studyURI, None, None)
		studyAg=parseAgraphStatementsRes(statements)
		statements.close()	
			
		
		return studyAg, 200


class NGSOnto_ProjectListUserResource(Resource):

	@login_required
	def get(self):

		id = current_user.id
		
		#Agraph
		UserURI = dbconAg.createURI(namespace=localNSpace, localname="users/"+str(id))
		studyBelong=dbconAg.createURI(namespace=obo, localname="NGS_0000015")		
		statements = dbconAg.getStatements(None, studyBelong, UserURI)
		studiesAg=parseAgraphStatementsRes(statements)
		statements.close()	
		
		
		return studiesAg, 200
	
	@login_required
	def post(self):

		id = current_user.id
		args=project_post_parser.parse_args()
		
		newstudyid= args.study_id

		#Agraph
		UserURI = dbconAg.createURI(namespace=localNSpace, localname="users/"+str(id))
		studyBelong2=dbconAg.createURI(namespace=obo, localname="NGS_0000015")
		studyURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(newstudyid))
		
		studyType = dbconAg.createURI(namespace=obo, localname="OBI_0000066")

		dbconAg.add(studyURI, RDF.TYPE, studyType)
		dbconAg.add(studyURI, studyBelong2, UserURI)
		return 201

