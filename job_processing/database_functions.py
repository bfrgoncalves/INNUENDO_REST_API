from app import app, db
import random
import os
import string
import json
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas, Report
import fast_mlst_functions
import datetime

from config import wg_index_correspondece, core_index_correspondece, core_headers_correspondece, wg_headers_correspondece, allele_classes_to_ignore

'''
index_correspondece = {"E.coli":"./chewbbaca_database_profiles/indexes/ecoli.index"}
headers_correspondece = {"E.coli":"./chewbbaca_database_profiles/profiles_headers/ecoli.txt"}
'''
database_correspondece = {"E.coli":Ecoli}

def search_on_database(strain_id, closest_number):
	return True


def add_to_database(strain_id, profile_object, classifier):
	return True



def tab_profile_from_db(strain_id, database, headers_file_path, profile_tab_file_path):

	print strain_id
	
	strain_to_use = db.session.query(database).filter(database.name == strain_id).first()

	if strain_to_use:
		allelic_profile = strain_to_use.allelic_profile
		profile_array = []

		with open(profile_tab_file_path, 'w') as w:

			if headers_file_path != None:
				with open(headers_file_path, 'rtU') as reader:
					for i, line in enumerate(reader):
						if i != 0:
							profile_array.append(allelic_profile[line.rstrip()])
						else:
							profile_array.append(str(i+1))
				w.write('\t'.join(profile_array))

	return profile_tab_file_path



def classify_profile(job_id, database_name):

	report = db.session.query(Report).filter(Report.job_id == job_id).first()

	file_name = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
	query_profle_path = "./chewbbaca_database_profiles/query_files/" + file_name + ".tab"


	headers_profile = []
	headers = []

	strain_allele_profile = {}

	to_replace = allele_classes_to_ignore

	#to_replace = {"LNF": "0", "INF-": "", "NIPHEM": "0", "NIPH": "0", "LOTSC": "0", "PLOT3": "0", "PLOT5": "0", "ALM": "0", "ASM": "0"}
	headers = headers_profile + report.report_data["run_output"]["header"]
	profile = report.report_data["run_output"]["run_output.fasta"]

	core_profile = []
	count_core = 0

	print headers[0]
	print len(headers)
	print len(profile)

	for i, header in enumerate(headers):
		strain_allele_profile[header] = profile[i]
	
	with open(core_headers_correspondece[database_name], 'rtU') as reader:
		for i, line in enumerate(reader):
			if i > 0:
				count_core+=1
				include_index = headers.index(line.rstrip())
				if include_index > -1:
					core_profile.append(profile[include_index])

	print len(core_profile)
	print query_profle_path

	string_list = "\t".join(core_profile)
	print len(core_profile)
	#string_list = "\t".join(report.report_data["run_output"]["run_output.fasta"])

	for k,v in to_replace.iteritems():
		string_list = string_list.replace(k,v)
	#new_profile.append(report.sample_name + "\t" + new_allele)

	print string_list

	with open(query_profle_path, 'w') as writer:
		writer.write(report.sample_name + "\t" + string_list)

	closest_profiles = fast_mlst_functions.get_closest_profiles(query_profle_path, core_index_correspondece[database_name], count_core/3)

	print closest_profiles

	if len(closest_profiles) == 0:
		classification = "undefined"
	else:
		database_entry = db.session.query(database_correspondece[database_name]).filter(database_correspondece[database_name].name == closest_profiles.split("\t")[0]).first()

		if database_entry:
			classification = database_entry.classifier
		else:
			classification = "undefined"

	new_database_entry = database_correspondece[database_name](name = report.sample_name, classifier = classification, allelic_profile = strain_allele_profile, strain_metadata = {}, platform_tag = "FP", timestamp = datetime.datetime.utcnow())
	
	db.session.add(new_database_entry)
	db.session.commit()

	print "ADDED TO DB...UPDATING INDEX"

	status = fast_mlst_functions.get_closest_profiles(query_profle_path, core_index_correspondece[database_name])

	print "INDEX UPDATED"

	##ADD TO DB AND UPDATE INDEX




