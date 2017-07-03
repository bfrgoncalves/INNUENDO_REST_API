from app import app, db
import random
import os
import string
import json
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas

def search_on_database(strain_id, closest_number):
	return True


def add_to_database(strain_id, profile_object, classifier):
	return True


def classify_profile(strain_id, profile_object):
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
					for line in reader:
						profile_array.append(allelic_profile[line])
				w.write('\t'.join(profile_array))

	return profile_tab_file_path