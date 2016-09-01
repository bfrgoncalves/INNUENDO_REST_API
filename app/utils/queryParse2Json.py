import json

#query parsers aux functions
def parseAgraphQueryRes(result,listValuesToGet):
	resultList=[]
	for bindingSet in result:
			auxDict={}
			
			for elem in listValuesToGet:
				
				try:
					auxDict[elem]=str(bindingSet.getValue(elem))
				except:
					pass
			resultList.append(auxDict)
	jsonObj=json.loads(json.dumps(resultList))
	return jsonObj

def parseAgraphStatementsRes(statements):
	resultList=[]
	for statem in statements:
		auxDict={}
		auxDict["subj"]=str(statem.getSubject())
		auxDict["pred"]=str(statem.getPredicate())
		auxDict["obj"]=str(statem.getObject())
		
		resultList.append(auxDict)
	jsonObj=json.loads(json.dumps(resultList))
	return jsonObj
