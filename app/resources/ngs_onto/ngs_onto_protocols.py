from app import app, dbconAg,dedicateddbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask_security import current_user, login_required
from flask import jsonify
from app.utils.queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

#from app.models.models import Study
#from flask.ext.security import current_user, login_required, roles_required
from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF
from franz.openrdf.vocabulary.xmlschema import XMLSchema
from franz.openrdf.query.query import QueryLanguage
from franz.openrdf.model import URI


#Defining get arguments parser
project_get_parser = reqparse.RequestParser()
project_get_parser.add_argument('uri', dest='uri', type=str, required=False, help="The protocol uri")

#Defining post arguments parser
project_post_parser = reqparse.RequestParser()
project_post_parser.add_argument('type_uri', dest='type_uri', type=str, required=False, help="The protocol type")
project_post_parser.add_argument('protocol_id', dest='protocol_id', type=str, required=False, help="The protocol id")

class NGSOnto_ProtocolList(Resource):

	@login_required
	def get(self): #id=user_id

		#Agraph
		queryString = """SELECT DISTINCT ?protocTypeLabel ?protocType WHERE {?protocType rdfs:subClassOf* obo:OBI_0000272;
                                                    ?s ?allprop. 
                                        ?protocType rdfs:label ?protocTypeLabel.
                                       MINUS {
                                           ?something rdfs:subClassOf ?protocType}}"""
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		jsonResult=parseAgraphQueryRes(result,["protocTypeLabel","protocType"])
		
		result.close()

		return jsonResult,200

class NGSOnto_ProtocolResource(Resource):    
	
	@login_required
	def get(self):
		prtocURI="<http://purl.obolibrary.org/obo/OBI_0000272>"
		queryString = "SELECT ?protocols ?sons WHERE {?sons rdfs:subClassOf* "+prtocURI+""" .
							?protocols a ?sons. }"""
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		jsonResult=parseAgraphQueryRes(result,["protocols","sons"])
		return jsonResult, 200

	@login_required
	def post(self):  

		args = project_post_parser.parse_args()  
		ProtocolId = args.protocol_id
		protoclTypeURI = args.type_uri

		protocolURI = dbconAg.createURI(namespace=localNSpace, localname="protocols/"+str(ProtocolId))
		protocolTypeURI = dbconAg.createURI(protoclTypeURI)

		dbconAg.add(protocolURI, RDF.TYPE, protocolTypeURI)

		return 201


class NGSOnto_ProtocolPropertiesList(Resource):

	@login_required
	def get(self):

		#Agraph
		args = project_get_parser.parse_args()

		if args.uri:
			queryString = "SELECT ?plabel ?rangeClass WHERE {"+args.uri+""" rdfs:subClassOf* ?parents.
										?parents ?s ?allprop. 
										?allprop owl:onProperty ?p .
										?p rdfs:label ?plabel. 
										OPTIONAL {?p rdfs:range ?rangeClass.}}"""
			tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
			result = tupleQuery.evaluate()
			jsonResult=parseAgraphQueryRes(result,["plabel","rangeClass"])

			result.close()

			return jsonResult,200

		else:
			return 404

class NGSOnto_ProtocolPropertiesFieldsList(Resource):

	@login_required
	def get(self): #id=user_id

		args = project_get_parser.parse_args()
		#Agraph
		if args.uri:
			queryString = "SELECT ?plabel WHERE {"+args.uri+""" ?s ?allprop.
								?allprop owl:onProperty ?property.
								?property rdfs:label ?plabel.}"""
			print queryString
			tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
			result = tupleQuery.evaluate()
			jsonResult=parseAgraphQueryRes(result,["plabel"])

			result.close()

			return jsonResult,200
		else:
			return 404
