/*
Single Project Object - An object with all functions used in the Single Project Controller
 - add_strain_to_project
 - create_pipeline
 - get_and_apply_pipeline
 - periodic_check_job_status
 - get_workflows
 - get_strains
 - get_project_strains
 - get_applied_pipelines
 - get_public_strain_applied_pipelines
 - get_and_apply_pipeline
 - get_uploaded_files
 - add_database_strains
 - add_new_strain
 - add_strain_to_project
 - update_strain
 - update_metadata
 - get_no_pip_strains
 - remove_strains_from_project
 - apply_workflow
 - check_if_pending
 - save_pipelines
 - run_pipelines
 - get_ids_from_processes
 - show_combined_reports
 - get_processes_outputs
 - download_result
 - download_log
 - remove_analysis
 - get_user_files
 - load_strains_from_file
*/


/*
Launch a Single Project instance
Uses:
	- pg_requests object
	- ngs_onto_requests object
	- object_utils object
*/

let pipelinesByID = {}, strainID_pipeline = {}, strains_dict = {};

let Single_Project = (CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope) => {

    pipelinesByID = {};
    strainID_pipeline = {};
    strains_dict = {};

    let project = {}, pipelinesByName = {}, strain_id_to_name = {},
        pipelines_applied = {};
    let pipelinesByVersion = {};
    let protocols_applied = {};
    let protocols_applied_by_pipeline = {};
    let tasks_to_buttons = {}, buttons_to_tasks = {};
    let dict_of_tasks_status = {};
    let process_to_workdir = {};
    let specie_name = "", species_id = "";
    let strains = [], pipelines = [], strains_headers = [], public_strains = [],
        files = [];
    let strainid_processes_buttons = {};
    let buttons_to_strain_names = {};
    let buttons_to_pipelines = {};
    let buttons_to_processes = {};
    let button_class_to_pipeline = {};
    let strain_to_real_pip = {};
    let pipelines_type_by_strain = {};
    intervals_running = {};
    strainName_to_tids = {};
    pipeline_status = {};
    jobs_to_parameters = {};
    let protocols_on_button = {};
    let current_status_wf_to_protocol = {};
    let process_id_to_workflow = {};
    let workflow_id_to_name = {};
    let global_counter_pipelines = 0;
    let strains_without_pip = {};
    let strains_new_without_pip = {};
    let workflowname_to_protocols = {};
    let strainNames_to_pipelinesNames = {};
    let applied_dependencies = {};
    let pipelinesAndDependency = {};
    let pg_requests = Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    let ngs_onto_requests = ngs_onto_client(CURRENT_PROJECT_ID, $http);
    let objects_utils = Objects_Utils();

    //Colors for the Running, Pending, Completed, Failed, and Warning of the workflows buttons
    let status_dict = {
        'R': '#bae1ff',
        'PD': '#ffdfba',
        'COMPLETED': '#baffc9',
        'FAILED': '#ffb3ba',
        'WARNING': '#fdff2f',
        'NEUTRAL': '#ffffff'
    };

    const modalAlert = (text, header, callback) => {

        const buttonSub = $('#buttonSub');
        const modalBodyEl = $('#modalAlert .modal-body');

        $('#buttonCancelAlert').off("click");

        $('#modalAlert .modal-title').empty();
        $('#modalAlert .modal-title').append("<p>" + header + "</p>");

        modalBodyEl.empty();
        modalBodyEl.append("<p>" + text + "</p>");

        buttonSub.off("click").on("click", () => {
            $('#modalAlert').modal("hide");

            setTimeout(() => {
                return callback();
            }, 400);
        });

        $('#modalAlert').modal("show");

    };

    const modalAlertAddSameFiles = (text, callback) => {

        const buttonSub = $('#buttonSub');
        const modalBodyEl = $('#modalAlert .modal-body');
        const buttonCancelEl = $('#buttonCancelAlert');

        buttonCancelEl.off("click");

        modalBodyEl.empty();
        modalBodyEl.append("<p>" + text + "</p>");

        buttonSub.off("click").on("click", () => {
            $('#modalAlert').modal("hide");
            setTimeout(() => {
                return callback(true);
            }, 400);
        });

        buttonCancelEl.on("click", () => {
            $('#modalAlert').modal("hide");
            setTimeout(() => {
                return callback(false);
            }, 400);
        });

        $('#modalAlert').modal("show");

    };

    const sortFunction = (a, b) => {
        if (parseInt(a[0]) === parseInt(b[0])) {
            return 0;
        }
        else {
            return (parseInt(a[0]) < parseInt(b[0])) ? -1 : 1;
        }
    };

    /*
    Add a strain to a project
    */
    const add_strain_to_project = (strain_name, callback) => {


        pg_requests.add_strain_to_project(strain_name, (response) => {

            if (response.status === 200) {

                let has_same_files = false;
                let message = "";
                let message_to_add = "";

                for (const s in strains) {
                    let md = JSON.parse(response.data.strain_metadata);
                    if (md.File_1 === strains[s].File_1) {
                        has_same_files = true;
                        message_to_add += "<b>" + strains[s].strainID + ":</b>" + md.File_1 + "<br/>";

                    }
                    if (md.File_2 === strains[s].File_2) {
                        has_same_files = true;
                        message_to_add += "<b>" + strains[s].strainID + ":</b>" + md.File_2 + "<br/>";
                    }
                }
                ;

                //Add strain to ngs_onto and add it to the strains dictionary
                const continue_adding = () => {

                    ngs_onto_requests.ngs_onto_request_add_strain_to_project(response.data.id, (response) => {
                        if (response.status === 200) {

                        }
                        else {
                            console.log(response.statusText);
                        }
                    });

                    const data = response.data;
                    objects_utils.destroyTable('strains_table');

                    if (data.length !== 0) {
                        strains_headers = JSON.parse(data.fields).metadata_fields;
                        strains_headers.push('Analysis');
                        strains_headers.push("timestamp");
                        strains_headers.push("Strain_State");

                        

                        const strain_data = JSON.parse(data.strain_metadata);
                        if(data.delete_timestamp != null)
                        {
                            icon = "<i class='fa fa-ban' style='color:#DC143C;'></i>";
                            strain_data["Strain_State"] = icon  + "<strong style='color:#DC143C;'> - Removed </strong>"; 

                            strain_data["delete_timestamp"] = data[i].delete_timestamp; 
                        }else if(data.update_timestamp != null)
                        {
                            icon = "<i class='fa fa-wrench' style='color:#FF8C00;'></i>";
                            strain_data["Strain_State"] = icon  + "<strong style='color:#FF8C00;'> - Uptated </strong>"; ; 
                            strain_data["update_timestamp"] = data[i].update_timestamp; 
                        }else{
                            icon = "<i class='fa fa-check' style='color:#006400;'></i>";
                            strain_data["Strain_State"] = icon  + "<strong style='color:#006400;'> - No changed </strong>"; ; 
                        }
                        strain_data['Analysis'] = "";
                        strain_data["timestamp"] = data.timestamp;
                        let sd = {};
                        for (const i in strains_headers) {
                            if (strain_data.hasOwnProperty(strains_headers[i])) {
                                if (strains_headers[i] === "timestamp") {
                                    let modified_data_parts = strain_data[strains_headers[i]].split(" ")[0].split("-");
                                    let modified_data = modified_data_parts[2] + "/" + modified_data_parts[1] + "/" + modified_data_parts[0];
                                    sd[strains_headers[i]] = modified_data;
                                }
                                else if (strains_headers[i] === "SampleReceivedDate" || strains_headers[i] === "SamplingDate") {
                                    let modified_data = strain_data[strains_headers[i]].replace(/\./g, "/");
                                    modified_data = modified_data.replace(/-/g, "/");

                                    sd[strains_headers[i]] = modified_data;
                                }

                                else {
                                    sd[strains_headers[i]] = strain_data[strains_headers[i]];
                                }
                            }
                        }
                        sd["strainID"] = data.strainID;
                        sd["FilesLocation"] = data.fq_location;
                        sd["has_files"] = data.has_files;
                        sd["Accession"] = data.Accession;

                        if (!strains_dict.hasOwnProperty($.trim(data.strainID))) {
                            strains_dict[$.trim(data.strainID)] = data.id;
                        }

                        for (const s in sd) {
                           sd[s] =  sd[s] !== "" ? sd[s] : "NA";
                        }

                        strains.push(sd);

                        callback({
                            strains_headers: strains_headers,
                            strains: strains
                        });

                    }
                    else {
                        callback({
                            strains_headers: strains_headers,
                            strains: strains
                        });
                    }

                };

                continue_adding();

            }
            else {
                modalAlert(response.data.message.split('.')[0] + '.', "Warning", () => {
                });
                callback({message: "Strain already on Project."})
            }
        });
    };

    /*
    Create a pipeline for a strain in case it doesnt exist
    */
    function create_pipeline(strain_Name, callback) {
        strain_Name = $.trim(strain_Name);
        let strain_id = strains_dict[strain_Name];
        let new_pipeline_id = '';

        const add_pip = (strainid) => {
            pg_requests.add_pipeline(strainid, null, null, (response) => {
                if (response.status === 201) {
                    new_pipeline_id = response.data.id;
                    ngs_onto_requests.ngs_onto_request_create_pipeline(response.data.id, response.data.strain_id, (response, strain_id) => {
                        callback(strain_id, new_pipeline_id);
                    });
                }
                else {
                    console.log(response.statusText);
                }
            });
        };

        //Checks if pipeline alrasy exists for that strain on this project
        pg_requests.check_if_pipeline_exists(strain_id, null, (response, strainid, not_used) => {

            if (response.status === 200) {
                //For each pipeline applied on that strain, checks if the project associated is the CURRENT_PROJECT_ID
                for (const x in response.data) {
                    if (response.data[x].project_id === String(CURRENT_PROJECT_ID) && response.data[x].removed !== 'true') {
                        new_pipeline_id = response.data[x].id;
                        callback(strainid, response.data[x].id);
                        return;
                    }
                }
                add_pip(strainid);

            }
            else {
                add_pip(strainid);
            }
        });
    }

    /*
    Search for the workflows in a given pipeline and apply them to the strain
    */
    const get_and_apply_pipeline = (total_pipelines, pipeline_id, strain_id, project_id, added_pipeline_id, callback) => {

        //Get the workflows IDs and the order that are applied from the ngs_onto
        ngs_onto_requests.ngs_onto_request_applied_pipelines(pipeline_id, project_id, strain_id, (response, strain_id, p, q) => {
            const response_length = response.data.length;
            let counter = 0;

            if (response.status === 200) {
                let appliedPipelines = [];
                strain_to_real_pip[strain_id] = [];
                let protocol_counter = 0;

                //Parse the results and construct the strain_to_real_pip object. (Object with all the processes in that pipeline)
                for (const w in response.data) {
                    let workflow_id = response.data[w].workflowURI.split('<')[1].split('>')[0].split('/');
                    workflow_id = workflow_id[workflow_id.length - 1];
                    appliedPipelines.push(workflow_id);
                    counter += 1;
                    strainid_processes_buttons[strain_id][0][counter] = pipelinesByID[workflow_id];
                    let parts = response.data[w].execStep.split('<')[1].split('>')[0].split('/');

                    for (const protocol in workflowname_to_protocols[workflow_id_to_name[workflow_id]]) {
                        protocol_counter += 1;
                        let wf_url_parts = [];
                        //project
                        wf_url_parts.push(parts[6]);
                        //pipeline
                        wf_url_parts.push(parts[8]);
                        //process
                        wf_url_parts.push(String(protocol_counter));

                        strain_to_real_pip[strain_id].push(wf_url_parts);
                        process_id_to_workflow[strain_id_to_name[strain_id] + protocol_counter] = strain_id_to_name[strain_id] + "_workflow_" + counter + "_" + CURRENT_PROJECT_ID;
                    }

                }

                global_counter_pipelines += 1;

                //Create the buttons of the workflows and show them on the graphic interface
                objects_utils.apply_pipeline_to_strain('strains_table', strain_id_to_name[strain_id], appliedPipelines, pipelinesByID, pipelines_applied, pipelines_type_by_strain, workflowname_to_protocols, protocols_applied, protocols_applied_by_pipeline, strainNames_to_pipelinesNames, pipelinesAndDependency, applied_dependencies, pipelinesByVersion, (results) => {
                    // Case workflows in pipeline
                    if (results.strains[results.strain_index] !== undefined) {
                        for (let strain of strains) {
                            if (strain.strainID === results.strains[results.strain_index].strainID){
                                strain = results.strains[results.strain_index];
                                break;
                            }
                        }
                        for (x in results.workflow_ids) {
                            workflow_id_to_name[results.workflow_ids[x]] = results.workflow_names[x];
                        }
                    }

                    if (total_pipelines === global_counter_pipelines) {
                        callback({strains: strains});
                    }
                });
            }
            else {
                strain_to_real_pip[strain_id] = [];
            }
        });
    };

    /*
    Checks for the job status in an interval of time
    */
    const periodic_check_job_status = (job_ids, dict_of_tasks_status, strain_id, process_ids, pipeline_id, project_to_search) => {

        const strainTableEl = $('#strains_table');

        const strain_data = $.map(strainTableEl.DataTable().rows().data(), (item) => {
            return item;
        });

        let job_location = "";

        for (const row of strain_data) {
            if (strain_id === row.strainID) {
                job_location = row.FilesLocation;
            }
        }

        //Get the status and assign new colors to the buttons if required
        const get_status = (job_ids, strain_id, process_ids, pipeline_id, job_location) => {

            //Put check to see if analysis tab is visible
            let process_positions = [];
            let procedure_names = [];

            job_ids = job_ids.split(",");

            for (const job_id in job_ids) {
                let procedure_name = workflow_id_to_name[tasks_to_buttons[job_ids[job_id]].replace(/ /g, "_")];
                let parts_split = tasks_to_buttons[job_ids[job_id]].replace(/ /g, "_").split("_");
                let process_position = parts_split[parts_split.length - 2];
                process_positions.push(process_position);
                procedure_names.push(procedure_name);
            }

            pg_requests.get_job_status(job_ids, procedure_names, strain_id, pipeline_id, process_positions, project_to_search, process_ids, job_location, (response, this_job_id, pip_id) => {

                this_job_id = this_job_id.join();
                let has_failed = false;
                let counter_processes = 0;
                let prev_process_status = '';
                let is_running = false;
                let pending_jobs = 0;
                let all_status_done = 0;
                let has_warning = false;
                let protocols_on_workflow = [];
                let prev_workflow = process_id_to_workflow[strain_id + String(counter_processes + 1)];

                let firstWorkflow = true;

                if (response.data !== false && response.data.stdout !== undefined) {
                    //console.log(response.data);
                    for (const n in response.data.stdout) {
                        counter_processes += 1;
                        let task_id = response.data.stdout[n][0];
                        let status = response.data.stdout[n][1];

                        let res_pos = n;

                        if (task_id === "null") {
                            return;
                        }

                        protocols_on_workflow.push(tasks_to_buttons[task_id]);

                        dict_of_tasks_status[task_id] = status;
                        current_job_status_color[tasks_to_buttons[task_id]] = status_dict[status];
                        process_to_workdir[pip_id + "-" + response.data.process_ids[counter_processes - 1]] = response.data.all_wrkdirs[counter_processes - 1].join(";");

                        $('#' + tasks_to_buttons[task_id].replace(/ /g, "_")).css({'background-color': status_dict[status]});

                        let prevtaskid = task_id;

                        //Case the job as finished in any way, clear the interval
                        if (status === 'COMPLETED' || status === 'WARNING' || status === 'FAILED') {
                            all_status_done += 1;
                        }
                        if (status === 'FAILED') {
                            has_failed = true;
                        }
                        if (status === "R") {
                            is_running = true;
                        }
                        if (status === "PD") {
                            pending_jobs += 1;
                        }
                        if (status === "WARNING") {
                            has_warning = true;
                        }

                        if (prev_process_status === 'FAILED' && status === "PD") {
                            dict_of_tasks_status[task_id] = 'NEUTRAL';
                            current_job_status_color[tasks_to_buttons[task_id]] = status_dict['NEUTRAL'];
                            $('#' + tasks_to_buttons[task_id].replace(/ /g, "_")).css({'background-color': status_dict['NEUTRAL']});
                            all_status_done += 1;
                            clearInterval(intervals_running[task_id]);
                        }
                        else {
                            prev_process_status = status;
                        }

                        let protocol_pos = tasks_to_buttons[task_id].split("_").splice(-2)[0];

                        if (firstWorkflow === true) {
                            prev_workflow = process_id_to_workflow[strain_id + String(parseInt(protocol_pos))];
                            firstWorkflow = false;
                        }

                        if ((process_id_to_workflow[strain_id + String(parseInt(protocol_pos) + 1)] !== undefined && prev_workflow !== process_id_to_workflow[strain_id + String(parseInt(protocol_pos) + 1)]) || response.data.stdout.length === counter_processes) {

                            if (response.data.stdout.length === counter_processes) {
                                prev_workflow = process_id_to_workflow[strain_id + String(parseInt(protocol_pos))];
                            }

                            protocols_on_button[prev_workflow] = protocols_on_workflow;

                            if (has_failed) {
                                $('#' + prev_workflow).css({'background-color': status_dict["FAILED"]});
                                current_job_status_color[prev_workflow] = status_dict["FAILED"];
                                dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "FAILED";
                                //$('#' + prev_workflow).parent().find(".neutral").css({"display":"none"});
                            }
                            else if (pending_jobs === protocols_on_workflow.length) {
                                $('#' + prev_workflow).css({'background-color': status_dict["PD"]});
                                current_job_status_color[prev_workflow] = status_dict["PD"];
                                dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "PD";
                                //$('#' + prev_workflow).parent().find(".neutral").css({"display":"none"});
                            }
                            else if (is_running || all_status_done < protocols_on_workflow.length && pending_jobs > 0) {
                                $('#' + prev_workflow).css({'background-color': status_dict["R"]});
                                current_job_status_color[prev_workflow] = status_dict["R"];
                                dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "R";
                                //$('#' + prev_workflow).parent().find(".neutral").css({"display":"none"});
                            }
                            else if (has_warning) {
                                $('#' + prev_workflow).css({'background-color': status_dict["WARNING"]});
                                current_job_status_color[prev_workflow] = status_dict["WARNING"];
                                dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "WARNING";
                            }
                            else if (prev_process_status === "COMPLETED") {
                                $('#' + prev_workflow).css({'background-color': status_dict["COMPLETED"]});
                                current_job_status_color[prev_workflow] = status_dict["COMPLETED"];
                                dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "COMPLETED";
                                //$('#' + prev_workflow).parent().find(".neutral").css({"display":"none"});
                            }

                            //Reset status of worflow
                            protocols_on_workflow = [];
                            has_failed = false;
                            is_running = false;
                            has_warning = false;
                            all_status_done = 0;
                            pending_jobs = 0;
                            prev_process_status = '';
                        }


                        prev_workflow = process_id_to_workflow[strain_id + String(parseInt(protocol_pos) + 1)];

                    }
                    if (response.data.stdout.length === all_status_done) {
                        clearInterval(intervals_running[this_job_id]);
                    }

                }
                else {
                    dict_of_tasks_status[job_id.split('_')[0]] = status;
                    current_job_status_color[tasks_to_buttons[task_id]] = status_dict[status];
                    $('#' + tasks_to_buttons[task_id].replace(/ /g, "_")).css({'background-color': status_dict[status]});
                    clearInterval(intervals_running[this_job_id]);
                }
            })

        };

        let prevtaskid = '';
        job_ids = job_ids.join();
        process_ids = process_ids.join();

        get_status(job_ids, strain_id, process_ids, pipeline_id, job_location);

        const periodic_check = () => {
            get_status(job_ids, strain_id, process_ids, pipeline_id, job_location);
        };


        intervals_running[job_ids] = periodic_check;
        pipeline_status[job_ids] = get_status;
        jobs_to_parameters[job_ids] = [job_ids, strain_id, process_ids, pipeline_id];

    }

    const returned_functions = {

        /**
         * Check if controller is available
         * @param callback
         */
        check_controller: (callback) => {
            pg_requests.check_controller((response) => {
                callback(response);
            });
        },

        /*
        Get the workflows available for that species
        */
        get_workflows: (classifier, species_name, callback) => {

            pg_requests.get_workflows(classifier, species_name, (response) => {
                if (response.status === 200) {

                    let to_send = [];

                    if (typeof response.data !== 'string') {
                        for (const i in response.data) {
                            pipelinesByName[response.data[i].name+"--"+response.data[i].id] = response.data[i].id;
                            pipelinesByID[response.data[i].id] = response.data[i].name+"--"+response.data[i].id;
                            pipelinesAndDependency[response.data[i].name+"--"+response.data[i].id] = response.data[i].dependency;
                            pipelinesByVersion[response.data[i].id] = response.data[i].version;

                            if (response.data[i].availability === null || response.data[i].availability === "true" || response.data[i].availability === "admin" && SHOW_INFO_BUTTON === true) {
                                to_send.push(response.data[i]);
                            }

                            workflowname_to_protocols[response.data[i].name+"--"+response.data[i].id] = [];
                            workflow_id_to_name[response.data[i].id] = response.data[i].name+"--"+response.data[i].id;

                            ngs_onto_requests.ngs_onto_request_get_workflow(response.data[i].id, "", response.data[i].name, (response, nn, workflow_name, workflow_id) => {
                                let protocol_data = response.data.reverse();

                                for (const x in protocol_data) {
                                    let index = protocol_data[x].index.split("^^")[0].split('"')[1];
                                    let protoc = protocol_data[x].protocol.split("protocols/")[1].split('>')[0];
                                    workflowname_to_protocols[workflow_name+"--"+workflow_id].push([index, protoc]);
                                }

                                workflowname_to_protocols[workflow_name+"--"+workflow_id].sort(sortFunction);

                                for (const y in workflowname_to_protocols[workflow_name+"--"+workflow_id]) {
                                    pg_requests.get_protocols_by_ids(workflowname_to_protocols[workflow_name+"--"+workflow_id][y][1], workflowname_to_protocols[workflow_name+"--"+workflow_id][y], (response, workflow_entry) => {
                                        workflow_entry.push(response.data[0].name);
                                    });
                                }
                            })
                        }
                    }
                    callback(to_send);
                }
                else {
                    callback(response.data);
                }
            });
        },

        /*
        Get quota available for the user and institution
         */
        get_quota: (callback) => {

            //Request to get quota
            pg_requests.get_quota((quota_obj) => {

                let testdict = {
                    "t_quota": quota_obj.data.f_space.split(/\s/g),
                    "f_quota": quota_obj.data.f_space.split(/\s/g),
                    "user_quota": quota_obj.data.f_space.split(/\s/g),
                    "p_space": quota_obj.data.p_space.split(/\s/g),
                    "u_space": quota_obj.data.u_quota.split(/\s/g),
                    "i_quota": quota_obj.data.i_quota.split(/\s/g)
                };

                let t_quota = /^\d+$/.test(quota_obj.data.f_space.split(/\s/g)[23]) === false ?
                    quota_obj.data.f_space.split(/\s/g)[42] : quota_obj.data.f_space.split(/\s/g)[23];
                let f_quota = /^\d+$/.test(quota_obj.data.f_space.split(/\s/g)[24]) === false ?
                    quota_obj.data.f_space.split(/\s/g)[43] : quota_obj.data.f_space.split(/\s/g)[24];
                let user_quota = /^\d+$/.test(quota_obj.data.f_space.split(/\s/g)[24]) === false ?
                    quota_obj.data.f_space.split(/\s/g)[43] : quota_obj.data.f_space.split(/\s/g)[24];
                let p_space = quota_obj.data.p_space.split(/\s/g)[0];
                let u_space = /^\d+$/.test(quota_obj.data.u_quota.split(/\s/g)[23]) === false ?
                    quota_obj.data.u_quota.split(/\s/g)[42] : quota_obj.data.u_quota.split(/\s/g)[23];
                let i_space = /^\d+$/.test(quota_obj.data.i_quota.split(/\s/g)[23]) === false ?
                    quota_obj.data.i_quota.split(/\s/g)[42] : quota_obj.data.i_quota.split(/\s/g)[23];

                let quota_dict = {
                    "t_quota": t_quota,
                    "f_quota": f_quota,
                    "user_quota": user_quota,
                    "p_space": p_space,
                    "u_space": u_space,
                    "i_quota": i_space
                };

                quota_dict.t_quota = quota_dict.t_quota === "" ? 0 : parseInt(quota_dict.t_quota);
                quota_dict.f_quota = quota_dict.f_quota === "" ? 0 : parseInt(quota_dict.f_quota);
                quota_dict.p_space = quota_dict.p_space === "" ? 0 : parseInt(quota_dict.p_space);
                quota_dict.u_space = quota_dict.u_space === "" ? 0 : parseInt(quota_dict.u_space);
                quota_dict.user_quota = quota_dict.user_quota === "" ? 0 : parseInt(quota_dict.user_quota);
                quota_dict.i_quota = quota_dict.i_quota === "" ? 0 : parseInt(quota_dict.i_quota);

                callback(quota_dict);
            });

        },

        /*
        Get the strains for that project or the public strains
        from_user = true ? Search only on user
        from_user = false ? Search the public strains
        */
        get_strains: (from_user, callback) => {

            pg_requests.get_strains(CURRENT_SPECIES_ID, from_user, (response) => {

                if (response.status === 200) {
                    let max_headers = 0;
                    let data = response.data;
                    objects_utils.destroyTable('public_strains_table');
                    let new_strains = [];

                    let public_strains_headers = [];

                    if (data.length !== 0) {

                        let public_strains_headers = JSON.parse(data[0].fields).metadata_fields;
                        public_strains_headers.unshift("strainID");
                        public_strains_headers.push("timestamp");
                        public_strains_headers.push("Strain_State");

                        for (const i in data) {

                            strains_dict[$.trim(data[i].strainID)] = data[i].id;
                            strain_id_to_name[data[i].id] = $.trim(data[i].strainID);

                            let strain_data = JSON.parse(data[i].strain_metadata);
                            strain_data["strainID"] = data[i].strainID;
                            //strain_data["FilesLocation"] = data[i].fq_location;
                            strain_data["timestamp"] = data[i].timestamp;

                            if(data[i].delete_timestamp != null)
                            {
                                icon = "<i class='fa fa-ban' style='color:#DC143C;'></i>";
                                strain_data["Strain_State"] = icon  + "<strong style='color:#DC143C;'> - Removed </strong>"; 

                                strain_data["delete_timestamp"] = data[i].delete_timestamp; 
                            }else if(data[i].update_timestamp != null)
                            {
                                icon = "<i class='fa fa-wrench' style='color:#FF8C00;'></i>";
                                strain_data["Strain_State"] = icon  + "<strong style='color:#FF8C00;'> - Uptated </strong>"; ; 
                                strain_data["update_timestamp"] = data[i].update_timestamp; 
                            }else{
                                icon = "<i class='fa fa-check' style='color:#006400;'></i>";
                                strain_data["Strain_State"] = icon  + "<strong style='color:#006400;'> - No changed </strong>"; ; 
                            }

                            let sd = {};
                            //Parse the metadata and add it to the public strains object
                            for (const j in public_strains_headers) {
                                if (strain_data.hasOwnProperty(public_strains_headers[j])) {
                                    if (public_strains_headers[j] === "timestamp") {
                                        let modified_data_parts = strain_data[public_strains_headers[j]].split(" ")[0].split("-");
                                        let modified_data = modified_data_parts[2] + "/" + modified_data_parts[1] + "/" + modified_data_parts[0];

                                        modified_data = modified_data.replace(/\./g, "/");
                                        modified_data = modified_data.replace(/-/g, "/");

                                        sd[public_strains_headers[j]] = modified_data;
                                    }
                                    else if (public_strains_headers[j] === "SampleReceivedDate" || public_strains_headers[j] === "SamplingDate") {
                                        let modified_data = strain_data[public_strains_headers[j]].replace(/\./g, "/");
                                        modified_data = modified_data.replace(/-/g, "/");

                                        sd[public_strains_headers[j]] = modified_data;
                                    }
                                    else {
                                        sd[public_strains_headers[j]] = strain_data[public_strains_headers[j]];
                                    }
                                }
                            }
                            sd["id"] = data[i].id;
                            sd["FilesLocation"] = data[i].fq_location;
                            sd["has_files"] = data[i].has_files;
                            sd["Accession"] = data[i].Accession;

                            // Parse for empty cell data
                            for (const s in sd) {
                               sd[s] =  sd[s] !== "" ? sd[s] : "NA";
                            }

                            new_strains.push(sd);
                        }
                        public_strains = new_strains;

                    }

                    callback({
                        public_strains_headers: public_strains_headers,
                        public_strains: public_strains
                    });
                }
                else {
                    callback({public_strains_headers: [], public_strains: []});
                }


            });


            $('#fromdbbutton').click(() => {
                const table = $("#public_strains_table").DataTable();
                setTimeout(() => {
                    table.draw();
                }, 400);
            });
        },

        /*
        Get the strains for that project
        */
        get_project_strains: (callback) => {

            pg_requests.get_project_strains((response) => {

                if (response.status === 200) {
                    let max_headers = 0;
                    let data = response.data;
                    objects_utils.destroyTable('strains_table');
                    let add_strains = [];

                    if (data.length !== 0) {

                        strains_headers = JSON.parse(data[0].fields).metadata_fields;
                        strains_headers.unshift("strainID");
                        strains_headers.push('Analysis');
                        strains_headers.push('FilesLocation');
                        strains_headers.push("timestamp");
                        strains_headers.push("has_files");
                        strains_headers.push("Accession");
                        strains_headers.push("Owner");
                        strains_headers.push("Strain_State");

                        console.log(data);

                        for (const i in data) {

                            let strain_data = JSON.parse(data[i].strain_metadata);
                            strain_data["strainID"] = data[i].strainID ; 
                            if(data[i].delete_timestamp != null)
                            {
                                icon = "<i class='fa fa-ban' style='color:#DC143C;'></i>";
                                strain_data["Strain_State"] = icon  + "<strong style='color:#DC143C;'> - Removed </strong>"; 

                                strain_data["delete_timestamp"] = data[i].delete_timestamp; 
                            }else if(data[i].update_timestamp != null)
                            {
                                icon = "<i class='fa fa-wrench' style='color:#FF8C00;'></i>";
                                strain_data["Strain_State"] = icon  + "<strong style='color:#FF8C00;'> - Uptated </strong>"; ; 
                                strain_data["update_timestamp"] = data[i].update_timestamp; 
                            }else{
                                icon = "<i class='fa fa-check' style='color:#006400;'></i>";
                                strain_data["Strain_State"] = icon  + "<strong style='color:#006400;'> - No changed </strong>"; ; 
                            }
                            
                            strain_data['Analysis'] = "";
                            strain_data['FilesLocation'] = data[i].fq_location;
                            strain_data['timestamp'] = data[i].timestamp;
                            strain_data['has_files'] = data[i].has_files;
                            strain_data['Accession'] = data[i].Accession;

                            let sd = {};
                            for (const j in strains_headers) {
                                if (strain_data.hasOwnProperty(strains_headers[j])) {

                                    if (strains_headers[j] === "timestamp") {
                                        let modified_data_parts = strain_data[strains_headers[j]].split(" ")[0].split("-");
                                        let modified_data = modified_data_parts[2] + "/" + modified_data_parts[1] + "/" + modified_data_parts[0];
                                        sd[strains_headers[j]] = modified_data;
                                    }

                                    else if (strains_headers[j] === "SampleReceivedDate" || strains_headers[j] === "SamplingDate") {
                                        let modified_data = strain_data[strains_headers[j]].replace(/\./g, "/");
                                        modified_data = modified_data.replace(/-/g, "/");

                                        sd[strains_headers[j]] = modified_data;
                                    }
                                    else {
                                        sd[strains_headers[j]] = strain_data[strains_headers[j]];
                                    }

                                    sd["delete_timestamp"] = strain_data["delete_timestamp"]; 
                                    sd["update_timestamp"] = strain_data["update_timestamp"]; 
                                }
                            }


                            if (!strains_dict.hasOwnProperty($.trim(data[i].strainID))) {
                                strains_dict[$.trim(data[i].strainID)] = data[i].id;
                            }

                            for (const s in sd) {
                               sd[s] =  sd[s] !== "" ? sd[s] : "NA";
                            }

                           

                            add_strains.push(sd);
                        }
                        strains = add_strains;
                    }

                    callback({
                        strains: strains,
                        strains_headers: strains_headers
                    });
                }
                else {
                    callback({strains: [], strains_headers: []});
                }
            });
        },

        /*
        Get the pipelines applied to a given strain
        */
        get_applied_pipelines: (strainid, callback) => {

            if (strainid !== null) {
                strainid = strains_dict[strainid];
            }
            //Get the pipeline ids for that strain
            pg_requests.get_applied_pipelines(strainid, CURRENT_PROJECT_ID, (response, strainid) => {
                let total_pipelines = response.data.length;

                if (response.data.hasOwnProperty("message") === true) {
                    return callback({strains: "no_pipelines"});
                }

                global_counter_pipelines = 0;

                if (response.status === 200) {

                    for (const i in response.data) {

                        if (response.data[i].parent_pipeline_id !== null) {
                            strainid_processes_buttons[response.data[i].strain_id] = [{}];
                            let ppipid = response.data[i].parent_pipeline_id;
                            let pipid = response.data[i].id;
                            let pprojid = response.data[i].parent_project_id;
                            let sid = response.data[i].strain_id;

                            //Check if exist workflows on pipeline
                            ngs_onto_requests.ngs_onto_request_applied_pipelines_with_parent(ppipid, pprojid, sid, pipid, (response, ppipid, pprojid, sid, pipid) => {

                                if (response.data.length === 0) {
                                    pipid = pipid;
                                    strainID_pipeline[sid] = ppipid;
                                }
                                else {
                                    ppipid = pipid;
                                    pprojid = CURRENT_PROJECT_ID;
                                    strainID_pipeline[sid] = ppipid;
                                }

                                get_and_apply_pipeline(total_pipelines, ppipid, sid, pprojid, pipid, (response) => {
                                    callback(response);
                                });
                            });
                        }
                        else {
                            strainID_pipeline[response.data[i].strain_id] = response.data[i].id;
                            strainid_processes_buttons[response.data[i].strain_id] = [{}];

                            get_and_apply_pipeline(total_pipelines, response.data[i].id, response.data[i].strain_id, CURRENT_PROJECT_ID, null, (response) => {
                                callback(response);
                            });
                        }

                    }
                }
                else {
                    callback({strains: []});
                }
            });
        },

        /*
        Get the pipelines applied to a given strain
        */
        get_public_strain_applied_pipelines: (strainids, callback) => {

            let processed_strains = 0;
            let total_strains = strainids.length;
            let total_wf = {};
            let total_pips = {};
            let hasPipelines = false;

            for (const strainid in strainids) {

                let strain_id;

                if (strainid !== null) {
                    strain_id = strains_dict[strainids[strainid]];
                }

                total_wf[strainids[strainid]] = [];
                total_pips[strainids[strainid]] = [];

                //Get the pipeline ids
                pg_requests.get_applied_pipelines(strain_id, CURRENT_PROJECT_ID, (response, strain_id) => {

                    let available_workflows = [];
                    let workflow_ids_added = {};
                    let pipelines_ids = [];

                    if (response.status === 200) {
                        const total_pip = response.data.length;
                        let processed_pip = 0;

                        for (const pipeline in response.data) {

                            if (response.data[pipeline].project_id === null || response.data[pipeline].parent_pipeline_id !== null) {
                                processed_pip += 1;

                                if (processed_pip === total_pip) {
                                    processed_strains += 1;
                                    for (const pipeline in available_workflows) {
                                        let final_pips = [];

                                        if (workflow_ids_added[available_workflows[pipeline].join()] !== true) {
                                            workflow_ids_added[available_workflows[pipeline].join()] = true;

                                            for (const workflow in available_workflows[pipeline]) {
                                                final_pips.push(pipelinesByID[available_workflows[pipeline][workflow]]);
                                            }

                                            total_pips[strain_id_to_name[strain_id]].push(pipelines_ids[pipeline]);
                                            total_wf[strain_id_to_name[strain_id]].push(final_pips);
                                        }
                                    }
                                    if (total_strains === processed_strains) {
                                        callback(total_wf, strainids, total_pips, strains_dict);
                                    }
                                }
                            }
                            else {
                                let pipeline_id = response.data[pipeline].id;
                                let projectid = response.data[pipeline].project_id;

                                ngs_onto_requests.ngs_onto_request_applied_pipelines(pipeline_id, projectid, strain_id, (response, strain_id, pip_id, projid) => {
                                    pipelines_ids.push([pip_id, projid]);
                                    let appliedWorkflows = [];
                                    processed_pip += 1;

                                    for (const w in response.data) {

                                        let wf_url_parts = [];
                                        let workflow_id = response.data[w].workflowURI.split('<')[1].split('>')[0].split('/');
                                        workflow_id = workflow_id[workflow_id.length - 1];
                                        appliedWorkflows.push(workflow_id);

                                        let parts = response.data[w].execStep.split('<')[1].split('>')[0].split('/');
                                        //project
                                        wf_url_parts.push(parts[6]);
                                        //pipeline
                                        wf_url_parts.push(parts[8]);
                                        //process
                                        wf_url_parts.push(parts[10]);
                                    }
                                    available_workflows.push(appliedWorkflows);
                                    workflow_ids_added[appliedWorkflows.join()] = false;

                                    if (processed_pip === total_pip) {
                                        processed_strains += 1;

                                        for (const pipeline in available_workflows) {
                                            let final_pips = [];

                                            if (workflow_ids_added[available_workflows[pipeline].join()] !== true) {
                                                workflow_ids_added[available_workflows[pipeline].join()] = true;

                                                for (const workflow in available_workflows[pipeline]) {
                                                    final_pips.push(pipelinesByID[available_workflows[pipeline][workflow]]);
                                                }
                                                total_pips[strain_id_to_name[strain_id]].push(pipelines_ids[pipeline]);
                                                total_wf[strain_id_to_name[strain_id]].push(final_pips);
                                            }
                                        }

                                        if (total_strains === processed_strains) {
                                            callback(total_wf, strainids, total_pips, strains_dict);
                                        }
                                    }
                                });
                            }
                        }

                    }
                    else callback(total_wf, strainids, total_pips, strains_dict);
                });

            }


        },

        /*
        Get the pipelines applied to a given strain
        */
        get_and_apply_pipeline: (total_pipelines, pipeline_id, strain_id, project_id, callback) => {

            strainID_pipeline[strain_id] = pipeline_id;
            strainid_processes_buttons[strain_id] = [{}];

            global_counter_pipelines = 0;

            if (project_id !== CURRENT_PROJECT_ID) {
                pg_requests.add_pipeline(strain_id, pipeline_id, project_id, (response) => {
                    let new_pipeline_id = response.data.id;
                    let parent_project_id = response.data.parent_project_id;
                    let parent_pipeline_id = response.data.parent_pipeline_id;

                    ngs_onto_requests.ngs_onto_request_create_pipeline(response.data.id, response.data.strain_id, (response, strain_id) => {
                        get_and_apply_pipeline(total_pipelines, pipeline_id, strain_id, project_id, new_pipeline_id, () => {
                            callback();
                        })
                    });
                })
            }
            else {
                pg_requests.change_pipeline_from_project(strain_id, false, "", (response, strain_id, pipeline_s) => {
                    get_and_apply_pipeline(total_pipelines, pipeline_id, strain_id, project_id, null, () => {
                        callback();
                    })
                })
            }
        },

        /*
        Get files from the user
        */
        get_uploaded_files: (callback) => {

            pg_requests.get_uploaded_files((response) => {
                if (response.status === 200) {
                    callback(response.data.files);
                }
                else console.log(response.statusText);
            });

        },

        /*
        Add a strain from the database
        */
        add_database_strains: (strain_names, callback) => {

            if (strain_names.length > 0) {
                objects_utils.destroyTable('strains_table');
                for (i in strain_names) {
                    add_strain_to_project(strain_id_to_name[strain_names[i]], (results) => {
                        callback(results);
                    });
                }
            }
            else modalAlert('Please select some strains first.', "Select" +
                " Strains", () => {
            });
        },

        /*
        Add a new strain
        */
        add_new_strain: (is_from_file, callback) => {

            const fileButton = $("#fromfilebutton");

            if (fileButton.hasClass("active")) {
                $('#add_pip_from_fileSubmit').css({"display": "block"});
            }
            if (fileButton.hasClass("active")) {
                $('#add_new_pip_from_fileSubmit').css({"display": "block"});
            }

            pg_requests.add_new_strain((response) => {
                if (response.status === 200 || response.status === 201) {

                    let to_append = '<div class="row">';
                    strain_id_to_name[response.data.id] = response.data.strainID;
                    strains_new_without_pip[response.data.id] = [response.data.id, strain_id_to_name[response.data.id]];

                    if (response.status === 200) {
                        if (response.data.file_1 !== "" || response.data.file_2 !== "") {
                            to_append += '<div class="col-md-8"><p><b>Strain ' + response.data.strainID + '</b></p>';
                            to_append += '<p>Files already mapped to strain!</p>';

                            if (response.data.file_1 !== "") {
                                to_append += '<p>File 1: ' + response.data.file_1 + '</p>';
                            }
                            if (response.data.file_2 !== "") {
                                to_append += '<p>File 2: ' + response.data.file_2 + '</p>';
                            }

                            to_append += '</div><div class="col-md-4" id="file_col_' + response.data.strainID.replace(/ /g, "_") + '"><button strain_name="' + response.data.strainID + '" class="btn btn-md btn-primary" onclick="checkPipelineFromFile(this)">Check Pipelines</button>';
                            to_append += '</div>';
                            to_append += '</div><div class="row"><hr' +
                                ' size="30"/>';

                            if (is_from_file === true) {
                                $('#status_upload_from_file').append(to_append);
                            }
                            else modalAlert(to_append, "Info", () => {
                            });
                        }

                        pg_requests.get_project_strains_2(response.data.id, false, (response, strain_id, is_there) => {
                            let onproject = "";

                            for (const l in response.data) {
                                if (response.data[l].id === strain_id) {
                                    is_there = true;
                                    onproject = response.data[l].strainID;
                                    break;
                                }
                            }

                            //Case strain already on project
                            if (is_there) {
                                let already_there = true;
                                const onProjectEl = $('#file_col_' + onproject.replace(/ /g, "_"));
                                onProjectEl.empty();
                                onProjectEl.append("Strain already on project");
                                callback({"already_there": already_there}, is_from_file);
                            }
                            else {
                                //Check if that strain already has some pipelines applied to it. Case it isnt really new.
                                pg_requests.get_applied_pipelines(strain_id, CURRENT_PROJECT_ID, (response, strain_id) => {

                                    let no_pip = true;

                                    for (const f in response.data) {
                                        if (response.data[f].project_id !== null) {
                                            no_pip = false;
                                        }

                                        if (response.data[f].project_id === CURRENT_PROJECT_ID) {

                                            onproject = strain_id_to_name[strain_id];

                                            if (response.data[f].removed !== "true") {
                                                add_strain_to_project(strain_id_to_name[strain_id], function (results) {
                                                    results.already_there = true;
                                                    const onProjectEl = $('#file_col_' + onproject.replace(/ /g, "_"));

                                                    onProjectEl.empty();
                                                    onProjectEl.append("Strain already on project");
                                                    callback(results, is_from_file);
                                                });
                                            }
                                            //break;
                                        }
                                    }
                                    if (no_pip) {
                                        const fileColEl = $('#file_col_' + strain_id_to_name[strain_id].replace(/ /g, "_"));

                                        fileColEl.empty();
                                        fileColEl.append('<p>No pipelines available for this strain.</p><button strain_name="' + strain_id_to_name[strain_id] + '" class="btn btn-md btn-default" onclick="newPipelineFromFile(this)">New Pipeline</button>');
                                        strains_without_pip[strain_id] = [strain_id, strain_id_to_name[strain_id]];
                                    }
                                });

                            }
                        });
                    }
                    else if (response.status === 201) {
                        //Case strain is really new
                        add_strain_to_project(response.data.strainID, (results) => {

                            to_append += '<div class="col-md-8"><p><b>Strain ' + response.data.strainID + '</b></p>';
                            to_append += '<p>Strain added to the Project!</p>';
                            to_append += '</div></div><hr size="30"/>';
                            if (is_from_file === true) {
                                $('#status_upload_from_file').append(to_append);
                            }
                            else modalAlert(to_append, "Info", () => {
                            });

                            callback(results, is_from_file);
                        });
                    }
                }
                else {
                    modalAlert("An error as occurried when creating a new" +
                        " strain.", "Error", () => {
                    });
                }
            });
        },

        /*
        Add strain to project
        */
        add_strain_to_project: (strain_name, callback) => {
            add_strain_to_project(strain_name, (results) => {
                callback(results, strain_name);
            });
        },

        /*
        Update a strain DEPREACTED?
        */
        update_strain: (strain_id, key, value, callback) => {
            pg_requests.update_strain(strain_id, key, value, (response) => {
                callback(response);
            });
        },

        /*
        Update strain metadata
        */
        update_metadata: (strain_id, callback) => {
            pg_requests.update_metadata(strain_id, (response) => {
                callback(response);
            });
        },

        /*
        Remove strain metadata
        */
        remove_metadata: (strain_id, callback) => {
        pg_requests.remove_metadata(strain_id, (response) => {
            callback(response);
        });
    },

        /*
        Get nextflow logs
        */
        getNextflowLog: (filename, pipeline_id, project_id, callback) => {
            pg_requests.get_nextflow_log(filename, pipeline_id, project_id, (response) => {
                callback(response);
            });
        },

        /*
        Trigger Flowcraft Inspect on the server
         */
        triggerInspect: (pipeline_id, project_id, callback) => {
            pg_requests.trigger_inspect(pipeline_id, project_id, (response) => {
                callback(response);
            });
        },

        /*
        Retry pipeline
         */
        retryPipeline: (pipeline_id, project_id, callback) => {
            pg_requests.retry_pipeline(pipeline_id, project_id, (response) => {
                callback(response);
            });
        },

        /*
        Trigger remove inspect
         */
        killInspect: (pid, callback) => {
            pg_requests.kill_inspect(pid, (response) => {
                callback(response);
            });
        },

        /*
        Get strains without pipeline applied
        */
        get_no_pip_strains: (callback) => {
            return strains_without_pip;
        },

        /*
        Get strain ids added by file
        */
        get_added_by_file_strains: (callback) => {
            return strains_new_without_pip;
        },

        /*
        Remove strains from a project
        */
        remove_strains_from_project: (used_strains, callback) => {

            const strainTableEl = $('#strains_table');

            const strain_names = $.map(strainTableEl.DataTable().rows('.selected').data(), (item) => {
                return item['strainID'];
            });
            const strain_indexes = $.map(strainTableEl.DataTable().rows('.selected').indexes(), (index) => {
                return index;
            });

            if (strain_indexes.length === 0) {
                return callback("no_select");
            }

            strain_names.map((d) => {
                delete pipelines_applied[d];
                delete strainNames_to_pipelinesNames[d];
                delete applied_dependencies[d];
                delete protocols_applied[d];
            });

            let to_use = used_strains;
            let number_of_strains = strain_names.length;
            let count_removed = 0;

            if (strain_names.length > 0) {

                modalAlert("By accepting this option you are removing the" +
                    " strain/strains from the project. Do you really want" +
                    " proceed?", "Warning", () => {

                    while (strain_names.length !== 0) {

                        let strain_name = strain_names.pop();
                        strain_name = strain_name.replace(/(.*?) <i.*/i, "$1")  ;


                        pg_requests.remove_strain_from_project(strain_name, (response) => {
                            count_removed += 1;

                            if (response.status === 200) {
                                let new_strains = [];

                                to_use.map((d) => {
                                    if (d.strainID !== response.data.strainID) {
                                        new_strains.push(d);
                                    }
                                    else {

                                        pg_requests.check_if_pipeline_exists(strains_dict[response.data.strainID], response.data.strainID, (response, strainid, strainID) => {
                                            if (response.status === 200) {
                                                pg_requests.change_pipeline_from_project(strainid, true, "", (response, strainid) => {
                                                });

                                            }
                                        });
                                    }
                                });

                                to_use = new_strains;

                                if (count_removed === number_of_strains) {
                                    strains = to_use;
                                    callback({strains: to_use});
                                }
                            }
                        });
                    }
                });
            }
        },

        /*
        Apply a workflow to a strain
        */
        apply_workflow: (mode, type_proc, callback) => {

            const table = $('#strains_table').DataTable();

            //Get the selected strain indexes on the table
            const selected_indexes = $.map(table.rows('.selected').indexes(), (index) => {
                return index;
            });

            //Get the selected strain data on the table
            const strain_data = $.map(table.rows('.selected').data(), (item) => {
                return item;
            });

            if (strain_data.length === 0) {
                modalAlert('Select strains to' +
                    ' apply procedures.', "Select Strains", () => {
                });
            }

            let counter = -1;
            let workflow_names = [];
            let workflowids = [];
            let dependencies_check = [];

            let proc_value = "";
            let workflow_already_applied = false;
            let workflowN = "";


            if (type_proc === 'lab_protocol') {
                proc_value = $("#classifier_selector option:selected").attr("pname") +"--"+ $("#classifier_selector option:selected").attr("workflow_id");
                workflowN = $("#pipeline_selector option:selected").attr("pname") + "&emsp;<span class='label label-info'>"+$("#pipeline_selector option:selected").attr("version")+"</span>";
            }
            else if (type_proc === 'analysis_protocol') {
                proc_value = $("#pipeline_selector option:selected").attr("pname") +"--"+ $("#pipeline_selector option:selected").attr("workflow_id");
                workflowN = $("#pipeline_selector option:selected").attr("pname") + "&emsp;<span class='label label-info'>"+$("#pipeline_selector option:selected").attr("version")+"</span>";

            }

            let needs_dependency = false;

            //Checks the last protocol name and creates the buttons to be applied to the strain
            for (const i in strain_data) {
                let toAdd_analysis = '';
                let toAdd_lab_protocols = '';
                let toAdd_Protocols = '';
                counter++;
                let pip_start_id = 0;
                let proc_start_id = 0;
                let local_workflow_applied = false;
                let last_proc_name = proc_value;

                if (pipelines_applied[strain_data[counter]['strainID']] !== undefined && pipelines_applied[strain_data[counter]['strainID']].length !== 0) {
                    let button_name_parts_to_use = pipelines_applied[strain_data[counter]['strainID']][pipelines_applied[strain_data[counter]['strainID']].length - 1].split("id")[1].split('"')[1].split("_");
                    let split_protocols_by_buttons = protocols_applied[strain_data[counter]['strainID']][protocols_applied[strain_data[counter]['strainID']].length - 1].split("<button");

                    let button_protocols_parts_to_use = split_protocols_by_buttons[split_protocols_by_buttons.length - 1].split("id")[1].split('"')[1].split("_");
                    pip_start_id = parseInt(button_name_parts_to_use[button_name_parts_to_use.length - 2]);
                    proc_start_id = parseInt(button_protocols_parts_to_use[button_protocols_parts_to_use.length - 2]);
                    last_proc_name = pipelines_type_by_strain[strain_data[counter]['strainID']][1][pip_start_id - 1].split('<li class="')[1].split("&&")[0];
                }

                if (!strainNames_to_pipelinesNames.hasOwnProperty(strain_data[counter]['strainID'])) {
                    strainNames_to_pipelinesNames[strain_data[counter]['strainID']] = [];
                    applied_dependencies[strain_data[counter]['strainID']] = [];
                }

                let inDependencies = false;

                for (const workflow of strainNames_to_pipelinesNames[strain_data[counter]['strainID']]) {
                    if (workflow.split("--")[0] === pipelinesAndDependency[proc_value]) {
                        inDependencies = true;
                        break;

                    }
                }

                if (pipelinesAndDependency[proc_value] !== "None" && pipelinesAndDependency[proc_value] !== null && !inDependencies) {
                    needs_dependency = true;

                    // Check if input type is Accession
                    if (pipelinesAndDependency[proc_value] === "Accession" && strain_data[counter]["Accession"] !== "NA") {
                        needs_dependency = false;
                        strainNames_to_pipelinesNames[strain_data[counter]['strainID']].push(proc_value);
                        applied_dependencies[strain_data[counter]['strainID']].push(pipelinesAndDependency[proc_value]);
                    }
                    // Check if input type is Fastq or if it has some
                    // process to grab accessions
                    else if (pipelinesAndDependency[proc_value] === "Fastq" && (strain_data[counter]["File_1"] !== "None" && strain_data[counter]["File_2"] !== "None") || applied_dependencies[strain_data[counter]['strainID']].includes("Accession")) {
                        needs_dependency = false;
                        strainNames_to_pipelinesNames[strain_data[counter]['strainID']].push(proc_value);
                        applied_dependencies[strain_data[counter]['strainID']].push(pipelinesAndDependency[proc_value]);
                    }
                    // In case not having the required dependencies
                    else {
                        dependencies_check.push([proc_value.split("--")[0], pipelinesAndDependency[proc_value]]);

                        if (counter === strain_data.length - 1) {
                            let message;

                            if (needs_dependency) {
                                message = 'Some of the applied procedures' +
                                    ' lack' +
                                    ' some dependencies:<br/>';

                                for (const dep in dependencies_check) {
                                    message += '<b>' + dependencies_check[dep][0] + "</b> requires <b>" + dependencies_check[dep][1] + "</b><br/>"
                                }
                            }
                            else {
                                message = 'Procedures applied.';
                            }
                            modalAlert(message, "Info", () => {
                            });
                            callback({
                                strains: strain_data,
                                indexes: selected_indexes,
                                workflow_names: workflow_names,
                                workflow_ids: workflowids
                            });
                            return;
                        }
                        else continue;
                    }

                }
                else {
                    strainNames_to_pipelinesNames[strain_data[counter]['strainID']].push(proc_value);
                    applied_dependencies[strain_data[counter]['strainID']].push(pipelinesAndDependency[proc_value]);
                }

                if (mode === 'new') {

                    //ALLOW ONLY THE LAST WORKFLOW TO BE REMOVED
                    let class_of_button_remove_to_replace = last_proc_name + '&&' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_workflow_" + String(pip_start_id) + '_' + CURRENT_PROJECT_ID + '&&&';
                    class_of_button_remove_to_replace = 'class="' + class_of_button_remove_to_replace + '" onclick="removeAnalysis(this)';

                    if (pip_start_id > 0) {
                        //console.log('style="display:block;" ' + class_of_button_remove_to_replace, pipelines_type_by_strain[strain_data[counter]['strainID']][1][pip_start_id-1]);
                        pipelines_type_by_strain[strain_data[counter]['strainID']][1][pip_start_id - 1] = pipelines_type_by_strain[strain_data[counter]['strainID']][1][pip_start_id - 1].replace('style="display:block;" ' + class_of_button_remove_to_replace, 'style="display:none;" ' + class_of_button_remove_to_replace)
                    }

                    let buttonselectedPipeline = '<div class="dropdown"' +
                        ' style="float:left;">' +
                        '<button class="btn btn-sm btn-default dropdown-toggle workflows_child" shown_child="false" strainID="' + strain_data[counter]['strainID'] + '" name="' + proc_value + '" id="' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_workflow_" + String(pip_start_id + 1) + '_' + CURRENT_PROJECT_ID + '"><i class="fa fa-arrow-down"></i>&emsp;' + workflowN + '</button>' +
                        '<ul class="dropdown-menu" id="' + strain_data[counter]['strainID'] + '_' + proc_value.replace(/ /, "") + '" style="position:relative;float:right;">' +
                        '<li class="' + proc_value + '&&' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_" + String(pip_start_id + 1) + '_workflow_' + CURRENT_PROJECT_ID + '&&&" onclick="getProcessesOutputs(this)" style="display:none;"><a>Get Results</a></li>' +
                        '<li class="' + proc_value + '&&' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_" + String(pip_start_id + 1) + '_workflow_' + CURRENT_PROJECT_ID + '&&&" onclick="getProcessesLog(this)" style="display:none;"><a>Get Run Log</a></li>' +
                        '<li style="display:block;" class="' + proc_value + '&&' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_workflow_" + String(pip_start_id + 1) + '_' + CURRENT_PROJECT_ID + '&&&" onclick="removeAnalysis(this)"><a>Remove</a></li></ul></div>';

                    let just_button = '<button class="btn btn-sm btn-default' +
                        ' dropdown-toggle" data-toggle="dropdown" id="' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_" + String(pip_start_id + 1) + '_' + CURRENT_PROJECT_ID + '">' + proc_value + '</button>';

                    let protocol_buttons = "";
                    let new_proc_count = 0;

                    console.log(workflowname_to_protocols);

                    for (const pt in workflowname_to_protocols[proc_value]) {
                        new_proc_count += 1;
                        protocol_buttons += '<div class="dropdown" style="float:left;">' +
                            '<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_protocol_" + String(proc_start_id + new_proc_count) + '_' + CURRENT_PROJECT_ID + '">' + workflowname_to_protocols[proc_value][pt][2] + '</button>' +
                            '<ul class="dropdown-menu" id="' + strain_data[counter]['strainID'] + '_' + workflowname_to_protocols[proc_value][pt][2] + '" style="position:relative;float:right;">' +
                            '<li class="' + workflowname_to_protocols[proc_value][pt][2] + '&&' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_protocol_" + String(proc_start_id + new_proc_count) + '_' + CURRENT_PROJECT_ID + '&&&" onclick="getProcessesOutputs(this)" style="display:none;"><a>Get Results</a></li>' +
                            '<li class="' + workflowname_to_protocols[proc_value][pt][2] + '&&' + strain_data[counter]['strainID'].replace(/ /g, '_') + "_protocol_" + String(proc_start_id + new_proc_count) + '_' + CURRENT_PROJECT_ID + '&&&" onclick="getProcessesLog(this)"><a>Get Run Log</a></li></ul></div>';

                        let workflow_counter = String(pip_start_id + 1);

                        let protoc_counter = String(proc_start_id + new_proc_count);

                        process_id_to_workflow[strain_data[counter]['strainID'] + protoc_counter] = strain_data[counter]['strainID'] + "_workflow_" + workflow_counter + "_" + CURRENT_PROJECT_ID;
                    }

                    //console.log(buttonselectedPipeline);


                    if (!pipelines_applied.hasOwnProperty(strain_data[counter]['strainID'])) {
                        pipelines_type_by_strain[strain_data[counter]['strainID']] = [[], [], []];
                        pipelines_applied[strain_data[counter]['strainID']] = [];
                        protocols_applied[strain_data[counter]['strainID']] = [];
                    }


                    //ALLOW MULTIPLE EQUAL WORKFLOWS
                    /*try{
                        workflow_id_to_name[strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pipelines_applied[strain_data[counter]['strainID']].length + 1) + '_' + CURRENT_PROJECT_ID] = proc_value;
                    }
                    catch(e){
                        workflow_id_to_name[strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(1)+ '_' + CURRENT_PROJECT_ID] = proc_value;
                    }

                    pipelines_applied[strain_data[counter]['strainID']].push(buttonselectedPipeline);
                    protocols_applied[strain_data[counter]['strainID']].push(protocol_buttons);

                    */

                    if (!protocols_applied_by_pipeline.hasOwnProperty(strain_data[counter]['strainID'])) {
                        protocols_applied_by_pipeline[strain_data[counter]['strainID']] = {};
                    }


                    if (protocols_applied_by_pipeline[strain_data[counter]['strainID']].hasOwnProperty(proc_value)) {
                        workflow_already_applied = true;
                        local_workflow_applied = true;
                    }
                    else {

                        pipelines_applied[strain_data[counter]['strainID']].push(buttonselectedPipeline);
                        protocols_applied[strain_data[counter]['strainID']].push(protocol_buttons);

                        if (!protocols_applied_by_pipeline[strain_data[counter]['strainID']].hasOwnProperty(proc_value)) {
                            protocols_applied_by_pipeline[strain_data[counter]['strainID']][proc_value] = [];
                        }

                        protocols_applied_by_pipeline[strain_data[counter]['strainID']][proc_value].push(protocol_buttons);

                        if (type_proc === 'lab_protocol') pipelines_type_by_strain[strain_data[counter]['strainID']][0].push(buttonselectedPipeline.replace("&&&", "&&protocol"));
                        else if (type_proc === 'analysis_protocol') {
                            pipelines_type_by_strain[strain_data[counter]['strainID']][1].push(buttonselectedPipeline.replace("&&&", ""));
                            pipelines_type_by_strain[strain_data[counter]['strainID']][2].push(protocol_buttons.replace("&&&", ""));
                        }
                    }

                    //console.log(pipelines_applied, counter, strain_data,
                    // pipelines_type_by_strain);


                    for (const j in pipelines_type_by_strain[strain_data[counter]['strainID']]) {
                        for (const o in pipelines_type_by_strain[strain_data[counter]['strainID']][j]) {
                            if (j === String(0)) toAdd_lab_protocols += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
                            else if (j === String(1)) toAdd_analysis += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
                            else toAdd_Protocols = pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
                        }
                    }

                }
                else if (mode === 'same') {
                    for (const j in pipelines_type_by_strain[strain_data[counter]['strainID']]) {
                        for (const o in pipelines_type_by_strain[strain_data[counter]['strainID']][j]) {
                            if (j === String(0)) toAdd_lab_protocols += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
                            else if (j === String(1)) toAdd_analysis += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
                            else toAdd_Protocols += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
                        }
                    }
                }

                //console.log(toAdd_analysis);
                if (!strain_data[i].hasOwnProperty('protocols')) {
                    strain_data[i]['protocols'] = {};
                }

                if (type_proc === 'lab_protocol' && local_workflow_applied !== true) {
                    strain_data[i]['lab_protocols'] = toAdd_lab_protocols;
                }
                else if (type_proc === 'analysis_protocol' && local_workflow_applied !== true) {
                    strain_data[i]['Analysis'] = toAdd_analysis;
                    strain_data[i]['protocols'][proc_value] = toAdd_Protocols;
                }

                if (counter === strain_data.length - 1) {
                    let message;

                    if (needs_dependency) {
                        message = 'Procedures applied but' +
                            ' some lack dependencies.';
                    }
                    else if (workflow_already_applied) {
                        message = 'Workflow' +
                            ' already applied to some of the selected strains.';
                    }
                    else {
                        message = 'Procedures applied.';
                    }
                    modalAlert(message, "Info", () => {
                    });

                    callback({
                        strains: strain_data,
                        indexes: selected_indexes,
                        workflow_names: workflow_names,
                        workflow_ids: workflowids
                    });
                }
            }
        },

        /*
        Check if there are jobs pending or running
        */
        check_if_pending: (callback) => {

            const table = $('#strains_table').DataTable();

            const strain_names = $.map($('#strains_table').DataTable().rows('.selected').data(), (item) => {
                return item['strainID'];
            });

            for(let i = 0; i< strain_names.length; i++)
            {
                let strain_id = strain_names[i];
                strain_id = strain_id.replace(/(.*?) <i.*/i, "$1")  ;
                strain_names[i] = strain_id;
            }


            if (strain_names.length === 0) {
                return callback("no_selected");
            }
            else {
                let count_passed = 0;
                let has_pending = false;

                for (const sn in strain_names) {

                    if (pipelines_applied.hasOwnProperty(strain_names[sn])) {
                        pipelines_applied[strain_names[sn]].map((d, x) => {

                            let workflowName = d.split('button')[1].split('>')[1].split('</')[0];
                            let button_n = d.split("id")[1].split('"')[1];

                            if (buttons_to_tasks[button_n] !== undefined) {
                                if (dict_of_tasks_status[buttons_to_tasks[button_n]] === "PD" || dict_of_tasks_status[buttons_to_tasks[button_n]] === "R") {
                                    has_pending = true;
                                }
                            }
                        });

                        count_passed += 1;
                        if (count_passed === strain_names.length) {
                            return callback(has_pending);
                        }
                    }
                    else {
                        count_passed += 1;
                        if (count_passed === strain_names.length) {
                            return callback(has_pending);
                        }
                    }
                }
            }
        },

        /*
        Save pipelines if required
        */
        save_pipelines: (callback) => {

            const table = $('#strains_table').DataTable();

            const strain_names = $.map(table.rows('.selected').data(), (item) => {
                return item['strainID'];
            });

            for(let i = 0; i< strain_names.length; i++)
            {
                let strain_id = strain_names[i];
                strain_id = strain_id.replace(/(.*?) <i.*/i, "$1")  ;
                strain_names[i] = strain_id;
            }

            /**
             * Check if strain has files to run
             */
            const strain_has_files = $.map(table.rows('.selected').data(), (item) => {
                return item['has_files'];
            });

            /**
             * Check if strain has accession
             */
            const strain_has_accession = $.map(table.rows('.selected').data(), (item) => {
                return item['Accession'];
            });

            //CASE THERE ARE NO STRAINS SELECTED
            if (strain_names.length === 0) {
                modalAlert('Please select at least one strain before running' +
                    ' any analysis.', "Select Strains", () => {
                });
                return callback("no_select");
            }

            let index_length = strain_names.length;
            let count_finished = 0;
            let pipeline_ids = [];
            let sel_index_clone = strain_names.slice(0);
            let total_index_length = strain_names.length;

            const save_single_pipeline = () => {

                let sel_name = strain_names.shift();
                let sel_has_file = strain_has_files.shift();
                let sel_has_accession = strain_has_accession.shift();
                const subStatusEl = $("#submission_status");

                subStatusEl.empty();
                subStatusEl.html("Saving pipeline " + String(count_finished + 1) + " out of " + String(sel_index_clone.length) + "...");

                if (sel_has_file === "false" && sel_has_accession === "NA") {
                    subStatusEl.empty();
                    subStatusEl.html("Strain " + String(sel_name) + " has no" +
                        " available files to run.");

                    count_finished += 1;

                    if (count_finished === total_index_length) {
                        return callback(true);
                    }
                    else {
                        save_single_pipeline();
                    }
                }
                else {

                    create_pipeline(sel_name, (strain_id, pipeline_id) => {
                        strainID_pipeline[strain_id] = pipeline_id;
                        pipeline_ids.push(pipeline_id);

                        if (pipelines_applied.hasOwnProperty(strain_id_to_name[strain_id])) {

                            let pipeline_to_use = pipeline_ids.shift();
                            let steps = [];
                            let workflow_ids = [];
                            let total_workflows = pipelines_applied[strain_id_to_name[strain_id]].length;
                            let counter_global = 0;
                            let counter_steps = 0;
                            let to_add = false;
                            let task_failed = false;

                            pipelines_applied[strain_id_to_name[strain_id]].map((d, x) => {

                                let workflowName = d.split('button')[1].split('name="')[1].split('"')[0];
                                button_class_to_pipeline[d.split('<li class="')[1].split('"')[0]] = pipeline_id;
                                let button_n = d.split("id")[1].split('"')[1];

                                if (buttons_to_tasks[button_n] === undefined) {
                                    buttons_to_tasks[button_n] = "buttonworkflow_" + pipeline_id + "_" + String(x + 1);
                                    workflow_ids.push(pipelinesByName[workflowName]);
                                    counter_steps += 1;
                                    steps.push(counter_steps);
                                }
                                else counter_steps += 1;

                                counter_global += 1;

                                if (total_workflows === counter_global) {
                                    if (workflow_ids.length === 0) {
                                        return callback(false);
                                    }
                                    //In case of all workflows are new in the pipeline, update the pipeline to remove the parent
                                    if (counter_steps === pipelines_applied[strain_id_to_name[strain_id]].length) {
                                        pg_requests.change_pipeline_from_project(strain_id, 'remove_parent', pipeline_to_use, (response, strain_id, pipeline_to_use) => {
                                            //Say that this process belongs to this project
                                            if (strain_to_real_pip.hasOwnProperty(strain_id)) {
                                                strain_to_real_pip[strain_id].map((d) => {
                                                    d[0] = CURRENT_PROJECT_ID;
                                                });
                                            }
                                            if (pipelines_type_by_strain[strain_id_to_name[strain_id]][3] !== undefined) {
                                                pipelines_type_by_strain[strain_id_to_name[strain_id]][3] = undefined;
                                            }

                                            ngs_onto_requests.ngs_onto_request_save_pipeline(pipeline_to_use, workflow_ids, steps, (response) => {
                                                if (response.status === 200) {
                                                }
                                                else console.log(response.statusText);

                                                count_finished += 1;

                                                if (count_finished === total_index_length) {
                                                    return callback(true);
                                                }
                                                else {
                                                    save_single_pipeline();
                                                }
                                            });
                                        });
                                    }
                                    else {
                                        ngs_onto_requests.ngs_onto_request_save_pipeline(pipeline_to_use, workflow_ids, steps, (response) => {
                                            if (response.status === 200) {
                                            }
                                            else console.log(response.statusText);

                                            count_finished += 1;

                                            if (count_finished === total_index_length) {
                                                return callback(true);
                                            }
                                            else {
                                                save_single_pipeline();
                                            }
                                        });
                                    }
                                }
                            });
                        }

                        else {
                            console.log("No pipeline for strain");
                            count_finished += 1;

                            if (count_finished === total_index_length) {
                                return callback(true);
                            }
                            else {
                                save_single_pipeline();
                            }
                        }
                    });
                }

            };

            save_single_pipeline();

        },

        /*
        Run pipelines
        */
        run_pipelines: () => {

            const table = $('#strains_table').DataTable();

            const strain_names = $.map(table.rows('.selected').data(), (item) => {
                return item['strainID'];
            });

            for(let i = 0; i< strain_names.length; i++)
            {
                let strain_id = strain_names[i];
                strain_id = strain_id.replace(/(.*?) <i.*/i, "$1")  ;
                strain_names[i] = strain_id;
            }


            const strain_submitter = $.map(table.rows('.selected').data(), (item) => {
                return item['FilesLocation'];
            });

            /**
             * Check if strain has files to run
             */
            const strain_has_files = $.map(table.rows('.selected').data(), (item) => {
                return item['has_files'];
            });

            /**
             * Check if strain has accession
             */
            const strain_has_accession = $.map(table.rows('.selected').data(), (item) => {
                return item['Accession'];
            });

            let countWorkflows = 0;
            let countFinished = 0;
            let dict_strain_names = {};
            let put_i = [];
            let count_strains_added_run = 0;
            let workflow_indexes = {};
            let workflow_order = {};
            let strain_names_clone = strain_names.slice(0);
            let count_total_strains = strain_names_clone.length;
            let no_pip_strains = [];
            let no_files_strains = [];
            let no_accession_strains = [];
            let has_error = [];


            const run_single_strain = () => {

                if (count_strains_added_run === count_total_strains) {
                    let message = "<p>Jobs for some of the strains were not submitted:</p>";

                    //Verification case there are no workflows applied to the strains
                    if (no_pip_strains.length > 0) {
                        message += "<ul>";

                        for (const x in no_pip_strains) {
                            message += "<li>Please add workflows first for <b>"
                                + no_pip_strains[x] + "</b></li>";
                        }

                        message += "</ul>";
                    }

                    if (no_files_strains.length > 0 || no_accession_strains.length > 0 || has_error.length > 0) {

                        message += "<ul>";

                        for (const x in no_files_strains) {
                            message += "<li>Please resubmit the associated" +
                                " files for the strain " +
                                " <b>" + no_files_strains[x] + "</b> or ask" +
                                " the owner to reupload them.</li>";
                        }

                        for (const x in no_accession_strains) {
                            message += "<li>Please associate" +
                                " fastq files or an accession number to the" +
                                " strain <b>" + no_accession_strains[x] + "</b></li>";
                        }

                        for (const er in has_error) {
                            message += "<li>There were errors when" +
                                " submitting jobs for the strain <b>" + has_error[er] + "</b></li>";
                        }

                        message += "</ul>";

                    }
                    else {
                        message = "<p>Jobs for all the selected strains have been submitted.</p>";
                    }

                    modalAlert(message, "Info", () => {
                    });
                    $('#button_run_strain').fadeTo("slow", 1).css('pointer-events', 'auto');
                    $("#overlayProjects").css({"display": "none"});
                    $("#overlayWorking").css({"display": "none"});
                    $("#single_project_controller_div").css({"display": "block"});
                    return;
                }

                let strain_in_use = strain_names.shift();
                let strain_in_has_files = strain_has_files.shift();
                let strain_in_accession = strain_has_accession.shift();


                //put_i.push(i);
                if (pipelines_applied[strain_in_use] !== undefined && (strain_in_has_files !== "false" || strain_in_accession !== "NA")) {
                    dict_strain_names[strain_in_use] = [pipelines_applied[strain_in_use].length, [], 0, 0];

                    let pip_id_of_parents = [];

                    for (const p in strain_to_real_pip[strains_dict[strain_in_use]]) {
                        if (strain_to_real_pip[strains_dict[strain_in_use]][p][0] !== CURRENT_PROJECT_ID && pipelines_type_by_strain[strain_in_use][3] !== undefined) {

                            pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_in_use]][p][0]);
                            pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_in_use]][p][1]);
                            pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_in_use]][p][2]);
                        }
                    }

                    //Checks the last workflow that has been run and pass that information to the ngs_onto
                    if (pip_id_of_parents.length === 0) {
                        let lastprocess = "";
                        let last_pipeline_id = "";
                        let count_processes = 0;
                        let has_completed = false;

                        for (const x in pipelines_applied[strain_in_use]) {

                            for (const p in workflowname_to_protocols[pipelines_applied[strain_in_use][x].split('button')[1].split('name="')[1].split('"')[0]]) {
                                count_processes += 1;
                            }

                            let pip_name = pipelines_applied[strain_in_use][x].split("id")[1].split('"')[1];

                            if ((dict_of_tasks_status[buttons_to_tasks[pip_name]] === "COMPLETED") || (dict_of_tasks_status[buttons_to_tasks[pip_name]] === "FAILED") || (dict_of_tasks_status[buttons_to_tasks[pip_name]] === "WARNING")) {
                                last_pipeline_id = strainID_pipeline[strains_dict[strain_in_use]];
                                lastprocess = count_processes;
                            }

                            if (dict_of_tasks_status[buttons_to_tasks[pip_name]] === "COMPLETED" || dict_of_tasks_status[buttons_to_tasks[pip_name]] === "FAILED" || dict_of_tasks_status[buttons_to_tasks[pip_name]] === "WARNING") has_completed = true;

                        }
                        if (lastprocess !== "" && has_completed === true) {
                            pip_id_of_parents.push(CURRENT_PROJECT_ID);
                            pip_id_of_parents.push(last_pipeline_id);
                            pip_id_of_parents.push(lastprocess);
                        }
                    }

                    workflow_indexes[strain_in_use] = {};
                    workflow_order[strain_in_use] = [];

                    //Add processes to ngs_onto
                    ngs_onto_requests.ngs_onto_request_add_processes(strainID_pipeline[strains_dict[strain_in_use]], strains_dict[strain_in_use], strain_in_use, pip_id_of_parents, pipelines_type_by_strain[strain_in_use], (response, strain_name) => {

                        if (response.status !== 404) {
                            dict_strain_names[strain_name].push(response.data);
                        }
                        //Push button identifier
                        dict_strain_names[strain_name].push([]);

                        //Push process position
                        dict_strain_names[strain_name].push([]);
                        dict_strain_names[strain_name].push(0);

                        //Push workflow ID
                        dict_strain_names[strain_name].push({});

                        //Push if process is to run
                        dict_strain_names[strain_name].push([]);

                        let count_pipelines_applied = 0;

                        for (const p in pipelines_applied[strain_name]) {
                            let pi_name = pipelines_applied[strain_name][p].split("id")[1].split('"')[1];

                            let real_pi_name = pipelines_applied[strain_name][p].split('button')[1].split('name="')[1].split('"')[0];

                            if (buttons_to_tasks[pi_name].indexOf("workflow") > -1) {

                                dict_strain_names[strain_name][1].push(pipelines_applied[strain_name][p].split('button')[1].split('name="')[1].split('"')[0]);
                                let protocols_in_pip = protocols_applied_by_pipeline[strain_name][real_pi_name][0].split('<div class="dropdown"');

                                protocols_in_pip.shift();

                                for (const protoc in protocols_in_pip) {
                                    let protocol_with_button = protocols_in_pip[protoc].split("</button>")[0];
                                    let protocol_name = protocol_with_button.split("id=")[1].split('"')[1];

                                    //Add to array the processes that should not run
                                    if (dict_of_tasks_status[buttons_to_tasks[pi_name]] === "COMPLETED" || dict_of_tasks_status[buttons_to_tasks[pi_name]] === "FAILED" || dict_of_tasks_status[buttons_to_tasks[pi_name]] === "PD" || dict_of_tasks_status[buttons_to_tasks[pi_name]] === "R" || dict_of_tasks_status[buttons_to_tasks[pi_name]] === "WARNING") {
                                        dict_strain_names[strain_name][9].push(false);
                                    }
                                    else {
                                        dict_strain_names[strain_name][9].push(true);
                                        dict_strain_names[strain_name][5].push(protocol_name);
                                    }
                                }

                                //dict_strain_names[strain_names[strain_name]][2] += 1;
                            }
                            else {
                                //Change to count for all protocol processes instead of the workflows

                                dict_strain_names[strain_name][2] += 1;
                                dict_strain_names[strain_name][7] += 1;

                            }

                            while (dict_strain_names[strain_name][1].length !== 0) {

                                let workflowName = dict_strain_names[strain_name][1].shift();
                                workflow_order[strain_name].push(workflowName);
                                count_pipelines_applied += 1;
                                dict_strain_names[strain_name][8][count_pipelines_applied] = [];

                                //Get the workflow to run and the step
                                ngs_onto_requests.ngs_onto_request_get_workflow(pipelinesByName[workflowName], strain_name, count_pipelines_applied, (response, strain_name, count_pip_app) => {

                                    dict_strain_names[strain_name][2] += 1;

                                    for (let k = response.data.length - 1; k >= 0; k--) {

                                        let indexProtocol = response.data[k].index.split("^^")[0].split('"')[1]
                                        let parts = response.data[k].protocol.split('/');
                                        parts = parts[parts.length - 1];
                                        dict_strain_names[strain_name][8][count_pip_app].push([indexProtocol, parts.replace('>', '')]);
                                    }

                                    dict_strain_names[strain_name][8][count_pip_app].sort(sortFunction);

                                    //Set the workflows ids to run
                                    if (dict_strain_names[strain_name][0] === dict_strain_names[strain_name][2]) {
                                        let indexes = '';

                                        for (const prot_index in dict_strain_names[strain_name][8]) {
                                            for (const prot in dict_strain_names[strain_name][8][prot_index]) {
                                                indexes += dict_strain_names[strain_name][8][prot_index][prot][1].replace('>', '') + ',';
                                                dict_strain_names[strain_name][7] += 1;
                                                dict_strain_names[strain_name][6].push(dict_strain_names[strain_name][7]);
                                            }
                                        }
                                        indexes = indexes.replace(/,$/, '');

                                        //Run the job
                                        console.log("RUN JOB");
                                        pg_requests.run_job(strains_dict[strain_name], indexes, strainID_pipeline[strains_dict[strain_name]], dict_strain_names[strain_name][6], strain_name, strain_submitter[count_strains_added_run], CURRENT_SPECIES_NAME, strain_name, dict_strain_names[strain_name][9], process_to_workdir, function (response, strain_name, pipeline_id) {

                                            let task_ids = [];
                                            let task_ids_to_map = [];
                                            let processes_to_map = [];

                                            dict_strain_names[strain_name][3] += 1;

                                            if (!strain_to_real_pip.hasOwnProperty(strains_dict[strain_name])) {
                                                strain_to_real_pip[strains_dict[strain_name]] = [];
                                            }

                                            console.log(response);

                                            // Case error in job submission
                                            if (response.status === 200) {

                                                let countTasks = 0;
                                                for (const l in response.data) {

                                                    if (response.data[l] === 'null') {
                                                        countTasks++;
                                                        let button_name = dict_strain_names[strain_name][5].shift();

                                                        tasks_to_buttons[response.data[l] + '_' + countTasks] = button_name;//strain_names[strain_name].replace(/ /g, "_") + '_' + String(countTasks) + '_' + CURRENT_PROJECT_ID;
                                                        buttons_to_tasks[button_name] = response.data[l] + '_' + countTasks;
                                                        buttons_to_strain_names[button_name] = strain_name;

                                                        task_ids_to_map.push(response.data[l] + '_' + countTasks);
                                                    }
                                                    else {
                                                        task_ids = response.data[l].task_ids;
                                                        //pipelinesToNextflowLogs[pipeline_id] = {"gen_stdout":response.data[l].gen_stdout, "path_nextflow_log": response.data[l].path_nextflow_log, "subproc_id": response.data[l].subproc_id}

                                                        for (const s in task_ids) {
                                                            countTasks++;
                                                            let projectId = task_ids[s].split("project")[1].split("pipeline")[0];
                                                            let pipelineId = task_ids[s].split("pipeline")[1].split("process")[0];
                                                            let processId = task_ids[s].split("process")[1];

                                                            strain_to_real_pip[strains_dict[strain_name]].push([projectId, pipelineId, processId]);

                                                            var button_name = dict_strain_names[strain_name][5].shift();
                                                            tasks_to_buttons[task_ids[s]] = button_name;//strain_names[strain_name].replace(/ /g, "_") + '_' + String(countTasks) + '_' + CURRENT_PROJECT_ID;
                                                            buttons_to_tasks[button_name] = task_ids[s];
                                                            buttons_to_strain_names[button_name] = strain_name;
                                                            task_ids_to_map.push(task_ids[s]);
                                                        }
                                                        processes_to_map = task_ids_to_map.map(function (x) {
                                                            return dict_strain_names[strain_name][4].shift();
                                                        });
                                                    }
                                                }


                                                //Add job id to the process on ngsonto and start checking the job status
                                                ngs_onto_requests.ngs_onto_request_add_jobid_to_process(strainID_pipeline[strains_dict[strain_name]], processes_to_map, task_ids_to_map, strain_name, (response, strain_name, process_ids) => {
                                                    count_strains_added_run += 1;

                                                    const subStatus = $("#submission_status");

                                                    subStatus.empty();
                                                    subStatus.html("Submitted " + String(count_strains_added_run) + " out of " + String(strain_names_clone.length) + " jobs...");

                                                    for (const tk in response.data.tasks) {
                                                        dict_of_tasks_status[response.data.tasks[tk]] = '';
                                                    }
                                                    strainName_to_tids[strain_name] = response.data.tasks.join();

                                                    periodic_check_job_status(response.data.tasks, dict_of_tasks_status, strain_name, process_ids, strainID_pipeline[strains_dict[strain_name]], CURRENT_PROJECT_ID);

                                                    run_single_strain();

                                                })
                                            }
                                            else {
                                                has_error.push(strain_in_use);
                                                count_strains_added_run += 1;
                                                run_single_strain();
                                            }

                                        })
                                    }

                                })
                            }
                        }
                    });
                }

                else {
                    if (strain_in_has_files === "false" && strain_in_accession === "NA") {
                        no_accession_strains.push(strain_in_use);
                        count_strains_added_run += 1;
                        run_single_strain();
                    }
                    else if (strain_in_has_files === "false") {
                        no_files_strains.push(strain_in_use);
                        count_strains_added_run += 1;
                        run_single_strain();
                    }
                    else {
                        no_pip_strains.push(strain_in_use);
                        count_strains_added_run += 1;
                        run_single_strain();
                    }

                }
            };

            //Trigger fist run
            run_single_strain();

        },

        /*
        Get the job id for each process on a given pipeline
        */
        get_ids_from_processes: (callback) => {


            for (const i in intervals_running) {
                clearInterval(intervals_running[i]);
            }

            intervals_running = {};

            let array_of_strains = [];
            let strain_array = [];
            let prevjobid = '';
            let countstrains = 0;
            let count_processes = 0;
            let count_strains_without_process = 0;

            let countStrain = {};
            let nstrains;

            if (strains.length === 0) {
                return callback({strains: []});
            }
            else {
                nstrains = strains.length;
            }

            let processed_proc = {};

            for (const i in strains) {
                let p_id_to_use = CURRENT_PROJECT_ID;

                if (strains[i] === undefined) {
                    continue;
                }

                let strain_processes = strain_to_real_pip[strains_dict[strains[i].strainID]];
                count_processes += strain_processes === undefined ? 0 : strain_processes.length;

                countStrain[strains[i].strainID] = 0;

                //Case has pipelines but no processes
                if (strain_processes === undefined || strain_processes.length === 0) {
                    count_strains_without_process += 1;
                    //Fix workflows positions.
                    if (count_strains_without_process === nstrains) {

                        const table = $('#strains_table').DataTable();

                        const strain_data = $.map(table.rows().data(), function (item) {
                            return item;
                        });

                        let toAdd_lab_protocols = "";
                        let toAdd_analysis = "";

                        for (const x in strain_data) {
                            toAdd_lab_protocols = "";
                            toAdd_analysis = "";
                            let s_name = strain_data[x]['strainID'];

                            for (const j in pipelines_applied[s_name]) {
                                let pipeline_id = pipelines_applied[s_name][j].split('id="')[1].split('"')[0];
                                if (buttons_to_tasks[pipeline_id] !== undefined && buttons_to_tasks[pipeline_id].indexOf("null") > -1) {
                                    pipelines_type_by_strain[s_name][0].push(pipelines_applied[s_name][j].replace("&&&", "&&protocol"));
                                    toAdd_lab_protocols += pipelines_applied[s_name][j].replace("&&&", "&&protocol");
                                }
                                else {
                                    pipelines_type_by_strain[s_name][1].push(pipelines_applied[s_name][j].replace("&&&", ""));
                                    toAdd_analysis += pipelines_applied[s_name][j].replace("&&&", "");
                                }
                            }
                            strain_data[x]["Analysis"] = toAdd_analysis;
                            strain_data[x]['lab_protocols'] = toAdd_lab_protocols;

                        }
                        callback({strains: strain_data});
                    }
                }
                else {

                    let t_ids = [];
                    let proc_ids = [];
                    processed_proc[strains[i].strainID] = 0;
                    let single_strain_processes = [];

                    let s_final_p;

                    for (const s_p in strain_processes) {
                        single_strain_processes.push(strain_processes[s_p][2])
                        s_final_p = s_p;
                    }

                    //for(s_p in strain_processes){
                    //	console.log(strain_processes);
                    ngs_onto_requests.ngs_onto_request_get_jobid_from_process(strain_processes[s_final_p][1], single_strain_processes, strain_processes[s_final_p][0], strains[i].strainID, countStrain, strain_processes, t_ids, proc_ids, processed_proc, (response, pr_ids, strain_id, count_process, pip_id, proj_id, strain_processes_from_request, t_ids, proc_ids, processed_proc) => {

                        //When error occurs when loading the job_id
                        if (response.data === 404) {
                            for (const x in strain_processes_from_request) {
                                countstrains += 1;
                                processed_proc[strain_id] += 1;
                            }
                        }

                        strain_id = strain_id.trim();

                        let prevWorkflow = "";

                        let countProcesses = 0;
                        let countWorkflows = 0;

                        for (const l in response.data) {
                            countProcesses += 1;

                            if (response.data[l].length !== 0) {

                                let t_id = response.data[l][0].jobid.split('^')[0].split('"')[1];
                                t_ids.push(t_id);
                                count_process[strain_id] += 1;
                                tasks_to_buttons[t_id] = strain_id.replace(/ /g, "_") + '_protocol_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID;
                                buttons_to_tasks[strain_id.replace(/ /g, "_") + '_protocol_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID] = t_id;
                                buttons_to_strain_names[strain_id.replace(/ /g, "_") + '_protocol_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID] = strain_id;
                                prevjobid = t_id.split('_')[0];
                                dict_of_tasks_status[t_id] = '';
                                proc_ids.push(pr_ids[l]);
                                //periodic_check_job_status(t_id, dict_of_tasks_status, strain_id, pr_ids[l], pip_id, proj_id);
                            }
                            countstrains += 1;
                            processed_proc[strain_id] += 1;

                            if (prevWorkflow !== process_id_to_workflow[strain_id + String(countProcesses)]) {
                                countWorkflows += 1;
                                buttons_to_tasks[strain_id.replace(/ /g, "_") + '_workflow_' + String(countWorkflows) + '_' + CURRENT_PROJECT_ID] = "buttonworkflow_" + strainID_pipeline[strains_dict[strain_id.replace(/ /g, "_")]] + "_" + String(countWorkflows);
                            }
                            prevWorkflow = process_id_to_workflow[strain_id + String(countProcesses)];

                        }
                        if (processed_proc[strain_id] === strain_processes_from_request.length && t_ids.length > 0) {
                            strainName_to_tids[strain_id] = t_ids.join();
                            periodic_check_job_status(t_ids, dict_of_tasks_status, strain_id, proc_ids, pip_id, proj_id);
                        }


                        //Fix workflows positions.
                        if (countstrains === count_processes) {

                            const table = $('#strains_table').DataTable();

                            const strain_data = $.map(table.rows().data(), (item) => {
                                return item;
                            });

                            let toAdd_lab_protocols = "";
                            let toAdd_analysis = "";

                            for (const x in strain_data) {
                                toAdd_lab_protocols = "";
                                toAdd_analysis = "";
                                let toAdd_protocols = "";
                                strain_data[x]['protocols'] = {};

                                let s_name = strain_data[x]['strainID'];

                                for (const j in pipelines_applied[s_name]) {
                                    let pipeline_id = pipelines_applied[s_name][j].split('id="')[1].split('"')[0];
                                    let pipeline_name = pipelines_applied[s_name][j].split('button')[1].split('name="')[1].split('"')[0];//.split('</i>')[1].split('</')[0];

                                    //console.log(pipeline_name, pipelines_applied[s_name][j]);
                                    if (buttons_to_tasks[pipeline_id] !== undefined && buttons_to_tasks[pipeline_id].indexOf("null") > -1) {
                                        pipelines_type_by_strain[s_name][0].push(pipelines_applied[s_name][j].replace("&&&", "&&protocol"));
                                        toAdd_lab_protocols += pipelines_applied[s_name][j].replace("&&&", "&&protocol");
                                    }
                                    else {
                                        pipelines_type_by_strain[s_name][1].push(pipelines_applied[s_name][j].replace("&&&", ""));
                                        toAdd_analysis += pipelines_applied[s_name][j].replace("&&&", "");
                                        toAdd_protocols = protocols_applied_by_pipeline[s_name][pipeline_name];

                                        strain_data[x]['protocols'][pipeline_name] = toAdd_protocols;
                                    }
                                }
                                strain_data[x]["Analysis"] = toAdd_analysis;
                                strain_data[x]['lab_protocols'] = toAdd_lab_protocols;

                            }
                            callback({strains: strain_data});
                        }
                    });
                    //}

                    //periodic_check_job_status(t_ids, dict_of_tasks_status, strain_id, pr_ids, pip_id, proj_id);

                }


            }
        },

        /*
        Show conbined reports. NOT BEING USED
        */
        show_combined_reports: (button_text) => {

            let button_parts = button_text.split('&&');
            let button_id = button_text.split('&&')[1];
            let workflow_name = button_text.split('&&')[0];

            if (button_parts.length > 2) {
                ngs_onto_requests.ngs_onto_request_get_workflow(pipelinesByName[workflow_name], "", 0, (response, strain_name, count_pip_app) => {

                    let indexes = "";

                    for (let k = response.data.length - 1; k >= 0; k--) {
                        let parts = response.data[k].protocol.split('/');
                        parts = parts[parts.length - 1];
                        indexes += parts.replace('>', '') + ',';
                    }

                    indexes = indexes.replace(/,$/, '');

                    pg_requests.get_protocols_by_ids(indexes, "", function (response) {
                        let protocols_in_use = [];
                        for (const x in response.data) {
                            let protocol_object = JSON.parse(response.data[x].steps);
                            protocol_object.protocol_name = response.data[x].name;
                            protocols_in_use.push(protocol_object)
                        }
                        $rootScope.protocols_in_use = protocols_in_use;
                        $('#LabProtocolTableModal').modal("show");
                    });
                });
            }
            else {

                if ($rootScope.showing_jobs === undefined) {
                    $rootScope.showing_jobs = [];
                }

                CURRENT_JOB_ID = buttons_to_tasks[button_id];
                if (dict_of_tasks_status[CURRENT_JOB_ID] !== "COMPLETED") {
                    return objects_utils.show_message('project_message_div', 'warning', 'This process cannot be added to the active report.');
                }
                $rootScope.showing_jobs.push(CURRENT_JOB_ID);
                objects_utils.show_message('project_message_div', 'success', 'Results stored on active report.');
            }
        },

        /*
        Get the outputs from a process. Uses ngsOnto
        */
        get_processes_outputs: (button_class, callback) => {
            let button_id = button_class.split('&&')[1];
            let button_position = parseInt(button_id.split('_').slice(-2)[0]);
            let real_p_data;

            if (Object.keys(strain_to_real_pip).length === 0) {
                let button_nout = button_class.split('&&')[1].split("_");
                real_p_data = [CURRENT_PROJECT_ID, button_class_to_pipeline[button_class], button_nout[button_nout.length - 2]]
            }
            else {
                real_p_data = strain_to_real_pip[strains_dict[buttons_to_strain_names[button_id]]][button_position - 1];
            }

            if (real_p_data === undefined) {
                modalAlert('The output you are trying to obtain is not' +
                    ' available yet.', "Information", () => {

                });
            }
            else {
                ngs_onto_requests.ngs_onto_request_get_processes_outputs(real_p_data[0], real_p_data[1], real_p_data[2], (response) => {
                    callback(response);
                });
            }
        },

        /*
        Download the results file
        */
        download_result: (response, callback) => {
            if (response.data.length === 0 || response.data[0].file_3 === 'None') {
                return modalAlert('The requested file is not available.', "Information", () => {
                });
            }

            let f_path = response.data[0].file_3.split('^^')[0].replace(/"/g, "");

            pg_requests.download_file(f_path, (response) => {
                callback();
            });
        },

        /*
        Download the log file
        */
        download_log: (response, callback) => {
            if (response.data.length === 0 || response.data[0].file_4 === 'None') {
                return modalAlert('The requested file is not available.', "Information", () => {
                });
            }

            let f_path = response.data[0].file_4.split('^^')[0].replace(/"/g, "");

            pg_requests.download_file(f_path, (response) => {
                callback();
            });
        },

        get_template_strain_file: () => {
            pg_requests.download_template_strain_file((response) => {
                console.log(response);
            });
        },

        /*
        Remove the last workflow button for a given strain
        The remove is only saved when a job is run again for that strain
        */
        remove_analysis: (element, callback) => {
            let class_n = element.className;
            let sp_name = class_n.split('&&')[1];

            const strainTableEl = $('#strains_table');

            const strain_indexes = $.map(strainTableEl.DataTable().rows().indexes(), (index) => {
                return index;
            });
            const strain_names = $.map(strainTableEl.DataTable().rows().data(), (item) => {
                return item.strainID;
            });
            const strain_data = $.map(strainTableEl.DataTable().rows().data(), (item) => {
                return item;
            });

            let last_process = "";
            let removed_pip_name = "";

            for (const index in strain_indexes) {

                let new_pipapplied = [];
                let new_pipapplied_prot = [];
                let new_pipapplied_proc = [];

                let count_pipeline_ids_last_parent = 0;

                let stored_added_pipeline = {};
                let real_sp_name = sp_name.split("_");
                real_sp_name = real_sp_name.slice(0, real_sp_name.length - 3);
                real_sp_name = real_sp_name.join("_");

                if (real_sp_name === strain_names[index].replace(/ /g, "_")) {

                    let count_added_to_new = 0;

                    for (const pipeline in pipelines_applied[strain_names[index]]) {

                        count_pipeline_ids_last_parent += 1;
                        last_process = count_pipeline_ids_last_parent;

                        if (pipelines_applied[strain_names[index]][pipeline].indexOf(class_n) < 0) {

                            new_pipapplied.push(pipelines_applied[strain_names[index]][pipeline]);

                            for (const x in pipelines_type_by_strain[strain_names[index]][0]) {
                                if (pipelines_type_by_strain[strain_names[index]][0][x].indexOf(class_n) < 0 && stored_added_pipeline[y] !== true) {
                                    new_pipapplied_prot.push(pipelines_type_by_strain[strain_names[index]][0][x]);
                                    stored_added_pipeline[y] = true;
                                }
                            }
                            for (const y in pipelines_type_by_strain[strain_names[index]][1]) {
                                if (pipelines_type_by_strain[strain_names[index]][1][y].indexOf(class_n) < 0 && stored_added_pipeline[y] !== true) {
                                    count_added_to_new += 1;
                                    if (count_added_to_new === pipelines_applied[strain_names[index]].length - 1) {
                                        //ALLOW ONLY THE LAST WORKFLOW TO BE REMOVED
                                        let last_proc_name = pipelines_type_by_strain[strain_names[index]][1][count_added_to_new - 1].split('<li class="')[1].split("&&")[0];
                                        let class_of_button_remove_to_replace = last_proc_name + '&&' + strain_names[index].replace(/ /g, '_') + "_workflow_" + String(count_added_to_new) + '_' + CURRENT_PROJECT_ID + '&&&';
                                        class_of_button_remove_to_replace = 'class="' + class_of_button_remove_to_replace + '" onclick="removeAnalysis(this)';
                                        pipelines_type_by_strain[strain_names[index]][1][y] = pipelines_type_by_strain[strain_names[index]][1][y].replace('style="display:none;" ' + class_of_button_remove_to_replace, 'style="display:block;" ' + class_of_button_remove_to_replace)
                                    }

                                    new_pipapplied_proc.push(pipelines_type_by_strain[strain_names[index]][1][y]);
                                    stored_added_pipeline[y] = true;
                                }

                            }

                            let pip_name = pipelines_applied[strain_names[index]][pipeline].split("id")[1].split('"')[1];

                            if (dict_of_tasks_status[buttons_to_tasks[pip_name]] === "COMPLETED" || dict_of_tasks_status[buttons_to_tasks[pip_name]] === "FAILED" || dict_of_tasks_status[buttons_to_tasks[pip_name]] === "WARNING") {

                                if (pipelines_type_by_strain[strain_names[index]][3] === undefined) {
                                    pipelines_type_by_strain[strain_names[index]].push(last_process);
                                }
                                else pipelines_type_by_strain[strain_names[index]][3] = last_process;
                            }
                        }
                        else {
                            removed_pip_name = pipelines_applied[strain_names[index]][pipeline].split('button')[1].split('name="')[1].split('"')[0]; //.split("</i>")[1].split('<')[0];
                        }
                    }

                    pipelines_applied[strain_names[index]] = new_pipapplied;

                    pipelines_type_by_strain[strain_names[index]][0] = new_pipapplied_prot;
                    pipelines_type_by_strain[strain_names[index]][1] = new_pipapplied_proc;

                    let toAdd_lab_protocols = "";
                    let toAdd_analysis = "";

                    //UPDATE WORKFLOWS
                    for (const j in pipelines_type_by_strain[strain_names[index]]) {
                        if (j === String(0)) toAdd_lab_protocols += pipelines_type_by_strain[strain_names[index]][j].join("");
                        else if (j === String(1)) toAdd_analysis += pipelines_type_by_strain[strain_names[index]][j].join("");
                    }
                    strain_data[index]['Analysis'] = toAdd_analysis;

                    clearInterval(intervals_running[strainName_to_tids[strain_names[index]]]);

                    for (const protocol in protocols_on_button[sp_name]) {
                        delete current_job_status_color[protocols_on_button[sp_name][protocol]];
                        delete tasks_to_buttons[buttons_to_tasks[protocols_on_button[sp_name][protocol]]];
                        delete buttons_to_tasks[protocols_on_button[sp_name][protocol]];
                    }

                    let needs_param_check = true;
                    let n_protocols;

                    try {
                        n_protocols = protocols_on_button[sp_name].length;
                    }
                    catch (e) {
                        console.log("Error loading protocols");
                        needs_param_check = false;
                    }

                    let params = jobs_to_parameters[strainName_to_tids[strain_names[index]]];
                    if (params !== undefined && params[0].length > 0 && needs_param_check) {
                        params[0] = params[0].split(",");
                        params[2] = params[2].split(",");

                        params[0] = params[0].slice(0, params[0].length - n_protocols);
                        params[2] = params[2].slice(0, params[2].length - n_protocols);

                        if (params[0].length > 0) {
                            intervals_running[strainName_to_tids[strain_names[index]]] = () => {
                                pipeline_status[strainName_to_tids[strain_names[index]]](params[0].slice(0, params[0].length - n_protocols), params[1], params[2].slice(0, params[2].length - n_protocols), params[3]);
                            };
                        }

                        params[0] = params[0].join();
                        params[2] = params[2].join();

                    }

                    delete current_job_status_color[sp_name];
                    delete tasks_to_buttons[buttons_to_tasks[sp_name]];
                    delete dict_of_tasks_status[buttons_to_tasks[sp_name]];
                    delete buttons_to_tasks[sp_name];
                    delete protocols_applied_by_pipeline[strain_names[index]][removed_pip_name];

                    strain_to_real_pip[strains_dict[strain_names[index]]].pop();
                    strainNames_to_pipelinesNames[strain_names[index]].pop();
                    applied_dependencies[strain_names[index]].pop();
                    protocols_applied[strain_names[index]].pop();
                }
            }
            modalAlert("Procedure removed. This action will only be applied" +
                " when running consequent analysis on this strain.", "Procedure Removed", () => {
            });
            callback({strains: strain_data, indexes: strain_indexes});

        },

        deleteAllWorkflows: (callback) => {

            const strainTableEl = $('#strains_table');

            const strain_indexes = $.map(strainTableEl.DataTable().rows().indexes(), (index) => {
                return index;
            });
            const strain_names = $.map(strainTableEl.DataTable().rows().data(), (item) => {
                return item.strainID;
            });
            const strain_data = $.map(strainTableEl.DataTable().rows().data(), (item) => {
                return item;
            });

            current_job_status_color = {};
            tasks_to_buttons = {};
            dict_of_tasks_status = {};
            buttons_to_tasks = {};
            protocols_applied_by_pipeline = {};
            intervals_running = {};
            pipelines_applied = {};
            strain_to_real_pip = {};

            for (const index in strain_indexes) {
                strain_data[index]['Analysis'] = "";
            }

            callback({strains: strain_data, indexes: strain_indexes});

        },

        /*
        Get files from a user
        */
        get_user_files: (callback) => {
            pg_requests.get_user_files((response) => {
                callback(response);
            });
        },

        /*
        Show reports from single project table
         */
        showReports: (dt, scope, callback) => {

            let selectedRows = $.map(dt.rows(".selected").data(), (d) => {
                return d.strainID;
            });

            if (selectedRows.length === 0) {
                modalAlert("Please select one or more entries from the" +
                    " Project first.", "Select Strains", () => {
                });
            }
            else {
                //Send to reports Page
                loadReport(selectedRows, CURRENT_PROJECT_ID, scope);
            }
            callback();
        },

        /*
        Show reports from single project table
         */
        deleteFastq: (dt, scope, callback) => {

            let selectedRows = $.map(dt.rows(".selected").data(), (d) => {
                return d.strainID;
            });

            if (selectedRows.length === 0) {
                modalAlert("Please select one or more entries from the" +
                    " Project first.", "Select Strains", () => {
                });

                callback(false);
            }
            else {
                //Send to reports Page
                //loadReport(selectedRows, CURRENT_PROJECT_ID, scope);
                console.log("DELETE FASTQ");
                modalAlert("This option will delete the fastq files" +
                    " associated with the selected strains. Do you wish to" +
                    " continue?", "Delete Fastq", () => {

                    pg_requests.delete_fastq(selectedRows, (response, status) => {

                        if (status) {
                            modalAlert("The Fastq files for the selected" +
                                " strains have been removed. To run analyses" +
                                " again on those strains, reupload the files" +
                                " with the same name as the ones provided on" +
                                " upload time.", "Fastq" +
                                " files" +
                                " deleted", () => {
                            });
                        }
                        else {
                            modalAlert("An error as occurried when deleting the" +
                                " fastq files for the selected strains.", "Error",
                                () => {
                                });
                        }

                        callback(true);

                    });

                });

            }
        },

        /*
        Load strains from a file. Parses the file and trigger the add_new_strain function
        */
        load_strains_from_file: (input_element, separator, callback) => {

            console.log("LOADING FILE");

            const select_option = (select_id, i) => {
                return $('#' + select_id + ' select option[value="' + i + '"]').html();
            }

            const reader = new FileReader();

            let trigger_from_file_load = true;

            const used_headers = {
                "Primary-Identifier": [true, "Required", " Primary strain" +
                " identifier is required."],
                "Case-ID": [true, "Optional"],
                "Source": [true, "Required", " Source is required. Choose" +
                " between: Human; Food; Animal, cattle; Animal, poultry; Animal, swine; Animal, other; Environment; Water;"],
                "Sampling-Date": [true, "Optional"],
                "Sample-Received-Date": [true, "Optional"],
                "Owner": [true, "Required", "The Owner field is mandatory."],
                "Submitter": [true, "Required", " Strain submitter is" +
                " required. Must be the same as the user which is logged in."],
                "Location": [true, "Optional"],
                "Additional-Information": [true, "Optional"],
                "File_1": [true, "Required", " Fastq file 1 is required if" +
                " no accession number is provided." +
                " Must be available on your sftp files folder."],
                "File_2": [true, "Required", " Fastq file 2 is required if" +
                " no accession number is provided." +
                " Must be available on your sftp files folder."],
                "Accession": [true, "Required", " Accession number is" +
                " required if no Fastq files are specified."]
            };

            let total_headers = Object.keys(used_headers).length;
            let checked_headers = 0;


            reader.onload = (f) => {

                let lines = f.target.result.split('\n');
                let firstLine = true;
                let strains_object = {};
                let count_lines = 0;

                if (lines.length < 2) {

                    $("#overlayProjects").css({"display": "none"});
                    $("#overlayWorking").css({"display": "none"});
                    $("#single_project_controller_div").css({"display": "block"});
                    $("#submission_status").empty();

                    modalAlert("Uploaded file has less than two lines" +
                        " (headers and at least one strain).", "Warning", () => {

                    });
                    return;

                }

                let insufficient_headers = false;

                strains_object['body'] = [];

                let strains_with_problems = {};
                let mapped_headers = [];
                let hline_to_use;

                //parse file
                for (const i in lines) {

                    if (!lines[i].replace(/\s/g, "")) {
                        continue;
                    }

                    let line = lines[i].split(separator);
                    let array_to_use = [];

                    if (firstLine) {
                        line.map((l) => {
                            array_to_use.push(l);
                        });

                        for (const h in array_to_use) {
                            if (used_headers.hasOwnProperty(array_to_use[h]) && mapped_headers.indexOf(array_to_use[h]) < 0) {
                                checked_headers += 1;
                                mapped_headers.push(array_to_use[h]);
                            }
                        }

                        if (checked_headers < mapped_headers.length) {
                            insufficient_headers = true;
                        }

                        strains_object['headers'] = array_to_use;
                        firstLine = false;
                    }
                    else {
                        line.map(function (l) {
                            array_to_use.push(l);
                        });
                        strains_object['body'].push(array_to_use);
                    }
                }


                let lines_clone = strains_object['body'].slice(0);

                //load strains
                const add_to_database = () => {
                    let line_to_use = strains_object['body'].shift();
                    let has_files = 0;
                    let files_in_user_folder = 0;
                    let has_valid_source = false;
                    let identifier_s = "";
                    let no_identifier = true;
                    let no_case_id = true;
                    let bad_submitter = false;
                    let has_accession = false;
                    count_lines += 1;

                    let required_headers_missed = [];

                    $("#submission_status").html("Checking " + String(count_lines) + " out of " + String(lines_clone.length) + " lines...");

                    if (insufficient_headers === true) {

                        let toModal = "<p>Some of the required headers are" +
                            " missing from the uploaded file. There required headers are:</p><ul>";

                        for (const hh of Object.keys(used_headers)) {
                            toModal += "<li>" + hh + "</li>";
                        }
                        toModal += "</ul>";

                        $("#overlayProjects").css({"display": "none"});
                        $("#overlayWorking").css({"display": "none"});
                        $("#single_project_controller_div").css({"display": "block"});
                        $("#submission_status").empty();

                        modalAlert(toModal, "Information", () => {

                        });
                        return;
                    }

                    for (const x in line_to_use) {
                        hline_to_use = strains_object['headers'];

                        if (hline_to_use.length !== line_to_use.length) {

                            $("#overlayProjects").css({"display": "none"});
                            $("#overlayWorking").css({"display": "none"});
                            $("#single_project_controller_div").css({"display": "block"});
                            $("#submission_status").empty();

                            modalAlert("Uploaded file seems to be" +
                                " miss-formatted. Check if the number of" +
                                " headers and the rest of the file are the" +
                                " same.", "Warning", () => {

                            });
                            return;
                        }

                        let bline_to_use = line_to_use;

                        let headers_array = Object.keys(used_headers);

                        for (const header_to_check in headers_array) {

                            if (hline_to_use[x].indexOf(headers_array[header_to_check]) > -1) {

                                if (headers_array[header_to_check] === "Primary-Identifier") {
                                    if (bline_to_use[x] !== "") {
                                        no_identifier = false;
                                    }

                                    if (used_headers[headers_array[header_to_check]][1] === "Required" && bline_to_use[x] === "") {
                                        required_headers_missed.push([headers_array[header_to_check], used_headers[headers_array[header_to_check]][2]]);
                                    }

                                    identifier_s = String(bline_to_use[x]);

                                    if (!strains_with_problems.hasOwnProperty(identifier_s)) {
                                        strains_with_problems[identifier_s] = [];
                                    }
                                }

                                if (headers_array[header_to_check] === "Case-ID") {
                                    if (used_headers[headers_array[header_to_check]][1] === "Required" && bline_to_use[x] === "") {
                                        required_headers_missed.push([headers_array[header_to_check], used_headers[headers_array[header_to_check]][2]]);
                                    }
                                }

                                if (headers_array[header_to_check] === "Owner") {
                                    if (used_headers[headers_array[header_to_check]][1] === "Required" && bline_to_use[x] === "") {
                                        required_headers_missed.push([headers_array[header_to_check], used_headers[headers_array[header_to_check]][2]]);
                                    }
                                }

                                if (headers_array[header_to_check] === "Source") {

                                    $('#' + hline_to_use[x] + " option").filter((e, i) => {
                                        if ($(i).text().trim() === bline_to_use[x].trim()) {
                                            has_valid_source = true;
                                            return bline_to_use[x];
                                        }
                                    }).prop('selected', true);

                                    if (used_headers[headers_array[header_to_check]][1] === "Required" && bline_to_use[x] === "") {
                                        required_headers_missed.push([headers_array[header_to_check], used_headers[headers_array[header_to_check]][2]]);
                                    }
                                }

                                if (headers_array[header_to_check] === "Submitter") {
                                    if (bline_to_use[x] !== CURRENT_USER_NAME) {
                                        bad_submitter = true;
                                    }

                                    if (used_headers[headers_array[header_to_check]][1] === "Required" && bline_to_use[x] === "") {
                                        required_headers_missed.push([headers_array[header_to_check], used_headers[headers_array[header_to_check]][2]]);
                                    }

                                }

                                if (headers_array[header_to_check] === "Accession") {
                                    if (bline_to_use[x] !== "") {
                                        has_accession = true;
                                    }

                                    if (used_headers[headers_array[header_to_check]][1] === "Required" && bline_to_use[x] === "") {
                                        required_headers_missed.push([headers_array[header_to_check], used_headers[headers_array[header_to_check]][2]]);
                                    }
                                }

                                if (headers_array[header_to_check] === "File_1" || headers_array[header_to_check] === "File_2") {
                                    //check for files in user area
                                    has_files += 1;

                                    $('#' + hline_to_use[x] + " option").filter((e, i) => {
                                        if ($(i).text().trim() === bline_to_use[x].trim()) {
                                            files_in_user_folder += 1;
                                            return true;
                                        }
                                    }).prop('selected', true);

                                    //$('#'+hline_to_use[x]).trigger("change");

                                    if (used_headers[headers_array[header_to_check]][1] === "Required" && bline_to_use[x] === "") {
                                        required_headers_missed.push([headers_array[header_to_check], used_headers[headers_array[header_to_check]][2]]);
                                    }

                                }
                                else {
                                    let sel_element;

                                    if (hline_to_use === "Case-ID") {
                                        sel_element = "Food-Bug";
                                    }
                                    else {
                                        sel_element = hline_to_use[x];
                                    }
                                    try {
                                        $('#' + sel_element).val(bline_to_use[x] === "" ? "NA" : bline_to_use[x]);
                                    }
                                    catch(e){
                                        console.log("error");
                                    }

                                }


                            }

                        }
                    }

                    setTimeout(() => {

                        // Case uses fastq as input
                        if (files_in_user_folder === 2 && no_identifier !== true && bad_submitter !== true && has_valid_source === true && has_accession === false && required_headers_missed.length < 2) {
                            $('#change_type_to_file').trigger("click");
                            if (has_files === 2) {
                                $('#newstrainbuttonsubmit').trigger("submit");
                            }
                        }
                        // Case has accession number
                        else if ((files_in_user_folder === 0 && required_headers_missed.length === 2 || files_in_user_folder === 2 && required_headers_missed.length === 0) && no_identifier !== true && bad_submitter !== true && has_valid_source === true && has_accession === true) {

                            $('#change_type_to_file').trigger("click");
                            $('#newstrainbuttonsubmit').trigger("submit");

                        }
                        else {

                            let problems = 0;


                            if (has_valid_source === false) {

                                problems += 1;

                                strains_with_problems[identifier_s].push("<li>Select a valid Source (Human; Food; Animal, cattle; Animal, poultry; Animal, swine; Animal, other; Environment; Water).</li>");

                            }
                            if (bad_submitter === true) {

                                problems += 1;

                                strains_with_problems[identifier_s].push("<li>The submitter on the batch file must be the user you are logged in (" + CURRENT_USER_NAME + ").</li>");


                            }
                            if (no_identifier === true) {

                                problems += 1;

                                strains_with_problems[identifier_s].push("<li>One of the entries does not have a valid identifier.</li>");

                            }
                            if (required_headers_missed.length > 0) {

                                problems += 1;

                                let to_problems = "<li>Some required headers were" +
                                    " not specified: <ul>";

                                for (const r in required_headers_missed) {
                                    to_problems += "<li>" + required_headers_missed[r][0] + "-" + required_headers_missed[r][1] + "</li>";
                                }

                                to_problems += "</ul>";

                                strains_with_problems[identifier_s].push(to_problems);

                            }

                            if (files_in_user_folder < 2 && required_headers_missed.length === 0 && has_accession === true) {
                                problems += 1;

                                strains_with_problems[identifier_s].push("<li>One or more files for strain " + identifier_s + " are not available on the user folder.</li>");
                            }

                            if (files_in_user_folder < 2 && has_accession === false) {

                                problems += 1;

                                strains_with_problems[identifier_s].push("<li>One or more files for strain " + identifier_s + " are not available on the user folder.</li>");

                            }
                            if(problems == 0) {

                                strains_with_problems[identifier_s].push("<li>An unexpected error as occuried when adding the strain " + identifier_s + ".</li>");

                            }

                        }

                        if (strains_object['body'].length !== 0) add_to_database();
                        else {
                            showDoneImportModal();
                            hline_to_use.map((a) => {
                                $("#" + a).val("")
                            });
                            $('#Submitter').val(CURRENT_USER_NAME);
                        }



                    }, 500);

                }

                function showDoneImportModal() {
                    let toModal = "";

                    for (const strain of Object.keys(strains_with_problems)) {
                        if (strains_with_problems[strain].length !== 0) {
                            toModal += "<p>Strain <b>" + strain + "</b> problems:</p><ul>";
                            for (const reason of strains_with_problems[strain]) {
                                toModal += reason;
                            }
                            toModal += "</ul>";
                        }

                    }

                    if (toModal === "") {
                        toModal += "All strains were successfully processed!";
                    }

                    $("#overlayProjects").css({"display": "none"});
                    $("#overlayWorking").css({"display": "none"});
                    $("#single_project_controller_div").css({"display": "block"});
                    $("#submission_status").empty();

                    modalAlert(toModal, "Information", () => {

                    });
                }

                add_to_database();
            };

            $('#status_upload_from_file').empty();

            reader.readAsText(input_element.files[0]);
        }

    };

    return returned_functions;
};