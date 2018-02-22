from app import dbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import current_user, login_required
from app.utils.queryParse2Json import parseAgraphStatementsRes

from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF

# Defining post arguments parser
pipeline_post_parser = reqparse.RequestParser()
pipeline_post_parser.add_argument('pipeline_id', dest='pipeline_id', type=str, required=True, help="Pipeline id")

pipeline_delete_parser = reqparse.RequestParser()
pipeline_delete_parser.add_argument('pipeline_id', dest='pipeline_id', type=str, required=True, help="Pipeline id")


class NGSOnto_PipelineListProjectResource(Resource):
    
    @login_required
    def get(self, id):

        studyURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id))
        hasPart = dbconAg.createURI(namespace=obo, localname="OBI_0000471")
        statements = dbconAg.getStatements(studyURI, hasPart, None)
        jsonResult = parseAgraphStatementsRes(statements)
        statements.close()

        return jsonResult,200

    @login_required
    def post(self, id):

        args = pipeline_post_parser.parse_args()
        newpipelineid = args.pipeline_id
        pipelineURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(newpipelineid))#need new pipeline ID

        studyURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id))
        hasPart = dbconAg.createURI(namespace=obo, localname="BFO_0000051")
        pipelineType = dbconAg.createURI(namespace=obo, localname="OBI_0000471")

        dbconAg.add(pipelineURI, RDF.TYPE, pipelineType)
        dbconAg.add(studyURI, hasPart, pipelineURI)

        return 201

    def delete(self, id):

        args = pipeline_delete_parser.parse_args()
        pipeline_id = args.pipeline_id

        studyURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id))
        hasPart = dbconAg.createURI(namespace=obo, localname="OBI_0000471")
        pipelineURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(pipeline_id))
        dbconAg.remove(studyURI, hasPart, pipelineURI)

        return 204
