function Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope){

	var project = {}, pipelinesByName = {}, pipelinesByID = {}, strainID_pipeline = {}, strains_dict = {}, strain_id_to_name = {}, pipelines_applied = {};
	var tasks_to_buttons = {}, buttons_to_tasks = {};
	var dict_of_tasks_status = {};
    var specie_name = "", species_id = "";
    var strains = [], pipelines = [], strains_headers = [], public_strains = [], files = [];
    var strainid_processes_buttons = {};
    //var dict_strain_names_button_ids = {};
    var buttons_to_strain_names = {};
    //var pipeline_ids_parents = {};

    var buttons_to_pipelines = {};
    var buttons_to_processes = {};

    var strain_to_real_pip = {};


    var pipelines_type_by_strain = {};
    var intervals_running = {};
    //var injected_pipelines = {};

    var workflow_id_to_name = {};

    var global_counter_pipelines = 0;

    var strains_without_pip = {};

    var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    var ngs_onto_requests = new ngs_onto_client(CURRENT_PROJECT_ID, $http);
    var objects_utils = new Objects_Utils();

    status_dict = {'R': '#42c2f4', 'PD': '#f49542', 'COMPLETED': '#42f442', 'FAILED': '#f75454', 'WARNING': '#f9fb30'}

    function modalAlert(text, callback){

    	$('#modalAlert #buttonSub').off("click");
    	$('#modalAlert .modal-body').empty();
    	$('#modalAlert .modal-body').append("<p>"+text+"</p>");

    	$('#modalAlert #buttonSub').on("click", function(){
    		$("#buttonCancelAlert").click();
    		setTimeout(function(){callback()}, 400);
    	})

    	$('#modalAlert').modal("show");

    }

    function modalAlertAddSameFiles(text, callback){

    	$('#modalAlert #buttonSub').off("click");
    	$('#modalAlert .modal-body').empty();
    	$('#modalAlert .modal-body').append("<p>"+text+"</p>");

    	$('#modalAlert #buttonSub').on("click", function(){
    		$("#buttonCancelAlert").click();
    		setTimeout(function(){callback(true)}, 400);
    	})

    	$('#modalAlert #buttonCancelAlert').on("click", function(){
    		$('#modalAlert #buttonCancelAlert').off("click");
    		setTimeout(function(){callback(false)}, 400);
    	})

    	$('#modalAlert').modal("show");

    }

    console.log(CURRENT_PROJECT_ID);


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

	            if(has_same_files == true){
	            	message = "<p><b>Some files associated with this strain are already being used in this Project:</b></p><p>"+message_to_add+"</p><p><b>Do you want to proceed?</b></p>";
	            	modalAlertAddSameFiles(message, function(toadd){
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
		                if(!strains_dict.hasOwnProperty($.trim(data.strainID))){
		                    strains_dict[$.trim(data.strainID)] = data.id;
		                }
		                strains.push(sd);

		                //objects_utils.show_message('project_message_div', 'success', 'Strains were added to the project.');
		                callback({ strains_headers: strains_headers, strains: strains});
		            
		            }
		 			else callback({ strains_headers: strains_headers, strains: strains});

		        }
	            //objects_utils.loadDataTables('strains_table', strains);
			}
			else{
				//objects_utils.loadDataTables('strains_table', strains);
				modalAlert(response.data.message.split('.')[0]+'.', function(){});
        		//objects_utils.show_message('project_message_div', 'warning', response.data.message.split('.')[0]+'.');
        		callback({message:"Strain already on Project."})
			}
		});
	}

	function create_pipeline(strain_Name, callback){
		strain_Name = $.trim(strain_Name);
		//console.log(strains_dict, strain_Name);
		strain_id = strains_dict[strain_Name];
		var new_pipeline_id = '';

		function add_pip(strainid){
			//console.log(strainid);
			pg_requests.add_pipeline(strainid, null, null, function(response){
				//console.log(response);
				if(response.status == 201){
					new_pipeline_id = response.data.id;
					//parent_pipeline_id = response.data.parent_pipeline_id;
					//parent_project_id = response.data.parent_project_id;

					ngs_onto_requests.ngs_onto_request_create_pipeline(response.data.id, response.data.strain_id, function(response, strain_id){
						console.log("CREATE PIPELINE", response);
						//pipeline_ids_parents[new_pipeline_id] = [parent_project_id, parent_pipeline_id]
						callback(strain_id, new_pipeline_id);
					});
				}
				else console.log(response.statusText);
			});
		}

		pg_requests.check_if_pipeline_exists(strain_id, function(response, strainid){
			if(response.status == 200){
				//console.log(response);

				console.log(response, CURRENT_PROJECT_ID);

				for(x in response.data){
					if(response.data[x].project_id == CURRENT_PROJECT_ID){
						console.log(response.data[x]);
						console.log("Pipeline already exists", strainid, response.data[x].id);

						new_pipeline_id = response.data[x].id;
						//parent_pipeline_id = response.data[x].parent_pipeline_id;
						//parent_project_id = response.data[x].parent_project_id;
						
						//if(!pipeline_ids_parents.hasOwnProperty(new_pipeline_id)) pipeline_ids_parents[new_pipeline_id] = [parent_project_id, parent_pipeline_id]
						
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

	function get_and_apply_pipeline(total_pipelines, pipeline_id, strain_id, project_id, added_pipeline_id, callback){

		console.log("##########");
		console.log(total_pipelines, pipeline_id, strain_id, project_id);
		
		ngs_onto_requests.ngs_onto_request_applied_pipelines(pipeline_id, project_id, strain_id, function(response, strain_id,p,q){
        	console.log(response);
        	var response_length=response.data.length;
        	var counter = 0;
        	if(response.status == 200){
        		var appliedPipelines = [];
        		//var parent_positions_to_buttons = {};
        		strain_to_real_pip[strain_id] = [];

	            for (w in response.data){
	            	//console.log(response.data[w]);
	            	var wf_url_parts = [];
	                workflow_id = response.data[w].workflowURI.split('<')[1].split('>')[0].split('/');
	                workflow_id = workflow_id[workflow_id.length-1];
	                appliedPipelines.push(workflow_id);
	                counter += 1;
	                //parent_positions_to_buttons[pipelinesByID[workflow_id]] = counter;
	                strainid_processes_buttons[strain_id][0][counter] = pipelinesByID[workflow_id];
	                parts = response.data[w].execStep.split('<')[1].split('>')[0].split('/');
	                
	                //project
	                wf_url_parts.push(parts[6]);
	                //pipeline
	                wf_url_parts.push(parts[8]);
	                //process
	                wf_url_parts.push(parts[10]);
	                strain_to_real_pip[strain_id].push(wf_url_parts);
	            }

	            //parent process positions
	            //console.log(pipeline_ids_parents, pipeline_id, parent_positions_to_buttons, added_pipeline_id, pipeline_id);
	            
	            //if(added_pipeline_id != null) pipeline_ids_parents[added_pipeline_id].push(parent_positions_to_buttons);
	            //else pipeline_ids_parents[pipeline_id].push(parent_positions_to_buttons);

	            //appliedPipelines = appliedPipelines.reverse();
	            global_counter_pipelines += 1;
	            console.log(strain_id_to_name[strain_id], appliedPipelines, pipelinesByID, pipelines_applied, pipelines_type_by_strain);
	            //console.log(strain_id_to_name[strain_id], appliedPipelines, pipelinesByID, pipelines_applied);
	            objects_utils.apply_pipeline_to_strain('strains_table', strain_id_to_name[strain_id], appliedPipelines, pipelinesByID, pipelines_applied, pipelines_type_by_strain, function(results){
	            	strains[results.strain_index] = results.strains[results.strain_index];
	            	for(x in results.workflow_ids){
	            		workflow_id_to_name[results.workflow_ids[x]] = results.workflow_names[x];
	            	}
	            	//workflow_id_to_name[results.workflow_id] = results.workflow_name;
	            	//console.log(total_pipelines, counter_pipelines);
	            	//console.log(total_pipelines, global_counter_pipelines, workflow_id_to_name)

	            	if (total_pipelines == global_counter_pipelines) callback({strains:strains});
	            });
        	}
        	else console.log(response.statusText);
        });
	}

	function periodic_check_job_status(job_id, dict_of_tasks_status, strain_id, process_id, pipeline_id, project_to_search){

		function get_status(job_id, strain_id, process_id, pipeline_id){

			//console.log(tasks_to_buttons, job_id, workflow_id_to_name, strain_id);
			//console.log(tasks_to_buttons);

			procedure_name = workflow_id_to_name[tasks_to_buttons[job_id].replace(/ /g, "_")];

			var parts_split = tasks_to_buttons[job_id].replace(/ /g, "_").split("_");
			var process_position = parts_split[parts_split.length-2];
			console.log(parts_split);

			//var pipeline_id = strainID_pipeline[strains_dict[strain_id]];

			//console.log(job_id, procedure_name, strain_id, pipeline_id, process_position, CURRENT_PROJECT_ID, process_id);

			pg_requests.get_job_status(job_id, procedure_name, strain_id, pipeline_id, process_position, project_to_search, process_id, function(response, this_job_id){
				//console.log(response, tasks_to_buttons, response.data[0]);
				//console.log(dict_of_tasks_status);
				//console.log(response, tasks_to_buttons, current_job_status_color);
				//console.log(response.data);
				if(response.data != false){
					task_id = response.data[0];
					status = response.data[1];
					if (task_id == "null") return;
					
					if (dict_of_tasks_status[task_id.split('_')[0]] != 'R'){
						dict_of_tasks_status[task_id] = status;
						current_job_status_color[tasks_to_buttons[task_id]] = status_dict[status];
						$('#' + tasks_to_buttons[task_id].replace(/ /g, "_")).css({'background-color': status_dict[status]});
					}
					prevtaskid = task_id;
					if(status == 'COMPLETED' || status == 'WARNING') clearInterval(intervals_running[this_job_id]);

				}
				else{
					//if(prevtaskid != '') {
						dict_of_tasks_status[job_id.split('_')[0]] = status;
						//console.log(tasks_to_buttons[job_id]);
						current_job_status_color[tasks_to_buttons[task_id]] = status_dict[status];
						var bah = tasks_to_buttons[task_id].replace(/ /g, "_")
						$('#' + tasks_to_buttons[task_id].replace(/ /g, "_")).css({'background-color': status_dict[status]});
					//}
					clearInterval(intervals_running[this_job_id]);
				}
				//map to workflow_id
			})

		}

		prevtaskid = '';

		setTimeout(function(){get_status(job_id, strain_id, process_id, pipeline_id);}, 1000);

		//console.log("PROCESS_ID", process_id);

		//get_status(job_id);

		var periodic_check = setInterval(function(){ get_status(job_id, strain_id, process_id, pipeline_id); }, 20000);

		intervals_running[job_id] = periodic_check;

	}

    var returned_functions = {

	    get_workflows: function(classifier, species_name, callback){

			pg_requests.get_workflows(classifier, species_name, function(response){
				//console.log(response);
				if(response.status == 200){
					if (typeof response.data != 'string'){
		                for (i in response.data){
		                    pipelinesByName[response.data[i].name] = response.data[i].id;
		                    pipelinesByID[response.data[i].id] = response.data[i].name;
		                }
		            }
		            callback(response.data);
				}
				else{
					console.log(response.statusText);
					callback(response.data);
				}

			});
		},
		get_strains: function(from_user, callback){

			pg_requests.get_strains(CURRENT_SPECIES_ID, from_user, function(response){
				if(response.status == 200){
					console.log(response.data);
					var max_headers = 0;
		            var data = response.data;
		            objects_utils.destroyTable('public_strains_table');
		            var new_strains = [];

		            if (data.length != 0){

		                public_strains_headers = JSON.parse(data[0].fields).metadata_fields;
		                public_strains_headers.unshift("strainID");

		                //public_strains_headers.push('Analysis');

		                for (i in data){

		                    strains_dict[$.trim(data[i].strainID)] = data[i].id;
		                    strain_id_to_name[data[i].id] = $.trim(data[i].strainID);

		                    var strain_data = JSON.parse(data[i].strain_metadata);
		                    strain_data["strainID"] = data[i].strainID;
		                    //strain_data['Analysis'] = "";
		                    var sd = {};
		                    for (j in public_strains_headers){
		                        if(strain_data.hasOwnProperty(public_strains_headers[j])){
		                            sd[public_strains_headers[j]] = strain_data[public_strains_headers[j]];
		                        }
		                    }
		                    sd["id"] = data[i].id;
		                    new_strains.push(sd);
		                }
		                public_strains = new_strains;
		                
		            }
		            callback({ public_strains_headers: public_strains_headers, public_strains: public_strains});
				}
				else{
					console.log(response.statusText);
					callback({ public_strains_headers: [], public_strains: []});
				}


			}),


			
			$('#fromdbbutton').click(function(){
				var table = $("#public_strains_table").DataTable();
				setTimeout(function(){
					table.draw();
				}, 400);
				//objects_utils.destroyTable('public_strains_table');
				//objects_utils.loadDataTables('public_strains_table', [1,2]);
			});
		},
		get_project_strains: function(callback){

			pg_requests.get_project_strains(function(response){
				//console.log('RESPONSE', response);
				if(response.status == 200){
					var max_headers = 0;
		            var data = response.data;
		            objects_utils.destroyTable('strains_table');
		            var add_strains = [];
		            if (data.length != 0){

		                strains_headers = JSON.parse(data[0].fields).metadata_fields;
		                strains_headers.unshift("strainID");
		                strains_headers.push('Analysis');
		                
		                for (i in data){

		                    var strain_data = JSON.parse(data[i].strain_metadata);
		                    strain_data["strainID"] = data[i].strainID;
		                    strain_data['Analysis'] = "";
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
		get_applied_pipelines: function(strainid, callback){

			//console.log(strains_dict, strainid);
			if (strainid != null) strainid = strains_dict[strainid];
			//console.log(strainid);

			pg_requests.get_applied_pipelines(strainid, CURRENT_PROJECT_ID, function(response, strainid){
				console.log(response);
				var total_pipelines = response.data.length;
				console.log(response.data.hasOwnProperty("message"), response.data);
				if(response.data.hasOwnProperty("message") == true) return callback({strains: "no_pipelines"});
				console.log("PASSOU");
				global_counter_pipelines = 0;
				if (response.status == 200){
					for (i in response.data){
						if(response.data[i].parent_pipeline_id != null){
			                strainid_processes_buttons[response.data[i].strain_id] = [{}];


			                //pipeline_ids_parents[response.data[i].id] = [response.data[i].parent_project_id, response.data[i].parent_pipeline_id];
			                ppipid = response.data[i].parent_pipeline_id;
			                pipid = response.data[i].id;
			                pprojid = response.data[i].parent_project_id;
			                sid = response.data[i].strain_id;

			                console.log(response.data[i]);

			                console.log(pprojid);
			                //console.log(total_pipelines, counter_pipelines, ppipid, sid, pprojid, pipid);
			                //Check if exist workflows on pipeline
			                ngs_onto_requests.ngs_onto_request_applied_pipelines_with_parent(ppipid, pprojid, sid, pipid, function(response, ppipid, pprojid, sid, pipid){
			                	console.log(response);

			                	/*ppipid = response_parent.parent_pipeline_id;
				                pipid = response_parent.id;
				                pprojid = response_parent.parent_project_id;
				                sid = response_parent.strain_id;*/

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
			                /*get_and_apply_pipeline(total_pipelines, counter_pipelines, ppipid, sid, pprojid, pipid, function(response){
			                	callback(response);
			                })*/
			                
						}
						else{
							strainID_pipeline[response.data[i].strain_id] = response.data[i].id;
			                strainid_processes_buttons[response.data[i].strain_id] = [{}];
			                
			                //pipeline_ids_parents[response.data[i].id] = [response.data[i].parent_project_id, response.data[i].parent_pipeline_id]

			                get_and_apply_pipeline(total_pipelines, response.data[i].id, response.data[i].strain_id, CURRENT_PROJECT_ID, null, function(response){
			                	callback(response);
			                })
						}
		            	
		            }
		            //callback();
		        }
		        else{
		        	console.log(response.statusText);

		        	callback({strains:[]});
		        }
			});
		},
		get_public_strain_applied_pipelines: function(strainids, callback){

			var processed_strains = 0;
			var total_strains = strainids.length;
			var total_wf = {};
			var total_pips = {};

			for(strainid in strainids){
				if (strainid != null) strain_id = strains_dict[strainids[strainid]];
				//console.log(strains_dict);
				//console.log(strainid);
				//var new_a_w = [];

				total_wf[strainids[strainid]] = [];
				total_pips[strainids[strainid]] = [];
				//console.log(strain_id_to_name, strain_id, strainids[strainid]);

				pg_requests.get_applied_pipelines(strain_id, CURRENT_PROJECT_ID, function(response, strain_id){
					//console.log(response, strain_id);
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
					            			//console.log(available_workflows[pipeline]);
					            			for(workflow in available_workflows[pipeline]){
												final_pips.push(pipelinesByID[available_workflows[pipeline][workflow]]);
											}
											total_pips[strain_id_to_name[strain_id]].push(pipelines_ids[pipeline]);
											total_wf[strain_id_to_name[strain_id]].push(final_pips);
											//console.log(available_workflows);
					            		}
									}
									if(total_strains == processed_strains) callback(total_wf, strainids, total_pips, strains_dict);
					            }
							}
							else{
								var pipeline_id = response.data[pipeline].id;
								var projectid = response.data[pipeline].project_id;
								//total_pips[strainid]
								//console.log(pipeline_id, strainid);
								ngs_onto_requests.ngs_onto_request_applied_pipelines(pipeline_id, projectid, strain_id, function(response, strain_id, pip_id, projid){
									pipelines_ids.push([pip_id, projid]);
									//console.log(response, strain_id);
									var appliedWorkflows = [];
									processed_pip += 1;

									strain_to_real_pip[strain_id] = [];

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
						                strain_to_real_pip[strain_id].push(wf_url_parts);
						            }
						            //console.log(strain_to_real_pip);
						            //appliedWorkflows = appliedWorkflows.reverse();
		
						            available_workflows.push(appliedWorkflows);
						            workflow_ids_added[appliedWorkflows.join()] = false;

						            if(processed_pip == total_pip) {
						            	//console.log(workflow_ids_added);
						            	//console.log(available_workflows);
						            	processed_strains += 1;
						            	for(pipeline in available_workflows){
						            		final_pips = []
						            		//console.log(workflow_ids_added, available_workflows[pipeline].join(), workflow_ids_added[available_workflows[pipeline].join()]);
						            		if(workflow_ids_added[available_workflows[pipeline].join()] != true){
						            			workflow_ids_added[available_workflows[pipeline].join()] = true;
						            			//console.log(available_workflows[pipeline]);
						            			for(workflow in available_workflows[pipeline]){
						            				//console.log(pipelinesByID[available_workflows[pipeline][workflow]], pipelinesByID, available_workflows[pipeline][workflow]);
													//available_workflows[pipeline][workflow] = pipelinesByID[available_workflows[pipeline][workflow]];
													final_pips.push(pipelinesByID[available_workflows[pipeline][workflow]]);
												}
												//console.log(total_pips, strain_id_to_name[strain_id], strain_id);
												total_pips[strain_id_to_name[strain_id]].push(pipelines_ids[pipeline]);
												total_wf[strain_id_to_name[strain_id]].push(final_pips);
												//console.log(available_workflows);
						            		}
										}

										if(total_strains == processed_strains) callback(total_wf, strainids, total_pips, strains_dict);
						            }
								});
							}
						}

			        }
			        else callback(available_workflows, strainids, total_pips, strains_dict);
				});

			}

			
		},
		get_and_apply_pipeline: function(total_pipelines, pipeline_id, strain_id, project_id, callback){

			strainID_pipeline[strain_id] = pipeline_id;
		    strainid_processes_buttons[strain_id] = [{}];

		    global_counter_pipelines = 0;
		    console.log(project_id);

		    if (project_id != CURRENT_PROJECT_ID){
				pg_requests.add_pipeline(strain_id, pipeline_id, project_id, function(response){
					console.log(response);
					var new_pipeline_id = response.data.id;
					var parent_project_id = response.data.parent_project_id;
					var parent_pipeline_id = response.data.parent_pipeline_id;
					
					ngs_onto_requests.ngs_onto_request_create_pipeline(response.data.id, response.data.strain_id, function(response, strain_id){
						//console.log("CREATE PIPELINE", response);
						//pipeline_ids_parents[new_pipeline_id] = [parent_project_id, parent_pipeline_id]
						console.log(pipeline_id);
						console.log(project_id);
						get_and_apply_pipeline(total_pipelines, pipeline_id, strain_id, project_id, new_pipeline_id, function(){
							callback();
						})
					});
					//pipeline_ids_parents[response.data.id] = [response.data.parent_project_id, response.data.parent_pipeline_id]
				})
			}
			else{
				console.log("PIPELINE ALREADY ON PROJECT");
				pg_requests.change_pipeline_from_project(strain_id, false, "", function(response, strain_id, pipeline_s){
					//console.log(response);
					//pipeline_ids_parents[response.data.id] = [response.data.parent_project_id, response.data.parent_pipeline_id]
					get_and_apply_pipeline(total_pipelines, pipeline_id, strain_id, project_id, null, function(){
						callback();
					})
				})
			}
		},
		get_uploaded_files: function(callback){

			pg_requests.get_uploaded_files(function(response){
				if (response.status == 200){
					callback(response.data.files);
				}
				else console.log(response.statusText);
			});

		},
		add_database_strains: function(strain_names, callback){

			/*var strain_names = $.map($('#public_strains_table').DataTable().rows('.selected').data(), function(item){
		        return item['strainID'];
		    });*/
		    //console.log(strain_names);

		    if(strain_names.length > 0){
		        objects_utils.destroyTable('strains_table');
		        for(i in strain_names){
		        	//console.log(strain_id_to_name[strain_names[i]]);
		            add_strain_to_project(strain_id_to_name[strain_names[i]], function(results){
		            	callback(results);
		            });
		        }
		    }
		    else modalAlert('Please select some strains first.', function(){});
		    //else objects_utils.show_message('project_message_div', 'warning', 'Please select some strains first.');
		},
		add_new_strain: function(callback){

			if($("#fromfilebutton").hasClass("active")) $('#add_pip_from_fileSubmit').css({"display":"block"});

			pg_requests.add_new_strain(function(response){
				console.log(response);
				if(response.status == 200 || response.status == 201){
					
					var to_append = '<div class="row">';
					//$('#status_upload_from_file').append('<p><b>Strain ' + response.data.strainID + '</b></p>');

					strain_id_to_name[response.data.id] = response.data.strainID;
					
					if(response.status == 200){
						if(response.data.file_1 != "" || response.data.file_2 != ""){
							to_append += '<div class="col-md-8"><p><b>Strain ' + response.data.strainID + '</b></p>';
							to_append += '<p>Files already mapped to strain!</p>';
							//$('#status_upload_from_file').append('<p>Files already mapped to strain!</p>');
							if(response.data.file_1 != "") to_append += '<p>File 1: '+response.data.file_1+'</p>';
							if(response.data.file_2 != "") to_append += '<p>File 2: '+response.data.file_2+'</p>';
							to_append += '</div><div class="col-md-4" id="file_col_'+response.data.strainID.replace(/ /g,"_")+'"><button strain_name="'+response.data.strainID+'" class="btn btn-md btn-primary" onclick="checkPipelineFromFile(this)">Check Pipelines</button>';
							to_append += '</div>';
							to_append += '</div><div class="row"><hr size="30">';
							$('#status_upload_from_file').append(to_append);
						}

						//current_id = response.data.id;
						//is_there = false;
						
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
								//console.log("already there");
								already_there = true;
								$('#file_col_'+onproject.replace(/ /g,"_")).empty();
								$('#file_col_'+onproject.replace(/ /g,"_")).append("Strain already on project");
								callback({"already_there":already_there});
							}
							else{

								pg_requests.get_applied_pipelines(strain_id, CURRENT_PROJECT_ID, function(response, strain_id){
							
									no_pip = true;

									for(f in response.data){
										if(response.data[f].project_id != null) no_pip = false;
										
										if(response.data[f].project_id == CURRENT_PROJECT_ID){
											onproject = strain_id_to_name[strain_id];
											if(response.data[f].removed != "true"){
												add_strain_to_project(strain_id_to_name[strain_id], function(results){
													//console.log("already there");
													results.already_there = true;
													$('#file_col_'+onproject.replace(/ /g,"_")).empty();
													$('#file_col_'+onproject.replace(/ /g,"_")).append("Strain already on project");
								        			callback(results);
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
						add_strain_to_project(response.data.strainID, function(results){
							to_append += '<div class="col-md-8"><p><b>Strain ' + response.data.strainID + '</b></p>';
							to_append += '<p>Strain added to the Project!</p>';
							to_append += '</div></div><hr size="30">';
							$('#status_upload_from_file').append(to_append);
							console.log(to_append);
		        			callback(results);
			            });
					}
				}
				else{
					modalAlert("An error as occurried when creating a new strain.", function(){});
					//objects_utils.show_message('project_message_div', 'warning', 'An error as occurried when creating a new strain.');
				}
			});
		},
		add_strain_to_project: function(strain_name, callback){
			add_strain_to_project(strain_name, function(results){
				callback(results, strain_name);
            });
		},
		update_strain: function(strain_id, key, value, callback){
			pg_requests.update_strain(strain_id, key, value, function(response){
				callback(response);
			});
		},
		update_metadata: function(strain_id, callback){
			pg_requests.update_metadata(strain_id, function(response){
				callback(response);
			});
		},
		get_no_pip_strains: function(callback){
			return strains_without_pip;
		},
		remove_strains_from_project: function(used_strains, callback){

			var strain_names = $.map($('#strains_table').DataTable().rows('.selected').data(), function(item){ return item['strainID']; });
		    var strain_indexes = $.map($('#strains_table').DataTable().rows('.selected').indexes(), function(index){ return index; });

		    strain_indexes.map(function(d){ delete pipelines_applied[d]; });

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
				                    	pg_requests.check_if_pipeline_exists(strains_dict[response.data.strainID], function(response, strainid){
				                    		if(response.status == 200){
				                    			console.log(response, pipelines_applied, strainid);

				                    			if(response.data.length > 0 && Object.keys(pipelines_applied).length != 0 && pipelines_applied[strainid].length > 0){
				                    				modalAlert("The applied pipeline is being used in other projects. A so, the strain will be removed from the project but the pipeline will still be available.", function(){
					                    				pg_requests.change_pipeline_from_project(strainid, true, "", function(response, strainid){
					                    					console.log(response, "DONE");
						                    			});
					                    			});
				                    			}
				                    			else{
				                    				pg_requests.change_pipeline_from_project(strainid, true, "", function(response, strainid){
				                    					console.log(response, "DONE");
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
				                //objects_utils.show_message('project_message_div', 'success', 'Strains removed from project.');
				        	}
				        });
			    	}
		    	});

		    }
		},
		apply_workflow: function(mode, type_proc, callback){

			var table = $('#strains_table').DataTable();

		    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
		        return index;
		    });

		    var strain_data = $.map(table.rows('.selected').data(), function(item){
		        return item;
		    });
		    //console.log(strain_data);
		    if (strain_data.length == 0) modalAlert('Select strains to apply procedures.', function(){});
		    	//objects_utils.show_message('project_message_div', 'warning', 'Select strains to apply procedures.');

		    //buttonselectedPipeline = '<button class="btn btn-sm btn-default">'+ $( "#pipeline_selector option:selected" ).val() + '</button>';

		    var counter = -1;
		    var workflow_names = [];
	        var workflowids = [];

	        var proc_value = "";
	        
	        if(type_proc == 'lab_protocol') proc_value = $( "#classifier_selector option:selected" ).val();
	        else if (type_proc == 'analysis_protocol') proc_value = $( "#pipeline_selector option:selected" ).val();
		    
		    for(i in strain_data){
		        var toAdd_analysis = '';
		        var toAdd_lab_protocols = '';
		        counter++;
		        //console.log(pipelines_applied)
		        var pip_start_id = 0;
		        //console.log(pipelines_applied[strain_data[counter]['strainID']])
		        if(pipelines_applied[strain_data[counter]['strainID']] != undefined && pipelines_applied[strain_data[counter]['strainID']].length != 0) pip_start_id = parseInt(pipelines_applied[strain_data[counter]['strainID']][pipelines_applied[strain_data[counter]['strainID']].length-1].split("id")[1].split('"')[1].split("_")[-2]);
		        //onclick="showCombinedReports(this)"
		        //console.log(pip_start_id, pipelines_applied);
		        if(mode == 'new'){
		        	
	        		buttonselectedPipeline = '<div class="dropdown" style="float:left;">'+
	        		'<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'">'+ proc_value + '</button>'+
						'<ul class="dropdown-menu" style="position:relative;">'+
					//'<li class="'+proc_value+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="showCombinedReports(this)"><a href="#">Add to Active Report</a></li>'+
					'<li class="'+proc_value+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesOutputs(this)"><a href="#">Get Results</a></li>'+
					'<li class="'+proc_value+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesLog(this)"><a href="#">Get Run Log</a></li>'+
					'<li class="'+proc_value+'&&'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="removeAnalysis(this)"><a href="#">Remove</a></li></ul></div>';

		        	just_button = '<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pip_start_id + 1)+ '_' + CURRENT_PROJECT_ID+'">'+ proc_value + '</button>';
			        

			        if(!pipelines_applied.hasOwnProperty(strain_data[counter]['strainID'])){
			        	pipelines_type_by_strain[strain_data[counter]['strainID']] = [[],[]];
			            pipelines_applied[strain_data[counter]['strainID']] = [];
			        }
			        if(String(pipelines_applied[strain_data[counter]['strainID']]).indexOf(proc_value) < 0){
			        	try{
				        	workflow_id_to_name[strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(pipelines_applied[strain_data[counter]['strainID']].length + 1) + '_' + CURRENT_PROJECT_ID] = proc_value;
				        }
				        catch(e){
				        	workflow_id_to_name[strain_data[counter]['strainID'].replace(/ /g, '_')+"_"+String(1)+ '_' + CURRENT_PROJECT_ID] = proc_value;
				        }

				        pipelines_applied[strain_data[counter]['strainID']].push(buttonselectedPipeline);
			        	if(type_proc == 'lab_protocol') pipelines_type_by_strain[strain_data[counter]['strainID']][0].push(buttonselectedPipeline.replace("&&&", "&&protocol"));
			        	else if (type_proc == 'analysis_protocol') pipelines_type_by_strain[strain_data[counter]['strainID']][1].push(buttonselectedPipeline.replace("&&&", ""));
			        }
			        
			        for(j in pipelines_type_by_strain[strain_data[counter]['strainID']]){
			        	//for(x in pipelines_type_by_strain[strain_data[counter]['strainID']][j]){
			        	if(j == 0) toAdd_lab_protocols += pipelines_type_by_strain[strain_data[counter]['strainID']][j];
	        			else if (j==1) toAdd_analysis += pipelines_type_by_strain[strain_data[counter]['strainID']][j];
			        	//}
			            //toAdd += pipelines_applied[strain_data[counter]['strainID']][j];
			        }
			    }
		        else if(mode=='same'){
		        	for(j in pipelines_type_by_strain[strain_data[counter]['strainID']]){
		        		//for(x in pipelines_type_by_strain[strain_data[counter]['strainID']][j]){
			        	if(j == 0) toAdd_lab_protocols += pipelines_type_by_strain[strain_data[counter]['strainID']][j];
	        			else if (j==1) toAdd_analysis += pipelines_type_by_strain[strain_data[counter]['strainID']][j];
			        	//}  //toAdd += pipelines_applied[strain_data[counter]['strainID']][j];
			        }
		        }

		        if(type_proc == 'lab_protocol') strain_data[i]['lab_protocols'] = toAdd_lab_protocols;
	        	else if (type_proc == 'analysis_protocol') strain_data[i]['Analysis'] = toAdd_analysis;

		        if(counter == strain_data.length-1){
		    		//objects_utils.show_message('project_message_div', 'success', 'Procedure applied.');
		    		modalAlert('Procedure applied.', function(){});
		        	callback({strains: strain_data, indexes:selected_indexes, workflow_names:workflow_names, workflow_ids: workflowids});
		        }
		        //table.cell(selected_indexes[i], -1).data(toAdd).draw(); 
		    
		    }
		},
		save_pipelines: function(callback){

			var table = $('#strains_table').DataTable();

		    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
		        return index;
		    });
		    index_length = selected_indexes.length;
		    count_finished = 0;
		    pipeline_ids = [];

		    for(i in selected_indexes){
		        create_pipeline(strains[selected_indexes[i]].strainID, function(strain_id, pipeline_id){
		        	strainID_pipeline[strain_id] = pipeline_id;
		        	pipeline_ids.push(pipeline_id);
		        	//console.log(strain_id, pipeline_id);

		        
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
			                workflowName = d.split('button')[1].split('>')[1].split('</')[0];
			                //console.log('WN', workflowName);

			                button_n = d.split("id")[1].split('"')[1];
			                //steps.push(x+1);
			                
			                //workflow_ids.push(pipelinesByName[workflowName]);
			                //console.log(current_job_status_color[button_n]);
			                if(current_job_status_color[button_n] == "#f75454") task_failed = true;
			                //console.log(task_failed);
			                
			                if(buttons_to_tasks[button_n] == undefined || task_failed == true){
			                	if(task_failed == true) clearInterval(intervals_running[buttons_to_tasks[button_n]]);
			                	
			                	buttons_to_tasks[button_n] = undefined;

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
			                	//console.log(counter_steps, pipelines_applied[strain_id_to_name[strain_id]].length);
			                	if(counter_steps == pipelines_applied[strain_id_to_name[strain_id]].length){
			                		pg_requests.change_pipeline_from_project(strain_id, 'remove_parent', pipeline_to_use, function(response, strain_id, pipeline_to_use){
			                			//console.log("Parent Removed")
			                			//Say that this process belongs to this project

			                			if(strain_to_real_pip.hasOwnProperty(strain_id)){
			                				strain_to_real_pip[strain_id].map(function(d){
				                				d[0] = CURRENT_PROJECT_ID;
				                			});
			                			}

			                			if(pipelines_type_by_strain[strain_id_to_name[strain_id]][2] != undefined) pipelines_type_by_strain[strain_id_to_name[strain_id]][2] = undefined;
			                			console.log(pipeline_to_use, workflow_ids, steps);

			                			ngs_onto_requests.ngs_onto_request_save_pipeline(pipeline_to_use, workflow_ids, steps, function(response){
					                		//console.log(response);
						                	if(response.status == 200){
						                		//console.log('SAVED!!!');
						                	}
						                	else console.log(response.statusText);

						                	count_finished += 1;

						                	if(count_finished == index_length){
								        		//objects_utils.show_message('project_message_div', 'success', 'Procedure state saved.');
								        		callback(true);

								        	}
						                });
			                		});
			                	}
			                	else{
			                		console.log(pipeline_to_use, workflow_ids, steps);
			                		ngs_onto_requests.ngs_onto_request_save_pipeline(pipeline_to_use, workflow_ids, steps, function(response){
				                		//console.log(response);
					                	if(response.status == 200){
					                		//console.log('SAVED!!!');
					                	}
					                	else console.log(response.statusText);

					                	count_finished += 1;

					                	if(count_finished == index_length){
							        		//objects_utils.show_message('project_message_div', 'success', 'Procedure state saved.');
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
		run_pipelines: function(){

			var table = $('#strains_table').DataTable();

		    var strain_names = $.map(table.rows('.selected').data(), function(item){
		        return item['strainID'];
		    });

		    var strain_submitter = $.map(table.rows('.selected').data(), function(item){
		        return item['Submitter'];
		    });

		    countWorkflows = 0;
		    countFinished = 0;
		    var dict_strain_names = {};
		    var put_i = [];

		    for(i in strain_names){

		        put_i.push(i);
		        //indexes = '';
		        if(pipelines_applied[strain_names[i]] != undefined){

		        	dict_strain_names[strain_names[i]] = [pipelines_applied[strain_names[i]].length, [], 0, 0];
		        	//console.log(pipeline_ids_parents);
		        	var pip_id_of_parents = [];
		        	for(p in strain_to_real_pip[strains_dict[strain_names[i]]]){
		        		if(strain_to_real_pip[strains_dict[strain_names[i]]][p][0] != CURRENT_PROJECT_ID && pipelines_type_by_strain[strain_names[i]][2] != undefined){

			        		pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_names[i]]][p][0]);
			        		pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_names[i]]][p][1]);
			        		pip_id_of_parents.push(strain_to_real_pip[strains_dict[strain_names[i]]][p][2]);
			        	}
		        	}
		        	
		        	if(pip_id_of_parents.length == 0){
		        		var lastprocess = "";
		        		var last_pipeline_id = "";
			        	//console.log(pipelines_applied);
			        	var count_processes = 0;
			        	var has_completed = false;
			        	for(x in pipelines_applied[strain_names[i]]){
			        		count_processes += 1;
			        		var pip_name = pipelines_applied[strain_names[i]][x].split("id")[1].split('"')[1];
			        		console.log(dict_of_tasks_status[buttons_to_tasks[pip_name]], count_processes);
			        	
			        		if(dict_of_tasks_status[buttons_to_tasks[pip_name]] != "COMPLETED" && count_processes != 1){
			        			lastprocess = count_processes-1;
			        			last_pipeline_id = strainID_pipeline[strains_dict[strain_names[i]]];
			        		}

			        		if(dict_of_tasks_status[buttons_to_tasks[pip_name]] == "COMPLETED") has_completed = true;

			        	}
			        	if(lastprocess != "" && has_completed == true){
			        		pip_id_of_parents.push(CURRENT_PROJECT_ID);
			        		pip_id_of_parents.push(last_pipeline_id);
			        		pip_id_of_parents.push(lastprocess);
			        	}
		        	}
		        	
		        	//console.log(pip_id_of_parents);
		        	
		        	//console.log(strainID_pipeline[strains_dict[strain_names[i]]], strains_dict[strain_names[i]], i, pip_id_of_parents, pipelines_type_by_strain[strain_names[i]]);
		        	ngs_onto_requests.ngs_onto_request_add_processes(strainID_pipeline[strains_dict[strain_names[i]]], strains_dict[strain_names[i]], i, pip_id_of_parents, pipelines_type_by_strain[strain_names[i]], function(response, strain_name){

	        			if(response.status != 404){
	        				dict_strain_names[strain_names[strain_name]].push(response.data);
	        			}
	        			//console.log("DONE NGSOnto");

	        			//console.log(dict_strain_names[strain_names[strain_name]][4]);

	        			//Push button identifier
	        			dict_strain_names[strain_names[strain_name]].push([]);

	        			//Push process position
	        			dict_strain_names[strain_names[strain_name]].push([]);
	        			dict_strain_names[strain_names[strain_name]].push(0);

	        			//Push workflow ID
	        			dict_strain_names[strain_names[strain_name]].push({});

	        			count_pipelines_applied = 0;

			        	for(p in pipelines_applied[strain_names[strain_name]]){
			        		//console.log(pipelines_applied, pipelines_applied[strain_names[strain_name]]);
			        		var pi_name = pipelines_applied[strain_names[strain_name]][p].split("id")[1].split('"')[1];
			        		
			        		//console.log(strain_names, strain_name, pi_name, dict_strain_names);
			        		//console.log(buttons_to_tasks);			        		
			        		if(buttons_to_tasks[pi_name] == undefined){
			        			dict_strain_names[strain_names[strain_name]][1].push(pipelines_applied[strain_names[strain_name]][p].split('button')[1].split('>')[1].split('<')[0]);
			        			dict_strain_names[strain_names[strain_name]][5].push(pi_name);
			        		}
			        		else{
			        			dict_strain_names[strain_names[strain_name]][2]+=1;
			        			dict_strain_names[strain_names[strain_name]][7] += 1;
		        				//dict_strain_names[strain_names[strain_name]][6].push(dict_strain_names[strain_names[strain_name]][7]);

			        		}
				
				        	//var indexes = '';
				        	//console.log(dict_strain_names);
				        	//console.log('####################GET WORKFLOW###################');

		        			while(dict_strain_names[strain_names[strain_name]][1].length != 0){
		        				workflowName = dict_strain_names[strain_names[strain_name]][1].shift();
		        				count_pipelines_applied += 1;
				        		dict_strain_names[strain_names[strain_name]][8][count_pipelines_applied] = "";

		        				dict_strain_names[strain_names[strain_name]][7] += 1;
		        				dict_strain_names[strain_names[strain_name]][6].push(dict_strain_names[strain_names[strain_name]][7]);

		        				ngs_onto_requests.ngs_onto_request_get_workflow(pipelinesByName[workflowName], strain_name, count_pipelines_applied, function(response, strain_name, count_pip_app){
		        					//console.log(response, strain_name);
		        					//console.log(dict_strain_names[strain_names[strain_name]][6]);
			        				dict_strain_names[strain_names[strain_name]][2]+=1;

			        				for(k=response.data.length-1; k>=0;k--){
			        					parts = response.data[k].protocol.split('/');
			        					parts = parts[parts.length-1];
			        					dict_strain_names[strain_names[strain_name]][8][count_pip_app] = parts.replace('>', '');
			        					//indexes += parts.replace('>', '') + ',';
			        				}

			        				if (dict_strain_names[strain_names[strain_name]][0] == dict_strain_names[strain_names[strain_name]][2]){
			        					
			        					var indexes = '';

			        					for(prot_index in dict_strain_names[strain_names[strain_name]][8]){
			        						indexes += dict_strain_names[strain_names[strain_name]][8][prot_index].replace('>', '') + ',';
			        					}

			        					//console.log(indexes);
					        			indexes = indexes.replace(/,$/, '');
					        			//console.log(strainID_pipeline[strains_dict[strain_names[strain_name]]], dict_strain_names[strain_names[strain_name]][6]);
					        			pg_requests.run_job(strains_dict[strain_names[strain_name]], indexes, strainID_pipeline[strains_dict[strain_names[strain_name]]], dict_strain_names[strain_names[strain_name]][6], strain_name, strain_submitter[strain_name], function(response, strain_name){
					        				console.log('RUNNING JOB');

					        				task_ids = [];
					        				task_ids_to_map = [];

					        				dict_strain_names[strain_names[strain_name]][3] += 1;

					        				//console.log( dict_strain_names[strain_names[strain_name]][5]);
					        				
					        				var countTasks = 0;
					        				for(l in response.data){
					        					//console.log(response.data);
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
					        						for(s in task_ids){
					        							countTasks++;
					        							var button_name = dict_strain_names[strain_names[strain_name]][5].shift();
						        						tasks_to_buttons[task_ids[s]] = button_name;//strain_names[strain_name].replace(/ /g, "_") + '_' + String(countTasks) + '_' + CURRENT_PROJECT_ID;
						        						buttons_to_tasks[button_name] = task_ids[s];
						        						buttons_to_strain_names[button_name] = strain_names[strain_name];
					        							task_ids_to_map.push(task_ids[s]);
					        						}

					        						processes_to_map = task_ids_to_map.map(function(x){
					        							//console.log(x, dict_strain_names[strain_names[strain_name]]);
					        							return dict_strain_names[strain_names[strain_name]][4].shift();
							        				});
					        					}
					        				}



					        				ngs_onto_requests.ngs_onto_request_add_jobid_to_process(strainID_pipeline[strains_dict[strain_names[strain_name]]], processes_to_map, task_ids_to_map, strain_name, function(response, strain_name){
		        								//console.log(strainID_pipeline, strain_name);
		        								for(tk in response.data.tasks){
		        									dict_of_tasks_status[response.data.tasks[tk]] = '';
		        									if(response.data.tasks[tk].indexOf('null') < 0) periodic_check_job_status(response.data.tasks[tk], dict_of_tasks_status, strain_names[strain_name], response.data.tasks[tk], strainID_pipeline[strains_dict[strain_names[strain_name]]], CURRENT_PROJECT_ID);
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
		get_ids_from_processes: function(callback){

			
			for(i in intervals_running){
				clearInterval(intervals_running[i]);
			}
			intervals_running = {};

			array_of_strains = []
			strain_array = []
			prevjobid = '';
			//console.log(strains);
			countstrains = 0;
			count_processes = 0;

			console.log('AQUI');

			var countStrain = {};
			console.log(strain_to_real_pip);
			console.log(strains);
			if (strains.length == 0) return callback({strains:[]});
			for(i in strains){
				//array_of_strains.push(strains[i]);
				//p_id_to_use = injected_pipelines[strains_dict[strains[i].strainID.trim()]] == undefined ? CURRENT_PROJECT_ID: injected_pipelines[strains_dict[strains[i].strainID.trim()]];
				p_id_to_use = CURRENT_PROJECT_ID;

				if(strains[i] == undefined) continue;

				var strain_processes = strain_to_real_pip[strains_dict[strains[i].strainID]];
				//console.log(strain_processes);
				count_processes += strain_processes == undefined ? 0 : strain_processes.length;

				countStrain[strains[i].strainID] = 0;

				for(s_p in strain_processes){

					ngs_onto_requests.ngs_onto_request_get_jobid_from_process(strain_processes[s_p][1], [strain_processes[s_p][2]], strain_processes[s_p][0], strains[i].strainID, countStrain, function(response, pr_ids, strain_id, count_process, pip_id, proj_id){
						strain_id = strain_id.trim();
						console.log("###############");
						console.log(response);

						//console.log(pr_ids);
						for(l in response.data){
							if(response.data[l].length != 0){
								t_id = response.data[l][0].jobid.split('^')[0].split('"')[1];
								//if (t_id.split('_')[0] != prevjobid) count+=1;
								count_process[strain_id]+=1;
								tasks_to_buttons[t_id] = strain_id.replace(/ /g, "_") + '_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID;
								buttons_to_tasks[strain_id.replace(/ /g, "_") + '_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID] = t_id;
								buttons_to_strain_names[strain_id.replace(/ /g, "_") + '_' + String(response.data[l][0].process_id) + '_' + CURRENT_PROJECT_ID] = strain_id;
								prevjobid = t_id.split('_')[0];
								dict_of_tasks_status[t_id] = '';
								//console.log(strain_id, pip_id);
								//console.log(buttons_to_tasks);
								periodic_check_job_status(t_id, dict_of_tasks_status, strain_id, pr_ids[l], pip_id, proj_id);
							}
						}
						countstrains += 1;

						//Fix workflows positions
						if(countstrains == count_processes){
							var table = $('#strains_table').DataTable();
							var strain_data = $.map(table.rows().data(), function(item){
						        return item;
						    });
						    //console.log(strain_data);
						    toAdd_lab_protocols = "";
						    toAdd_analysis = "";

						    for(x in strain_data){
						    	toAdd_lab_protocols = "";
						    	toAdd_analysis = "";
						    	var s_name = strain_data[x]['strainID'];
						    	//console.log(pipelines_applied[s_name]);
						    	//console.log(pipelines_applied, pipelines_applied[s_name]);
						    	for(j in pipelines_applied[s_name]){
						    			console.log(pipelines_applied[s_name][j], s_name, pipelines_applied);
						    			pipeline_id = pipelines_applied[s_name][j].split('id="')[1].split('"')[0];
						    			console.log(pipeline_id);
						    			console.log(buttons_to_tasks);
						    			if(buttons_to_tasks[pipeline_id].indexOf("null")>-1){
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
					})
				}

				/*ngs_onto_requests.ngs_onto_request_get_processes(strainID_pipeline[strains_dict[strains[i].strainID.trim()]], p_id_to_use, function(response){
					var processes_ids = [];

					console.log(response);

					if(response.status == 200){
						strain_to_use = array_of_strains.shift();
						//console.log(strain_to_use);
						
						for(p in response.data){
							processes_ids.push(response.data[p].split('/').slice(-1)[0].split('>')[0])
						} 
						strain_array.push(strain_to_use);
						//console.log(processes_ids);

						ngs_onto_requests.ngs_onto_request_get_jobid_from_process(strainID_pipeline[strains_dict[strain_to_use.strainID.trim()]], processes_ids, p_id_to_use, function(response, pr_ids){
							strain_id = strain_array.shift().strainID.trim();
							count = 0;

							//console.log(pr_ids);

							for(l in response.data){
								if(response.data[l].length != 0){
									t_id = response.data[l][0].jobid.split('^')[0].split('"')[1];
									//if (t_id.split('_')[0] != prevjobid) count+=1;
									count+=1;
									tasks_to_buttons[t_id] = strain_id.replace(/ /g, "_") + '_' + String(count) + '_' + CURRENT_PROJECT_ID;
									buttons_to_tasks[strain_id.replace(/ /g, "_") + '_' + String(count) + '_' + CURRENT_PROJECT_ID] = t_id;
									buttons_to_strain_names[strain_id.replace(/ /g, "_") + '_' + String(count) + '_' + CURRENT_PROJECT_ID] = strain_id;
									prevjobid = t_id.split('_')[0];
									dict_of_tasks_status[t_id] = '';
									periodic_check_job_status(t_id, dict_of_tasks_status, strain_id, pr_ids[l]);
								}
							}
							countstrains += 1;

							//Fix workflows positions
							if(countstrains == strains.length){
								var table = $('#strains_table').DataTable();
								var strain_data = $.map(table.rows().data(), function(item){
							        return item;
							    });
							    //console.log(strain_data);
							    toAdd_lab_protocols = "";
							    toAdd_analysis = "";

							    for(x in strain_data){
							    	var s_name = strain_data[x]['strainID'];
							    	//console.log(pipelines_applied[s_name]);
							    	for(j in pipelines_applied[s_name]){
							    			//console.log(pipelines_applied[s_name][j]);
							    			pipeline_id = pipelines_applied[s_name][j].split('id="')[1].split('"')[0];
							    			console.log(pipeline_id);
							    			console.log(buttons_to_tasks);
							    			if(buttons_to_tasks[pipeline_id].indexOf("null")>-1){
							    				pipelines_type_by_strain[s_name][0].push(pipelines_applied[s_name][j].replace("&&&", "&&protocol"));
							    				toAdd_lab_protocols += pipelines_applied[s_name][j].replace("&&&", "&&protocol");
							    			}
							    			else{
							    				pipelines_type_by_strain[s_name][1].push(pipelines_applied[s_name][j].replace("&&&", ""));
							    				toAdd_analysis += pipelines_applied[s_name][j].replace("&&&", "");
							    			}
								    }
								    strain_data[x]["Analysis"] = toAdd_analysis;
								    strain_data[i]['lab_protocols'] = toAdd_lab_protocols;

							    }
							    callback({strains:strain_data});
							}
						})
					}
				})*/
			}			
		},
		show_combined_reports: function(button_text){
			button_parts = button_text.split('&&');
			button_id = button_text.split('&&')[1];
			workflow_name = button_text.split('&&')[0];
			console.log(button_parts);
			if(button_parts.length > 2){
				ngs_onto_requests.ngs_onto_request_get_workflow(pipelinesByName[workflow_name], "", 0, function(response, strain_name, count_pip_app){
					console.log(response);
					indexes = "";
					for(k=response.data.length-1; k>=0;k--){
    					parts = response.data[k].protocol.split('/');
    					parts = parts[parts.length-1];
    					indexes += parts.replace('>', '') + ',';
    				}
    				indexes = indexes.replace(/,$/, '');
    				pg_requests.get_protocols_by_ids(indexes, function(response){
    					protocols_in_use = [];
    					for (x in response.data){
    						protocol_object = JSON.parse(response.data[x].steps);
    						protocol_object.protocol_name = response.data[x].name;
    						protocols_in_use.push(protocol_object)
    					}
    					$rootScope.protocols_in_use = protocols_in_use;
    					//console.log(response);
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


				//$('#reports_button').trigger("click");
			}
		},
		get_processes_outputs: function(button_class, callback){
			button_id = button_class.split('&&')[1];
			process_id = String(parseInt(buttons_to_tasks[button_id].split('_')[1]) + 1);
			button_position = parseInt(button_id.split('_').slice(-2)[0]);
			pipeline_id = String(strainID_pipeline[strains_dict[buttons_to_strain_names[button_id]]]);
			real_p_data = strain_to_real_pip[strains_dict[buttons_to_strain_names[button_id]]][button_position-1];

			ngs_onto_requests.ngs_onto_request_get_processes_outputs(real_p_data[0], real_p_data[1], real_p_data[2], function(response){
				callback(response);
			});
		},
		download_result: function(response, callback){
			console.log("Download", response);
			if(response.data.length == 0){
				return modalAlert('The requested file is not available.', function(){});
				//return objects_utils.show_message('project_message_div', 'warning', 'The requested file is not available.');
			}
			f_path = response.data[0].file_3.split('^^')[0].replace(/"/g, "")
			//console.log(f_path);
			pg_requests.download_file(f_path, function(response){
				callback();
			});
		},
		download_log: function(response, callback){
			console.log("Download", response);
			if(response.data.length == 0){
				return modalAlert('The requested file is not available.', function(){});
				//return objects_utils.show_message('project_message_div', 'warning', 'The requested file is not available.');
			}
			f_path = response.data[0].file_4.split('^^')[0].replace(/"/g, "")
			//console.log(f_path);
			pg_requests.download_file(f_path, function(response){
				callback();
			});
		},
		remove_analysis: function(element, callback){
			var class_n = element.className;
			var sp_name = class_n.split('&&')[1];
			var button_m = element.parentElement.parentElement.getElementsByTagName("button")[0];
			console.log(button_m);
			//console.log(element, element.parentElement.parentElement.remove(), pipelines_applied);
			var strain_indexes = $.map($('#strains_table').DataTable().rows().indexes(), function(index){ return index; });
			var strain_names = $.map($('#strains_table').DataTable().rows().data(), function(item){ console.log(item);return item.strainID; });
			
			var new_pipapplied = [];
			var new_pipapplied_prot = [];
			var new_pipapplied_proc = [];
			//console.log(strain_names);
			var last_process = "";

			var count_pipeline_ids_last_parent = 0;
			//var first_time = true;

			for(index in strain_indexes){
					new_pipapplied = [];
					new_pipapplied_prot = [];
					new_pipapplied_proc = [];
					//console.log(sp_name, strain_names[index]);
					count_pipeline_ids_last_parent = 0;
					//console.log(sp_name, strain_names[index], sp_name.indexOf(strain_names[index]));
					if(sp_name.indexOf(strain_names[index].replace(/ /g, "_")) > -1){
						for (pipeline in pipelines_applied[strain_names[index]]){
					
							count_pipeline_ids_last_parent += 1;
							console.log(dict_of_tasks_status);
							last_process = count_pipeline_ids_last_parent;
							
							
							//console.log(pipelines_applied[strain_names[index]][pipeline], class_n, pipelines_applied[strain_names[index]][pipeline].indexOf(class_n))
							if(pipelines_applied[strain_names[index]][pipeline].indexOf(class_n) < 0) {
								
								new_pipapplied.push(pipelines_applied[strain_names[index]][pipeline]);
								
								for(x in pipelines_type_by_strain[strain_names[index]][0]){
									if(pipelines_type_by_strain[strain_names[index]][0][x].indexOf(class_n) < 0){
										new_pipapplied_prot.push(pipelines_type_by_strain[strain_names[index]][0][x]);
									}
								}
								for(y in pipelines_type_by_strain[strain_names[index]][1]){
									if(pipelines_type_by_strain[strain_names[index]][1][y].indexOf(class_n) < 0){
										new_pipapplied_proc.push(pipelines_type_by_strain[strain_names[index]][1][y]);
									}
									
								}

								var pip_name = pipelines_applied[strain_names[index]][pipeline].split("id")[1].split('"')[1];

								console.log(pip_name, buttons_to_tasks);
								if(dict_of_tasks_status[buttons_to_tasks[pip_name]] == "COMPLETED"){
									if(pipelines_type_by_strain[strain_names[index]][2] == undefined){
										console.log(last_process)
										pipelines_type_by_strain[strain_names[index]].push(last_process);
									}
									else pipelines_type_by_strain[strain_names[index]][2] = last_process;
								}
							}
						}
						pipelines_applied[strain_names[index]] = new_pipapplied;

						pipelines_type_by_strain[strain_names[index]][0] = new_pipapplied_prot;
						pipelines_type_by_strain[strain_names[index]][1] = new_pipapplied_proc;

						clearInterval(intervals_running[buttons_to_tasks[sp_name]]);
						delete current_job_status_color[sp_name];
						delete tasks_to_buttons[buttons_to_tasks[sp_name]];
						delete buttons_to_tasks[sp_name];
						console.log(intervals_running, buttons_to_tasks[sp_name], tasks_to_buttons, current_job_status_color, pipelines_type_by_strain);
					}
			}
			element.parentElement.parentElement.remove()
			callback();
			//console.log(pipelines_applied);

		},
		get_user_files: function(callback){
			pg_requests.get_user_files(function(response){
				callback(response);
			});
		},
		load_strains_from_file: function(input_element, separator, callback){

			function select_option(select_id, i) {
			  return $('#'+select_id+' select option[value="' + i + '"]').html();
			}

			var reader = new FileReader();

	      	reader.onload = function(f){
		      	var lines = this.result.split('\n');
		      	firstLine = true;
		      	strains_object = {};
		      	console.log(lines);

		      	strains_object['body'] = [];
		      	
		      	//parse file
		      	for(i in lines){
		      		line  = lines[i].split(separator);
		      		console.log(line);
		      		var array_to_use = [];

		      		//console.log(line);
		      		
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
		      		for (x in line_to_use){
		      			var hline_to_use = strains_object['headers'];
		      			var bline_to_use = line_to_use;

		      			if(hline_to_use[x].indexOf("File_1") > -1 || hline_to_use[x].indexOf("File_2") > -1){
		      				//check for files in user area
		      				has_files += 1;

		      				$('#'+hline_to_use[x] + " option").filter(function() {
							    //may want to use $.trim in here
							    if($(this).text().trim().indexOf(bline_to_use[x].trim()) > -1){
							    	console.log(hline_to_use[x], bline_to_use[x]);
							    	return bline_to_use[x];
							    }
							    //console.log($(this).text().replace(" ",""), bline_to_use[x].trim());
							    //if($(this).text().trim() == bline_to_use[x].trim()) console.log($(this).text().trim(), bline_to_use[x].trim());
							    //return $(this).text().trim() == bline_to_use[x].trim(); 
							}).prop('selected', true);
						}
						else $('#'+hline_to_use[x]).val(bline_to_use[x]);
		      		}
		      		setTimeout(function(){
		      			if (has_files == 2) $('#newstrainbuttonsubmit').trigger("submit");
		      			console.log("ENTER");
		      			if(strains_object['body'].length != 0) add_to_database();
		      			else console.log("DONE");
		      		}, 1000);

		      	}

		      	add_to_database();
		      	
		      	/*for (l in strains_object['body']){
		      		for (x in strains_object['body'][l]){
		      			var hline_to_use = strains_object['headers'];
		      			var bline_to_use = strains_object['body'][l];

		      			if(hline_to_use[x].indexOf("File_1") > -1 || hline_to_use[x].indexOf("File_2") > -1){
		      				console.log("AQUI", hline_to_use[x]);
		      				$('#'+hline_to_use[x] + " option").filter(function() {
							    //may want to use $.trim in here
							    if($(this).text().indexOf(bline_to_use[x]) > -1){
							    	console.log(hline_to_use[x], bline_to_use[x]);
							    	return bline_to_use[x];
							    }
							    //console.log($(this).text().replace(" ",""), bline_to_use[x].trim());
							    //if($(this).text().trim() == bline_to_use[x].trim()) console.log($(this).text().trim(), bline_to_use[x].trim());
							    //return $(this).text().trim() == bline_to_use[x].trim(); 
							}).prop('selected', true);
						}
						else $('#'+hline_to_use[x]).val(bline_to_use[x]);
		      		}
		      		$('#newstrainbuttonsubmit').trigger("submit");
		      	}*/


		    };

		    $('#status_upload_from_file').empty();

	      	reader.readAsText(input_element.files[0]);
		}

	}

	return returned_functions;
}