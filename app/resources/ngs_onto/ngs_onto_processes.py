from app import app, dbconAg,dedicateddbconAg
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from flask_security import current_user, login_required
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
process_post_parser.add_argument('parent_pipeline_id', dest='parent_pipeline_id', type=str, required=True, help="parent_pipeline_id id")
process_post_parser.add_argument('parent_project_id', dest='parent_project_id', type=str, required=True, help="parent_project_id id")
process_post_parser.add_argument('parent_process_id', dest='parent_process_id', type=str, required=True, help="parent_process_id id")
process_post_parser.add_argument('real_pipeline_id', dest='real_pipeline_id', type=str, required=True, help="real_pipeline_id id")

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

#post output parser
process_post_output_parser = reqparse.RequestParser()
process_post_output_parser.add_argument('run_stats', dest='run_stats', type=str, required=True, help="run stats")
process_post_output_parser.add_argument('run_info', dest='run_info', type=str, required=True, help="run info")
process_post_output_parser.add_argument('output', dest='output', type=str, required=True, help="output")
process_post_output_parser.add_argument('status', dest='status', type=str, required=True, help="output")



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
		queryString = "SELECT (str(?proc) as ?StrProc) (str(?index) as ?StrIndex) WHERE{<"+pipelineStr+"> obo:BFO_0000051 ?proc. ?proc obo:NGS_0000081 ?index.}"
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		procJsonResult=parseAgraphQueryRes(result,["StrProc","StrIndex"])
		result.close()

		numberOfProcesses=len(procJsonResult)	

		
		#get all ordered workflows from pipeline
		queryString = "SELECT ?execStep ?stepIndex ?workflowURI ?execStep  WHERE {<"+pipelineStr+"> obo:NGS_0000076 ?execStep. ?execStep obo:NGS_0000079 ?workflowURI; obo:NGS_0000081 ?stepIndex} ORDER BY ASC(?stepIndex)"
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		jsonResult=parseAgraphQueryRes(result,["stepIndex","workflowURI","execStep"])
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
		
		'''for bindingSet in result:
			#print bindingSet[0]
			processid=int(str(bindingSet[0]).split('"')[1])
		result.close()'''

		queryString = """SELECT (COUNT (?out) as ?ocount){
		SELECT DISTINCT ?out WHERE { ?pip a obo:OBI_0000471;obo:BFO_0000051 ?proc. ?proc obo:RO_0002234 ?out.}
		}"""

		#print queryString
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		
		for bindingSet in result:
			messageid=int(str(bindingSet[0]).split('"')[1])
		result.close()
		print '##############'
		print args.strain_id, type(args.strain_id) 
		if args.strain_id != "null":
			strainid=args.strain_id
		else:
			ppipid = args.parent_pipeline_id
			ppropid = args.parent_project_id
			pprocid = args.parent_process_id
			rpipid = args.real_pipeline_id

			parentProcessURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(ppropid)+"/pipelines/"+str(ppipid)+"/processes/"+str(pprocid))

			if ppipid == rpipid:
				print procJsonResult
				for proc_json in procJsonResult:
					print proc_json["StrIndex"]
					if k == "StrIndex" and int(proc_json["StrIndex"]) > int(pprocid):
						todelUri = dbconAg.createURI(k)
						dbconAg.remove(parentProcessURI, None, todelUri)

			print ppropid, ppipid, pprocid
			print '##############################'
			print parentProcessURI
			#get output URI from process
			hasOutput = dbconAg.createURI(namespace=obo, localname="RO_0002234")
			statements = dbconAg.getStatements(parentProcessURI, hasOutput, None)
			outputURI=parseAgraphStatementsRes(statements)
			statements.close()

			print outputURI
			#print outputURI[0]
			outputURI = dbconAg.createURI(outputURI[0]['obj'])
			print outputURI
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
			addedProcesses=numberOfProcesses
			hasOutputRel=dbconAg.createURI(namespace=obo, localname="RO_0002234")
			hasInputRel=dbconAg.createURI(namespace=obo, localname="RO_0002233")
			isRunOfProtocl=dbconAg.createURI(namespace=obo, localname="NGS_0000091")
			
			#prev process to link (strain URI most of times)
			if args.strain_id != "null":
				prevMessageURI = dbconAg.createURI(namespace=localNSpace, localname="strains/strain_"+str(strainid))
				strainTypeURI=dbconAg.createURI('http://rdf.ebi.ac.uk/terms/biosd/Sample')
				dbconAg.add(prevMessageURI, RDF.TYPE, strainTypeURI)

			else:
				prevMessageURI = outputURI
			#prevMessageURI = dbconAg.createURI(namespace=localNSpace+"studies/", localname=str(id2)+"/pipelines/pipeline_"+str(id3)+"/messages/message"+str(2))
			processes_ids = []
			print len(listOrderedProcessTypes), addedProcesses
			print messageid
			processid=addedProcesses
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
				print jsonResult2
				jsonResult2[0]["process_id"] = x
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

class NGSOnto_ProcessOutputResource(Resource):

	def post(self, id, id2,id3):

		args = process_post_output_parser.parse_args()
		try:
			#Agraph
			processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(id)+"/pipelines/"+str(id2)+"/processes/"+str(id3))


			#get output URI from process
			hasOutput = dbconAg.createURI(namespace=obo, localname="RO_0002234")
			statements = dbconAg.getStatements(processURI, hasOutput, None)
			outputURI=parseAgraphStatementsRes(statements)
			statements.close()

			outputURI = dbconAg.createURI(outputURI[0]['obj'])

			runInfo = dbconAg.createLiteral((args.run_info), datatype=XMLSchema.STRING)
			runInfoProp = dbconAg.createURI(namespace=obo, localname="NGS_0000092")

			runStats = dbconAg.createLiteral((args.output), datatype=XMLSchema.STRING)
			runStatsProp = dbconAg.createURI(namespace=obo, localname="NGS_0000093")

			runFile = dbconAg.createLiteral((args.run_stats), datatype=XMLSchema.STRING)
			runFileProp = dbconAg.createURI(namespace=obo, localname="NGS_0000094")
			
			runStatus = dbconAg.createLiteral((args.status), datatype=XMLSchema.STRING)
			runStatusProp = dbconAg.createURI(namespace=obo, localname="NGS_0000097")

			dbconAg.remove(outputURI, runInfoProp, None)
			dbconAg.remove(outputURI, runStatsProp, None)
			dbconAg.remove(outputURI, runFileProp, None)
			dbconAg.remove(outputURI, runStatusProp, None)

			#add outputs paths to process
			stmt1 = dbconAg.createStatement(outputURI, runInfoProp, runInfo)
			stmt2 = dbconAg.createStatement(outputURI, runStatsProp, runStats)
			stmt3 = dbconAg.createStatement(outputURI, runFileProp, runFile)
			stmt4 = dbconAg.createStatement(processURI, runStatusProp, runStatus)

			#send to allegro
			dbconAg.add(stmt1)
			dbconAg.add(stmt2)
			dbconAg.add(stmt3)
			dbconAg.add(stmt4)
			return 202
		except Exception as e:
			print e
			return 404

	def get(self, id, id2, id3):

		try:
			procStr = localNSpace + "projects/" + str(id) + "/pipelines/" + str(id2) + "/processes/" + str(id3)
			queryString = "SELECT (str(?file1) as ?file_1) (str(?file2) as ?file_2) (str(?file3) as ?file_3) (str(?file4) as ?file_4) (str(?status) as ?statusStr)  WHERE {<"+procStr+"> obo:RO_0002234 ?out. <"+procStr+"> obo:NGS_0000097 ?status.  ?out obo:NGS_0000092 ?file1.?out obo:NGS_0000093 ?file2.?out obo:NGS_0000094 ?file3. ?out obo:NGS_0000096 ?file4.}"
			#print queryString
			tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
			result = tupleQuery.evaluate()
			
			jsonResult=parseAgraphQueryRes(result,["file_1", "file_2", "file_3", "file_4", "statusStr"])
			
			'''file_out = ""
			for bindingSet in result:
				print bindingSet
				file_out = bindingSet["file3"] #output_file
			'''
			result.close()

			
			return jsonResult, 200
		except Exception as e:
			print e
			return 404