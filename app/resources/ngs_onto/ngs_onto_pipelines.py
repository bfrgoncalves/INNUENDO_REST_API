from app import app, dbconAg,dedicateddbconAg
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user, login_required
from flask import jsonify
from app.utils.queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF
from franz.openrdf.vocabulary.xmlschema import XMLSchema
from franz.openrdf.query.query import QueryLanguage
from franz.openrdf.model import URI


#Defining post arguments parser

pipeline_post_parser = reqparse.RequestParser()
pipeline_post_parser.add_argument('pipeline_id', dest='pipeline_id', type=str, required=True, help="Pipeline id")

class NGSOnto_PipelineListProjectResource(Resource):
    
	@login_required
	def get(self, id):

		#Agraph
		studyURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id))
		hasPart = dbconAg.createURI(namespace=obo, localname="OBI_0000471")
		statements = dbconAg.getStatements(studyURI, hasPart, None)
		jsonResult=parseAgraphStatementsRes(statements)
		statements.close()

		return jsonResult,201

	@login_required
	def post(self, id):

		#Agraph
		args=pipeline_post_parser.parse_args()
		newpipelineid=args.pipeline_id
		pipelineURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(newpipelineid))#need new pipeline ID

		studyURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id))
		hasPart = dbconAg.createURI(namespace=obo, localname="OBI_0000471")
		pipelineType = dbconAg.createURI(namespace=obo, localname="BFO_0000051")

		dbconAg.add(pipelineURI, RDF.TYPE, pipelineType)
		dbconAg.add(studyURI, hasPart, pipelineURI)

		return 200
		

	def delete(self, id):
		pass