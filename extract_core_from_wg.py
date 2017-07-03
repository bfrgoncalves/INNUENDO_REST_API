#!flask/bin/python

import subprocess
import argparse
import os
import shutil
import os


def main():

	parser = argparse.ArgumentParser(description="This program build a db and creates the indexes for searches and correspondence files")
	parser.add_argument('-i', nargs='?', type=str, help="results_alleles chewbbaca", required=True)
	parser.add_argument('-c', nargs='?', type=str, help="core list", required=True)
	parser.add_argument('-o', nargs='?', type=str, help="Output file", required=True)


	args = parser.parse_args()

	core_json, core_list  = extract_core(args.i, args.c)

	writeCoreFile(core_json, args.o)


def writeCoreFile(core_json, out_file);
	
	first_time=True
	
	with open(out_file, 'w') as w:
		all_profiles = []
		for sample, val in core_json.items():
			allelic_profile = []
			loci=[]
			loci.append("FILE")
			allelic_profile.push(val)
			for allele, allele_val in sample.items():
				if allele in core_loci_list:
					allelic_profile.append(allele_val)
					if first_time == True:
						loci.append(allele)
			all_profiles.append(allelic_profile)
			first_time = False
		
		w.write("\t".join(loci) + "\n")
		
		for profile in all_profiles:
			w.write("\t".join(profile) +"\n")




def extract_core(allele_file, core_file)

	results_alleles_file = allele_file
	core_loci_list_file = core_file

	core_loci_list = []
	with open(core_loci_list_file, 'rtU') as reader:
		for line in reader:
			line = line.splitlines()[0]
			if len(line) > 0:
				core_loci_list.append(line)

	results_alleles = {}
	results_alleles_core = {}
	with open(results_alleles_file, 'rtU') as reader:
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
					results_alleles_core[sample] = {}
					line = line[1:]
					if len(line) != len(loci):
						sys.exit('Different number of loci')
					for x, allele_locus in enumerate(line):
						if allele_locus.startswith(tuple(allele_classes_to_ignore.keys())):
							for k, v in allele_classes_to_ignore.items():
								allele_locus = allele_locus.replace(k, v)
						results_alleles[sample][loci[x]] = allele_locus
						if loci[x] in core_loci_list:
							results_alleles_core[sample][loci[x]] = allele_locus

	return results_alleles_core, core_loci_list

