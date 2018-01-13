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

var pipelinesByID = {}, strainID_pipeline = {}, strains_dict= {};

function Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope){

	pipelinesByID = {}
	strainID_pipeline = {}
	strains_dict = {}
	
	var project = {}, pipelinesByName = {}, strain_id_to_name = {}, pipelines_applied = {};
	var protocols_applied = {};
	var protocols_applied_by_pipeline = {};
	var tasks_to_buttons = {}, buttons_to_tasks = {};
	var dict_of_tasks_status = {};
	var process_to_workdir = {};
    var specie_name = "", species_id = "";
    var strains = [], pipelines = [], strains_headers = [], public_strains = [], files = [];
    var strainid_processes_buttons = {};
    var buttons_to_strain_names = {};
    var buttons_to_pipelines = {};
    var buttons_to_processes = {};
    var button_class_to_pipeline = {};
    var strain_to_real_pip = {};
    var pipelines_type_by_strain = {};
    intervals_running = {};
    strainName_to_tids = {};
    pipeline_status = {};
    jobs_to_parameters = {};
    var protocols_on_button = {};
    var current_status_wf_to_protocol = {};
    var process_id_to_workflow = {};
    var workflow_id_to_name = {};
    var global_counter_pipelines = 0;
    var strains_without_pip = {};
    var strains_new_without_pip = {};
    var workflowname_to_protocols = {};
    var strainNames_to_pipelinesNames = {};
    var pipelinesAndDependency = {};
    var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    var ngs_onto_requests = new ngs_onto_client(CURRENT_PROJECT_ID, $http);
    var objects_utils = new Objects_Utils();

    //Colors for the Running, Pending, Completed, Failed, and Warning of the workflows buttons
    status_dict = {'R': '#42c2f4', 'PD': '#f49542', 'COMPLETED': '#42f442', 'FAILED': '#f75454', 'WARNING': '#f9fb30', 'NEUTRAL': '#ffffff'}

    function modalAlert(text, callback){

    	$('#buttonSub').off("click");
    	$('#buttonCancelAlert').off("click");

    	$('#modalAlert .modal-body').empty();
    	$('#modalAlert .modal-body').append("<p>"+text+"</p>");

    	$('#buttonSub').one("click", function(){
    		$('#modalAlert').modal("hide");

    		setTimeout(function(){return callback()}, 400);
    	})

    	$('#modalAlert').modal("show");

    }

    function modalAlertAddSameFiles(text, callback){

    	$('#buttonSub').off("click");
    	$('#buttonCancelAlert').off("click");

    	$('#modalAlert .modal-body').empty();
    	$('#modalAlert .modal-body').append("<p>"+text+"</p>");

    	$('#buttonSub').one("click", function(){
    		//$('#buttonSub').off("click");
    		$('#modalAlert').modal("hide");
    		setTimeout(function(){return callback(true)}, 400);
    	})

    	$('#buttonCancelAlert').one("click", function(){
    		//$('#buttonCancelAlert').off("click");
    		$('#modalAlert').modal("hide");
    		setTimeout(function(){return callback(false)}, 400);
    	})

    	$('#modalAlert').modal("show");

    }

    /*
    Add a strain to a project
    */
    function add_strain_to_project(strain_name, callback){


		pg_requests.add_strain_to_project(strain_name, function(response){
			if(response.status == 200){

	            var has_same_files = false;
	            var message = "";
	            var message_to_add = "";

	            for(s in strains){
	            	md = JSON.parse(response.data.strain_metadata);
	            	if(md.File_1 == strains[s].File_1){
	            		has_same_files = true;
	            		message_to_add += "<b>"+strains[s].strainID + ":</b>" + md.File_1 + "<br>";

	            	}
	            	if(md.File_2 == strains[s].File_2){
	            		has_same_files = true;
	            		message_to_add += "<b>"+strains[s].strainID + ":</b>" + md.File_2 + "<br>";
	            	}
	            }

	            //Checks if files are already being used on other strains
	            if(has_same_files == true){
	            	message = "<p><b>Some files associated with this strain are already being used in this Project:</b></p><p>"+message_to_add+"</p><p><b>Do you want to proceed?</b></p>";
	            	modalAlertAddSameFiles(message, function(toadd){
	            		console.log(toadd);
	            		if(toadd == true) continue_adding();
	            		else{
	            			pg_requests.remove_strain_from_project(strain_name, function(response){
	            				objects_utils.destroyTable('strains_table');
	            				callback({ strains_headers: strains_headers, strains: strains, prevent:true});
	            			});
	            		}
	            	});
	            }
	            else continue_adding();

	            //Add strain to ngs_onto and add it to the strains dictionary
	            function continue_adding(){

	            	ngs_onto_requests.ngs_onto_request_add_strain_to_project(response.data.id, function(response){
						if(response.status == 200){

						}
						else console.log(response.statusText);
					});

					var data = response.data;
		            objects_utils.destroyTable('strains_table');

		            if (data.length != 0){
		                strains_headers = JSON.parse(data.fields).metadata_fields;
		                strains_headers.push('Analysis');
		                
		                var strain_data = JSON.parse(data.strain_metadata);
		                strain_data['Analysis'] = "";
		                var sd = {};
		                for (i in strains_headers){
		                    if(strain_data.hasOwnProperty(strains_headers[i])){
		                        sd[strains_headers[i]] = strain_data[strains_headers[i]];
		                    }
		                }
		                sd["strainID"] = data.strainID;
		                sd["FilesLocation"] = data.fq_location;
		                if(!strains_dict.hasOwnProperty($.trim(data.strainID))){
		                    strains_dict[$.trim(data.strainID)] = data.id;
		                }
		                strains.push(sd);

		                callback({ strains_headers: strains_headers, strains: strains});
		            
		            }
		 			else callback({ strains_headers: strains_headers, strains: strains});

		        }
			}
			else{
				modalAlert(response.data.message.split('.')[0]+'.', function(){});
        		callback({message:"Strain already on Project."})
			}
		});
	}

	/*
    Create a pipeline for a strain in case it doesnt exist
    */
	function create_pipeline(strain_Name, callback){
		strain_Name = $.trim(strain_Name);
		strain_id = strains_dict[strain_Name];
		var new_pipeline_id = '';

		function add_pip(strainid){
			pg_requests.add_pipeline(strainid, null, null, function(response){
				if(response.status == 201){
					new_pipeline_id = response.data.id;
					ngs_onto_requests.ngs_onto_request_create_pipeline(response.data.id, response.data.strain_id, function(response, strain_id){
						callback(strain_id, new_pipeline_id);
					});
				}
				else console.log(response.statusText);
			});
		}

		//Checks if pipeline alrasy exists for that strain on this project
		pg_requests.check_if_pipeline_exists(strain_id, null, function(response, strainid, not_used){
			if(response.status == 200){
				//For each pipeline applied on that strain, checks if the project associated is the CURRENT_PROJECT_ID
				for(x in response.data){
					if(response.data[x].project_id == CURRENT_PROJECT_ID && response.data[x].removed != 'true'){
						new_pipeline_id = response.data[x].id;						
						callback(strainid, response.data[x].id);
						return;
					}
				}
				add_pip(strainid);

			}
			else{
				add_pip(strainid);
			}
		});
	}

	/*
    Search for the workflows in a given pipeline and apply them to the strain
    */
	function get_and_apply_pipeline(total_pipelines, pipeline_id, strain_id, project_id, added_pipeline_id, callback){
		
		//Get the workflows IDs and the order that are applied from the ngs_onto
		ngs_onto_requests.ngs_onto_request_applied_pipelines(pipeline_id, project_id, strain_id, function(response, strain_id,p,q){
        	var response_length=response.data.length;
        	var counter = 0;

        	if(response.status == 200){
        		var appliedPipelines = [];
        		strain_to_real_pip[strain_id] = [];
        		protocol_counter = 0;

        		//Parse the results and construct the strain_to_real_pip object. (Object with all the processes in that pipeline)
	            for (w in response.data){
	                workflow_id = response.data[w].workflowURI.split('<')[1].split('>')[0].split('/');
	                workflow_id = workflow_id[workflow_id.length-1];
	                appliedPipelines.push(workflow_id);
	                counter += 1;
	                strainid_processes_buttons[strain_id][0][counter] = pipelinesByID[workflow_id];
	                parts = response.data[w].execStep.split('<')[1].split('>')[0].split('/');

	                
	                for(protocol in workflowname_to_protocols[workflow_id_to_name[workflow_id]]){
	                	protocol_counter += 1;
	                	var wf_url_parts = [];
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
	            objects_utils.apply_pipeline_to_strain('strains_table', strain_id_to_name[strain_id], appliedPipelines, pipelinesByID, pipelines_applied, pipelines_type_by_strain, workflowname_to_protocols, protocols_applied, protocols_applied_by_pipeline, strainNames_to_pipelinesNames, function(results){
	            	strains[results.strain_index] = results.strains[results.strain_index];
	            	for(x in results.workflow_ids){
	            		workflow_id_to_name[results.workflow_ids[x]] = results.workflow_names[x];
	            	}
	            	if (total_pipelines == global_counter_pipelines) callback({strains:strains});
	            });
        	}
        	else{
        		strain_to_real_pip[strain_id] = [];
        	}
        });
	}

	/*
    Checks for the job status in an interval of time
    */
	function periodic_check_job_status(job_ids, dict_of_tasks_status, strain_id, process_ids, pipeline_id, project_to_search){

		//Get the status and assign new colors to the buttons if required
		function get_status(job_ids, strain_id, process_ids, pipeline_id){

			//Put check to see if analysis tab is visible
			var process_positions = [];
			var procedure_names = [];

			job_ids = job_ids.split(",")

			for (job_id in job_ids){
				procedure_name = workflow_id_to_name[tasks_to_buttons[job_ids[job_id]].replace(/ /g, "_")];
				var parts_split = tasks_to_buttons[job_ids[job_id]].replace(/ /g, "_").split("_");
				var process_position = parts_split[parts_split.length-2];
				process_positions.push(process_position);
				procedure_names.push(procedure_name);
			}

			pg_requests.get_job_status(job_ids, procedure_names, strain_id, pipeline_id, process_positions, project_to_search, process_ids, function(response, this_job_id, pip_id){

				this_job_id = this_job_id.join();
				var has_failed = false;
				var counter_processes = 0;
				var prev_process_status = '';
				var is_running = false;
				var pending_jobs = 0;
				var protocols_on_workflow = [];
				var prev_workflow = process_id_to_workflow[strain_id + String(counter_processes+1)];

				var firstWorkflow = true;

				if(response.data != false && response.data.stdout != undefined){
					all_status_done = 0;
					//console.log(response.data);
					for(n in response.data.stdout){
						counter_processes += 1;
						task_id = response.data.stdout[n][0];
						status = response.data.stdout[n][1];
						var res_pos = n;
						if (task_id == "null") return;

						protocols_on_workflow.push(tasks_to_buttons[task_id]);

						dict_of_tasks_status[task_id] = status;
						current_job_status_color[tasks_to_buttons[task_id]] = status_dict[status];
						process_to_workdir[pip_id + "-" + response.data.process_ids[counter_processes-1]] = response.data.all_wrkdirs[counter_processes-1];

						$('#' + tasks_to_buttons[task_id].replace(/ /g, "_")).css({'background-color': status_dict[status]});

						prevtaskid = task_id;
						//Case the job as finished in any way, clear the interval
						if(status == 'COMPLETED' || status == 'WARNING' || status == 'FAILED') all_status_done += 1;
						if(status == 'FAILED') has_failed = true;
						if(status == "R") is_running = true;
						if(status == "PD") pending_jobs += 1;

						if(prev_process_status == 'FAILED'){
							dict_of_tasks_status[task_id] = 'NEUTRAL';
							current_job_status_color[tasks_to_buttons[task_id]] = status_dict['NEUTRAL'];
							$('#' + tasks_to_buttons[task_id].replace(/ /g, "_")).css({'background-color': status_dict['NEUTRAL']});
							all_status_done += 1;
							clearInterval(intervals_running[task_id]);
						}
						else prev_process_status = status;

						var protocol_pos = tasks_to_buttons[task_id].split("_").splice(-2)[0];
						
						if ((process_id_to_workflow[strain_id + String(parseInt(protocol_pos)+1)] !== undefined && prev_workflow !== process_id_to_workflow[strain_id + String(parseInt(protocol_pos)+1)]) || response.data.stdout.length === counter_processes){

							if(response.data.stdout.length == counter_processes){
								prev_workflow = process_id_to_workflow[strain_id + String(parseInt(protocol_pos))];
							}
							protocols_on_button[prev_workflow] = protocols_on_workflow;

							if(has_failed){
								$('#' + prev_workflow).css({'background-color': status_dict["FAILED"]});
								current_job_status_color[prev_workflow] = status_dict["FAILED"];
								dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "FAILED";
								$('#' + prev_workflow).parent().find(".neutral").css({"display":"none"});
							}
							else if(pending_jobs == protocols_on_workflow.length){
								$('#' + prev_workflow).css({'background-color': status_dict["PD"]});
								current_job_status_color[prev_workflow] = status_dict["PD"];
								dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "PD";
								$('#' + prev_workflow).parent().find(".neutral").css({"display":"none"});
							}
							else if(is_running || all_status_done < protocols_on_workflow.length && pending_jobs > 0){
								$('#' + prev_workflow).css({'background-color': status_dict["R"]});
								current_job_status_color[prev_workflow] = status_dict["R"];
								dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "R";
								$('#' + prev_workflow).parent().find(".neutral").css({"display":"none"});
							}
							else if(prev_process_status == "COMPLETED"){
								$('#' + prev_workflow).css({'background-color': status_dict["COMPLETED"]});
								current_job_status_color[prev_workflow] = status_dict["COMPLETED"];
								dict_of_tasks_status[buttons_to_tasks[prev_workflow]] = "COMPLETED";
								$('#' + prev_workflow).parent().find(".neutral").css({"display":"none"});
							}
							protocols_on_workflow = [];
							has_failed = false;
							pending_jobs = 0;
						}


						prev_workflow = process_id_to_workflow[strain_id + String(parseInt(protocol_pos))];

					}
					console.log(process_to_workdir);
					if(response.data.stdout.length == all_status_done) clearInterval(intervals_running[this_job_id]);

				}
				else{
					dict_of_tasks_status[job_id.split('_')[0]] = status;
					current_job_status_color[tasks_to_buttons[task_id]] = status_dict[status];
					$('#' + tasks_to_buttons[task_id].replace(/ /g, "_")).css({'background-color': status_dict[status]});
					clearInterval(intervals_running[this_job_id]);
				}
			})

		}
		prevtaskid = '';
		job_ids = job_ids.join();
		process_ids = process_ids.join();

		setTimeout(function(){get_status(job_ids, strain_id, process_ids, pipeline_id);}, 200);


		var periodic_check = setInterval(function(){ get_status(job_ids, strain_id, process_ids, pipeline_id); }, 50000);


		intervals_running[job_ids] = periodic_check;
		pipeline_status[job_ids] = get_status;
		jobs_to_parameters[job_ids] = [job_ids, strain_id, process_ids, pipeline_id];

	}

    var returned_functions = {

    	/*
	    Get the workflows available for that species
	    */
	    get_workflows: function(classifier, species_name, callback){

			pg_requests.get_workflows(classifier, species_name, function(response){
				if(response.status == 200){
					to_send = [];
					if (typeof response.data != 'string'){
		                for (i in response.data){
		                    pipelinesByName[response.data[i].name] = response.data[i].id;
		                    pipelinesByID[response.data[i].id] = response.data[i].name;
		                    pipelinesAndDependency[response.data[i].name] = response.data[i].dependency;
		                    if (response.data[i].availability == null || response.data[i].availability == "true"){
		                    	to_send.push(response.data[i]);
		                    }

		                    workflowname_to_protocols[response.data[i].name] = [];
		                    workflow_id_to_name[response.data[i].id] = response.data[i].name;

		                    ngs_onto_requests.ngs_onto_request_get_workflow(response.data[i].id, "", response.data[i].name, function(response, nn, workflow_name){
		            			protocol_data = response.data.reverse();
		            			
		            			for(x in protocol_data){
		            				index = protocol_data[x].index.split("^^")[0].split('"')[1]
		            				protoc = protocol_data[x].protocol.split("protocols/")[1].split('>')[0]
		            				workflowname_to_protocols[workflow_name].push([index,protoc]);
		            			}

		            			for(y in workflowname_to_protocols[workflow_name]){
		            				pg_requests.get_protocols_by_ids(workflowname_to_protocols[workflow_name][y][1], workflowname_to_protocols[workflow_name][y], function(response, workflow_entry){
		            					workflow_entry.push(response.data[0].name);
		            				})
		            			}

		            		})
		                }
		            }
		            callback(to_send);
				}
				else{
					callback(response.data);
				}

			});
		},

		/*
	    Get the strains for that project or the public strains
	    from_user = true ? Search only on user
	    from_user = false ? Search the public strains
	    */
		get_strains: function(from_user, callback){

			pg_requests.get_strains(CURRENT_SPECIES_ID, from_user, function(response){
				if(response.status == 200){
					var max_headers = 0;
		            var data = response.data;
		            objects_utils.destroyTable('public_strains_table');
		            var new_strains = [];

		            if (data.length != 0){

		                public_strains_headers = JSON.parse(data[0].fields).metadata_fields;
		                public_strains_headers.unshift("strainID");

		                for (i in data){

		                    strains_dict[$.trim(data[i].strainID)] = data[i].id;
		                    strain_id_to_name[data[i].id] = $.trim(data[i].strainID);

		                    var strain_data = JSON.parse(data[i].strain_metadata);
		                    strain_data["strainID"] = data[i].strainID;
		                    //strain_data["FilesLocation"] = data[i].fq_location;

		                    var sd = {};
		                    //Parse the metadata and add it to the public strains object
		                    for (j in public_strains_headers){
		                        if(strain_data.hasOwnProperty(public_strains_headers[j])){
		                            sd[public_strains_headers[j]] = strain_data[public_strains_headers[j]];
		                        }
		                    }
		                    sd["id"] = data[i].id;
		                    sd["FilesLocation"] = data[i].fq_location;
		                    new_strains.push(sd);
		                }
		                public_strains = new_strains;
		                
		            }
		            callback({ public_strains_headers: public_strains_headers, public_strains: public_strains});
				}
				else{
					callback({ public_strains_headers: [], public_strains: []});
				}


			}),


			
			$('#fromdbbutton').click(function(){
				var table = $("#public_strains_table").DataTable();
				setTimeout(function(){
					table.draw();
				}, 400);
			});
		},

		/*
	    Get the strains for that project
	    */
		get_project_strains: function(callback){

			pg_requests.get_project_strains(function(response){
				if(response.status == 200){
					var max_headers = 0;
		            var data = response.data;
		            objects_utils.destroyTable('strains_table');
		            var add_strains = [];
		            if (data.length != 0){

		                strains_headers = JSON.parse(data[0].fields).metadata_fields;
		                strains_headers.unshift("strainID");
		                strains_headers.push('Analysis');
		                strains_headers.push('FilesLocation');
		                
		                for (i in data){

		                    var strain_data = JSON.parse(data[i].strain_metadata);
		                    strain_data["strainID"] = data[i].strainID;
		                    strain_data['Analysis'] = "";
		                    strain_data['FilesLocation'] = data[i].fq_location;
		                    var sd = {};
		                    for (j in strains_headers){
		                        if(strain_data.hasOwnProperty(strains_headers[j])){
		                            sd[strains_headers[j]] = strain_data[strains_headers[j]];
		                        }
		                    }
		                    if(!strains_dict.hasOwnProperty($.trim(data[i].strainID))){
		                        strains_dict[$.trim(data[i].strainID)] = data[i].id;
		                    }
		                    add_strains.push(sd);
		                }
		                strains = add_strains;
		                
		            }
		            callback({ strains: strains, strains_headers: strains_headers});
				}
				else callback({strains: [], strains_headers: []});
			});
		},

		/*
	    Get the pipelines applied to a given strain
	    */
		get_applied_pipelines: function(strainid, callback){

			if (strainid != null) strainid = strains_dict[strainid];
			//Get the pipeline ids for that strain
			pg_requests.get_applied_pipelines(strainid, CURRENT_PROJECT_ID, function(response, strainid){
				var total_pipelines = response.data.length;
				if(response.data.hasOwnProperty("message") == true) return callback({strains: "no_pipelines"});
				global_counter_pipelines = 0;
				if (response.status == 200){
					for (i in response.data){
						if(response.data[i].parent_pipeline_id != null){
			                strainid_processes_buttons[response.data[i].strain_id] = [{}];
			                ppipid = response.data[i].parent_pipeline_id;
			                pipid = response.data[i].id;
			                pprojid = response.data[i].parent_project_id;
			                sid = response.data[i].strain_id;
			                //Check if exist workflows on pipeline
			                ngs_onto_requests.ngs_onto_request_applied_pipelines_with_parent(ppipid, pprojid, sid, pipid, function(response, ppipid, pprojid, sid, pipid){

			                	if(response.data.length == 0){
			                		pipid = pipid;
			                		strainID_pipeline[sid] = ppipid;
			                	}
			                	else{
			                		ppipid = pipid;
			                		pprojid = CURRENT_PROJECT_ID;
			                		strainID_pipeline[sid] = ppipid;
			                	}
			                	get_and_apply_pipeline(total_pipelines, ppipid, sid, pprojid, pipid, function(response){
				                	callback(response);
				                })
			                });			                
						}
						else{
							strainID_pipeline[response.data[i].strain_id] = response.data[i].id;
			                strainid_processes_buttons[response.data[i].strain_id] = [{}];
			                get_and_apply_pipeline(total_pipelines, response.data[i].id, response.data[i].strain_id, CURRENT_PROJECT_ID, null, function(response){
			                	callback(response);
			                })
						}
		            	
		            }
		        }
		        else{
		        	callback({strains:[]});
		        }
			});
		},

		/*
	    Get the pipelines applied to a given strain
	    */
		get_public_strain_applied_pipelines: function(strainids, callback){

			var processed_strains = 0;
			var total_strains = strainids.length;
			var total_wf = {};
			var total_pips = {};

			for(strainid in strainids){
				if (strainid != null) strain_id = strains_dict[strainids[strainid]];

				total_wf[strainids[strainid]] = [];
				total_pips[strainids[strainid]] = [];

				//Get the pipeline ids
				pg_requests.get_applied_pipelines(strain_id, CURRENT_PROJECT_ID, function(response, strain_id){
					var available_workflows = [];
					var workflow_ids_added = {};
					var pipelines_ids = [];

					if (response.status == 200){
						var total_pip = response.data.length;
						var processed_pip = 0;

						for(pipeline in response.data){

							if(response.data[pipeline].project_id == null || response.data[pipeline].parent_pipeline_id != null){
								processed_pip += 1;
								if(processed_pip == total_pip) {
									processed_strains += 1;
					            	for(pipeline in available_workflows){
					            		final_pips = []
										if(workflow_ids_added[available_workflows[pipeline].join()] != true){
					            			workflow_ids_added[available_workflows[pipeline].join()] = true;
					            			for(workflow in available_workflows[pipeline]){
												final_pips.push(pipelinesByID[available_workflows[pipeline][workflow]]);
											}
											total_pips[strain_id_to_name[strain_id]].push(pipelines_ids[pipeline]);
											total_wf[strain_id_to_name[strain_id]].push(final_pips);
					            		}
									}
									if(total_strains == processed_strains) callback(total_wf, strainids, total_pips, strains_dict);
					            }
							}
							else{
								var pipeline_id = response.data[pipeline].id;
								var projectid = response.data[pipeline].project_id;
								ngs_onto_requests.ngs_onto_request_applied_pipelines(pipeline_id, projectid, strain_id, function(response, strain_id, pip_id, projid){
									pipelines_ids.push([pip_id, projid]);
									var appliedWorkflows = [];
									processed_pip += 1;

						            for (w in response.data){
						            	var wf_url_parts = [];
						                workflow_id = response.data[w].workflowURI.split('<')[1].split('>')[0].split('/');
						                workflow_id = workflow_id[workflow_id.length-1];
						                appliedWorkflows.push(workflow_id);

										parts = response.data[w].execStep.split('<')[1].split('>')[0].split('/');
						                //project
						                wf_url_parts.push(parts[6]);
						                //pipeline
						                wf_url_parts.push(parts[8]);
						                //process
						                wf_url_parts.push(parts[10]);
						            }		
						            available_workflows.push(appliedWorkflows);
						            workflow_ids_added[appliedWorkflows.join()] = false;

						            if(processed_pip == total_pip) {
						            	processed_strains += 1;
						            	for(pipeline in available_workflows){
						            		final_pips = []
						            		if(workflow_ids_added[available_workflows[pipeline].join()] != true){
						            			workflow_ids_added[available_workflows[pipeline].join()] = true;
						            			for(workflow in available_workflows[pipeline]){
													final_pips.push(pipelinesByID[available_workflows[pipeline][workflow]]);
												}
												total_pips[strain_id_to_name[strain_id]].push(pipelines_ids[pipeline]);
												total_wf[strain_id_to_name[strain_id]].push(final_pips);
						            		}
										}

										if(total_strains == processed_strains) callback(total_wf, strainids, total_pips, strains_dict);
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
		get_and_apply_pipeline: function(total_pipelines, pipeline_id, strain_id, project_id, callback){

			strainID_pipeline[strain_id] = pipeline_id;
		    strainid_processes_buttons[strain_id] = [{}];

		    global_counter_pipelines = 0;

		    if (project_id != CURRENT_PROJECT_ID){
				pg_requests.add_pipeline(strain_id, pipeline_id, project_id, function(response){
					var new_pipeline_id = response.data.id;
					var parent_project_id = response.data.parent_project_id;
					var parent_pipeline_id = response.data.parent_pipeline_id;
					
					ngs_onto_requests.ngs_onto_request_create_pipeline(response.data.id, response.data.strain_id, function(response, strain_id){
						get_and_apply_pipeline(total_pipelines, pipeline_id, strain_id, project_id, new_pipeline_id, function(){
							callback();
						})
					});
				})
			}
			else{
				pg_requests.change_pipeline_from_project(strain_id, false, "", function(response, strain_id, pipeline_s){
					get_and_apply_pipeline(total_pipelines, pipeline_id, strain_id, project_id, null, function(){
						callback();
					})
				})
			}
		},

		/*
	    Get files from the user
	    */
		get_uploaded_files: function(callback){

			pg_requests.get_uploaded_files(function(response){
				if (response.status == 200){
					callback(response.data.files);
				}
				else console.log(response.statusText);
			});

		},

		/*
	    Add a strain from the database
	    */
		add_database_strains: function(strain_names, callback){

		    if(strain_names.length > 0){
		        objects_utils.destroyTable('strains_table');
		        for(i in strain_names){
		            add_strain_to_project(strain_id_to_name[strain_names[i]], function(results){
		            	callback(results);
		            });
		        }
		    }
		    else modalAlert('Please select some strains first.', function(){});
		},

		/*
	    Add a new strain
	    */
		add_new_strain: function(is_from_file, callback){

			if($("#fromfilebutton").hasClass("active")) $('#add_pip_from_fileSubmit').css({"display":"block"});
			if($("#fromfilebutton").hasClass("active")) $('#add_new_pip_from_fileSubmit').css({"display":"block"});

			pg_requests.add_new_strain(function(response){
				if(response.status == 200 || response.status == 201){
					
					var to_append = '<div class="row">';
					strain_id_to_name[response.data.id] = response.data.strainID;
					strains_new_without_pip[response.data.id] = [response.data.id, strain_id_to_name[response.data.id]];
					
					if(response.status == 200){
						if(response.data.file_1 != "" || response.data.file_2 != ""){
							to_append += '<div class="col-md-8"><p><b>Strain ' + response.data.strainID + '</b></p>';
							to_append += '<p>Files already mapped to strain!</p>';
							if(response.data.file_1 != "") to_append += '<p>File 1: '+response.data.file_1+'</p>';
							if(response.data.file_2 != "") to_append += '<p>File 2: '+response.data.file_2+'</p>';
							to_append += '</div><div class="col-md-4" id="file_col_'+response.data.strainID.replace(/ /g,"_")+'"><button strain_name="'+response.data.strainID+'" class="btn btn-md btn-primary" onclick="checkPipelineFromFile(this)">Check Pipelines</button>';
							to_append += '</div>';
							to_append += '</div><div class="row"><hr size="30">';
							
							if(is_from_file == true) $('#status_upload_from_file').append(to_append);
							else modalAlert(to_append, function(){});
						}
						
						pg_requests.get_project_strains_2(response.data.id, false, function(response, strain_id, is_there){
							onproject = "";
							for(l in response.data){
								if(response.data[l].id == strain_id){
									is_there = true;
									onproject = response.data[l].strainID;
									break;
								}
							}
							//Case strain already on project
							if(is_there){
								already_there = true;
								$('#file_col_'+onproject.replace(/ /g,"_")).empty();
								$('#file_col_'+onproject.replace(/ /g,"_")).append("Strain already on project");
								callback({"already_there":already_there}, is_from_file);
							}
							else{
								//Check if that strain already has some pipelines applied to it. Case it isnt really new.
								pg_requests.get_applied_pipelines(strain_id, CURRENT_PROJECT_ID, function(response, strain_id){
							
									no_pip = true;

									for(f in response.data){
										if(response.data[f].project_id != null) no_pip = false;
										
										if(response.data[f].project_id == CURRENT_PROJECT_ID){
											onproject = strain_id_to_name[strain_id];
											if(response.data[f].removed != "true"){
												add_strain_to_project(strain_id_to_name[strain_id], function(results){
													results.already_there = true;
													$('#file_col_'+onproject.replace(/ /g,"_")).empty();
													$('#file_col_'+onproject.replace(/ /g,"_")).append("Strain already on project");
								        			callback(results, is_from_file);
									            });
											}
											//break;
										}
									}
									if(no_pip){
										$('#file_col_'+strain_id_to_name[strain_id].replace(/ /g,"_")).empty();
										$('#file_col_'+strain_id_to_name[strain_id].replace(/ /g,"_")).append('<p>No pipelines available for this strain.</p><button strain_name="'+strain_id_to_name[strain_id]+'" class="btn btn-md btn-default" onclick="newPipelineFromFile(this)">New Pipeline</button>');
										strains_without_pip[strain_id] = [strain_id, strain_id_to_name[strain_id]];
									}
								});

							}
						});
					}
					else if(response.status == 201){
						//Case strain is really new
						add_strain_to_project(response.data.strainID, function(results){
							to_append += '<div class="col-md-8"><p><b>Strain ' + response.data.strainID + '</b></p>';
							to_append += '<p>Strain added to the Project!</p>';
							to_append += '</div></div><hr size="30">';
							if(is_from_file == true) $('#status_upload_from_file').append(to_append);
							else modalAlert(to_append, function(){});
		        			callback(results, is_from_file);
			            });
					}
				}
				else{
					modalAlert("An error as occurried when creating a new strain.", function(){});
				}
			});
		},

		/*
	    Add strain to project
	    */
		add_strain_to_project: function(strain_name, callback){
			add_strain_to_project(strain_name, function(results){
				callback(results, strain_name);
            });
		},

		/*
	    Update a strain DEPREACTED?
	    */
		update_strain: function(strain_id, key, value, callback){
			pg_requests.update_strain(strain_id, key, value, function(response){
				callback(response);
			});
		},

		/*
	    Update strain metadata
	    */
		update_metadata: function(strain_id, callback){
			pg_requests.update_metadata(strain_id, function(response){
				callback(response);
			});
		},

		/*
		Get nextflow logs
		*/
		getNextflowLog: function(filename, pipeline_id, project_id, callback){
			console.log(filename);
			console.log(pipeline_id);
			pg_requests.get_nextflow_log(filename, pipeline_id, project_id, function(response){
				callback(response);
			});
		},

		/*
	    Get strains without pipeline applied
	    */
		get_no_pip_strains: function(callback){
			return strains_without_pip;
		},

		/*
	    Get strain ids added by file
	    */
		get_added_by_file_strains: function(callback){
			return strains_new_without_pip;
		},

		/*
	    Remove strains from a project
	    */
		remove_strains_from_project: function(used_strains, callback){

			var strain_names = $.map($('#strains_table').DataTable().rows('.selected').data(), function(item){ return item['strainID']; });
		    var strain_indexes = $.map($('#strains_table').DataTable().rows('.selected').indexes(), function(index){ return index; });

		    if (strain_indexes.length == 0) return callback("no_select");
		    
		    strain_indexes.map(function(d){ 
		    	delete pipelines_applied[d]; 
		    	delete strainNames_to_pipelinesNames[d];
				delete protocols_applied[d];
		    });

		    var to_use = used_strains;
		    var number_of_strains = strain_names.length;
		    count_removed = 0;

		    if(strain_names.length > 0){

		    	modalAlert("By accepting this option you are removing the strain/strains from the project. Do you really want proceed?", function(){

			    	while(strain_names.length != 0){

				        strain_name = strain_names.pop();
				        pg_requests.remove_strain_from_project(strain_name, function(response){
				        	count_removed += 1;
				        	if(response.status == 200){
				        		var new_strains = [];
				                to_use.map(function(d){
				                    if (d.strainID != response.data.strainID) new_strains.push(d);
				                    else{
				                    	pg_requests.check_if_pipeline_exists(strains_dict[response.data.strainID], response.data.strainID, function(response, strainid, strainID){
				                    		if(response.status == 200){

				                    			if(response.data.length > 0 && Object.keys(pipelines_applied).length != 0 && pipelines_applied[strainID].length > 0){
				                    				modalAlert("The applied pipeline is being used in other projects. A so, the strain will be removed from the project but the pipeline will still be available.", function(){
					                    				pg_requests.change_pipeline_from_project(strainid, true, "", function(response, strainid){
						                    			});
					                    			});
				                    			}
				                    			else{
				                    				pg_requests.change_pipeline_from_project(strainid, true, "", function(response, strainid){
					                    			});
				                    			}
				                    		}
				                    	});
				                    }
				                })
				                
				                to_use = new_strains;
				                
				                if(count_removed == number_of_strains){
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
		apply_workflow: function(mode, type_proc, callback){

			var table = $('#strains_table').DataTable();

			//Get the selected strain indexes on the table
		    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
		        return index;
		    });

		    //Get the selected strain data on the table
		    var strain_data = $.map(table.rows('.selected').data(), function(item){
		        return item;
		    });
		    if (strain_data.length == 0) modalAlert('Select strains to apply procedures.', function(){});

		    var counter = -1;
		    var workflow_names = [];
	        var workflowids = [];

	        var proc_value = "";
	    	workflow_already_applied = false;
	        
	        if(type_proc == 'lab_protocol') proc_value = $( "#classifier_selector option:selected" ).val();
	        else if (type_proc == 'analysis_protocol') proc_value = $( "#pipeline_selector option:selected" ).val();
		    
		    needs_dependency = false;
	        //Checks the last protocol name and creates the buttons to be applied to the strain
		    for(i in strain_data){
		        var toAdd_analysis = '';
		        var toAdd_lab_protocols = '';
		        var toAdd_Protocols = '';
		        counter++;
		        var pip_start_id = 0;
		        var proc_start_id = 0;
		        var local_workflow_applied = false;
		        var last_proc_name = proc_value;
		        if(pipelines_applied[strain_data[counter]['strainID']] != undefined && pipelines_applied[strain_data[counter]['strainID']].length != 0){
		        	button_name_parts_to_use = pipelines_applied[strain_data[counter]['strainID']][pipelines_applied[strain_data[counter]['strainID']].length-1].split("id")[1].split('"')[1].split("_")
		        	split_protocols_by_buttons = protocols_applied[strain_data[counter]['strainID']][protocols_applied[strain_data[counter]['strainID']].length-1].split("<button")

		        	button_protocols_parts_to_use = split_protocols_by_buttons[split_protocols_by_buttons.length-1].split("id")[1].split('"')[1].split("_")
		        	pip_start_id = parseInt(button_name_parts_to_use[button_name_parts_to_use.length-2]);
		        	proc_start_id = parseInt(button_protocols_parts_to_use[button_protocols_parts_to_use.length-2]);
		        	last_proc_name = pipelines_type_by_strain[strain_data[counter]['strainID']][1][pip_start_id-1].split('<li class="')[1].split("&&")[0]
		        }

		        if(!strainNames_to_pipelinesNames.hasOwnProperty(strain_data[counter]['strainID'])){
		        	strainNames_to_pipelinesNames[strain_data[counter]['strainID']] = [];
		        }

		        if( pipelinesAndDependency[proc_value] != "None" && pipelinesAndDependency[proc_value] != null && !strainNames_to_pipelinesNames[strain_data[counter]['strainID']].includes(pipelinesAndDependency[proc_value])){
		        	needs_dependency = true;
		        	if(counter == strain_data.length-1){
			        	if(needs_dependency) message = 'Procedures applied but some lack dependencies.';
			        	else message = 'Procedures applied.';
			    		modalAlert(message, function(){});
			        	callback({strains: strain_data, indexes:selected_indexes, workflow_names:workflow_names, workflow_ids: workflowids});
			        	return;
			        }
		        	else continue;
		        }
		        else{
		        	strainNames_to_pipelinesNames[strain_data[counter]['strainID']].push(proc_value);
		        }

		        if(mode == 'new'){

		        	//ALLOW ONLY THE LAST WORKFLOW TO BE REMOVED
		        	class_of_button_remove_to_replace = last_proc_name+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id)+ '_' + CURRENT_PROJECT_ID+'&&&';
		        	class_of_button_remove_to_replace = 'class="neutral '+class_of_button_remove_to_replace+'" onclick="removeAnalysis(this)'
		        	if(pip_start_id > 0){
		        		pipelines_type_by_strain[strain_data[counter]['strainID']][1][pip_start_id-1] = pipelines_type_by_strain[strain_data[counter]['strainID']][1][pip_start_id-1].replace('style="display:block;" ' + class_of_button_remove_to_replace, 'style="display:none;" ' + class_of_button_remove_to_replace)
		        	}

	        		buttonselectedPipeline = '<div class="dropdown" style="float:left;">'+
	        		'<button class="btn btn-sm btn-default dropdown-toggle workflows_child" shown_child="false" strainID="'+strain_data[counter]['strainID']+'" name="'+proc_value+'" id="'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_workflow_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'"><i class="fa fa-arrow-down"></i>'+ proc_value + '</button>'+
						'<ul class="dropdown-menu" id="'+strain_data[counter]['strainID']+'_'+proc_value+'" style="position:relative;float:right;">'+
					'<li class="'+proc_value+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_workflow_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesOutputs(this)"><a href="#">Get Results</a></li>'+
					'<li class="'+proc_value+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_workflow_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesLog(this)"><a href="#">Get Run Log</a></li>'+
					'<li style="display:block;" class="neutral '+proc_value+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_workflow_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="removeAnalysis(this)"><a href="#">Remove</a></li></ul></div>';

		        	just_button = '<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'">'+ proc_value + '</button>';

		        	protocol_buttons = "";
		        	var new_proc_count = 0;
			        for(pt in workflowname_to_protocols[proc_value]){
			        	new_proc_count += 1;
			        	protocol_buttons += '<div class="dropdown" style="float:left;">'+
			        	'<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_protocol_"+String(proc_start_id + new_proc_count)+ '_' + CURRENT_PROJECT_ID+'">'+ workflowname_to_protocols[proc_value][pt][2] + '</button>'+
			        	'<ul class="dropdown-menu" id="'+strain_data[counter]['strainID']+'_'+workflowname_to_protocols[proc_value][pt][2]+'" style="position:relative;float:right;">'+
				        	'<li class="'+workflowname_to_protocols[proc_value][pt][2]+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_protocol_"+String(proc_start_id + new_proc_count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesOutputs(this)"><a href="#">Get Results</a></li>'+
    						'<li class="'+workflowname_to_protocols[proc_value][pt][2]+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_protocol_"+String(proc_start_id + new_proc_count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesLog(this)"><a href="#">Get Run Log</a></li></ul></div>';
			        
    					workflow_counter = String(pip_start_id + 1);
						protoc_counter = String(proc_start_id + new_proc_count);
    					process_id_to_workflow[strain_data[counter]['strainID'] + protoc_counter] = strain_data[counter]['strainID'] + "_workflow_" + workflow_counter + "_" + CURRENT_PROJECT_ID;
			        }


			        if(!pipelines_applied.hasOwnProperty(strain_data[counter]['strainID'])){
			        	pipelines_type_by_strain[strain_data[counter]['strainID']] = [[],[],[]];
			            pipelines_applied[strain_data[counter]['strainID']] = [];
			            protocols_applied[strain_data[counter]['strainID']] = [];
			        }
			        //ALLOW MULTIPLE EQUAL WORKFLOWS
		        	try{
			        	workflow_id_to_name[strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pipelines_applied[strain_data[counter]['strainID']].length + 1) + '_' + CURRENT_PROJECT_ID] = proc_value;
			        }
			        catch(e){
			        	workflow_id_to_name[strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(1)+ '_' + CURRENT_PROJECT_ID] = proc_value;
			        }

			        pipelines_applied[strain_data[counter]['strainID']].push(buttonselectedPipeline);
			        protocols_applied[strain_data[counter]['strainID']].push(protocol_buttons);

			        if(!protocols_applied_by_pipeline.hasOwnProperty(strain_data[counter]['strainID'])){
			        	protocols_applied_by_pipeline[strain_data[counter]['strainID']] = {};
			        }


			        if(protocols_applied_by_pipeline[strain_data[counter]['strainID']].hasOwnProperty(proc_value)){
			        	workflow_already_applied = true;
			        	local_workflow_applied = true;
			        }
			        else{

			        	if(!protocols_applied_by_pipeline[strain_data[counter]['strainID']].hasOwnProperty(proc_value)){
				        	protocols_applied_by_pipeline[strain_data[counter]['strainID']][proc_value] = [];
				        }
				        console.log(proc_value);
				        console.log(protocols_applied_by_pipeline[strain_data[counter]['strainID']]);

			        	protocols_applied_by_pipeline[strain_data[counter]['strainID']][proc_value].push(protocol_buttons);
		        	
			        	if(type_proc == 'lab_protocol') pipelines_type_by_strain[strain_data[counter]['strainID']][0].push(buttonselectedPipeline.replace("&&&", "&&protocol"));
			        	else if (type_proc == 'analysis_protocol'){
			        		pipelines_type_by_strain[strain_data[counter]['strainID']][1].push(buttonselectedPipeline.replace("&&&", ""));
			        		pipelines_type_by_strain[strain_data[counter]['strainID']][2].push(protocol_buttons.replace("&&&", ""));
			        	}
			        }


			        for(j in pipelines_type_by_strain[strain_data[counter]['strainID']]){
			        	for(o in pipelines_type_by_strain[strain_data[counter]['strainID']][j]){
			        		if(j == 0) toAdd_lab_protocols += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
	        				else if (j==1) toAdd_analysis += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
			        		else toAdd_Protocols = pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
			        	}
			        }
			        
			    }
		        else if(mode=='same'){
		        	for(j in pipelines_type_by_strain[strain_data[counter]['strainID']]){
			        	for(o in pipelines_type_by_strain[strain_data[counter]['strainID']][j]){
			        		if(j == 0) toAdd_lab_protocols += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
	        				else if (j==1) toAdd_analysis += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
	        				else toAdd_Protocols += pipelines_type_by_strain[strain_data[counter]['strainID']][j][o];
			        	}
			        }
		        }

		        //console.log(toAdd_analysis);
		        if(!strain_data[i].hasOwnProperty('protocols')) strain_data[i]['protocols'] = {};
		        

		        if(type_proc == 'lab_protocol' && local_workflow_applied != true) strain_data[i]['lab_protocols'] = toAdd_lab_protocols;
	        	else if (type_proc == 'analysis_protocol' && local_workflow_applied != true){
	        		strain_data[i]['Analysis'] = toAdd_analysis;
	        		strain_data[i]['protocols'][proc_value] = toAdd_Protocols;
	        	}

		        if(counter == strain_data.length-1){
		        	if(needs_dependency) message = 'Procedures applied but some lack dependencies.';
		        	else if(workflow_already_applied) message = 'Workflow already applied to some strains.';
		        	else message = 'Procedures applied.';
		    		modalAlert(message, function(){});
		        	callback({strains: strain_data, indexes:selected_indexes, workflow_names:workflow_names, workflow_ids: workflowids});
		        }
		    }
		},

		/*
	    Check if there are jobs pending or running
	    */
		check_if_pending: function(callback){

			var table = $('#strains_table').DataTable();

		    var strain_names = $.map($('#strains_table').DataTable().rows('.selected').data(), function(item){ return item['strainID']; });
		    
		    if(strain_names.length == 0){
		    	return callback("no_selected");
		    }
		    else{
		    	count_passed = 0;
			    has_pending = false;
			    for(sn in strain_names){
			    	if(pipelines_applied.hasOwnProperty(strain_names[sn])){
			    		pipelines_applied[strain_names[sn]].map(function(d, x){
			                workflowName = d.split('button')[1].split('>')[1].split('</')[0];
			                button_n = d.split("id")[1].split('"')[1];

			                if(buttons_to_tasks[button_n] != undefined){
			                	if(dict_of_tasks_status[buttons_to_tasks[button_n]] == "PD" || dict_of_tasks_status[buttons_to_tasks[button_n]] == "R"){
			                		has_pending = true;
			                	}
			                }
			            });
			            count_passed +=1;
			            if(count_passed == strain_names.length) return callback(has_pending);
			    	}
			    	else{
			    		count_passed += 1;
			    		if(count_passed == strain_names.length) return callback(has_pending);
			    	}
			    }
		    }
		},

		/*
	    Save pipelines if required
	    */
		save_pipelines: function(callback){

			var table = $('#strains_table').DataTable();

		    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
		        return index;
		    });

		    //CASE THERE ARE NO STRAINS SELECTED
		    if(selected_indexes.length == 0){
		    	modalAlert('Please select at least one strain before running any analysis.', function(){});
		    	return callback("no_select");
		    }
		    
		    index_length = selected_indexes.length;
		    count_finished = 0;
		    pipeline_ids = [];

		    for(i in selected_indexes){
		        create_pipeline(strains[selected_indexes[i]].strainID, function(strain_id, pipeline_id){
		        	strainID_pipeline[strain_id] = pipeline_id;
		        	pipeline_ids.push(pipeline_id);

		        	if(pipelines_applied.hasOwnProperty(strain_id_to_name[strain_id])){
		        		pipeline_to_use = pipeline_ids.shift();
		        		var steps = [];
		        		var workflow_ids = [];
		        		var total_workflows = pipelines_applied[strain_id_to_name[strain_id]].length;
		        		var counter_global = 0;
		        		var counter_steps = 0;
		        		var to_add = false;
		        		var task_failed = false;
		        		pipelines_applied[strain_id_to_name[strain_id]].map(function(d, x){
			                workflowName = d.split('button')[1].split('</i>')[1].split('</')[0];
			                button_class_to_pipeline[d.split('<li class="')[1].split('"')[0]] = pipeline_id
			                button_n = d.split("id")[1].split('"')[1];
			                console.log(x);
			                
			                if(buttons_to_tasks[button_n] == undefined){
			                	buttons_to_tasks[button_n] = "buttonworkflow_" + pipeline_id + "_" + String(x+1);
			                	workflow_ids.push(pipelinesByName[workflowName]);
			                	counter_steps += 1;
			                	steps.push(counter_steps);
			        		}
			        		else counter_steps += 1;

			        		counter_global += 1;

			                if (total_workflows == counter_global){
			                	if(workflow_ids.length == 0){
			                		return callback(false);
			                	}
			                	//In case of all workflows are new in the pipeline, update the pipeline to remove the parent
			                	if(counter_steps == pipelines_applied[strain_id_to_name[strain_id]].length){
			                		pg_requests.change_pipeline_from_project(strain_id, 'remove_parent', pipeline_to_use, function(response, strain_id, pipeline_to_use){
			                			//Say that this process belongs to this project
			                			if(strain_to_real_pip.hasOwnProperty(strain_id)){
			                				strain_to_real_pip[strain_id].map(function(d){
				                				d[0] = CURRENT_PROJECT_ID;
				                			});
			                			}
			                			if(pipelines_type_by_strain[strain_id_to_name[strain_id]][3] != undefined) pipelines_type_by_strain[strain_id_to_name[strain_id]][3] = undefined;
			                			
			                			console.log(workflow_ids, steps);
			                			ngs_onto_requests.ngs_onto_request_save_pipeline(pipeline_to_use, workflow_ids, steps, function(response){
						                	if(response.status == 200){
						                	}
						                	else console.log(response.statusText);

						                	count_finished += 1;

						                	if(count_finished == index_length){
								        		callback(true);
								        	}
						                });
			                		});
			                	}
			                	else{
			                		console.log(workflow_ids, steps);
			                		ngs_onto_requests.ngs_onto_request_save_pipeline(pipeline_to_use, workflow_ids, steps, function(response){
					                	if(response.status == 200){
					                	}
					                	else console.log(response.statusText);
					                	count_finished += 1;
					                	if(count_finished == index_length){
							        		callback(true);
							        	}
					                });
			                	}
			                }
		            	});
		        	}
		        });

		    }
		},

		/*
	    Run pipelines
	    */
		run_pipelines: function(){

			var table = $('#strains_table').DataTable();

		    var strain_names = $.map(table.rows('.selected').data(), function(item){
		        return item['strainID'];
		    });

		    var strain_submitter = $.map(table.rows('.selected').data(), function(item){
		        return item['FilesLocation'];
		    });

		    countWorkflows = 0;
		    countFinished = 0;
		    var dict_strain_names = {};
		    var put_i = [];
		    var count_strains_added_run = 0;
		    var workflow_indexes = {};
		    var workflow_order = {};

		    for(i in strain_names){
		        put_i.push(i);
		        if(pipelines_applied[strain_names[i]] != undefined){
		        	dict_strain_names[strain_names[i]] = [pipelines_applied[strain_names[i]].length, [], 0, 0];
		        	var pip_id_of_parents = [];
		        	for(p in strain_to_real_pip[strains_dict[strain_names[i]]]){
		        		if(strain_to_real_pip[strains_dict[strain_names[i]]][p][0] != CURRENT_PROJECT_ID && pipelines_type_by_strain[strain_names[i]][3] != undefined){

			        		pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_names[i]]][p][0]);
			        		pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_names[i]]][p][1]);
			        		pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_names[i]]][p][2]);
			        	}
		        	}
		        	
		        	//Checks the last workflow that has been run and pass that information to the ngs_onto
		        	if(pip_id_of_parents.length == 0){
		        		var lastprocess = "";
		        		var last_pipeline_id = "";
			        	var count_processes = 0;
			        	var has_completed = false;
			        	for(x in pipelines_applied[strain_names[i]]){
			        		//console.log(workflowname_to_protocols, pipelines_applied[strain_names[i]][x].split("</i>")[1].split("</button>")[0]);
			        		for(p in workflowname_to_protocols[pipelines_applied[strain_names[i]][x].split("</i>")[1].split("</button>")[0]]){
			        			count_processes += 1;
			        		}
			        		var pip_name = pipelines_applied[strain_names[i]][x].split("id")[1].split('"')[1];

			        		if((dict_of_tasks_status[buttons_to_tasks[pip_name]] == "COMPLETED") || (dict_of_tasks_status[buttons_to_tasks[pip_name]] == "FAILED") || (dict_of_tasks_status[buttons_to_tasks[pip_name]] == "WARNING")){
			        			last_pipeline_id = strainID_pipeline[strains_dict[strain_names[i]]];
			        			lastprocess = count_processes;
			        		}

			        		if(dict_of_tasks_status[buttons_to_tasks[pip_name]] == "COMPLETED" || dict_of_tasks_status[buttons_to_tasks[pip_name]] == "FAILED" || dict_of_tasks_status[buttons_to_tasks[pip_name]] == "WARNING") has_completed = true;

			        	}
			        	if(lastprocess != "" && has_completed == true){
			        		pip_id_of_parents.push(CURRENT_PROJECT_ID);
			        		pip_id_of_parents.push(last_pipeline_id);
			        		pip_id_of_parents.push(lastprocess);
			        	}
		        	}

		        	workflow_indexes[strain_names[i]] = {};
		        	workflow_order[strain_names[i]] = [];

		        	//Add processes to ngs_onto
		        	ngs_onto_requests.ngs_onto_request_add_processes(strainID_pipeline[strains_dict[strain_names[i]]], strains_dict[strain_names[i]], i, pip_id_of_parents, pipelines_type_by_strain[strain_names[i]], function(response, strain_name){
	        			if(response.status != 404){
	        				dict_strain_names[strain_names[strain_name]].push(response.data);
	        			}
	        			//Push button identifier
	        			dict_strain_names[strain_names[strain_name]].push([]);

	        			//Push process position
	        			dict_strain_names[strain_names[strain_name]].push([]);
	        			dict_strain_names[strain_names[strain_name]].push(0);

	        			//Push workflow ID
	        			dict_strain_names[strain_names[strain_name]].push({});

	        			//Push if process is to run
	        			dict_strain_names[strain_names[strain_name]].push([]);

	        			count_pipelines_applied = 0;

			        	for(p in pipelines_applied[strain_names[strain_name]]){
			        		var pi_name = pipelines_applied[strain_names[strain_name]][p].split("id")[1].split('"')[1];

			        		var real_pi_name = pipelines_applied[strain_names[strain_name]][p].split('</i>')[1].split('</')[0];

			        		//console.log(dict_of_tasks_status[buttons_to_tasks[pi_name]], pi_name, buttons_to_tasks, dict_of_tasks_status, pipelines_applied);
			        		
			        		if(buttons_to_tasks[pi_name].indexOf("workflow") > -1){
		        				
		        				dict_strain_names[strain_names[strain_name]][1].push(pipelines_applied[strain_names[strain_name]][p].split('button')[1].split('</i>')[1].split('<')[0]);
		        				
		        				//console.log(protocols_applied_by_pipeline, protocols_applied_by_pipeline[strain_names[strain_name]][real_pi_name][0].split('<div class="dropdown"'));

			        			protocols_in_pip = protocols_applied_by_pipeline[strain_names[strain_name]][real_pi_name][0].split('<div class="dropdown"');
			        			
			        			protocols_in_pip.shift();
			        			for(protoc in protocols_in_pip){
			        				protocol_with_button = protocols_in_pip[protoc].split("</button>")[0];
			        				protocol_name = protocol_with_button.split("id=")[1].split('"')[1];

			        				//Add to array the processes that should not run
			        				if (dict_of_tasks_status[buttons_to_tasks[pi_name]] == "COMPLETED"){
			        					dict_strain_names[strain_names[strain_name]][9].push(false);
			        				}
			        				else {
			        					dict_strain_names[strain_names[strain_name]][9].push(true);
			        					dict_strain_names[strain_names[strain_name]][5].push(protocol_name);
			        				}
			        			}

			        			//dict_strain_names[strain_names[strain_name]][2] += 1;
			        		}
			        		else{
			        			//Change to count for all protocol processes instead of the workflows

			        			dict_strain_names[strain_names[strain_name]][2]+=1;
			        			dict_strain_names[strain_names[strain_name]][7] += 1;

			        		}

			        		console.log(dict_strain_names[strain_names[strain_name]][1]);


		        			while(dict_strain_names[strain_names[strain_name]][1].length != 0){
		        				workflowName = dict_strain_names[strain_names[strain_name]][1].shift();
		        				workflow_order[strain_names[i]].push(workflowName);
		        				count_pipelines_applied += 1;
				        		dict_strain_names[strain_names[strain_name]][8][count_pipelines_applied] = [];

		        				//Get the workflow to run and the step
		        				ngs_onto_requests.ngs_onto_request_get_workflow(pipelinesByName[workflowName], strain_name, count_pipelines_applied, function(response, strain_name, count_pip_app){

			        				dict_strain_names[strain_names[strain_name]][2]+=1;
			        				for(k=response.data.length-1; k>=0;k--){
			        					parts = response.data[k].protocol.split('/');
			        					parts = parts[parts.length-1];
			        					dict_strain_names[strain_names[strain_name]][8][count_pip_app].push(parts.replace('>', ''));
			        				}
			        				//Set the workflows ids to run
			        				if (dict_strain_names[strain_names[strain_name]][0] == dict_strain_names[strain_names[strain_name]][2]){
			        					var indexes = '';
			        					for(prot_index in dict_strain_names[strain_names[strain_name]][8]){
			        						for (prot in dict_strain_names[strain_names[strain_name]][8][prot_index]){
			        							indexes += dict_strain_names[strain_names[strain_name]][8][prot_index][prot].replace('>', '') + ',';
			        							dict_strain_names[strain_names[strain_name]][7] += 1;
		        								dict_strain_names[strain_names[strain_name]][6].push(dict_strain_names[strain_names[strain_name]][7]);
			        						}
			        					}
					        			indexes = indexes.replace(/,$/, '');

					        			//Run the job
					        			console.log("RUN JOB");
					        			pg_requests.run_job(strains_dict[strain_names[strain_name]], indexes, strainID_pipeline[strains_dict[strain_names[strain_name]]], dict_strain_names[strain_names[strain_name]][6], strain_name, strain_submitter[strain_name], CURRENT_SPECIES_NAME, strain_names[strain_name], dict_strain_names[strain_names[strain_name]][9], process_to_workdir, function(response, strain_name, pipeline_id){
					        				
					        				task_ids = [];
					        				task_ids_to_map = [];

					        				dict_strain_names[strain_names[strain_name]][3] += 1;

					        				var countTasks = 0;
					        				for(l in response.data){

					        					if(response.data[l] == 'null'){
					        						countTasks++;
					        						var button_name = dict_strain_names[strain_names[strain_name]][5].shift();

						        					tasks_to_buttons[response.data[l] + '_' + countTasks] = button_name;//strain_names[strain_name].replace(/ /g, "_") + '_' + String(countTasks) + '_' + CURRENT_PROJECT_ID;
						        					buttons_to_tasks[button_name] = response.data[l] + '_' + countTasks;
						        					buttons_to_strain_names[button_name] = strain_names[strain_name];

						        					task_ids_to_map.push(response.data[l] + '_' + countTasks);
					        					}
					        					else{
					        						task_ids = response.data[l].task_ids;
					        						//pipelinesToNextflowLogs[pipeline_id] = {"gen_stdout":response.data[l].gen_stdout, "path_nextflow_log": response.data[l].path_nextflow_log, "subproc_id": response.data[l].subproc_id}

					        						for(s in task_ids){
					        							countTasks++;
					        							var button_name = dict_strain_names[strain_names[strain_name]][5].shift();
						        						tasks_to_buttons[task_ids[s]] = button_name;//strain_names[strain_name].replace(/ /g, "_") + '_' + String(countTasks) + '_' + CURRENT_PROJECT_ID;
						        						buttons_to_tasks[button_name] = task_ids[s];
						        						buttons_to_strain_names[button_name] = strain_names[strain_name];
					        							task_ids_to_map.push(task_ids[s]);
					        						}
					        						processes_to_map = task_ids_to_map.map(function(x){
					        							return dict_strain_names[strain_names[strain_name]][4].shift();
							        				});
					        					}
					        				}


					        				//Add job id to the process on ngsonto and start checking the job status
					        				ngs_onto_requests.ngs_onto_request_add_jobid_to_process(strainID_pipeline[strains_dict[strain_names[strain_name]]], processes_to_map, task_ids_to_map, strain_name, function(response, strain_name, process_ids){
		        								count_strains_added_run += 1;
		        								for(tk in response.data.tasks){
		        									dict_of_tasks_status[response.data.tasks[tk]] = '';
		        								}
		        								strainName_to_tids[strain_name] = response.data.tasks.join();
		        								periodic_check_job_status(response.data.tasks, dict_of_tasks_status, strain_names[strain_name], process_ids, strainID_pipeline[strains_dict[strain_names[strain_name]]], CURRENT_PROJECT_ID);

		        								if (count_strains_added_run == strain_names.length){
		        									modalAlert("Jobs for all the selected strains have been submitted", function(){});
		        									$('#button_run_strain').fadeTo("slow", 1).css('pointer-events','auto');
		        								}
		        							})
					        			})
			        				}
			        				
			        			})
		        			}
			        	}
			        });
		        }
		    }
		},

		/*
	    Get the job id for each process on a given pipeline
	    */
		get_ids_from_processes: function(callback){

			
			for(i in intervals_running){
				clearInterval(intervals_running[i]);
			}
			intervals_running = {};

			array_of_strains = []
			strain_array = []
			prevjobid = '';
			countstrains = 0;
			count_processes = 0;
			count_strains_without_process = 0;

			var countStrain = {};

			if (strains.length == 0) return callback({strains:[]});
			else nstrains = strains.length;

			var processed_proc = {};
			
			for(i in strains){
				p_id_to_use = CURRENT_PROJECT_ID;

				if(strains[i] == undefined) continue;

				var strain_processes = strain_to_real_pip[strains_dict[strains[i].strainID]];
				count_processes += strain_processes == undefined ? 0 : strain_processes.length;

				countStrain[strains[i].strainID] = 0;

				//Case has pipelines but no processes
				if(strain_processes == undefined || strain_processes.length == 0){
					count_strains_without_process += 1;
					//Fix workflows positions.
					if(count_strains_without_process == nstrains){
						var table = $('#strains_table').DataTable();
						var strain_data = $.map(table.rows().data(), function(item){
					        return item;
					    });
					    toAdd_lab_protocols = "";
					    toAdd_analysis = "";

					    for(x in strain_data){
					    	toAdd_lab_protocols = "";
					    	toAdd_analysis = "";
					    	var s_name = strain_data[x]['strainID'];
					    	for(j in pipelines_applied[s_name]){
					    			pipeline_id = pipelines_applied[s_name][j].split('id="')[1].split('"')[0];
					    			if(buttons_to_tasks[pipeline_id] != undefined && buttons_to_tasks[pipeline_id].indexOf("null")>-1){
					    				pipelines_type_by_strain[s_name][0].push(pipelines_applied[s_name][j].replace("&&&", "&&protocol"));
					    				toAdd_lab_protocols += pipelines_applied[s_name][j].replace("&&&", "&&protocol");
					    			}
					    			else{
					    				pipelines_type_by_strain[s_name][1].push(pipelines_applied[s_name][j].replace("&&&", ""));
					    				toAdd_analysis += pipelines_applied[s_name][j].replace("&&&", "");
					    			}
						    }
						    strain_data[x]["Analysis"] = toAdd_analysis;
						    strain_data[x]['lab_protocols'] = toAdd_lab_protocols;

					    }
					    callback({strains:strain_data});
					}
				}
				else{
					
					var t_ids = [];
					var proc_ids = [];
					processed_proc[strains[i].strainID] = 0;
					var single_strain_processes = [];
					
					for(s_p in strain_processes){
						single_strain_processes.push(strain_processes[s_p][2])
					} 
					
					//for(s_p in strain_processes){
					//	console.log(strain_processes);
					ngs_onto_requests.ngs_onto_request_get_jobid_from_process(strain_processes[s_p][1], single_strain_processes, strain_processes[s_p][0], strains[i].strainID, countStrain, strain_processes, t_ids, proc_ids, processed_proc, function(response, pr_ids, strain_id, count_process, pip_id, proj_id, strain_processes_from_request, t_ids, proc_ids, processed_proc){

						//When error occurs when loading the job_id
						if(response.data == 404){
							for(x in strain_processes_from_request){
								countstrains += 1;
								processed_proc[strain_id] += 1;
							}
						}

						strain_id = strain_id.trim();
						var prevWorkflow = "";

						var countProcesses = 0;
						var countWorkflows = 0;

						for(l in response.data){
							countProcesses += 1;
							if(response.data[l].length != 0){
								t_id = response.data[l][0].jobid.split('^')[0].split('"')[1];
								t_ids.push(t_id);
								count_process[strain_id]+=1;
								tasks_to_buttons[t_id] = strain_id.replace(/ /g, "_") + '_protocol_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID;
								buttons_to_tasks[strain_id.replace(/ /g, "_") + '_protocol_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID] = t_id;
								buttons_to_strain_names[strain_id.replace(/ /g, "_") + '_protocol_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID] = strain_id;
								prevjobid = t_id.split('_')[0];
								dict_of_tasks_status[t_id] = '';
								proc_ids.push(pr_ids[l])
								//periodic_check_job_status(t_id, dict_of_tasks_status, strain_id, pr_ids[l], pip_id, proj_id);
							}
							countstrains += 1;
							processed_proc[strain_id] += 1;

							if(prevWorkflow != process_id_to_workflow[strain_id + String(countProcesses)]){
								countWorkflows += 1;
								buttons_to_tasks[strain_id.replace(/ /g, "_") + '_workflow_' + String(countWorkflows) + '_' + CURRENT_PROJECT_ID] = "buttonworkflow_" + strainID_pipeline[strains_dict[strain_id.replace(/ /g, "_")]] + "_" + String(countWorkflows);
							}
							prevWorkflow = process_id_to_workflow[strain_id + String(countProcesses)];

						}
						if(processed_proc[strain_id] == strain_processes_from_request.length && t_ids.length > 0){
							strainName_to_tids[strain_id] = t_ids.join();
							periodic_check_job_status(t_ids, dict_of_tasks_status, strain_id, proc_ids, pip_id, proj_id);
						}
						

						//Fix workflows positions.
						if(countstrains == count_processes){
							var table = $('#strains_table').DataTable();
							var strain_data = $.map(table.rows().data(), function(item){
						        return item;
						    });
						    toAdd_lab_protocols = "";
						    toAdd_analysis = "";

						    for(x in strain_data){
						    	toAdd_lab_protocols = "";
						    	toAdd_analysis = "";
						    	toAdd_protocols = "";
						    	strain_data[x]['protocols'] = {};
						    	var s_name = strain_data[x]['strainID'];
						    	for(j in pipelines_applied[s_name]){
						    			pipeline_id = pipelines_applied[s_name][j].split('id="')[1].split('"')[0];
						    			pipeline_name = pipelines_applied[s_name][j].split('button')[1].split('</i>')[1].split('</')[0];

						    			//console.log(pipeline_name, pipelines_applied[s_name][j]);
						    			if(buttons_to_tasks[pipeline_id] != undefined && buttons_to_tasks[pipeline_id].indexOf("null")>-1){
						    				pipelines_type_by_strain[s_name][0].push(pipelines_applied[s_name][j].replace("&&&", "&&protocol"));
						    				toAdd_lab_protocols += pipelines_applied[s_name][j].replace("&&&", "&&protocol");
						    			}
						    			else{
						    				pipelines_type_by_strain[s_name][1].push(pipelines_applied[s_name][j].replace("&&&", ""));
						    				toAdd_analysis += pipelines_applied[s_name][j].replace("&&&", "");
						    				toAdd_protocols = protocols_applied_by_pipeline[s_name][pipeline_name];

						    				strain_data[x]['protocols'][pipeline_name] = toAdd_protocols;
						    			}
							    }
							    strain_data[x]["Analysis"] = toAdd_analysis;
							    strain_data[x]['lab_protocols'] = toAdd_lab_protocols;

						    }
						    callback({strains:strain_data});
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
		show_combined_reports: function(button_text){
			button_parts = button_text.split('&&');
			button_id = button_text.split('&&')[1];
			workflow_name = button_text.split('&&')[0];
			if(button_parts.length > 2){
				ngs_onto_requests.ngs_onto_request_get_workflow(pipelinesByName[workflow_name], "", 0, function(response, strain_name, count_pip_app){
					indexes = "";
					for(k=response.data.length-1; k>=0;k--){
    					parts = response.data[k].protocol.split('/');
    					parts = parts[parts.length-1];
    					indexes += parts.replace('>', '') + ',';
    				}
    				indexes = indexes.replace(/,$/, '');
    				pg_requests.get_protocols_by_ids(indexes, "", function(response){
    					protocols_in_use = [];
    					for (x in response.data){
    						protocol_object = JSON.parse(response.data[x].steps);
    						protocol_object.protocol_name = response.data[x].name;
    						protocols_in_use.push(protocol_object)
    					}
    					$rootScope.protocols_in_use = protocols_in_use;
    					$('#LabProtocolTableModal').modal("show");
    				});
				});
			}
			else{
				
				if($rootScope.showing_jobs == undefined) $rootScope.showing_jobs = [];

				CURRENT_JOB_ID = buttons_to_tasks[button_id];
				if(dict_of_tasks_status[CURRENT_JOB_ID] != "COMPLETED") return objects_utils.show_message('project_message_div', 'warning', 'This process cannot be added to the active report.');
				$rootScope.showing_jobs.push(CURRENT_JOB_ID);
				objects_utils.show_message('project_message_div', 'success', 'Results stored on active report.');
			}
		},

		/*
	    Get the outputs from a process. Uses ngsOnto
	    */
		get_processes_outputs: function(button_class, callback){
			button_id = button_class.split('&&')[1];
			process_id = String(parseInt(buttons_to_tasks[button_id].split('_')[1]) + 1);
			button_position = parseInt(button_id.split('_').slice(-2)[0]);
			pipeline_id = String(strainID_pipeline[strains_dict[buttons_to_strain_names[button_id]]]);
			
			if(Object.keys(strain_to_real_pip).length == 0){
				button_nout = button_class.split('&&')[1].split("_")
				real_p_data = [CURRENT_PROJECT_ID, button_class_to_pipeline[button_class], button_nout[button_nout.length-2]]
			}
			else real_p_data = strain_to_real_pip[strains_dict[buttons_to_strain_names[button_id]]][button_position-1];

			if(real_p_data == undefined){
				modalAlert('The output you are trying to obtain is not available yet.', function(){

				});
			}
			else{
				ngs_onto_requests.ngs_onto_request_get_processes_outputs(real_p_data[0], real_p_data[1], real_p_data[2], function(response){
					callback(response);
				});
			}		
		},

		/*
	    Download the results file
	    */
		download_result: function(response, callback){
			if(response.data.length == 0 || response.data[0].file_3 == 'None'){
				return modalAlert('The requested file is not available.', function(){});
			}
			f_path = response.data[0].file_3.split('^^')[0].replace(/"/g, "")
			pg_requests.download_file(f_path, function(response){
				callback();
			});
		},

		/*
	    Download the log file
	    */
		download_log: function(response, callback){
			if(response.data.length == 0 || response.data[0].file_4 == 'None'){
				return modalAlert('The requested file is not available.', function(){});
			}
			f_path = response.data[0].file_4.split('^^')[0].replace(/"/g, "")
			pg_requests.download_file(f_path, function(response){
				callback();
			});
		},

		get_template_strain_file:function(){
			pg_requests.download_template_strain_file(function(response){
				console.log(response);
			});
		},

		/*
	    Remove the last workflow button for a given strain
	    The remove is only saved when a job is run again for that strain
	    */
		remove_analysis: function(element, callback){
			var class_n = element.className;
			var sp_name = class_n.split('&&')[1];
			var button_m = element.parentElement.parentElement.getElementsByTagName("button")[0];
			var strain_indexes = $.map($('#strains_table').DataTable().rows().indexes(), function(index){ return index; });
			var strain_names = $.map($('#strains_table').DataTable().rows().data(), function(item){ return item.strainID; });
			var strain_data = $.map($('#strains_table').DataTable().rows().data(), function(item){ return item; });
			
			var new_pipapplied = [];
			var new_pipapplied_prot = [];
			var new_pipapplied_proc = [];
			var last_process = "";
			var removed_pip_name = "";

			var count_pipeline_ids_last_parent = 0;

			for(index in strain_indexes){
					new_pipapplied = [];
					new_pipapplied_prot = [];
					new_pipapplied_proc = [];
					count_pipeline_ids_last_parent = 0;
					var stored_added_pipeline = {};
					if(sp_name.indexOf(strain_names[index].replace(/ /g, "_")) > -1){
						count_added_to_new = 0
						for (pipeline in pipelines_applied[strain_names[index]]){
					
							count_pipeline_ids_last_parent += 1;
							last_process = count_pipeline_ids_last_parent;

							if(pipelines_applied[strain_names[index]][pipeline].indexOf(class_n) < 0) {
								
								new_pipapplied.push(pipelines_applied[strain_names[index]][pipeline]);
								
								for(x in pipelines_type_by_strain[strain_names[index]][0]){
									if(pipelines_type_by_strain[strain_names[index]][0][x].indexOf(class_n) < 0 && stored_added_pipeline[y] != true){
										new_pipapplied_prot.push(pipelines_type_by_strain[strain_names[index]][0][x]);
										stored_added_pipeline[y] = true;
									}
								}
								for(y in pipelines_type_by_strain[strain_names[index]][1]){
									if(pipelines_type_by_strain[strain_names[index]][1][y].indexOf(class_n) < 0 && stored_added_pipeline[y] != true){
										count_added_to_new += 1;
										if(count_added_to_new == pipelines_applied[strain_names[index]].length - 1){
											//ALLOW ONLY THE LAST WORKFLOW TO BE REMOVED
											last_proc_name = pipelines_type_by_strain[strain_names[index]][1][count_added_to_new-1].split('<li class="')[1].split("&&")[0]
											class_of_button_remove_to_replace = last_proc_name+'&&'+strain_names[index].replace(/ /g, '_')+"_workflow_"+String(count_added_to_new)+ '_' + CURRENT_PROJECT_ID+'&&&';
								        	class_of_button_remove_to_replace = 'class="neutral '+class_of_button_remove_to_replace+'" onclick="removeAnalysis(this)'
											pipelines_type_by_strain[strain_names[index]][1][y] = pipelines_type_by_strain[strain_names[index]][1][y].replace('style="display:none;" ' + class_of_button_remove_to_replace, 'style="display:block;" ' + class_of_button_remove_to_replace)
										}

										new_pipapplied_proc.push(pipelines_type_by_strain[strain_names[index]][1][y]);
										stored_added_pipeline[y] = true;
									}
									
								}
								var pip_name = pipelines_applied[strain_names[index]][pipeline].split("id")[1].split('"')[1];
								if(dict_of_tasks_status[buttons_to_tasks[pip_name]] == "COMPLETED" || dict_of_tasks_status[buttons_to_tasks[pip_name]] == "FAILED" || dict_of_tasks_status[buttons_to_tasks[pip_name]] == "WARNING"){
									if(pipelines_type_by_strain[strain_names[index]][3] == undefined){
										pipelines_type_by_strain[strain_names[index]].push(last_process);
									}
									else pipelines_type_by_strain[strain_names[index]][3] = last_process;
								}
							}
							else {
								removed_pip_name = pipelines_applied[strain_names[index]][pipeline].split("</i>")[1].split('<')[0];
							}
						}

						pipelines_applied[strain_names[index]] = new_pipapplied;

						pipelines_type_by_strain[strain_names[index]][0] = new_pipapplied_prot;
						pipelines_type_by_strain[strain_names[index]][1] = new_pipapplied_proc;

						toAdd_lab_protocols = ""
						toAdd_analysis = ""
						//UPDATE WORKFLOWS
						for(j in pipelines_type_by_strain[strain_names[index]]){
				        	if(j == 0) toAdd_lab_protocols += pipelines_type_by_strain[strain_names[index]][j];
		        			else if (j==1) toAdd_analysis += pipelines_type_by_strain[strain_names[index]][j];
				        }
				        strain_data[index]['Analysis'] = toAdd_analysis;

						clearInterval(intervals_running[strainName_to_tids[strain_names[index]]]);

						for(protocol in protocols_on_button[sp_name]){
							delete current_job_status_color[protocols_on_button[sp_name][protocol]];
							delete tasks_to_buttons[buttons_to_tasks[protocols_on_button[sp_name][protocol]]];
							delete buttons_to_tasks[protocols_on_button[sp_name][protocol]];
						}

						try{
							n_protocols = protocols_on_button[sp_name].length;
						}
						catch(e){
							console.log("Error loading protocols");
						}

						params = jobs_to_parameters[strainName_to_tids[strain_names[index]]];
				        //pipeline_status[strainName_to_tids[strainID]](params[0], params[1], params[2], params[3]);
				        if(params != undefined && params[0].length > 0){
				        	params[0] = params[0].split(",");
					        params[2] = params[2].split(",");

					        params[0] = params[0].slice(0, params[0].length - n_protocols);
					        params[2] = params[2].slice(0, params[2].length - n_protocols);

					        if(params[0].length > 0){
					        	intervals_running[strainName_to_tids[strain_names[index]]] = setInterval(function(){ pipeline_status[strainName_to_tids[strain_names[index]]](params[0].slice(0, params[0].length - n_protocols), params[1], params[2].slice(0, params[2].length - n_protocols), params[3]); }, 30000);
					        }

					        params[0] = params[0].join();
					        params[2] = params[2].join();

				        }
				        						
						delete current_job_status_color[sp_name];
						delete tasks_to_buttons[buttons_to_tasks[sp_name]];
						delete dict_of_tasks_status[buttons_to_tasks[sp_name]];
						delete buttons_to_tasks[sp_name];
						delete protocols_applied_by_pipeline[strain_names[index]][removed_pip_name];

						console.log(dict_of_tasks_status, buttons_to_tasks[sp_name]);

						strainNames_to_pipelinesNames[strain_names[index]].pop();
						protocols_applied[strain_names[index]].pop();
						//console.log(intervals_running, buttons_to_tasks[sp_name], tasks_to_buttons, current_job_status_color, pipelines_type_by_strain, pipelines_applied);
					}
			}
			modalAlert("Procedure removed.", function(){});
			callback({strains: strain_data, indexes:strain_indexes});

		},

		/*
	    Get files from a user
	    */
		get_user_files: function(callback){
			pg_requests.get_user_files(function(response){
				callback(response);
			});
		},

		/*
	    Load strains from a file. Parses the file and trigger the add_new_strain function
	    */
		load_strains_from_file: function(input_element, separator, callback){

			function select_option(select_id, i) {
			  return $('#'+select_id+' select option[value="' + i + '"]').html();
			}

			var reader = new FileReader();

			trigger_from_file_load = true;

	      	reader.onload = function(f){
		      	var lines = this.result.split('\n');
		      	firstLine = true;
		      	strains_object = {};

		      	strains_object['body'] = [];
		      	
		      	//parse file
		      	for(i in lines){
		      		line  = lines[i].split(separator);
		      		var array_to_use = [];
		      		if(firstLine){
		      			line.map(function(l){array_to_use.push(l);});
		      			strains_object['headers'] = array_to_use;
		      			firstLine = false;
		      		}
		      		else{
		      			line.map(function(l){array_to_use.push(l);});
		      			strains_object['body'].push(array_to_use);
		      		}
		      	}

		      	//load strains
		      	function add_to_database(){
		      		line_to_use = strains_object['body'].shift();
		      		var has_files = 0;
		      		var files_in_user_folder = 0;
		      		var identifier_s = "";
		      		var no_identifier = true;
		      		var bad_submitter = false;
		      		for (x in line_to_use){
		      			var hline_to_use = strains_object['headers'];
		      			if(hline_to_use.length != line_to_use.length){
		      				modalAlert("Uploaded file seems to be miss-formatted. Check if the number of headers and the rest of the file are the same.", function(){
		      					
		      				});
		      				return;
		      			}
		      			var bline_to_use = line_to_use;
		      			if (hline_to_use[x].indexOf("Primary-Identifier") > -1){
		      				if (bline_to_use[x] != "") no_identifier = false;
		      				identifier_s = String(bline_to_use[x] + "-" + bline_to_use[parseInt(x)+1]).replace(/ /g, "-")
		      			}

		      			if (hline_to_use[x].indexOf("Submitter") > -1){
		      				if (bline_to_use[x] != CURRENT_USER_NAME) bad_submitter = true;
		      			}


		      			if(hline_to_use[x].indexOf("File_1") > -1 || hline_to_use[x].indexOf("File_2") > -1){
		      				//check for files in user area
		      				has_files += 1;

		      				$('#'+hline_to_use[x] + " option").filter(function() {
							    if($(this).text().trim().indexOf(bline_to_use[x].trim()) > -1){
							    	files_in_user_folder += 1;
							    	return bline_to_use[x];
							    }
							}).prop('selected', true);
						}
						else $('#'+hline_to_use[x]).val(bline_to_use[x] == "" ? "NA":bline_to_use[x]);
		      		}
		      		
		      		setTimeout(function(){
		      			if(files_in_user_folder == 2 && no_identifier != true && bad_submitter != true){
		      				$('#change_type_to_file').trigger("click");
			      			if (has_files == 2) $('#newstrainbuttonsubmit').trigger("submit");
			      			if(strains_object['body'].length != 0) add_to_database();
			      			else {
			      				console.log("DONE");
			      				hline_to_use.map(function(a){ $("#"+a).val("")});
			      			}
		      			}
		      			else if(bad_submitter == true){
		      				modalAlert("The submitter on the batch file must be the user you are logged in (" + CURRENT_USER_NAME + ").", function(){
				      			hline_to_use.map(function(a){ $("#"+a).val("")});
				      			$('#Submitter').val(CURRENT_USER_NAME);
		      				});
		      			}
		      			else if(no_identifier == true){
		      				modalAlert("One of the entries does not have a valid identifier.", function(){
		      					if(strains_object['body'].length != 0) add_to_database();
		      					else {
				      				console.log("DONE");
				      				hline_to_use.map(function(a){ $("#"+a).val("")});
				      			}
		      				});
		      			}
		      			else if(files_in_user_folder < 2){
		      				modalAlert("One or more files for strain " + identifier_s + " are not available on the user folder.", function(){
		      					if(strains_object['body'].length != 0) add_to_database();
		      					else {
				      				console.log("DONE");
				      				hline_to_use.map(function(a){ $("#"+a).val("")});
				      			}
		      				});
		      			}
		      			else{
		      				modalAlert("An unexpected error as occuried when adding the strain " + identifier_s + ".", function(){
		      					if(strains_object['body'].length != 0) add_to_database();
		      					else {
				      				console.log("DONE");
				      				hline_to_use.map(function(a){ $("#"+a).val("")});
				      			}
		      				});
		      			}

		      		}, 500);

		      	}

		      	add_to_database();
		    };

		    $('#status_upload_from_file').empty();

	      	reader.readAsText(input_element.files[0]);
		}

	}

	return returned_functions;
}