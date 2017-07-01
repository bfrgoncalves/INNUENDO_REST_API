from app import db
import random
import os
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas

database_correspondece = {"E.coli":Ecoli}

def send_to_phyloviz(job_ids, dataset_name, dataset_description, additional_data, database_to_include, max_closest):

	file_name = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
	file_path_profile = './app/uploads/'+file_name+'_profile.tab'
	file_path_metadata = './app/uploads/'+file_name+'_metadata.tab'

	if not os.path.isdir("./app/uploads"):
		os.mkdir("./app/uploads")
		
	if database_to_include != "None":
		strains_from_db = db.session.query(database_correspondece[database_to_include]).limit(int(max_closest)).all()

	headers_profile = ["ID"]
	headers_metadata = ["ID"]
	body_profile = []
	all_profiles = []
	all_metadata = []
	headers = []


	total_j_ids = job_ids.split(",")

	first_time = True
	first_time_m = True

	count_ids = 0
	additional_data = json.loads(args.additional_data)
	
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

			first_time_m = False
			
			straind = [report.sample_name]
			for x in strain_metadata:
				if x == "fileselector":
					continue
				else:
					straind.append(strain_metadata[x])
			for key, val in additional_data[str(count_ids)].iteritems():
				straind.append(val)

			all_metadata.append('\t'.join(straind) + "\n")

		count_ids += 1

	if strains_from_db:
		for strain_from_db in strains_from_db:
			string_profile = []
			string_metadata = []
			for x in headers:
				string_profile.append(strain_from_db.allelic_profile[x])

			string_profile = "\t".join(string_profile)
			all_profiles.append(strain_from_db.name + "\t" + string_profile)

			for x in headers_metadata:
				try:
					string_metadata.append(strain_from_db.strain_metadata[x])
				except Exception as e:
					string_metadata.append("")

			all_metadata.append('\t'.join(string_metadata) + "\n")


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

	#command = 'python ./app/resources/phyloviz/remoteUpload.py -u innuendo_demo -p innuendo_demo -sdt profile -sd ' + file_path_profile + ' -m '+ file_path_metadata +' -d ' + args.dataset_name + ' -dn ' + args.dataset_description + '-l';
	#command = 'python ./app/resources/phyloviz/remoteUpload.py -u innuendo_demo -p innuendo_demo -sdt profile -sd ' + file_path_profile + ' -d ' + args.dataset_name + ' -dn ' + args.dataset_description + '-l';
	#command = command.split(' ')

	#proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	#stdout, stderr = proc.communicate()

	#return stdout, 200

	return 200