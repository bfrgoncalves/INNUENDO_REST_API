function Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http){

	var project = {}, pipelinesByName = {}, pipelinesByID = {}, strainID_pipeline = {}, strains_dict = {}, strain_id_to_name = {}, pipelines_applied = {};

    var specie_name = "", species_id = "";
    var strains = [], pipelines = [], strains_headers = [], public_strains = [], files = [];

    var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    var ngs_onto_requests = new ngs_onto_client(CURRENT_PROJECT_ID, $http);
    var objects_utils = new Objects_Utils();


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
	                if(!strains_dict.hasOwnProperty(data.strainID)){
	                    strains_dict[data.strainID] = data.id;
	                }
	                strains.push(sd);

	                objects_utils.show_message('project_strain_message_div', 'success', 'Strains were added to the project.');
	            
	            }
	            callback({ strains_headers: strains_headers, strains: strains});
	            objects_utils.loadDataTables('strains_table', strains);
			}
			else{
				console.log(response.statusText);
				objects_utils.loadDataTables('strains_table', strains);
        		objects_utils.show_message('project_strain_message_div', 'warning', 'Strain ' + strain_name + ' already on project.');
			}
		});
	}

	function create_pipeline(strain_Name, callback){

		strain_id = strains_dict[strain_Name];

		pg_requests.check_if_pipeline_exists(strain_id, function(response){
			if(response.status == 200){
				console.log("Pipeline already exists");
	            callback(strain_id, response.data.id);
			}
			else{
				pg_requests.add_pipeline(strain_id, function(response){
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


    var returned_functions = {

	    get_workflows: function(callback){

			pg_requests.get_workflows(function(response){
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
		                public_strains_headers.push('Analysis');

		                for (i in data){

		                    strain_id_to_name[data[i].id] = data[i].strainID;

		                    var strain_data = JSON.parse(data[i].strain_metadata);
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
		                strains_headers.push('Analysis');
		                
		                for (i in data){

		                    var strain_data = JSON.parse(data[i].strain_metadata);
		                    strain_data['Analysis'] = "";
		                    var sd = {};
		                    for (j in strains_headers){
		                        if(strain_data.hasOwnProperty(strains_headers[j])){
		                            sd[strains_headers[j]] = strain_data[strains_headers[j]];
		                        }
		                    }
		                    if(!strains_dict.hasOwnProperty(data[i].strainID)){
		                        strains_dict[data[i].strainID] = data[i].id;
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
		get_applied_pipelines: function(){

			pg_requests.get_applied_pipelines(function(response){
				if (response.status == 200){
					for (i in response.data){
		                strainID_pipeline[response.data[i].strain_id] = response.data[i].id;
		                ngs_onto_requests.ngs_onto_request_applied_pipelines(response.data[i].id, response.data[i].strain_id, function(response, strain_id){
		                	if(response.status == 200){
		                		var appliedPipelines = [];
					            for (w in response.data){
					                workflow_id = response.data[w].workflowURI.split('<')[1].split('>')[0].split('/');
					                workflow_id = workflow_id[workflow_id.length-1];
					                appliedPipelines.push(workflow_id);
					                appliedPipelines = appliedPipelines.reverse();
					            }
					            objects_utils.apply_pipeline_to_strain('strains_table', strain_id_to_name[strain_id], appliedPipelines, pipelinesByID, pipelines_applied);
		                	}
		                	else console.log(response.statusText);
		                });
		            }
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
		add_database_strains: function(){

			var strain_names = $.map($('#public_strains_table').DataTable().rows('.selected').data(), function(item){
		        return item[1];
		    });

		    if(strain_names.length > 0){
		        objects_utils.destroyTable('strains_table');
		        for(i in strain_names){
		            add_strain_to_project(strain_names[i], function(results){
		            });
		        }
		    }
		    else objects_utils.show_message('database_strain_message_div', 'warning', 'Please select some strains first.');
		},
		add_new_strain: function(){

			pg_requests.add_new_strain(function(response){
				if(response.status == 201){
					strain_id_to_name[response.data.id] = response.data.strainID;
	        		add_strain_to_project(response.data.strainID, function(results){
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

		        pg_requests.remove_strain_from_project(strain_name, function(response){
		        	if(response.status == 200){
		        		var new_strains = [];
		                to_use.map(function(d){
		                    if (d.strainID != response.data.strainID) new_strains.push(d);
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
		    setTimeout(function(){callback({strains: to_use});}, 100);
		},
		apply_workflow: function(){

			var table = $('#strains_table').DataTable();

		    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
		        return index;
		    });

		    var strain_names = $.map(table.rows('.selected').data(), function(item){
		        return item[1];
		    });

		    buttonselectedPipeline = '<button class="btn btn-sm btn-default">'+ $( "#pipeline_selector option:selected" ).val() + '</button>';

		    var counter = -1;

		    for(i in selected_indexes){
		        var toAdd = '';
		        counter++;

		        if(!pipelines_applied.hasOwnProperty(strain_names[counter])){
		            pipelines_applied[strain_names[counter]] = [];
		        }
		        if(pipelines_applied[strain_names[counter]].indexOf(buttonselectedPipeline) < 0) pipelines_applied[strain_names[counter]].push(buttonselectedPipeline);
		        
		        for(j in pipelines_applied[strain_names[counter]]){
		            toAdd += pipelines_applied[strain_names[counter]][j];
		        }

		        table.cell(selected_indexes[i], -1).data(toAdd).draw();
		    
		    }
		    if (selected_indexes.length == 0) objects_utils.show_message('project_procedures_message_div', 'warning', 'Select strains to apply procedures.');
		    else objects_utils.show_message('project_procedures_message_div', 'success', 'Procedure applied.');
		},
		save_pipelines: function(){

			var table = $('#strains_table').DataTable();

		    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
		        return index;
		    });

		    for(i in selected_indexes){
		            
		        create_pipeline(strains[selected_indexes[i]].strainID, function(strain_id, pipeline_id){
		            pipelines_applied[strain_id_to_name[strain_id]].map(function(d, x){
		                workflowName = d.split('>')[1].split('</')[0];
		                ngs_onto_requests.ngs_onto_request_save_pipeline(pipeline_id, pipelinesByName[workflowName], x, function(response){
		                	if(response.status == 200){

		                	}
		                	else console.log(response.statusText);
		                });
		            });
		        });

		    }
		    objects_utils.show_message('project_procedures_message_div', 'success', 'Procedure state saved.');
		},
		run_pipelines: function(){

			var table = $('#strains_table').DataTable();

		    var strain_names = $.map(table.rows('.selected').data(), function(item){
		        return item[1];
		    });

		    for(i in strain_names){
		        
		        if(pipelines_applied[strain_names[i]] != undefined){

		        	ngs_onto_requests.ngs_onto_request_add_processes(strainID_pipeline[strains_dict[strain_names[i]]], strains_dict[strain_names[i]], function(response){
		        		if(response.status == 200){
		        			console.log('DONE NGSOnto');
		        		}
		        		else console.log(response.statusText);
		        	});
		        }
		    }
		}
	}

	return returned_functions;
}