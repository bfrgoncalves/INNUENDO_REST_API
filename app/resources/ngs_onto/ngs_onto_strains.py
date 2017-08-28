from app import app, dbconAg,dedicateddbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask import jsonify
from app.utils.queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

#from app.models.models import Study
from flask_security import current_user, login_required, roles_required
from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF
from franz.openrdf.vocabulary.xmlschema import XMLSchema
from franz.openrdf.query.query import QueryLanguage
from franz.openrdf.model import URI

#Defining post arguments parser
project_post_parser = reqparse.RequestParser()
project_post_parser.add_argument('strain_id', dest='strain_id', type=str, required=True, help="The strain id")

class NGSOnto_StrainsListUserResource(Resource):

	@login_required
	def get(self): #id=user_id
		
		#Agraph
		#UserURI = dbconAg.createURI(namespace=localNSpace, localname="users/"+str(id))
		strainType = dbconAg.createURI(namespace=obo, localname="OBI_0000747")	
		statements = dbconAg.getStatements(None, RDF.TYPE, strainType)
		strainsAg=parseAgraphStatementsRes(statements)
		statements.close()	
		
		
		return strainsAg, 200
	
	@login_required
	def post(self): #id=user_id

		id = current_user.id
		args=project_post_parser.parse_args()

		newstrainid=args.strain_id
		
		#Agraph
		strainURI = dbconAg.createURI(namespace=localNSpace+"strains/", localname=str(newstrainid))
		strainType = dbconAg.createURI(namespace=obo, localname="OBI_0000747")
		dbconAg.add(strainURI, RDF.TYPE, strainType)
		return 201