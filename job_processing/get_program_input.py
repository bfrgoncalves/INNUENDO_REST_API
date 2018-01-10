import os
import requests
import argparse
import sys

from queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

#from config import obo,localNSpace,protocolsTypes,processTypes,processMessages
import os 

from franz.openrdf.sail.allegrographserver import AllegroGraphServer
from franz.openrdf.repository.repository import Repository
from franz.miniclient import repository

#READ CONFIG FILE
config = {}
execfile("config.py", config)

obo = config["obo"]
localNSpace = config["localNSpace"]
protocolsTypes = config["protocolsTypes"]
processTypes = config["processTypes"]
processMessages = config["processMessages"]
basedir = config["basedir"]
AG_HOST = config["AG_HOST"]
AG_PORT = config["AG_PORT"]
AG_REPOSITORY = config["AG_REPOSITORY"]
AG_USER = config["AG_USER"]
AG_PASSWORD = config["AG_PASSWORD"]

from queryParse2Json import parseAgraphStatementsRes,parseAgraphQueryRes

#setup agraph
server= AllegroGraphServer(AG_HOST, AG_PORT, AG_USER, AG_PASSWORD)
catalog = server.openCatalog()             ## default rootCatalog
#print "Available repositories in catalog '%s':  %s" % (catalog.getName(), catalog.listRepositories())    
myRepository = catalog.getRepository(AG_REPOSITORY, Repository.OPEN)
myRepository.initialize()
dbconAg = myRepository.getConnection()
dedicateddbconAg = myRepository.getConnection()
#print "Repository %s is up!  It contains %i statements." % (
#	myRepository.getDatabaseName(), dbconAg.size())

#print '####################################################'

from franz.openrdf.vocabulary.rdf import RDF
from franz.openrdf.vocabulary.xmlschema import XMLSchema
from franz.openrdf.query.query import QueryLanguage
from franz.openrdf.model import URI


def get_process_input(project_id, pipeline_id, process_id):

	try:
		procStr = localNSpace + "projects/" + str(project_id) + "/pipelines/" + str(pipeline_id) + "/processes/" + str(process_id)
		
		queryString = "SELECT (str(?typelabel) as ?label) (str(?file1) as ?file_1) (str(?file2) as ?file_2) (str(?file3) as ?file_3) (str(?status) as ?statusStr) WHERE{<"+procStr+"> obo:RO_0002233 ?in. ?in a ?type.?type rdfs:label ?typelabel. OPTIONAL { ?in obo:NGS_0000092 ?file1; obo:NGS_0000093 ?file2; obo:NGS_0000094 ?file3; } OPTIONAL { <"+procStr+"> obo:NGS_0000097 ?status.}}"
		#queryString = "SELECT ?file1 ?file2 ?file3 ?type   WHERE {<"+procStr+"> obo:RO_0002233 ?in. ?in obo:NGS_0000092 ?file1.?in obo:NGS_0000093 ?file2.?in obo:NGS_0000094 ?file3. ?in a ?type}"
		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()

		jsonResult=parseAgraphQueryRes(result,["file_3", "label", "statusStr"])
		#jsonResult=parseAgraphQueryRes(result,["label"])

		result.close()

		if "biosamples sample" in jsonResult[0]["label"]:
			sys.stdout.write('FirstProcess')
		#elif "false" in jsonResult[0]["statusStr"]:
			#print "STATUS", jsonResult[0]["statusStr"]
			#sys.stderr.write("404")
		#elif "read" in jsonResult[0]["label"]:
		else:
			sys.stdout.write(jsonResult[0]["file_3"].split('"')[1])
		#print jsonResult["file3"]
	except Exception as e:
		sys.stdout.write("404")

		#change output to false
		processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(project_id)+"/pipelines/"+str(pipeline_id)+"/processes/"+str(process_id))
		
		runStatus = dbconAg.createLiteral(("false"), datatype=XMLSchema.STRING)
		runStatusProp = dbconAg.createURI(namespace=obo, localname="NGS_0000097")
		
		dbconAg.remove(processURI, runStatusProp, None)

		stmt5 = dbconAg.createStatement(processURI, runStatusProp, runStatus)

		dbconAg.add(stmt5)


	#queryString="SELECT DISTINCT (STR(?in) as ?messageURI) WHERE{<http://ngsonto.net/api/v1.0/projects/50/pipelines/106> obo:BFO_0000051  ?proc.{ ?proc obo:RO_0002233 ?in. ?in a <http://purl.obolibrary.org/obo/SO_0000150>. } UNION { ?proc obo:RO_0002234 ?in. ?in a <http://purl.obolibrary.org/obo/SO_0000150>. }}"


def get_process_status(project_id, pipeline_id, process_id):

	try:
		procStr = localNSpace + "projects/" + str(project_id) + "/pipelines/" + str(pipeline_id) + "/processes/" + str(process_id)
		queryString = "SELECT (str(?typelabel) as ?label) (str(?file1) as ?file_1) (str(?file2) as ?file_2) (str(?file3) as ?file_3) (str(?status) as ?statusStr) WHERE{<"+procStr+"> obo:RO_0002234 ?in. ?in a ?type.?type rdfs:label ?typelabel. OPTIONAL { ?in obo:NGS_0000092 ?file1; obo:NGS_0000093 ?file2; obo:NGS_0000094 ?file3. } OPTIONAL {?in obo:NGS_0000097 ?status.} }"

		tupleQuery = dbconAg.prepareTupleQuery(QueryLanguage.SPARQL, queryString)
		result = tupleQuery.evaluate()
		
		jsonResult=parseAgraphQueryRes(result,["statusStr"])

		result.close()

		if "pass" in jsonResult[0]["statusStr"]:
			#print "STATUS", jsonResult[0]["statusStr"]
			sys.stdout.write("COMPLETED")
		elif "None" in jsonResult[0]["statusStr"]:
			sys.stdout.write("PD")
		elif "running" in jsonResult[0]["statusStr"]:
			sys.stdout.write("R")
		elif "pending" in jsonResult[0]["statusStr"]:
			sys.stdout.write("PD")
		elif "warning" in jsonResult[0]["statusStr"]:
			sys.stdout.write("WARNING")
		elif "fail" in jsonResult[0]["statusStr"]:
			sys.stdout.write("FAILED")
		elif "error" in jsonResult[0]["statusStr"]:
			sys.stdout.write("FAILED")
	except Exception as e:
		sys.stdout.write("NEUTRAL")


def set_unique_prop_output(project_id, pipeline_id, process_id, property_type, property_value):

	output_prop_to_type = {"run_info":"NGS_0000092", "run_output":"NGS_0000093", "warnings":"NGS_0000094", "log_file":"NGS_0000096", "status":"NGS_0000097"}

	property_types = property_type.split(",")
	property_values = property_value.split(",")
	
	try:
		for p,v in zip(property_types, property_values):
			#Agraph
			processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(project_id)+"/pipelines/"+str(pipeline_id)+"/processes/"+str(process_id))

			#get output URI from process
			hasOutput = dbconAg.createURI(namespace=obo, localname="RO_0002234")
			statements = dbconAg.getStatements(processURI, hasOutput, None)
			outputURI=parseAgraphStatementsRes(statements)
			statements.close()

			outputURI = dbconAg.createURI(outputURI[0]['obj'])

			runInfo = dbconAg.createLiteral((v), datatype=XMLSchema.STRING)
			runInfoProp = dbconAg.createURI(namespace=obo, localname=output_prop_to_type[p])


			if p != "log_file":
				dbconAg.remove(outputURI, runInfoProp, None)

			#add outputs paths to process
			stmt1 = dbconAg.createStatement(outputURI, runInfoProp, runInfo)

			#send to allegro
			dbconAg.add(stmt1)

	except Exception as e:
		sys.stdout.write("404")

def set_process_output(project_id, pipeline_id, process_id, run_info, run_stats, output, log_file, status):

	try:
		#Agraph
		processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(project_id)+"/pipelines/"+str(pipeline_id)+"/processes/"+str(process_id))


		#get output URI from process
		hasOutput = dbconAg.createURI(namespace=obo, localname="RO_0002234")
		statements = dbconAg.getStatements(processURI, hasOutput, None)
		outputURI=parseAgraphStatementsRes(statements)
		statements.close()

		outputURI = dbconAg.createURI(outputURI[0]['obj'])

		runInfo = dbconAg.createLiteral((run_info), datatype=XMLSchema.STRING)
		runInfoProp = dbconAg.createURI(namespace=obo, localname="NGS_0000092")

		runStats = dbconAg.createLiteral((run_stats), datatype=XMLSchema.STRING)
		runStatsProp = dbconAg.createURI(namespace=obo, localname="NGS_0000093")

		runFile = dbconAg.createLiteral((output), datatype=XMLSchema.STRING)
		runFileProp = dbconAg.createURI(namespace=obo, localname="NGS_0000094")

		logFile = dbconAg.createLiteral((log_file), datatype=XMLSchema.STRING)
		logFileProp = dbconAg.createURI(namespace=obo, localname="NGS_0000096")

		runStatus = dbconAg.createLiteral((status), datatype=XMLSchema.STRING)
		runStatusProp = dbconAg.createURI(namespace=obo, localname="NGS_0000097")

		dbconAg.remove(outputURI, runInfoProp, None)
		dbconAg.remove(outputURI, runStatsProp, None)
		dbconAg.remove(outputURI, runFileProp, None)
		#dbconAg.remove(outputURI, logFileProp, None)
		dbconAg.remove(outputURI, runStatusProp, None)
		#dbconAg.remove(processURI, hasOutput, None)

		#add outputs paths to process
		stmt1 = dbconAg.createStatement(outputURI, runInfoProp, runInfo)
		stmt2 = dbconAg.createStatement(outputURI, runStatsProp, runStats)
		stmt3 = dbconAg.createStatement(outputURI, runFileProp, runFile)
		stmt4 = dbconAg.createStatement(outputURI, logFileProp, logFile)
		stmt5 = dbconAg.createStatement(outputURI, runStatusProp, runStatus)

		#send to allegro
		dbconAg.add(stmt1)
		dbconAg.add(stmt2)
		dbconAg.add(stmt3)
		dbconAg.add(stmt4)
		dbconAg.add(stmt5)
		
	except Exception as e:
		#print "ERROR", e
		sys.stdout.write("404")

def set_process_pending(project_id, pipeline_id, process_id):
	#change output to false
	processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(project_id)+"/pipelines/"+str(pipeline_id)+"/processes/"+str(process_id))
	
	runStatus = dbconAg.createLiteral(("pending"), datatype=XMLSchema.STRING)
	runStatusProp = dbconAg.createURI(namespace=obo, localname="NGS_0000097")
	
	dbconAg.remove(processURI, runStatusProp, None)

	stmt5 = dbconAg.createStatement(processURI, runStatusProp, runStatus)

	dbconAg.add(stmt5)

#TO TALK WITH MICKAEL
def set_process_input(project_id, pipeline_id, process_id, input_to_use):
	#change output to false
	pipelineURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(project_id)+"/pipelines/"+str(pipeline_id)+"/processes/"+str(process_id))
	
	queryString = "SELECT DISTINCT (STR(?in) as ?messageURI) WHERE {<http://ngsonto.net/api/v1.0/projects/50/pipelines/106> obo:BFO_0000051  ?proc. { ?proc obo:RO_0002233 ?in. ?in a <http://purl.obolibrary.org/obo/SO_0000150>. } UNION { ?proc obo:RO_0002234 ?in. ?in a input_to_use. }}"
	
	processURI = dbconAg.createURI(namespace=localNSpace+"projects/", localname=str(project_id)+"/pipelines/"+str(pipeline_id)+"/processes/"+str(process_id))
	
	runStatus = dbconAg.createLiteral((input_to_use), datatype=XMLSchema.STRING)
	runStatusProp = dbconAg.createURI(namespace=obo, localname="NGS_0000097") 
	
	dbconAg.remove(processURI, runStatusProp, None)

	stmt5 = dbconAg.createStatement(processURI, runStatusProp, runStatus)

	dbconAg.add(stmt5)


def main():

	parser = argparse.ArgumentParser(prog='get_program_input.py', description='Sets and Gets process inputs and outputs')

	parser.add_argument('--process', type=str, help='Process identifier', required=True)
	parser.add_argument('--pipeline', type=str, help='Pipeline identifier', required=True)
	parser.add_argument('--project', type=str, help='Project identifier', required=True)
	parser.add_argument('-v1', type=str, help='path value for file1', required=False)
	parser.add_argument('-v2', type=str, help='path value for file2', required=False)
	parser.add_argument('-v3', type=str, help='path value for file3', required=False)
	parser.add_argument('-v4', type=str, help='path value for file4', required=False)
	parser.add_argument('-v5', type=str, help='path value for status', required=False)
	parser.add_argument('-i', type=str, help='input to set', required=False)
	parser.add_argument('-t', type=str, help='type of set (input, output, status, set_pending, set_input)', required=True)
	parser.add_argument('-u', type=str, help='set unique property')

	args = parser.parse_args()

	if args.t == 'input' and not args.v1:
		get_process_input(args.project, args.pipeline, args.process)
	elif args.t == 'output' and args.u:
		set_unique_prop_output(args.project, args.pipeline, args.process, args.u, args.v1)
	elif args.t == 'output' and args.v1:
		set_process_output(args.project, args.pipeline, args.process, args.v1, args.v2, args.v3, args.v4, args.v5)
	elif args.t == 'status':
		get_process_status(args.project, args.pipeline, args.process)
	elif args.t == 'set_pending':
		set_process_pending(args.project, args.pipeline, args.process)
	elif args.t == 'set_input':
		set_process_input(args.project, args.pipeline, args.process, args.i)




if __name__ == "__main__":
	main()