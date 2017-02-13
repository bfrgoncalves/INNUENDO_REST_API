function Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http){

	var project = {}, pipelinesByName = {}, pipelinesByID = {}, strainID_pipeline = {}, strains_dict = {}, strain_id_to_name = {}, pipelines_applied = {};
	var tasks_to_buttons = {};
	var dict_of_tasks_status = {};
    var specie_name = "", species_id = "";
    var strains = [], pipelines = [], strains_headers = [], public_strains = [], files = [];
    var strainid_processes_buttons = {}

    var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    var ngs_onto_requests = new ngs_onto_client(CURRENT_PROJECT_ID, $http);
    var objects_utils = new Objects_Utils();

    status_dict = {'R': '#42c2f4', 'PD': '#f49542', 'C': '#42f442'}


    function add_strain_to_project(strain_name, callback){

		pg_requests.add_strain_to_project(strain_name, function(response){
			if(response.status == 200){
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

	                objects_utils.show_message('project_strain_message_div', 'success', 'Strains were added to the project.');
	                callback({ strains_headers: strains_headers, strains: strains});
	            
	            }
	 			else callback({ strains_headers: strains_headers, strains: strains});
	            //objects_utils.loadDataTables('strains_table', strains);
			}
			else{
				objects_utils.loadDataTables('strains_table', strains);
        		objects_utils.show_message('project_strain_message_div', 'warning', response.data.message.split('.')[0]+'.');
			}
		});
	}

	function create_pipeline(strain_Name, callback){
		strain_Name = $.trim(strain_Name);
		console.log(strains_dict, strain_Name);
		strain_id = strains_dict[strain_Name];
		var new_pipeline_id = '';
		pg_requests.check_if_pipeline_exists(strain_id, function(response, strainid){
			if(response.status == 200){
				console.log("Pipeline already exists");
	            callback(strainid, response.data.id);
			}
			else{
				console.log(strainid);
				pg_requests.add_pipeline(strainid, function(response){
					console.log(response);
					if(response.status == 201){
						new_pipeline_id = response.data.id;
						ngs_onto_requests.ngs_onto_request_create_pipeline(response.data.id, response.data.strain_id, function(response, strain_id){
							callback(strain_id, new_pipeline_id);
						});
					}
					else console.log(response.statusText);
				});
			}
		});
	}

	function periodic_check_job_status(job_id, dict_of_tasks_status){

		function get_status(job_id){


			console.log(job_id);
			pg_requests.get_job_status(job_id, function(response){
				console.log(response, tasks_to_buttons, response.data[0]);
				if(response.data != false){
					task_id = response.data[0];
					status = response.data[1];

					if (dict_of_tasks_status[task_id.split('_')[0]] != 'R'){
						dict_of_tasks_status[task_id.split('_')[0]] = status;
						$('#' + tasks_to_buttons[task_id]).css({'background-color': status_dict[status]});
					}
					prevtaskid = task_id;

				}
				else{
					//if(prevtaskid != '') {
						dict_of_tasks_status[job_id.split('_')[0]] = 'C';
						$('#' + tasks_to_buttons[job_id]).css({'background-color': status_dict['C']});
					//}
					clearInterval(periodic_check);
				}
				//map to workflow_id
			})

		}

		prevtaskid = '';

		//get_status(job_id);

		var periodic_check = setInterval(function(){ get_status(job_id); }, 20000);

	}


    var returned_functions = {

	    get_workflows: function(callback){

			pg_requests.get_workflows(function(response){
				console.log(response);
				if(response.status == 200){
					if (typeof response.data != 'string'){
		                for (i in response.data){
		                    pipelinesByName[response.data[i].name] = response.data[i].id;
		                    pipelinesByID[response.data[i].id] = response.data[i].name;
		                }
		            }
		            callback(response.data);
				}
				else console.log(response.statusText);

			});
		},
		get_strains: function(callback){

			pg_requests.get_strains(function(response){
				if(response.status == 200){

					var max_headers = 0;
		            var data = response.data;
		            objects_utils.destroyTable('public_strains_table');
		            var new_strains = [];

		            if (data.length != 0){

		                public_strains_headers = JSON.parse(data[0].fields).metadata_fields;
		                public_strains_headers.unshift("strainID");

		                public_strains_headers.push('Analysis');

		                for (i in data){

		                    strain_id_to_name[data[i].id] = $.trim(data[i].strainID);

		                    var strain_data = JSON.parse(data[i].strain_metadata);
		                    strain_data["strainID"] = data[i].strainID;
		                    strain_data['Analysis'] = "";
		                    var sd = {};
		                    for (i in public_strains_headers){
		                        if(strain_data.hasOwnProperty(public_strains_headers[i])){
		                            sd[public_strains_headers[i]] = strain_data[public_strains_headers[i]];
		                        }
		                    }
		                    new_strains.push(sd);
		                }
		                public_strains = new_strains;
		                
		            }
		            callback({ public_strains_headers: public_strains_headers, public_strains: public_strains});
				}
				else console.log(response.statusText);


			})
		},
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
				else console.log(response.statusText);
			});
		},
		get_applied_pipelines: function(callback){

			pg_requests.get_applied_pipelines(function(response){
				console.log(response);
				var total_pipelines = response.data.length;
				var processed_responses = 0;
				if (response.status == 200){
					for (i in response.data){

		                strainID_pipeline[response.data[i].strain_id] = response.data[i].id;
		                strainid_processes_buttons[response.data[i].strain_id] = [{}];
		                console.log(response.data[i].id, response.data[i].strain_id);
		                ngs_onto_requests.ngs_onto_request_applied_pipelines(response.data[i].id, response.data[i].strain_id, function(response, strain_id){
		                	console.log(response);
		                	counter = 0;
		                	if(response.status == 200){
		                		var appliedPipelines = [];
					            for (w in response.data){
					            	console.log(response.data[w]);
					                workflow_id = response.data[w].workflowURI.split('<')[1].split('>')[0].split('/');
					                workflow_id = workflow_id[workflow_id.length-1];
					                appliedPipelines.push(workflow_id);
					                appliedPipelines = appliedPipelines.reverse();
					                counter += 1;
					                strainid_processes_buttons[strain_id][0][counter] = pipelinesByID[workflow_id];
					            }
					            //processed_responses += 1;
					            console.log(appliedPipelines, pipelinesByID, pipelines_applied);
					            
					            objects_utils.apply_pipeline_to_strain('strains_table', strain_id_to_name[strain_id], appliedPipelines, pipelinesByID, pipelines_applied);
		                	}
		                	else console.log(response.statusText);
		                });
		            }
		            callback();
		        }
		        else console.log(response.statusText);
			});
		},
		get_uploaded_files: function(callback){

			pg_requests.get_uploaded_files(function(response){
				if (response.status == 200){
					callback(response.data.files);
				}
				else console.log(response.statusText);
			});

		},
		add_database_strains: function(callback){

			var strain_names = $.map($('#public_strains_table').DataTable().rows('.selected').data(), function(item){
		        return item[1];
		    });

		    if(strain_names.length > 0){
		        objects_utils.destroyTable('strains_table');
		        for(i in strain_names){
		            add_strain_to_project(strain_names[i], function(results){
		            	callback(results);
		            });
		        }
		    }
		    else objects_utils.show_message('database_strain_message_div', 'warning', 'Please select some strains first.');
		},
		add_new_strain: function(callback){

			pg_requests.add_new_strain(function(response){
				console.log(response);
				if(response.status == 201){
					strain_id_to_name[response.data.id] = response.data.strainID;
	        		add_strain_to_project(response.data.strainID, function(results){
	        			callback(results);
		            });
				}
				else{
					console.log(response.statusText);
					objects_utils.show_message('new_strain_message_div', 'warning', 'An error as occurried when creating a new strain.');
				}
			});
		},
		remove_strains_from_project: function(used_strains, callback){

			var strain_names = $.map($('#strains_table').DataTable().rows('.selected').data(), function(item){ return item[1]; });
		    var strain_indexes = $.map($('#strains_table').DataTable().rows('.selected').indexes(), function(index){ return index; });

		    strain_indexes.map(function(d){ delete pipelines_applied[d]; });

		    objects_utils.destroyTable('strains_table');

		    var to_use = used_strains;

		    while(strain_names.length != 0){

		        strain_name = strain_names.pop();
		        console.log(strain_name);
		        pg_requests.remove_strain_from_project(strain_name, function(response){
		        	if(response.status == 200){
		        		var new_strains = [];
		                to_use.map(function(d){
		                    if (d.strainID != response.data.strainID) new_strains.push(d);
		                    else{
		                    	pg_requests.check_if_pipeline_exists(strains_dict[response.data.strainID], function(response, strainid){
		                    		if(response.status == 200){
		                    			pg_requests.remove_pipeline_from_project(strainid, function(response){
		                    			});
		                    			ngs_onto_requests.ngs_onto_request_remove_pipeline(response.data.id, function(response){
		                    				console.log('removed');
		                    			});
		                    		}
		                    	});
		                    }
		                })
		                to_use = new_strains;
		                objects_utils.show_message('project_strain_message_div', 'success', 'Strains removed from project.');
		        	}
		        	else{
		        		console.log(response.statusText);
		        		objects_utils.show_message('project_strain_message_div', 'warning', 'An error occurried when removing strains from project.');
		        	}
		        });
		    }
		    setTimeout(function(){strains = to_use; callback({strains: to_use});}, 400);
		},
		apply_workflow: function(callback){

			var table = $('#strains_table').DataTable();

		    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
		        return index;
		    });

		    var strain_names = $.map(table.rows('.selected').data(), function(item){
		        return item[1];
		    });

		    //buttonselectedPipeline = '<button class="btn btn-sm btn-default">'+ $( "#pipeline_selector option:selected" ).val() + '</button>';

		    var counter = -1;

		    for(i in selected_indexes){
		        var toAdd = '';
		        counter++;

		        try{
		        	buttonselectedPipeline = '<button class="btn btn-sm btn-default" id="'+strain_names[counter].replace(/ /g, '_')+"_"+String(pipelines_applied[strain_names[counter]].length + 1)+'">'+ $( "#pipeline_selector option:selected" ).val() + '</button>';
		        }
		        catch(e){
		        	buttonselectedPipeline = '<button class="btn btn-sm btn-default" id="'+strain_names[counter].replace(/ /g, '_')+"_"+String(1)+'">'+ $( "#pipeline_selector option:selected" ).val() + '</button>';
		        }
		        
		        
		        if(!pipelines_applied.hasOwnProperty(strain_names[counter])){
		            pipelines_applied[strain_names[counter]] = [];
		        }
		        if(pipelines_applied[strain_names[counter]].indexOf(buttonselectedPipeline) < 0){
		        	//buttonselectedPipeline = '<button class="btn btn-sm btn-default">'+ $( "#pipeline_selector option:selected" ).val() + '</button>';

		        	pipelines_applied[strain_names[counter]].push(buttonselectedPipeline);
		        }
		        
		        for(j in pipelines_applied[strain_names[counter]]){
		            toAdd += pipelines_applied[strain_names[counter]][j];
		        }

		        table.cell(selected_indexes[i], -1).data(toAdd).draw();
		    
		    }
		    if (selected_indexes.length == 0) objects_utils.show_message('project_procedures_message_div', 'warning', 'Select strains to apply procedures.');
		    else objects_utils.show_message('project_procedures_message_div', 'success', 'Procedure applied.');
		    callback();
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
		        	count_finished += 1;
		        	strainID_pipeline[strain_id] = pipeline_id;
		        	pipeline_ids.push(pipeline_id);
		        	if(pipelines_applied.hasOwnProperty(strain_id_to_name[strain_id])){
		        		pipeline_to_use = pipeline_ids.shift()
		        		pipelines_applied[strain_id_to_name[strain_id]].map(function(d, x){
			                workflowName = d.split('>')[1].split('</')[0];
			                ngs_onto_requests.ngs_onto_request_save_pipeline(pipeline_to_use, pipelinesByName[workflowName], x, function(response){
			                	if(response.status == 200){
			                		console.log('SAVED!!!');
			                	}
			                	else console.log(response.statusText);
			                });
		            	});
			        	if(count_finished == index_length){
			        		objects_utils.show_message('project_procedures_message_div', 'success', 'Procedure state saved.');
			        		callback();
			        	}
		        	}
		        });

		    }
		},
		run_pipelines: function(){

			var table = $('#strains_table').DataTable();

		    var strain_names = $.map(table.rows('.selected').data(), function(item){
		        return item[1];
		    });

		    countWorkflows = 0;
		    countFinished = 0;
		    var dict_strain_names = {};
		    var put_i = [];
		    var new_stu = [];
		    var strain_to_slurm = [];
		    for(i in strain_names){
		        //workflowNames = [];
		        put_i.push(i);
		        indexes = '';
		        if(pipelines_applied[strain_names[i]] != undefined){

		        	dict_strain_names[strain_names[i]] = [pipelines_applied[strain_names[i]].length, [], 0, 0];
		        	
		        	for(p in pipelines_applied[strain_names[i]]){
		        		dict_strain_names[strain_names[i]][1].push(pipelines_applied[strain_names[i]][p].split('>')[1].split('<')[0]);
		        		console.log(strainID_pipeline[strains_dict[strain_names[i]]], strains_dict[strain_names[i]], i);
			        	ngs_onto_requests.ngs_onto_request_add_processes(strainID_pipeline[strains_dict[strain_names[i]]], strains_dict[strain_names[i]], i, function(response, strain_name){
			        		//if(response.status == 200){
			        			//strain_to_use = strain_name;
			        			console.log('BAH',response);
			        			if(response.status != 404){
			        				dict_strain_names[strain_names[strain_name]].push(response.data);
			        			}
			        			console.log('DONE NGSOnto');
			        			while(dict_strain_names[strain_names[strain_name]][1].length != 0){
			        				workflowName = dict_strain_names[strain_names[strain_name]][1].shift();
			        				new_stu.push(strain_name);
			        				strain_to_slurm.push(strain_name);

			        				ngs_onto_requests.ngs_onto_request_get_workflow(pipelinesByName[workflowName], function(response){

			        					stu = new_stu.shift();
				        				dict_strain_names[strain_names[stu]][2]+=1;
				        				indexes = '';
				        				console.log(response.data);
				        				for(k=response.data.length-1; k>=0;k--){
				        					parts = response.data[k].protocol.split('/');
				        					parts = parts[parts.length-1];
				        					indexes += parts.replace('>', '') + ',';
				        				}

				        				//if (dict_strain_names[strain_names[stu]][0] == dict_strain_names[strain_names[stu]][2]){
						        			indexes = indexes.replace(/,$/, '');
						        			console.log(indexes);
						        			pg_requests.run_job(strains_dict[strain_names[stu]], indexes, function(response){
						        				console.log('RUNNING JOB');
						        				task_ids = response.data;

						        				to_slurm = strain_to_slurm.shift();

						        				processes_to_map = task_ids.map(function(x){
						        					return dict_strain_names[strain_names[to_slurm]][4].shift();
						        				});
						        				
						        				dict_strain_names[strain_names[to_slurm]][3] += 1;
						        				for(l in task_ids){
						        					tasks_to_buttons[task_ids[l]] = strain_names[to_slurm] + '_' + dict_strain_names[strain_names[to_slurm]][3]
						        				}

						        				console.log(tasks_to_buttons);
						        				ngs_onto_requests.ngs_onto_request_add_jobid_to_process(strainID_pipeline[strains_dict[strain_names[to_slurm]]], processes_to_map, task_ids, function(response){
			        								
			        								for(tk in response.data.tasks){
			        									dict_of_tasks_status[response.data.tasks[tk]] = '';
			        									
			        									periodic_check_job_status(response.data.tasks[tk], dict_of_tasks_status);
			        								}
			        							})
						        			})
				        				//}
				        				
				        			})
			        			}
			        	});
		        	}
		        }
		    }
		},
		get_ids_from_processes: function(){

			array_of_strains = []
			strain_array = []
			prevjobid = '';
			
			for(i in strains){
				array_of_strains.push(strains[i]);
				ngs_onto_requests.ngs_onto_request_get_processes(strainID_pipeline[strains_dict[strains[i].strainID.trim()]], function(response){
					var processes_ids = []
					console.log(response);
					if(response.status == 200){
						strain_to_use = array_of_strains.shift();
						console.log(strain_to_use);
						
						for(p in response.data){
							processes_ids.push(response.data[p].split('/').slice(-1)[0].split('>')[0])
						} 
						strain_array.push(strain_to_use);

						ngs_onto_requests.ngs_onto_request_get_jobid_from_process(strainID_pipeline[strains_dict[strain_to_use.strainID.trim()]], processes_ids, function(response){
							strain_id = strain_array.shift().strainID.trim();
							count = 0;
							console.log(response);
							for(l in response.data){
								if(response.data[l].length != 0){
									t_id = response.data[l][0].jobid.split('^')[0].split('"')[1];
									if (t_id.split('_')[0] != prevjobid) count+=1;
									tasks_to_buttons[t_id] = strain_id + '_' + String(count);
									prevjobid = t_id.split('_')[0];
									dict_of_tasks_status[t_id.split('_')[0]] = '';
									periodic_check_job_status(t_id, dict_of_tasks_status);
								}
							}
						})
					}
				})
			}
			
		}

	}

	return returned_functions;
}