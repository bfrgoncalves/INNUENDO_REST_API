from app import db
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas
import datetime
import sys
import json
import os.path
import re
import argparse

from config import allele_classes_to_ignore, metadata_to_use, base_metadata


'''
This program plots the differences between nodes using the core genome against the distance using the accessory genome
'''
database_corespondence = {"ecoli": Ecoli, "yersinia": Yersinia, "campylobacter": Campylobacter, "salmonella": Salmonella}

def main():
    parser = argparse.ArgumentParser(description="This program plots the differences between nodes using the core genome against the distance using the accessory genome")
    parser.add_argument('-d', nargs='?', type=str, help='database to use', required=True)
    parser.add_argument('-g', nargs='?', type=str, help='list of genes to remove from wg', required=True)

    args = parser.parse_args()
    strain_core_object, strain_wg_object = get_profiles_object(args.d, args.g)
    core_distances, accesory_distances = compute_distances(strain_core_object, strain_wg_object)
    print core_distances
    plot_distances(core_distances, accesory_distances)


def get_profiles_object(database_to_use, genes_to_remove_file_path):

	results = db.session.query(database_corespondence[database_to_use]).all()

	FilesToRemove = []
	strain_wg_object = []
	strain_core_object = []

	with open(genes_to_remove_file_path) as f:
		for File in f:
			File = File.rstrip('\n')
			File = File.rstrip('\r')
			File = (File.split('\t'))[0]
			FilesToRemove.append(File)

		count_strains = -1

		for strain in results:
			print "Searching strain " + strain.name

			strain_wg_object.append({})
			strain_core_object.append({})
			count_strains += 1
			
			allelic_profile = strain.allelic_profile

			for removable in FilesToRemove:
				if not hasattr(strain_core_object[count_strains], removable):
					strain_core_object[count_strains][removable] = allelic_profile[removable]

			for key, val in allelic_profile.iteritems():
				strain_core_object[count_strains][key] = val


	return strain_core_object, strain_wg_object


def compute_distances(strain_core_object, strain_wg_object):
	
	rows_core = []
	rows_wg = []

	for strain_1 in range(0, len(strain_core_object)):
		print "RUNNING strain " + strain_1
		columns_core = []
		columns_wg = []
		
		for strain_2 in range(strain_1 + 1, len(strain_core_object)):
			count_diff_core = 0
			count_diff_wg = 0
			for locus in strain_core_object[strain_1]:
				if strain_core_object[strain_1][locus] != strain_core_object[strain_2][locus]:
					count_diff_core += 1
			columns_core.append(count_diff_core)
			for locus in strain_wg_object[strain_1]:
				if strain_wg_object[strain_1][locus] != strain_wg_object[strain_2][locus]:
					count_diff_wg += 1
			columns_wg.append(count_diff_wg)
		
		rows_core.append(columns_core)
		rows_wg.append(columns_wg)

	return rows_core, rows_wg


def plot_distances(core_distances, accesory_distances):

	return 200


if __name__ == "__main__":
    main()