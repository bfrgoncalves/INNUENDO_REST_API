from app import app, db
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas
import datetime
import sys
import json
import os.path

def populate_db_ecoli(name, classifier, allelic_profile, table_id):

	ecoli = Ecoli(name = name, classifier = classifier, allelic_profile = allelic_profile, timestamp = datetime.datetime.utcnow())
	
	db.session.add(ecoli)
	db.session.commit()

	return 201

def populate_db_yersinia(name, classifier, allelic_profile, table_id):

	ecoli = Yersinia(name = name, classifier = classifier, allelic_profile = allelic_profile, timestamp = datetime.datetime.utcnow())
	
	db.session.add(ecoli)
	db.session.commit()

	return 201

def populate_db_campylobacter(name, classifier, allelic_profile, table_id):

	ecoli = Campylobacter(name = name, classifier = classifier, allelic_profile = allelic_profile, timestamp = datetime.datetime.utcnow())
	
	db.session.add(ecoli)
	db.session.commit()

	return 201

def populate_db_salmonella(name, classifier, allelic_profile, table_id):

	ecoli = Salmonella(name = name, classifier = classifier, allelic_profile = allelic_profile, timestamp = datetime.datetime.utcnow())
	
	db.session.add(ecoli)
	db.session.commit()

	return 201


populate_dbs = {"ecoli": populate_db_ecoli, "yersinia": populate_db_yersinia, "campylobacter": populate_db_campylobacter, "salmonella": populate_db_salmonella}


def read_chewBBACA_file_to_JSON(file_path):

	results_alleles = {}
	with open(file_path, 'rtU') as reader:
	    allele_classes_to_ignore = {'LNF': '0', 'INF-': '', 'NIPHEM': '0', 'NIPH': '0', 'LOTSC': '0', 'PLOT3': '0', 'PLOT5': '0', 'ALM': '0', 'ASM': '0'}
	    loci = None
	    for line in reader:
	        line = line.splitlines()[0]
	        if len(line) > 0:
	            if line.startswith('FILE'):
	                loci = line.split('\t')[1:]
	            else:
	                line = line.split('\t')
	                sample = line[0]
	                results_alleles[sample] = {}
	                line = line[1:]
	                if len(line) != len(loci):
	                    sys.exit('Different number of loci')
	                for x, allele_locus in enumerate(line):
	                    if allele_locus.startswith(tuple(allele_classes_to_ignore.keys())):
	                        for k, v in allele_classes_to_ignore.items():
	                            allele_locus = allele_locus.replace(k, v)
	                    results_alleles[sample][loci[x]] = allele_locus
	
	return results_alleles

def read_metadata_file_to_JSON(file_path):

	results_metadata = {}
	with open(file_path, 'rtU') as reader:
	    metadata_to_use = {'Uberstrain': 'strainID', 'SourceType': 'Source', 'Country': 'Country', 'Serotype': 'Serotype', 'Simple Patho': 'Pathotyping', 'ST(Achtman 7 Gene)': 'ST'}
	    metadata_fields = None
	    for line in reader:
	        line = line.splitlines()[0]
	        if len(line) > 0:
	            if line.startswith('Uberstrain'):
	                metadata_fields = line.split('\t')[0:]
	            else:
	                line = line.split('\t')
	                sample = line[0] + ".fasta"
	                results_metadata[sample] = {}
	                line = line[0:]
	                if len(line) != len(metadata_fields):
	                    sys.exit('Different number of loci')
	                for x, metadata_field in enumerate(metadata_fields):
                        for k, v in metadata_to_use.items():
                        	if k == metadata_field:
                        		results_metadata[sample][metadata_to_use[metadata_field]] = line[x]

	return results_metadata


def read_classification_file_to_JSON(file_path):

	results_classification = {}
	with open(file_path, 'rtU') as reader:
	    loci = None
	    for line in reader:
	        line = line.splitlines()[0]
	        if len(line) > 0:
	            if not line.startswith('FILE'):
	                line = line.split('\t')
	                sample = line[0]
	                results_classification[sample] = {}
	                line = line[1:]
	                for x, classification in enumerate(line):
	                    results_classification[sample] = classification

	return results_classification

def mlst_profiles_to_db(chewbbaca_file_path, classification_file_path, metadata_file_path, table_id):
	chewbbaca_json = read_chewBBACA_file_to_JSON(chewbbaca_file_path)
	classification_json = read_classification_file_to_JSON(classification_file_path)
	metadata_json = read_metadata_file_to_JSON(metadata_file_path)


	print metadata_json
	
	#for strain_id, allelic_profile in chewbbaca_json.iteritems():
		#populate_dbs[table_id](strain_id, classification_json[strain_id], allelic_profile)

mlst_profiles_to_db("chewbbaca_database_profiles/results_alleles_ecoli.tsv", "chewbbaca_database_profiles/Classification15_ecoli.txt", "chewbbaca_database_profiles/ecoli_info_enterobase.txt", "ecoli")




