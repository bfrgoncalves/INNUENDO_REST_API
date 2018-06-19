from app import db
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella
import datetime
import sys
import argparse

from config import allele_classes_to_ignore, metadata_to_use, base_metadata, \
    metadata_to_use_yersinia


def main():
    """Main function to trigger profile adding to the databases

    The function parses the input of the user and triggers the funtion to add
    profiles to the databases.

    Returns
    -------

    """

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

    mlst_profiles_to_db(args.i, args.c, args.m, args.d, args.p)


def populate_db_ecoli(name, classifierl1, classifierl2,
                      classifierl3, allelic_profile,
                      strain_metadata, from_platform_tag):
    """Adds a new Escherichia coli profile to the database

    Parameters
    ----------
    name: str
    classifierl1: str
    classifierl2: str
    classifierl3: str
    allelic_profile: json
    strain_metadata: json
    from_platform_tag: str

    Returns
    -------
    status: request status code
    """

    try:
        ecoli = Ecoli(name=name, classifier_l1=classifierl1,
                      classifier_l2=classifierl2,
                      classifier_l3=classifierl3,
                      allelic_profile=allelic_profile,
                      strain_metadata=strain_metadata,
                      platform_tag=from_platform_tag,
                      timestamp=datetime.datetime.utcnow())

        db.session.add(ecoli)
        db.session.commit()

    except Exception:
        print name + " already exists"
        print "Updating data..."

        entry = db.session.query(Ecoli).filter(Ecoli.name == name).first()

        if not entry:
            print "Error updating " + name
        else:
            entry.classifier_l1 = classifierl1
            entry.classifier_l2 = classifierl2
            entry.classifier_l3 = classifierl3
            entry.allelic_profile = allelic_profile
            entry.strain_metadata = strain_metadata
            entry.platform_tag = from_platform_tag

            db.session.commit()

            print name + " updated!"

        return 200

    return 201


def populate_db_yersinia(name, classifierl1, classifierl2,
                         classifierl3, allelic_profile,
                         strain_metadata, from_platform_tag):
    """Adds a new Yersinia enterocolitica profile to the database

    Parameters
    ----------
    name: str
    classifierl1: str
    classifierl2: str
    classifierl3: str
    allelic_profile: json
    strain_metadata: json
    from_platform_tag: str

    Returns
    -------
    status: request status code
    """

    try:
        ecoli = Yersinia(name=name, classifier_l1=classifierl1,
                         classifier_l2=classifierl2,
                         classifier_l3=classifierl3,
                         allelic_profile=allelic_profile,
                         strain_metadata=strain_metadata,
                         platform_tag=from_platform_tag,
                         timestamp=datetime.datetime.utcnow())

        db.session.add(ecoli)
        db.session.commit()

    except Exception:
        print name + " already exists"
        print "Updating data..."

        entry = db.session.query(Yersinia).filter(Yersinia.name == name).first()

        if not entry:
            print "Error updating " + name
        else:
            entry.classifier_l1 = classifierl1
            entry.classifier_l2 = classifierl2
            entry.classifier_l3 = classifierl3
            entry.allelic_profile = allelic_profile
            entry.strain_metadata = strain_metadata
            entry.platform_tag = from_platform_tag

            db.session.commit()

            print name + " updated!"

        return 200

    return 201


def populate_db_campylobacter(name, classifierl1, classifierl2,
                              classifierl3, allelic_profile,
                              strain_metadata, from_platform_tag):
    """Adds a new Campylobacter jejuni/coli profile to the database

    Parameters
    ----------
    name: str
    classifierl1: str
    classifierl2: str
    classifierl3: str
    allelic_profile: json
    strain_metadata: json
    from_platform_tag: str

    Returns
    -------
    status: request status code
    """

    try:
        ecoli = Campylobacter(name=name, classifier_l1=classifierl1,
                              classifier_l2=classifierl2,
                              classifier_l3=classifierl3,
                              allelic_profile=allelic_profile,
                              strain_metadata=strain_metadata,
                              platform_tag=from_platform_tag,
                              timestamp=datetime.datetime.utcnow())

        db.session.add(ecoli)
        db.session.commit()

    except Exception:
        print name + " already exists"
        print "Updating data..."

        entry = db.session.query(Campylobacter).filter(Campylobacter.name == name).first()

        if not entry:
            print "Error updating " + name
        else:
            entry.classifier_l1 = classifierl1
            entry.classifier_l2 = classifierl2
            entry.classifier_l3 = classifierl3
            entry.allelic_profile = allelic_profile
            entry.strain_metadata = strain_metadata
            entry.platform_tag = from_platform_tag

            db.session.commit()

            print name + " updated!"

        return 200

    return 201


def populate_db_salmonella(name, classifierl1, classifierl2,
                           classifierl3, allelic_profile,
                           strain_metadata, from_platform_tag):
    """Adds a new Salmonella enterica profile to the database

    Parameters
    ----------
    name: str
    classifierl1: str
    classifierl2: str
    classifierl3: str
    allelic_profile: json
    strain_metadata: json
    from_platform_tag: str

    Returns
    -------
    status: request status code
    """

    try:
        ecoli = Salmonella(name=name, classifier_l1=classifierl1,
                           classifier_l2=classifierl2,
                           classifier_l3=classifierl3,
                           allelic_profile=allelic_profile,
                           strain_metadata=strain_metadata,
                           platform_tag=from_platform_tag,
                           timestamp=datetime.datetime.utcnow())

        db.session.add(ecoli)
        db.session.commit()

    except Exception:
        print name + " already exists"
        print "Updating data..."

        entry = db.session.query(Salmonella).filter(Salmonella.name == name).first()

        if not entry:
            print "Error updating " + name
        else:
            entry.classifier_l1 = classifierl1
            entry.classifier_l2 = classifierl2
            entry.classifier_l3 = classifierl3
            entry.allelic_profile = allelic_profile
            entry.strain_metadata = strain_metadata
            entry.platform_tag = from_platform_tag

            db.session.commit()

            print name + " updated!"

        return 200

    return 201


# dictionary with the associations between species tags and their respective
# databases.
populate_dbs = {
    "ecoli": populate_db_ecoli,
    "yersinia": populate_db_yersinia,
    "campylobacter": populate_db_campylobacter,
    "salmonella": populate_db_salmonella
}


def read_chewBBACA_file_to_JSON(file_path, type_species):

    """Loads chewBBACA profile file to a JSON format

    This method parses the chewBBACA file by substituting the locus not found
    variants by 0 and then it loads into a JSON object for a fastest data
    retrieval.

    Parameters
    ----------
    file_path: str
    type_species: str

    Returns
    -------
    dict: JSON object devided by sample and locus.
    """

    results_alleles = {}

    headers_file_path = "./chewbbaca_database_profiles/profiles_headers/" + \
                        type_species + ".txt"

    # Opens the chewBBACA file
    with open(file_path, 'rtU') as reader:
        # Creates an headers file to add all the loci and identifier into a
        # single file.
        with open(headers_file_path, 'w') as p:
            loci = None
            count = 0
            for line in reader:
                count += 1
                line = line.splitlines()[0]

                if len(line) > 0:
                    # Add headers to headers_file in case it is the first
                    # line and starts with the FILE identifier.
                    if line.startswith('FILE'):
                        loci = line.split('\t')[1:]
                        p.write("\n".join(line.split('\t')))
                        print "DONE profile headers file"
                    else:
                        line = line.split('\t')
                        sample = line[0]
                        results_alleles[sample] = {}
                        line = line[1:]

                        # Check if number of loci match with the headers
                        if len(line) != len(loci):
                            sys.exit('Different number of loci')

                        # Replace locus not found variants by 0
                        for x, allele_locus in enumerate(line):
                            if allele_locus.startswith(
                                    tuple(allele_classes_to_ignore.keys())):
                                for k, v in allele_classes_to_ignore.items():
                                    allele_locus = allele_locus.replace(k, v)
                            results_alleles[sample][loci[x]] = allele_locus

    print "chewBBACA to JSON DONE"

    return results_alleles


def read_metadata_file_to_JSON(file_path, table_id):

    """Load metadata file to a JSON object

    This method loads a provided metadata file into a JSON object. This is
    then used to be added to the profiles database.

    Parameters
    ----------
    file_path: str
    table_id: str

    Returns
    -------
    dict: JSON object with the strain metadata by sample and field
    """

    results_metadata = {}

    real_metadata_to_use = metadata_to_use_yersinia

    # Open metadata file
    with open(file_path, 'rtU') as reader:
        metadata_fields = None
        for line in reader:
            line = line.splitlines()[0]

            if len(line) > 0:
                # Get fields if is first line
                if line.startswith('Uberstrain') or line.startswith('FILE'):
                    metadata_fields = line.split('\t')[0:]
                else:
                    line = line.split('\t')
                    sample = line[0]
                    results_metadata[sample] = {}
                    line = line[0:]

                    # Check if number of columns match with the number of
                    # metadata fields.
                    if len(line) != len(metadata_fields):
                        sys.exit('Different number of fields')

                    for x, metadata_field in enumerate(metadata_fields):
                        for k, v in real_metadata_to_use.items():
                            if k == metadata_field:
                                results_metadata[sample][real_metadata_to_use[metadata_field]] = line[x]

    return results_metadata


def read_classification_file_to_JSON(file_path):

    """Loads a classification file to JSON

    This method loads a profile classification file to JSON. This is then
    used when adding the profiles to the database.

    Parameters
    ----------
    file_path: str

    Returns
    -------
    dict: JSON object with the classifications by sample.
    """

    results_classification = {}

    # Open classification file
    with open(file_path, 'rtU') as reader:

        for line in reader:
            line = line.splitlines()[0]

            if len(line) > 0:

                # Add classification to the JSON object
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

    """Main function to parse and add profiles to db

    This method merges all the required information obtained from profiles,
    metadata, and classification and add them to the profile database.

    Parameters
    ----------
    chewbbaca_file_path: str
    classification_file_path: str
    metadata_file_path: str
    table_id: str
    platform_tag: str

    Returns
    -------

    """

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
                    classification_to_use = ["undefined", "undefined",
                                             "undefined"]
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
                                       classification_to_use[2],
                                       allelic_profile, metadata_to_use,
                                       platform_tag)

    print "DONE IMPORTING TO DB AND CREATING PROFILE HEADERS FILE"


if __name__ == "__main__":
    main()



