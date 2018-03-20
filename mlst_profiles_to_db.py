from app import db
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, Core_Schemas
import datetime
import sys
import json
import os.path

import argparse

from config import allele_classes_to_ignore, metadata_to_use, base_metadata, metadata_to_use_yersinia


def main():
    parser = argparse.ArgumentParser(
        description="This program populates a database according with a set of "
                    "input files")
    parser.add_argument('-i', nargs='?', type=str, help='Allelic profiles',
                        required=True)
    parser.add_argument('-c', nargs='?', type=str, help='classification file',
                        required=True)
    parser.add_argument('-m', nargs='?', type=str, help='metadata file',
                        required=True)
    parser.add_argument('-d', nargs='?', type=str,
                        help='database to populate(str)', required=True)
    parser.add_argument('-p', nargs='?', type=str, help='platform tag',
                        required=True)

    args = parser.parse_args()
    args.i, args.c, args.m, args.d, args.p
    mlst_profiles_to_db(args.i, args.c, args.m, args.d, args.p)


def populate_db_ecoli(name, classifierl1, classifierl2, allelic_profile,
                      strain_metadata, from_platform_tag):

    ecoli = Ecoli(name=name, classifier_l1=classifierl1,
                  classifier_l2=classifierl2,
                  allelic_profile=allelic_profile,
                  strain_metadata=strain_metadata,
                  platform_tag=from_platform_tag,
                  timestamp=datetime.datetime.utcnow())

    db.session.add(ecoli)
    db.session.commit()

    return 201


def populate_db_yersinia(name, classifier, allelic_profile, strain_metadata,
                         from_platform_tag):

    ecoli = Yersinia(name=name, classifier=classifier,
                     allelic_profile=allelic_profile,
                     strain_metadata=strain_metadata,
                     platform_tag=from_platform_tag,
                     timestamp=datetime.datetime.utcnow())

    db.session.add(ecoli)
    db.session.commit()

    return 201


def populate_db_campylobacter(name, classifier, allelic_profile,
                              strain_metadata, from_platform_tag):

    ecoli = Campylobacter(name=name, classifier=classifier,
                          allelic_profile=allelic_profile,
                          strain_metadata=strain_metadata,
                          platform_tag=from_platform_tag,
                          timestamp=datetime.datetime.utcnow())

    db.session.add(ecoli)
    db.session.commit()

    return 201


def populate_db_salmonella(name, classifier, allelic_profile, strain_metadata,
                           from_platform_tag):

    ecoli = Salmonella(name=name, classifier=classifier,
                       allelic_profile=allelic_profile,
                       strain_metadata=strain_metadata,
                       platform_tag=from_platform_tag,
                       timestamp=datetime.datetime.utcnow())

    db.session.add(ecoli)
    db.session.commit()

    return 201

populate_dbs = {
    "ecoli": populate_db_ecoli,
    "yersinia": populate_db_yersinia,
    "campylobacter": populate_db_campylobacter,
    "salmonella": populate_db_salmonella
}


def read_chewBBACA_file_to_JSON(file_path, type_species):

    results_alleles = {}
    headers_file_path = file_path + ".headers"
    headers_file_path = "./chewbbaca_database_profiles/profiles_headers/" + \
                        type_species + ".txt"

    with open(file_path, 'rtU') as reader:
        with open(headers_file_path, 'w') as p:
            loci = None
            count = 0
            for line in reader:
                count += 1
                line = line.splitlines()[0]

                if len(line) > 0:
                    if line.startswith('FILE'):
                        loci = line.split('\t')[1:]
                        p.write("\n".join(line.split('\t')))
                        print "DONE profile headers file"
                    else:
                        line = line.split('\t')
                        sample = line[0]
                        results_alleles[sample] = {}
                        line = line[1:]
                        if len(line) != len(loci):
                            sys.exit('Different number of loci')
                        for x, allele_locus in enumerate(line):
                            if allele_locus.startswith(
                                    tuple(allele_classes_to_ignore.keys())):
                                for k, v in allele_classes_to_ignore.items():
                                    allele_locus = allele_locus.replace(k, v)
                            results_alleles[sample][loci[x]] = allele_locus

    return results_alleles


def read_metadata_file_to_JSON(file_path, table_id):

    results_metadata = {}

    if table_id == "yersinia" or table_id == "ecoli":
        real_metadata_to_use = metadata_to_use_yersinia
    else:
        real_metadata_to_use = metadata_to_use

    with open(file_path, 'rtU') as reader:
        metadata_fields = None
        for line in reader:
            line = line.splitlines()[0]
            if len(line) > 0:
                if line.startswith('Uberstrain') or line.startswith('FILE'):
                    metadata_fields = line.split('\t')[0:]
                    print metadata_fields
                else:
                    line = line.split('\t')

                    if table_id == "yersinia" or table_id == "ecoli":
                        sample = line[0]
                    else:
                        sample = line[0] + ".fasta"

                    results_metadata[sample] = {}
                    line = line[0:]
                    if len(line) != len(metadata_fields):
                        sys.exit('Different number of loci')
                    for x, metadata_field in enumerate(metadata_fields):
                        for k, v in real_metadata_to_use.items():
                            if k == metadata_field:
                                results_metadata[sample][real_metadata_to_use[metadata_field]] = line[x]

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
                    classifications = []

                    for x, classification in enumerate(line):
                        classifications.append(classification)

                    results_classification[sample] = classifications

    return results_classification


def mlst_profiles_to_db(chewbbaca_file_path, classification_file_path,
                        metadata_file_path, table_id, platform_tag):

    chewbbaca_json = read_chewBBACA_file_to_JSON(chewbbaca_file_path, table_id)
    print "DONE chewBBACA parse"
    classification_json = read_classification_file_to_JSON(classification_file_path)
    print "DONE classification parse"
    metadata_json = read_metadata_file_to_JSON(metadata_file_path, table_id)
    print "DONE metadata parse"
    count_no_meta = 0
    count_no_class = 0

    no_results_class_path = "./app/utils/no_results_class.txt"
    no_results_meta_path = "./app/utils/no_results_meta.txt"

    with open(no_results_meta_path, 'w') as m:

        with open(no_results_class_path, 'w') as w:

            for strain_id, allelic_profile in chewbbaca_json.iteritems():
                try:
                    classification_to_use = classification_json[strain_id]
                except KeyError as e:
                    print "No classification found for " + strain_id +\
                          ". Adding undefined..."
                    w.write(strain_id + "\n")
                    classification_to_use = ["undefined", "undefined"]
                    count_no_class += 1
                    print count_no_class
                try:
                    metadata_to_use = metadata_json[strain_id]
                except KeyError as e:
                    print "No metadata for " + strain_id + ". Adding empty..."
                    m.write(strain_id + "\n")
                    count_no_meta += 1
                    print count_no_meta
                    metadata_to_use = base_metadata

                populate_dbs[table_id](strain_id, classification_to_use[0],
                                       classification_to_use[1],
                                       allelic_profile, metadata_to_use,
                                       platform_tag)

    print "DONE IMPORTING TO DB AND CREATING PROFILE HEADERS FILE"


if __name__ == "__main__":
    main()



