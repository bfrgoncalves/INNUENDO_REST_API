from app import app, dbconAg,dedicateddbconAg
from flask.ext.restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask.ext.security import current_user, login_required
from flask import jsonify
from app.utils.queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
from franz.openrdf.vocabulary.rdf import RDF
from franz.openrdf.vocabulary.xmlschema import XMLSchema
from franz.openrdf.query.query import QueryLanguage
from franz.openrdf.model import URI

#process post parser
process_post_parser = reqparse.RequestParser()
process_post_parser.add_argument('strain_id', dest='strain_id', type=str, required=True, help="strain id")

#Defining get arguments parser
process_get_parser = reqparse.RequestParser()
process_get_parser.add_argument('workflow_id', dest='workflow_id', type=str, required=True, help="Workflow id")

#process post parser
parser_jobid = reqparse.RequestParser()
parser_jobid.add_argument('processes_ids', dest='processes_ids', type=str, required=True, help="processes ids")
parser_jobid.add_argument('task_ids', dest='task_ids', type=str, required=True, help="slurm task ids")

#get job id parser
parser_get_jobid = reqparse.RequestParser()
parser_get_jobid.add_argument('processes_ids', dest='processes_ids', type=str, required=True, help="processes ids")


class NGSOnto_ProcessListPipelineResource(Resource):
	
	@login_required
	def get(self, id, id2):
		
		#Agraph
		pipelineStr = localNSpace+"projects/"+str(id)+"/pipelines/"+str(id2)
		pipelineURI = dbconAg.createURI(pipelineStr)
		#function need to check if the first input of the pipeline is a material sample, if not get previous pipeline and check again
		
		matSampleReached=False
		safetyTrigger=0
		ListProcess=[]
		ListPipeline=[]
		
		while not matSampleReached:
			
			#is first pipeline input a material sample?
			queryString = "SELECT ?process  ?process2 ?pipeline2 {"+str(pipelineURI)+" obo:BFO_0000051 ?process. ?process obo:NGS_0000081 '1'^^<http://www.w3.org/2001/XMLSchema#int> ; obo:RO_0002233 ?input. ?process2 obo:RO_0002234 ?input. ?pipeline2 obo:BFO_0000051 ?process2. } "
			tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
			result = tupleQuery.evaluate()
			jsonResult=parseAgraphQueryRes(result,["process2","pipeline2","process"])
			
			
			if len(jsonResult)>0:
				ListProcess.append((jsonResult[0])["process2"])
				ListPipeline.append((jsonResult[0])["pipeline2"])
				pipelineURI=dbconAg.createURI((jsonResult[0])["pipeline2"])
			else:
				matSampleReached=True
			
			result.close()	
			
			safetyTrigger+=1
			if safetyTrigger>10:
				matSampleReached=True
		
		i=0
		finalListProc=[]
		while i< len(ListPipeline):
			pipeline=ListPipeline[i]
			lastproc=ListProcess[i]
			
			queryString = "SELECT ?process  ?index {"+str(pipeline)+" obo:BFO_0000051 ?process. ?process obo:NGS_0000081 ?index.} ORDER BY ASC(?index)"
			tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
			result = tupleQuery.evaluate()
			jsonResult=parseAgraphQueryRes(result,["process"])
			result.close()
			for item in jsonResult:
				finalListProc.append(item["process"])
				if lastproc in item["process"]:
					break
			
			i+=1
		
		pipelineURI = dbconAg.createURI(pipelineStr)	
		queryString = "SELECT ?process  ?index {"+str(pipelineURI)+" obo:BFO_0000051 ?process. ?process obo:NGS_0000081 ?index.} ORDER BY ASC(?index)"
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		jsonResult=parseAgraphQueryRes(result,["process"])
		result.close()	
		for item in jsonResult:
			finalListProc.append(item["process"])
		
		return finalListProc,200

	@login_required
	def post(self, id, id2):

		args = process_post_parser.parse_args()

		#Agraph
		pipelineStr = localNSpace+"projects/"+str(id)+"/pipelines/"+str(id2)	
		
		#get number of processes already mapped on the pipeline
		hasPart = dbconAg.createURI(namespace=obo, localname="BFO_0000051")
		pipelineURI = dbconAg.createURI(pipelineStr)
		statements = dbconAg.getStatements(pipelineURI, hasPart, None)
		jsonResult=parseAgraphStatementsRes(statements)
		statements.close()
		numberOfProcesses=len(jsonResult)
		
		#get all ordered workflows from pipeline
		queryString = "SELECT ?execStep ?stepIndex ?workflowURI  WHERE {<"+pipelineStr+"> obo:NGS_0000076 ?execStep. ?execStep obo:NGS_0000079 ?workflowURI; obo:NGS_0000081 ?stepIndex} ORDER BY ASC(?stepIndex)"
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		jsonResult=parseAgraphQueryRes(result,["stepIndex","workflowURI"])
		result.close()	
		
		#get all protocols per workflow
		listOrderedProtocolsURI=[]
		listOrderedProcessTypes=[]
		listOrderedMessageTypes=[]
		for result in jsonResult:
			workflowURI= result["workflowURI"]
			queryString = "SELECT ?protocStep ?stepIndex ?protocolURI ?type  WHERE {"+workflowURI+" obo:NGS_0000078 ?protocStep. ?protocStep obo:NGS_0000077 ?protocolURI; obo:NGS_0000081 ?stepIndex. ?protocolURI a ?type. ?type rdfs:label ?typelabel.} ORDER BY ASC(?stepIndex)"
			#print queryString
			tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
			result3 = tupleQuery.evaluate()
			jsonResult2=parseAgraphQueryRes(result3,["stepIndex","protocolURI","type"])
			result3.close()
			
			#print jsonResult2
			#print protocolsTypes
			for results in jsonResult2:
				for k,v in protocolsTypes.items():
					if v in results["type"]:
						listOrderedProtocolsURI.append(results["protocolURI"]);
						#print k
						listOrderedProcessTypes.append(processTypes[k])
						listOrderedMessageTypes.append(processMessages[k])
			#print listOrderedProtocolsURI
			#print "BABABA" ,listOrderedProtocolsURI
		#get last process id and last message id
		queryString = """SELECT (COUNT (?prc) as ?pcount){
		SELECT DISTINCT ?prc WHERE { ?pip a obo:OBI_0000471;obo:BFO_0000051 ?proc.}
		}"""
		#print queryString
		
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		
		for bindingSet in result:
			#print bindingSet[0]
			processid=int(str(bindingSet[0]).split('"')[1])
		result.close()

		queryString = """SELECT (COUNT (?out) as ?ocount){
		SELECT DISTINCT ?out WHERE { ?pip a obo:OBI_0000471;obo:BFO_0000051 ?proc. ?proc obo:RO_0002234 ?out.}
		}"""

		#print queryString
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		
		for bindingSet in result:
			messageid=int(str(bindingSet[0]).split('"')[1])
		result.close()

		strainid=args.strain_id

		print numberOfProcesses, listOrderedProcessTypes
		if numberOfProcesses >= len(listOrderedProcessTypes):
			queryString = "SELECT ?pid ?Index  WHERE {<"+pipelineStr+"> obo:BFO_0000051 ?pid. ?pid obo:NGS_0000081 ?Index.} ORDER BY ASC(?Index)"
			#print queryString
			tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
			result = tupleQuery.evaluate()
			jsonResult2=parseAgraphQueryRes(result,["pid"])
			#print jsonResult2
			processes_ids = []
			for x in jsonResult2:
				string_p = x['pid']
				processes_ids.append(string_p.split('/')[-1].split('>')[0])

			return processes_ids, 200
		
		try:
			addedProcesses=0
			hasOutputRel=dbconAg.createURI(namespace=obo, localname="RO_0002234")
			hasInputRel=dbconAg.createURI(namespace=obo, localname="RO_0002233")
			isRunOfProtocl=dbconAg.createURI(namespace=obo, localname="NGS_0000091")
			
			#prev process to link (strain URI most of times)
			prevMessageURI = dbconAg.createURI(namespace=localNSpace, localname="strains/strain_"+str(strainid))
			#prevMessageURI = dbconAg.createURI(namespace=localNSpace+"studies/", localname=str(id2)+"/pipelines/pipeline_"+str(id3)+"/messages/message"+str(2))
			processes_ids = []
			print len(listOrderedProcessTypes), addedProcesses
			while addedProcesses < len(listOrderedProcessTypes):
				processid+=1
				messageid+=1
				processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(id2)+"/processes/"+str(processid))
				print 'PROCESS', processURI
				messageURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(id2)+"/messages/"+str(messageid))
				processTypeURI=dbconAg.createURI(listOrderedProcessTypes[addedProcesses])
				messageTypeURI=dbconAg.createURI(listOrderedMessageTypes[addedProcesses])
				protocolTypeURI = dbconAg.createURI(listOrderedProtocolsURI[addedProcesses])
				indexProp = dbconAg.createURI(namespace=obo, localname="NGS_0000081")
				indexInt = dbconAg.createLiteral((addedProcesses+1), datatype=XMLSchema.INT)
				
				#add process and link to pipeline
				dbconAg.add(processURI, RDF.TYPE, processTypeURI)
				dbconAg.add(pipelineURI, hasPart, processURI)
				stmt1 = dbconAg.createStatement(processURI, indexProp, indexInt)
				dbconAg.add(stmt1)
				
				#create output and input/output link messages to process
				dbconAg.add(messageURI, RDF.TYPE, messageTypeURI)
				dbconAg.add(processURI, hasOutputRel, messageURI)
				dbconAg.add(processURI, isRunOfProtocl, protocolTypeURI)
				dbconAg.add(processURI, hasInputRel, prevMessageURI)
				
				prevMessageURI=messageURI
				addedProcesses+=1
				processes_ids.append(processid)
		
			return processes_ids
		except:
			return 404

	def delete(self, id):
		pass

class NGSOnto_ProcessResource(Resource):

	@login_required
	def get(self, id,id2,id3): #id=user_id
		
		#Agraph
		processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(id2)+"/processes/"+str(id3))
		queryString = "describe "+str(processURI)
		describeQuery = dbconAg.prepareGraphQuery(QueryLanguage.SPARQL, queryString)
		result = describeQuery.evaluate()
		jsonResult2=parseAgraphStatementsRes(result)
		
		return jsonResult2, 200


class NGSOnto_ProcessJobID(Resource):
    
	@login_required
	def get(self, id,id2): #id=user_id

		args = parser_get_jobid.parse_args()
		processes = args.processes_ids.split(',')
		job_ids = []
		for x in processes:
			try:
			#Agraph
				#processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(id2)+"/processes/"+str(x))
				processURI = localNSpace+"projects/"+str(id)+"/pipelines/"+str(id2)+"/processes/"+str(x)
				queryString = "SELECT ?jobid  WHERE {<"+processURI+"> obo:NGS_0000089 ?jobid}"
				tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
				result = tupleQuery.evaluate()
				jsonResult2=parseAgraphQueryRes(result,["jobid"])
				job_ids.append(jsonResult2)

			except:
				return 404
			
		return job_ids
    
	@login_required
	def post(self, id, id2):

		args = parser_jobid.parse_args()

		tasks = args.task_ids.split(',')
		processes = args.processes_ids.split(',')
		countadded = 0

		for index in range(0, len(processes)):
			#print tasks[index], processes[index]
			try:
			#Agraph
				print tasks[index], processes[index]
				processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(id2)+"/processes/"+str(processes[index]))
				indexProp = dbconAg.createURI(namespace=obo, localname="NGS_0000089")
				indexInt = dbconAg.createLiteral(tasks[index], datatype=XMLSchema.STRING)

				#add jobID to process
				dbconAg.remove(processURI, indexProp, None)
				#dbconAg.add(processURI, indexProp, indexInt)
				stmt1 = dbconAg.createStatement(processURI, indexProp, indexInt)
				#send to allegro
				dbconAg.add(stmt1)
				countadded+=1
			except:
				print 'error mapping process'

		if countadded == len(tasks):
			return {'status':202, 'tasks':tasks}
		else:
			return 404