from app import db
import random
import os
import string
import json
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas, Report, Strain, Tree

import subprocess
from subprocess import call


def get_closest_profiles(profile_query_file_path, index_path, max_closest):

	file_name = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))
	result_path = profile_query_file_path + ".result"


	command = './dependencies/fast-mlst/src/main -i '+index_path+' -q '+max_closest+' < '+profile_query_file_path+' &> ' + result_path;
	#command = './dependencies/fast-mlst/src/main --help';
	#command = 'python ./app/resources/phyloviz/remoteUpload.py -u innuendo_demo -p innuendo_demo -sdt profile -sd ' + file_path_profile + ' -d ' + args.dataset_name + ' -dn ' + args.dataset_description + '-l';
	command = command.split(' ')
	print command

	#proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	#stdout, stderr = proc.communicate()

	call(command)

	print "DONE"