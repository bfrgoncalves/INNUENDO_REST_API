from app import db
import random
import os
import string
import json
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas, Report, Strain, Tree

import subprocess
import requests
import datetime
import fast_mlst_functions
import database_functions

from config import wg_index_correspondece, core_index_correspondece, core_headers_correspondece, wg_headers_correspondece, allele_classes_to_ignore, phyloviz_root

database_correspondece = {"E.coli":Ecoli}

'''
index_correspondece = {"E.coli":"./chewbbaca_database_profiles/indexes/ecoli.index"}
headers_correspondece = {"E.coli":"./chewbbaca_database_profiles/profiles_headers/ecoli.txt"}
'''

def send_to_phyloviz(job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest, user_id, species_id, missing_data, missing_char):

	file_name = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
	file_path_profile = './app/uploads/'+file_name+'_profile.tab'
	file_path_metadata = './app/uploads/'+file_name+'_metadata.tab'

	profile_tab_file_path = './chewbbaca_database_profiles/query_files/'+file_name+'_profile.tab'

	if not os.path.isdir("./app/uploads"):
		os.mkdir("./app/uploads")

	total_j_ids = job_ids.split(",")
	array_to_process = []

	for job_id in total_j_ids:
		body_profile = [];
		report = db.session.query(Report).filter(Report.job_id == job_id).first()
		if not report:
			continue

		if database_to_include != "None":
			#report.sample_name
			profile_query_file_path, number_of_loci = database_functions.tab_profile_from_db(report.sample_name.replace(" ", "_"), database_correspondece[database_to_include], wg_headers_correspondece[database_to_include], profile_tab_file_path)
			array_to_process.append([profile_query_file_path, number_of_loci])
	

	array_of_strains_from_db = []
	merged_list = []

	if database_to_include != "None":
		merged_list_temp = []
		#Merge all first max_closest for each strain and then creates a set
		for strain_selected in array_to_process:
			list_to_query = fast_mlst_functions.get_closest_profiles(strain_selected[0], wg_index_correspondece[database_to_include], strain_selected[1]/2)
			print len(list_to_query)
			merged_list_temp = merged_list_temp + list_to_query[:int(max_closest)]
		
		merged_list = list(set(merged_list_temp))

		#list_to_query = list_to_query[:int(max_closest)] #FIlters according to the number of closest requested by the user
		print len(merged_list)
		for x in merged_list:
			strain_id = x.split("\t")[0]
			strains_from_db = db.session.query(database_correspondece[database_to_include]).filter(database_correspondece[database_to_include].name == strain_id).first()
			if strains_from_db:
				array_of_strains_from_db.append(strains_from_db)

	headers_profile = ["ID"]
	headers_metadata = ["ID"]
	body_profile = []
	all_profiles = []
	all_metadata = []
	headers = []

	strains_selected_from_plat = []

	
	total_j_ids = job_ids.split(",")

	first_time = True
	first_time_m = True

	count_ids = 0
	additional_data = json.loads(additional_data)

	to_replace = {"LNF": "0", "INF-": "", "NIPHEM": "0", "NIPH": "0", "LOTSC": "0", "PLOT3": "0", "PLOT5": "0", "ALM": "0", "ASM": "0"}
	
	for job_id in total_j_ids:
		body_profile = [];
		report = db.session.query(Report).filter(Report.job_id == job_id).first()
		if not report:
			continue
		else:
			#print report.report_data["run_output"]
			#print report.sample_name

			if first_time == True:
				headers = headers_profile + report.report_data["run_output"]["header"]
				first_time = False

			new_profile = []
			string_list = "\t".join(report.report_data["run_output"]["run_output.fasta"])

			for k,v in to_replace.iteritems():
				string_list = string_list.replace(k,v)
			#new_profile.append(report.sample_name + "\t" + new_allele)

			#print profiles
			strains_selected_from_plat.append(report.sample_name)
			all_profiles.append(report.sample_name + "\t" + string_list)

			strain = db.session.query(Strain).filter(Strain.name == report.sample_name).first()

			strain_metadata = json.loads(strain.strain_metadata)
			if first_time_m == True:
				for x in strain_metadata:
					if x == "fileselector":
						continue
					else:
						headers_metadata.append(x)
				for key, val in additional_data[str(count_ids)].iteritems():
					headers_metadata.append(key)
				headers_metadata.append("Platform tag")
				headers_metadata.append("Classifier")

			first_time_m = False
			
			straind = [report.sample_name]
			print strain_metadata
			for x in headers_metadata:
				try:
					if x == "fileselector":
						continue
					if x == "ID":
						continue

					else:
						straind.append(strain_metadata[x].replace(" ", "-"))
				except KeyError:
					continue
			for key, val in additional_data[str(count_ids)].iteritems():
				straind.append(val)
			straind.append("FP")
			strain_at_db_but_clicked = db.session.query(database_correspondece[database_to_include]).filter(database_correspondece[database_to_include].name == report.sample_name).first()
			if strain_at_db_but_clicked:
				straind.append(strain_at_db_but_clicked.classifier)
			else:
				straind.append("undefined")
			all_metadata.append('\t'.join(straind))

		count_ids += 1

	if len(array_of_strains_from_db) > 0:
		for strain_from_db in array_of_strains_from_db:
			if strain_from_db.name in strains_selected_from_plat:
				continue
			
			string_profile = []
			string_metadata = []
			for x in headers:
				if x != "ID":
					string_profile.append(strain_from_db.allelic_profile[x])

			string_profile = "\t".join(string_profile)
			all_profiles.append(strain_from_db.name + "\t" + string_profile)

			#INCLUDE METADATA FROM PLATFORM IF STRAIN FROM THERE
			if strain_from_db.platform_tag == "FP":
				print "FROM PLATFORM"
				strain = db.session.query(Strain).filter(Strain.name == strain_from_db.name).first()
				strain_metadata = json.loads(strain.strain_metadata)
			else:
				strain_metadata = strain_from_db.strain_metadata

			#print "HEADERS", len(headers_metadata)
			for x in headers_metadata:
				try:
					if x == "ID":
						string_metadata.append(strain_from_db.name)
					elif x == "Platform tag":
						string_metadata.append(strain_from_db.platform_tag)
					elif x == "Classifier":
						string_metadata.append(strain_from_db.classifier)
					else:
						string_metadata.append(strain_metadata[x].replace(" ", "-"))
				except Exception as e:
					string_metadata.append("")

			#print "METADATA",len(string_metadata)
			all_metadata.append('\t'.join(string_metadata))


	if len(all_profiles) < 2:
		return {"message":"Less than two profiles for comparison. Please try to increase the maximum number of differences."}

	#WRITE PROFILE FILE
	with open(file_path_profile, 'w') as p_file:
		hd = [];
		
		p_file.write('\t'.join(headers) + '\n')
		
		for y in all_profiles:
			p_file.write(y + '\n')
	
	#WRITE METADATA FILE
	with open(file_path_metadata, "w") as p_file:			
		p_file.write("\t".join(headers_metadata) + "\n")
		
		for y in all_metadata:
			p_file.write(y + "\n")

	print file_path_profile
	print file_path_metadata

	print missing_data
	if missing_data == "True":
		missing_data_to_use = "true"
		command = 'python ./app/resources/phyloviz/remoteUpload.py -u innuendo_demo -p innuendo_demo -cd '+phyloviz_root+' -am core -root '+phyloviz_root+' -mc ' + missing_char + ' -mt 0 -sdt profile -sd ' + file_path_profile + ' -d "'+dataset_name+'" -dn "'+dataset_description+'" -m '+ file_path_metadata;
	else:
		missing_data_to_use = "false"
		command = 'python ./app/resources/phyloviz/remoteUpload.py -u innuendo_demo -p innuendo_demo -cd '+phyloviz_root+' -root '+phyloviz_root+' -sdt profile -sd ' + file_path_profile + ' -d "'+dataset_name+'" -dn "'+dataset_description+'" -m '+ file_path_metadata +' -pid ' + parent_id;

	#command = 'python ./app/resources/phyloviz/remoteUpload.py -t '+cookie_string+' -cd '+config.final_root+' -am '+analysis_method+' -root '+config.final_root+' -mc ' + req.body.missingschar + ' -mt ' + missing_threshold + ' -sdt profile -sd uploads/'+profileName+' -d "'+req.body.name+'" -dn "'+req.body.description+'" -m uploads/'+metadataName+' -pid ' + parent_id;

	#command = 'python ./app/resources/phyloviz/remoteUpload.py -cd '+BASE_ROOT+' -am core -root '+BASE_ROOT+' -mc ' + missing_char + ' -mt 0 -sdt profile -sd ' + file_path_profile + ' -d "'+dataset_name+'" -dn "'+dataset_description+'" -m '+ file_path_metadata +' -pid ' + parent_id;
	#command = 'python ./app/resources/phyloviz/remoteUpload.py -u innuendo_demo -p innuendo_demo -sdt profile -sd ' + file_path_profile + ' -m '+ file_path_metadata +' -d ' + dataset_name + ' -dn ' + dataset_description + '-l' + ' --missing_data ' + missing_data_to_use + ' --missing_char ' + missing_char;
	#command = 'python ./app/resources/phyloviz/remoteUpload.py -u innuendo_demo -p innuendo_demo -sdt profile -sd ' + file_path_profile + ' -d ' + args.dataset_name + ' -dn ' + args.dataset_description + '-l';
	command = command.split(' ')

	print command

	proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	stdout, stderr = proc.communicate()

	print stdout, stderr


	if "http" in stdout:
		phyloviz_uri = "http" + stdout.split("http")[1]
		tree_entry = Tree(user_id=user_id, name=dataset_name, description=dataset_description, uri=phyloviz_uri, timestamp=datetime.datetime.utcnow(), species_id=species_id)
		if not tree_entry:
			abort(404, message="An error as occurried when uploading the data".format(id))
		db.session.add(tree_entry)
		db.session.commit()
		return 201
	else:
		return 404
	
	return 200