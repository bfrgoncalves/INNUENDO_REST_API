from app import app, dbconAg,dedicateddbconAg
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with #filters data according to some fields
from flask.ext.security import current_user
from flask import jsonify
from app.utils.queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

#from app.models.models import Study
#from flask.ext.security import current_user, login_required, roles_required
from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF
from franz.openrdf.vocabulary.xmlschema import XMLSchema
from franz.openrdf.query.query import QueryLanguage
from franz.openrdf.model import URI


#Defining post arguments parser
workflow_post_parser = reqparse.RequestParser()
workflow_post_parser.add_argument('workflow_id', dest='workflow_id', type=str, required=True, help="Workflow id")
workflow_post_parser.add_argument('protocol_ids', dest='protocol_ids', type=str, required=True, help="Protocol id list")

#Create pipeline and defining workflow order on pipeline
pipeline_post_parser = reqparse.RequestParser()
pipeline_post_parser.add_argument('workflow_id', dest='workflow_id', type=str, required=True, help="Workflow id")
pipeline_post_parser.add_argument('step', dest='step', type=str, required=True, help="workflow order in pipeline")

#Defining get arguments parser
workflow_get_parser = reqparse.RequestParser()
workflow_get_parser.add_argument('workflow_id', dest='workflow_id', type=str, required=True, help="Workflow id")



class NGSOnto_WorkflowListPipelineResource(Resource):
	
	def get(self, id,id1):
		
		#Agraph
		pipelineStr = localNSpace+"projects/"+str(id)+"/pipelines/"+str(id1)	
		
		
		queryString = "SELECT ?execStep ?workflowURI  WHERE {<"+pipelineStr+"> obo:NGS_0000076 ?execStep. ?execStep obo:NGS_0000079 ?workflowURI.}"
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		jsonResult=parseAgraphQueryRes(result,["execStep","workflowURI"])
		
		result.close()

		return jsonResult,200

	def post(self, id,id1):

		#Agraph

		args = pipeline_post_parser.parse_args()

		wkflid = args.workflow_id
		prtjctid = id
		pplid = id1
		step = args.step

		#check if workflow is on pipeline

		pipelineStr = localNSpace+"projects/"+str(prtjctid)+"/pipelines/"+str(pplid)
		workflowStr = localNSpace+"workflows/"+str(wkflid)

		queryString = "SELECT ?execStep WHERE {<"+pipelineStr+"> obo:NGS_0000076 ?execStep. ?execStep obo:NGS_0000079 <"+workflowStr+">.}"
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		jsonResult=parseAgraphQueryRes(result,["execStep"])
		result.close()

		if len(jsonResult) > 0:
			return 409
		else:				
			#add new workflow
			exStepType=dbconAg.createURI(namespace=obo, localname="NGS_0000074")
			#workflowURI = dbconAg.createURI(namespace=localNSpace+"user/"+args.user_id+"/studies/", localname="study_"+str(id2)+"/pipelines/pipeline_"+str(id3)+"/workflows/workflow_"+str(numberOfWorkflows+1))
			workflowURI = dbconAg.createURI(namespace=localNSpace, localname="workflows/"+str(wkflid))
			
			executeRel=dbconAg.createURI(namespace=obo, localname="NGS_0000076")
			pipelineURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(prtjctid)+"/pipelines/"+str(pplid))
			exStepURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(prtjctid)+"/pipelines/"+str(pplid)+"/step/"+str(step))
			indexInt = dbconAg.createLiteral((step), datatype=XMLSchema.INT)
			indexProp = dbconAg.createURI(namespace=obo, localname="NGS_0000081")
			hasWorkflRel = dbconAg.createURI(namespace=obo, localname="NGS_0000079")
			
			dbconAg.add(exStepURI, RDF.TYPE, exStepType)
			stmt1 = dbconAg.createStatement(exStepURI, indexProp, indexInt)
			dbconAg.add(stmt1)
			#link pipeline to step
			dbconAg.add(pipelineURI, executeRel, exStepURI)
			#add workflow + link to step
			workflowType= dbconAg.createURI(namespace=obo, localname="OBI_0500000")
			dbconAg.add(workflowURI, RDF.TYPE, workflowType)
			dbconAg.add(exStepURI, hasWorkflRel, workflowURI)
			
			return 201

	def delete(self, id):
		pass


class NGSOnto_ProtocolWorkflowResource(Resource):    
	
	def get(self):
		args=workflow_get_parser.parse_args()

		#Agraph
		workflowsid=args.workflow_id
		workflowURI = localNSpace+"workflows/"+str(workflowsid)


		queryString = "SELECT ?protocol ?index WHERE { <"+workflowURI+"""> obo:NGS_0000078 ?step.
						?step obo:NGS_0000077 ?protocol;
						obo:NGS_0000081 ?index.}"""
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		jsonResult=parseAgraphQueryRes(result,["index","protocol"])
		print jsonResult

		result.close()

		return jsonResult,200


	def post(self):

		args=workflow_post_parser.parse_args()

		protocol_ids = args.protocol_ids.split(',')
		workflow_id = args.workflow_id    

		for p_id in protocol_ids:

			print p_id

			protocolURI = dbconAg.createURI(namespace=localNSpace, localname="protocols/"+str(p_id))
			print protocolURI

			hasStep = dbconAg.createURI(namespace=obo, localname="NGS_0000078")
			workflowURI = dbconAg.createURI(namespace=localNSpace, localname="workflows/"+str(workflow_id))
			statements = dbconAg.getStatements(workflowURI, hasStep, None)
			jsonResult=parseAgraphStatementsRes(statements)
			statements.close()
			numberOfProtocols=len(jsonResult)

			protocolStepType = dbconAg.createURI(namespace=obo, localname="NGS_0000075")
			protocStepUri = dbconAg.createURI(namespace=localNSpace, localname="workflows/"+str(workflow_id)+"/step/"+str(numberOfProtocols+1))
			indexProp = dbconAg.createURI(namespace=obo, localname="NGS_0000081")
			indexInt = dbconAg.createLiteral((numberOfProtocols+1), datatype=XMLSchema.INT)
			hasProtocolRel=dbconAg.createURI(namespace=obo, localname="NGS_0000077")

			#add step + index
			dbconAg.add(protocStepUri, RDF.TYPE, protocolStepType)
			stmt1 = dbconAg.createStatement(protocStepUri, indexProp, indexInt)
			dbconAg.add(stmt1)
			#link workflow to step
			dbconAg.add(workflowURI, hasStep, protocStepUri)
			#add protocol + link to step
			dbconAg.add(protocStepUri, hasProtocolRel, protocolURI)

		return 201