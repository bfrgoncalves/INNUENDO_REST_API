from app import db
import random
import os
import string
import json
from app.models.models import Ecoli, Yersinia, Campylobacter, Salmonella, \
    Core_Schemas, Report, Strain, Tree, Project, projects_strains

import subprocess
import datetime
import fast_mlst_functions
import database_functions

from config import wg_index_correspondece, core_index_correspondece, \
    core_headers_correspondece, wg_headers_correspondece, \
    allele_classes_to_ignore, phyloviz_root

database_correspondece = {
    "E.coli": Ecoli,
    "Yersinia": Yersinia,
    "Salmonella": Salmonella,
    "Campylobacter": Campylobacter
}

'''
PHYLOViZ Online (https://github.com/bfrgoncalves/Online-PhyloViZ) functions:
    - Allows sending a set of profiles to PHYLOViZ Online according to the c
    losest profiles in a database to a given set of profiles. This comparison 
    is made using Fast-MLST (https://github.com/aplf/fast-mlst)
    
    - It gets the max_closest profiles to each of the given profiles and then 
    creates a set. The result is sent to PHYLOViZ Online with the corresponding
    metadata.
'''


def xstr(s):
    if s is None:
        return 'NA'
    return str(s)


def send_to_phyloviz(job_ids, dataset_name, dataset_description,
                     additional_data, database_to_include,
                     database_version, max_closest,
                     user_id, species_id, missing_data, missing_char,
                     phyloviz_user, phyloviz_pass, makePublic):

    file_name = ''.join(random.choice(string.ascii_uppercase + string.digits)
                        for _ in range(8))

    file_path_profile = './app/uploads/'+file_name+'_profile.tab'
    file_path_metadata = './app/uploads/'+file_name+'_metadata.tab'

    to_replace = {
        "LNF": "0",
        "INF-": "",
        "NIPHEM": "0",
        "NIPH": "0",
        "LOTSC": "0",
        "PLOT3": "0",
        "PLOT5": "0",
        "ALM": "0",
        "ASM": "0"
    }

    to_replace_0EM = {
        "0EM": "0"
    }

    profile_tab_file_path = './chewbbaca_database_profiles/query_files/' + \
                            file_name+'_profile.tab'

    if not os.path.isdir("./app/uploads"):
        os.mkdir("./app/uploads")

    total_j_ids = job_ids.split(",")
    array_to_process = []

    for job_id in total_j_ids:
        body_profile = [];
        split_job_ids = job_id.split(":")
        report = db.session.query(Report)\
            .filter(
            Report.project_id == split_job_ids[0],
            Report.pipeline_id == split_job_ids[1],
            Report.process_position == split_job_ids[2]).first()

        if not report:
            continue

        if database_to_include != "None":
            file_name_profile = ''.join(random.choice(string.ascii_uppercase +
                                                      string.digits)
                                        for _ in range(8))

            profile_tab_file_path_profile = \
                './chewbbaca_database_profiles/query_files/' + \
                file_name_profile+'_profile.tab'

            print report.sample_name

            profile_query_file_path, number_of_loci = database_functions\
                .tab_profile_from_db(
                    report.sample_name.replace(" ", "_"),
                    database_correspondece[database_to_include],
                    wg_headers_correspondece[database_version][database_to_include],
                    profile_tab_file_path_profile)

            array_to_process.append([profile_query_file_path, number_of_loci])


    array_of_strains_from_db = []
    merged_list = []

    if database_to_include != "None":
        merged_list_temp = []
        # Merge all first max_closest for each strain and then creates a set
        for strain_selected in array_to_process:
            print strain_selected
            list_to_query = fast_mlst_functions\
                .get_closest_profiles(
                    strain_selected[0],
                    wg_index_correspondece[database_version][database_to_include],
                    strain_selected[1]/2)

            print list_to_query[:int(50)]

            list_without_distance = []
            for element_plus_distance in list_to_query:
                list_without_distance.append(
                    element_plus_distance.split("\t")[0])

            merged_list_temp = merged_list_temp + list_without_distance[:int(max_closest)]
            try:
                merged_list_temp.remove("FILE")
            except Exception:
                print "no FILE in results"


        merged_list = list(set(merged_list_temp))

        print merged_list
        print len(merged_list)

        for x in merged_list:
            strain_id = x.split("\t")[0]
            strains_from_db = db.session\
                .query(database_correspondece[database_to_include])\
                .filter(
                    database_correspondece[database_to_include].name == strain_id,
                    database_correspondece[database_to_include].name == database_version
                ).first()

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

    try:
        additional_data = json.loads(additional_data)
        print additional_data
    except Exception:
        additional_data = {}

    for job_id in total_j_ids:
        # Get profiles from the chewBBACA report
        split_job_ids = job_id.split(":")
        report = db.session.query(Report)\
            .filter(Report.project_id == split_job_ids[0],
                    Report.pipeline_id == split_job_ids[1],
                    Report.process_position == split_job_ids[2]).first()

        if not report:
            print "NO report"
            continue
        else:

            for arr in report.report_data["reportJson"]["cagao"]:
                if len(arr["header"]) > 20:
                    if first_time == True:
                        headers = headers_profile + arr["header"]
                        first_time = False
                    for key in arr:
                        if key != "header":
                            string_list = "\t".join(arr[key])

            for k, v in to_replace.iteritems():
                string_list = string_list.replace(k, v)

            for k,v in to_replace_0EM.iteritems():
                string_list = string_list.replace(k, v)

            strains_selected_from_plat.append(report.sample_name)
            all_profiles.append(report.sample_name + "\t" + string_list)

            print report.sample_name

            strain = db.session.query(Strain)\
                .filter(Strain.name == report.sample_name).first()

            strain_metadata = json.loads(strain.strain_metadata)

            if first_time_m:
                for x in strain_metadata:
                    if x == "fileselector":
                        continue
                    elif x == "Food-Bug":
                        # Change Food-Bug to Case ID
                        headers_metadata.append("Case ID")
                    else:
                        headers_metadata.append(x)

                count_metadata_added = 0

                for key, val in additional_data.iteritems():
                    for key1, val1 in val.iteritems():
                        if key1 not in headers_metadata:
                            headers_metadata.append(key1)

                headers_metadata.append("Platform tag")
                headers_metadata.append("Cluster L1")
                headers_metadata.append("Cluster L2")
                headers_metadata.append("Cluster L3")
                headers_metadata.append("Cluster All")

                print headers_metadata

            first_time_m = False

            straind = [report.sample_name]

            for x in headers_metadata:
                try:
                    if x == "fileselector":
                        continue
                    if x == "ID":
                        continue
                    else:
                        straind.append(strain_metadata[x].replace("\n", "")
                                       .replace("\r", ""))
                except KeyError:
                    is_added = False
                    try:
                        for key, val in additional_data[report.sample_name]\
                                .iteritems():
                            if key == x:
                                is_added = True
                                straind.append(str(val))
                    except KeyError:
                        if x == "Case ID":
                            # Change Food-Bug to Case ID
                            is_added = True
                            straind.append(strain_metadata["Food-Bug"])
                        else:
                            print "no additional data for that strain"

                    if not is_added:
                        if x != "Platform tag" and x != "Cluster L1" and x !=\
                                "Cluster L2" and x != "Cluster L3" and x != \
                                "Cluster All":
                            straind.append("NA")
                    continue

            straind.append("FP")
            strain_at_db_but_clicked = db.session\
                .query(database_correspondece[database_to_include])\
                .filter(
                    database_correspondece[database_to_include].name == report.sample_name,
                    database_correspondece[database_to_include].version == database_version
                ).first()

            if strain_at_db_but_clicked:
                straind.append(xstr(strain_at_db_but_clicked.classifier_l1))
                straind.append(xstr(strain_at_db_but_clicked.classifier_l2))
                straind.append(xstr(strain_at_db_but_clicked.classifier_l3))
                straind.append("{}:{}:{}".format(strain_at_db_but_clicked.classifier_l1,strain_at_db_but_clicked.classifier_l2,strain_at_db_but_clicked.classifier_l3))
            else:
                straind.append("NA")

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

            for k, v in to_replace.iteritems():
                string_profile = string_profile.replace(k,v)

            for k,v in to_replace_0EM.iteritems():
                string_profile = string_profile.replace(k,v)

            all_profiles.append(strain_from_db.name + "\t" + string_profile)

            # INCLUDE METADATA FROM PLATFORM IF STRAIN FROM THERE
            if strain_from_db.platform_tag == "FP":
                print strain_from_db.name
                strain = db.session.query(Strain)\
                    .filter(Strain.name == strain_from_db.name).first()

                try:
                    strain_metadata = json.loads(strain.strain_metadata)
                except AttributeError:
                    print "No metadata for strain " + strain_from_db.name
                    continue

                # Add projects where strain is
                projects_of_strain = Project.query\
                    .join(projects_strains, (projects_strains.c.project_id == Project.id))\
                    .filter(projects_strains.c.strains_id == strain.id).all()

                projects_string = ""

                if not projects_of_strain:
                    print "NO PROJECTS WITH STRAIN"
                else:
                    for p in projects_of_strain:
                        projects_string = projects_string + p.name

                strain_metadata["Project Name"] = projects_string

            else:
                strain_metadata = strain_from_db.strain_metadata

            print headers_metadata

            for x in headers_metadata:
                try:
                    if x == "ID":
                        string_metadata.append(strain_from_db.name)
                    elif x == "Platform tag":
                        string_metadata.append(strain_from_db.platform_tag)
                    elif x == "Cluster L1":
                        string_metadata.append(xstr(strain_from_db.classifier_l1))
                    elif x == "Cluster L2":
                        string_metadata.append(xstr(strain_from_db.classifier_l2))
                    elif x == "Cluster L3":
                        string_metadata.append(xstr(strain_from_db.classifier_l3))
                    elif x == "Cluster All":
                        string_metadata.append("{}:{}:{}"
                                               .format(strain_from_db.classifier_l1, strain_from_db.classifier_l2, strain_from_db.classifier_l3))
                    elif x != "Project Name":
                        string_metadata\
                            .append(strain_metadata[x].replace(" ", "-"))
                    else:
                        string_metadata.append(strain_metadata[x]
                                               .replace("\n", "")
                                               .replace("\r", ""))
                except Exception as e:
                    string_metadata.append("NA")

            print string_metadata

            all_metadata.append('\t'.join(string_metadata))

    if len(all_profiles) < 2:
        print "LESS THAN 2"
        return {"message": "Less than two profiles for comparison. Please try to increase the maximum number of differences."}

    # WRITE PROFILE FILE
    with open(file_path_profile, 'w') as p_file:

        p_file.write('\t'.join(headers) + '\n')

        for y in all_profiles:
            p_file.write(y + '\n')

    # WRITE METADATA FILE
    with open(file_path_metadata, "w") as p_file:
        p_file.write("\t".join(headers_metadata) + "\n")

        for y in all_metadata:
            p_file.write(y + "\n")

    print file_path_profile
    print file_path_metadata

    if missing_data == "True":
        if makePublic == "True":
            make_public = "true"
            command = 'python ./app/resources/phyloviz/remoteUpload.py -u '+\
                      phyloviz_user+' -p '+phyloviz_pass+' -cd '+phyloviz_root+\
                      ' -am core -root '+phyloviz_root+' -mc ' + missing_char +\
                      ' -mt 0 -sdt profile -sd ' + file_path_profile + ' -d '+ \
                      dataset_name.replace(" ", "_")+' -dn ' + \
                      dataset_description.replace(" ", "_")+' -m ' + \
                      file_path_metadata + ' -e ' + make_public
        else:
            command = 'python ./app/resources/phyloviz/remoteUpload.py -u '+\
                      phyloviz_user+' -p '+phyloviz_pass+' -cd '+phyloviz_root+\
                      ' -am core -root '+phyloviz_root+' -mc ' + missing_char +\
                      ' -mt 0 -sdt profile -sd ' + file_path_profile + ' -d '+ \
                      dataset_name.replace(" ", "_")+' -dn ' + \
                      dataset_description.replace(" ", "_")+' -m ' + \
                      file_path_metadata

    else:
        if makePublic == "True":
            make_public = "true"
            command = 'python ./app/resources/phyloviz/remoteUpload.py -u ' + \
                      phyloviz_user+' -p '+phyloviz_pass+' -cd '+phyloviz_root+\
                      ' -root '+phyloviz_root+' -sdt profile -sd ' + \
                      file_path_profile + ' -d ' + \
                      dataset_name.replace(" ", "_")+' -dn ' + \
                      dataset_description.replace(" ", "_")+' -m ' + \
                      file_path_metadata +' -pid ' + parent_id + ' -e ' + \
                      make_public
        else:
            command = 'python ./app/resources/phyloviz/remoteUpload.py -u ' + \
                      phyloviz_user+' -p '+phyloviz_pass+' -cd '+phyloviz_root+\
                      ' -root '+phyloviz_root+' -sdt profile -sd ' + \
                      file_path_profile + ' -d ' + \
                      dataset_name.replace(" ", "_")+' -dn ' + \
                      dataset_description.replace(" ", "_")+' -m ' + \
                      file_path_metadata +' -pid ' + parent_id

    command = command.split(' ')

    print command

    proc = subprocess.Popen(command, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
    stdout, stderr = proc.communicate()

    print stdout, stderr

    if "http" in stdout:
        phyloviz_uri = "http" + stdout.split("http")[1].split('">')[0]
        tree_entry = Tree(user_id=user_id, name=dataset_name,
                          description=dataset_description, uri=phyloviz_uri,
                          timestamp=datetime.datetime.utcnow(),
                          species_id=species_id, phyloviz_user=phyloviz_user)
        if not tree_entry:
            abort(404, message="An error as occurried when uploading the data"
                  .format(id))

        db.session.add(tree_entry)
        db.session.commit()

        return {"jobid": stdout.split("jobid:")[1]}, 201
    else:
        return 404
