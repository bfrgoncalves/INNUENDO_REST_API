function Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http) {

	return {

		//////////////// Protocols Requests /////////////////////////////////////////
		download_accession: function(username, accession_numbers, callback){

			req = {
		        url:'api/v1.0/downloads/',
		        method:'POST',
		        data: { accession_numbers: accession_numbers }
		    }

		    ////console.log(req);

		    $http(req).then(function(response){
		    	callback(response, accession_numbers);
		    }, function(response){
		    	callback(response, accession_numbers);
		    });
		},

		check_download_accession_status: function(file_name, accession_numbers, callback){

			req = {
		        url:'api/v1.0/downloads/',
		        method:'GET',
		        params: { accession_numbers: file_name }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response, accession_numbers);
		    }, function(response){
		    	callback(response, accession_numbers);
		    });
		},
		create_protocol: function(protocol_object, callback){
			req = {
		        url:'api/v1.0/protocols/',
		        method:'POST',
		        headers: {'Content-Type': 'application/json'},
		        data: { steps: protocol_object, name: protocol_object.name}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });
		},
		get_protocols_of_type: function(selectedType, callback){
			req = {
		        url:'api/v1.0/protocols/',
		        method:'GET',
		        params: { type: selectedType }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });
		},
		get_protocols_by_ids: function(ids, workflow_entry, callback){
			req = {
		        url:'api/v1.0/protocols/ids',
		        method:'GET',
		        params: { protocol_ids: ids }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response, workflow_entry);
		    }, function(response){
		    	callback(response, workflow_entry);
		    });
		},
		//////////////// Workflows Requests /////////////////////////////////////////
		add_workflow: function(callback){

			//console.log($('#new_workflow_form').serialize() + "&classifier=" + $( "#select_classifier option:selected" ).text());
			
			req = {
		        url:'api/v1.0/workflows/',
		        method:'POST',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        data: $('#new_workflow_form').serialize() + "&classifier=" + $( "#select_classifier option:selected" ).text() + "&species=" + $( "#workflow_species option:selected" ).text() + "&dependency=" + $( "#select_dependency option:selected" ).text()
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });
		    
		},
		//////////////// Projects Table Requests /////////////////////////////////////////
		get_species_names: function(callback){
			req = {
	            url:'api/v1.0/species/',
	            method:'GET'
	        }

	        //console.log(req);

	        $http(req).then(function(response){
	            callback(response);
	        }, function(response){
	        	callback(response);
	        });
		},

		get_all_workflows: function(callback){
			req = {
	            url:'api/v1.0/workflows/all/',
	            method:'GET'
	        }

	        //console.log(req);

	        $http(req).then(function(response){
	            callback(response);
	        }, function(response){
	        	callback(response);
	        });
		},

		change_workflow_state: function(selected_data, callback){

			req = {
	            url:'api/v1.0/workflows/availability/',
	            method:'PUT',
	            params:
		        {
		        	identifier: String(selected_data[0]),
		        	to_change: String(selected_data[1])
		        }
	        }

	        //console.log(req);

	        $http(req).then(function(response){
	        	//console.log(response);
	            callback(response);
	        }, function(response){
	        	//console.log(response);
	        	callback(response);
	        });
		},

		get_species_projects: function(species_id, is_others, callback){

			//Get user projects for specie 1
			if(is_others){
				req = {
	                url:'api/v1.0/projects/species/' + species_id,
	                method:'GET',
	                params: { get_others: true }
	            }
			}
			else{
				req = {
	                url:'api/v1.0/projects/species/' + species_id,
	                method:'GET'
	            }
			}

			//console.log(req);

	        $http(req).then(function(response){
	        	callback(response);
	      
	        }, function(response){
	        	callback(response);
	        });
		},
		add_project_to_database: function(callback){

			req = {
		        url:'api/v1.0/projects/',
		        method:'POST',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        data: $('#new_project_form').serialize()
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		        callback(response);
		    });	
		},
		delete_project_from_database: function(project_id, callback){

			req = {
	            url:'api/v1.0/projects/' + project_id,
	            method:'DELETE'
	        }

	        //console.log(req);

	        $http(req).then(function(response){
	            callback(response);
	        }, function(response){
	        	callback(response);
	        });
		},
		load_project: function(project_id, callback){

			req = {
	            url:'api/v1.0/projects/' + project_id,
	            method:'GET'
	        }

	        //console.log(req);

	        $http(req).then(function(response){
	            callback(response);
	        }, function(response){
	        	callback(response);
	        });
		},
		//////////////// Reports Requests /////////////////////////////////////////
		get_user_reports: function(callback){

		    req = {
		        url: 'api/v1.0/reports/', //Defined at utils.js
		        method:'GET'
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
	            callback(response);
		    });

		},
		get_project_reports: function(project_id, pipelines_to_check, callback){

		    req = {
		        url: 'api/v1.0/reports/project', //Defined at utils.js
		        method:'GET',
		        params:{'project_id': project_id, 'pipelines_to_check':pipelines_to_check}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
	            callback(response);
		    });

		},
		get_reports_by_strain: function(strain_id_to_search, callback){

		    req = {
		        url: 'api/v1.0/reports/strain', //Defined at utils.js
		        method:'GET',
		        params:{'strain_id': strain_id_to_search}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
	            callback(response);
		    });

		},
		get_multiple_user_reports: function(job_ids, callback){
		    req = {
		        url: 'api/v1.0/reports/', //Defined at utils.js
		        method:'GET',
		        params: {
		        	job_ids:job_ids.toString()
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
	            callback(response);
		    });

		},
		save_reports: function(job_ids, strain_names, CURRENT_SPECIES_ID, callback){

			//console.log(strain_names,job_ids);

		    req = {
		        url: 'api/v1.0/reports/combined', //Defined at utils.js
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'POST',
		        data: $('#save_report_form').serialize() + '&job_ids=' + job_ids + '&strain_ids=' + strain_names +'&species_id='+ CURRENT_SPECIES_ID
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
	            callback(response);
		    });

		},
		get_saved_user_reports: function(CURRENT_SPECIES_ID, callback){

		    req = {
		        url: 'api/v1.0/reports/combined', //Defined at utils.js
		        method:'GET',
		        params:{"species_id": CURRENT_SPECIES_ID}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	//console.log(response);
		    	callback(response);
	        },function(response){
	        	//console.log(response);
	            callback(response);
		    });

		},
		get_user_trees: function(CURRENT_SPECIES_ID, callback){

		    req = {
		        url: 'api/v1.0/phyloviz/trees', //Defined at utils.js
		        method:'GET',
		        params:{"species_id": CURRENT_SPECIES_ID}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	//console.log(response);
		    	callback(response);
	        },function(response){
	        	//console.log(response);
	            callback(response);
		    });

		},
		delete_combined_report: function(report_name, callback){

		    req = {
		        url: 'api/v1.0/reports/combined', //Defined at utils.js
		        method:'DELETE',
		        params: {
		        	"report_name": report_name
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
	            callback(response);
		    });

		},
		get_saved_report: function(callback){

		    req = {
		        url: 'api/v1.0/reports/combined/show', //Defined at utils.js
		        method:'GET',
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
	            callback(response);
		    });

		},
		//////////////// Single Project Requests /////////////////////////////////////////
		get_workflows: function(classifier, species, callback){

		    req = {
		        url: 'api/v1.0/workflows/', //Defined at utils.js
		        method:'GET',
		        params:{"classifier": classifier, "species":species}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
	        	//console.log(response);
	            callback(response);
		    });

		},
		add_pipeline: function(pipelineformID, callback){

		    req = {
		        url: CURRENT_PROJECT.pipelines,
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'POST',
		        data:$('#' + pipelineformID).serialize()
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		      		callback(response);
		        },
		        function(response){
		            callback(response);
		    });	

		},
		get_strains: function(CURRENT_SPECIES_ID, from_user, callback){


		    req = {
		        url: 'api/v1.0/strains/',
		        method:'GET',
		        params:
		        {
		        	speciesID: CURRENT_SPECIES_ID,
		        	from_user: from_user
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });

		},
		update_strain: function(strain_id, key, value, callback){

			req = {
		        url: 'api/v1.0/strains/',
		        method:'PUT',
		        params:
		        {
		        	strain_id: strain_id,
		        	key: key,
		        	value: value
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });

		},
		get_strain_by_name: function(strain_name, callback){


		    req = {
		        url: 'api/v1.0/strains/' + strain_name,
		        method:'GET'
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });

		},
		get_applied_pipelines: function(strain_id, project_id, callback){

			if (strain_id == null){
				req = {
			        url: 'api/v1.0/projects/'+project_id+'/pipelines/',
			        method:'GET'
			    }
			}
			else{
				req = {
			        url: 'api/v1.0/projects/'+project_id+'/pipelines/',
			        method:'GET',
			        params:{ strain_id_all:strain_id}
			    }
			}

			//console.log(req);

		    $http(req).then(function(response){
		        callback(response, strain_id);
	        },
	        function(response){
	        	//console.log(response);
	            callback(response, strain_id);
		    });
		},
		get_public_strains_applied_pipelines: function(callback){

		    req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
		        method:'GET',
		        params:{all:true}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		        callback(response);
	        },
	        function(response){
	            callback(response);
		    });
		},
		remove_pipeline_from_project: function(strain_id, tag_remove, callback){

		    req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
		        method:'DELETE',
		        params: {
		        	"strain_id": strain_id,
		        	tag_remove: tag_remove
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		        callback(response);
	        },
	        function(response){
	            callback(response);
		    });
		},
		change_pipeline_from_project: function(strain_id, tag_remove, pipeline_to_use, callback){

		    req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
		        method:'PUT',
		        params: {
		        	"strain_id": strain_id,
		        	tag_remove: tag_remove
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		        callback(response, strain_id, pipeline_to_use);
	        },
	        function(response){
	            callback(response, strain_id, pipeline_to_use);
		    });
		},
		get_uploaded_files: function(callback){

		    req = {
		        url: 'api/v1.0/uploads/',
		        method:'GET'
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},
		get_project_strains: function(callback){

			req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
		        method:'GET'
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},
		get_project_strains_2: function(strain_id, is_there, callback){

			req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
		        method:'GET'
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response, strain_id, is_there);
		        },
		        function(response){
		            callback(response, strain_id, is_there);
		    });
		},
		add_strain_to_project: function(strain_name, callback){

		    req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
		        method:'PUT',
		        data: {
		            "strainID": strain_name.trim()
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){      
		            callback(response);
		        },
		        function(response){
		        	//console.log(response);  
		            callback(response);
		    });
		},
		add_new_strain: function(callback){
		    
		    req = {
		        url: 'api/v1.0/strains/',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'POST',
		        data: $('#new_strain_form').find("select, input, textarea").serialize()
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    		//console.log(response);
		            callback(response);
		        },
		        function(response){
		        	//console.log(response);
		            callback(response);
		    });

		},

		update_metadata: function(strain_id, callback){
		    
		    req = {
		        url: 'api/v1.0/strains/',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'PUT',
		        data: $('#modify_strain_form').find("select, input, textarea").serialize() + "&strain_id=" + strain_id
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });

		},

		remove_strain_from_project: function(strain_name, callback){

			req = {
	            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
	            method:'DELETE',
	            params: {
	                "strainID": strain_name
	            }
	        }

	        //console.log(req);

	        $http(req).then(function(response){
	                callback(response);
	            },
	            function(response){
	                callback(response);
	        });
		},
		check_if_pipeline_exists: function(strain_id, strainID, callback){
			req = {
	            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
	            method:'GET',
	            params: {
	                strain_id_all: strain_id,
	                parent_project_id: CURRENT_PROJECT_ID
	            }
	        }

	        //console.log(req);

	        $http(req).then(function(response){
	               callback(response, strain_id, strainID);
	            },
	            function(response){
	               callback(response, strain_id, strainID);
	        });
		},
		add_pipeline: function(strain_id, parent_pipeline_id, parent_project_id, callback){

	        req = {
	            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
	            method:'POST',
	            data: {
	                strain_id: strain_id,
	                parent_pipeline_id:parent_pipeline_id,
	                parent_project_id:parent_project_id
	            }
	        }

	        //console.log(req);

	        $http(req).then(function(response){
	               callback(response);
	            },
	            function(response){
	               callback(response);
	        });
		},
		run_job: function(strain_id, protocol_ids, pipeline_id, process_id, strain_name, strain_submitter, current_specie, strainName, to_run, process_to_wrkdir, callback){

			processes_wrkdir = []

			for(x in process_id){
				if (process_to_wrkdir[String(pipeline_id) + "-" + String(process_id[x])] != undefined){
					processes_wrkdir.push(process_to_wrkdir[String(pipeline_id) + "-" + String(process_id[x])])
				}
				else{
					processes_wrkdir.push("false")
				}
			}

		    req = {
		        url: 'api/v1.0/jobs/',
		        method:'POST',
		        data: {
		        	strain_id: strain_id,
		        	protocol_ids: protocol_ids,
		        	project_id: CURRENT_PROJECT_ID,
		        	pipeline_id: pipeline_id,
		        	process_id: process_id.join(),
		        	strain_submitter: strain_submitter,
		        	current_specie: current_specie,
		        	sampleName: strainName,
		        	processes_to_run: to_run.join(),
		        	processes_wrkdir: processes_wrkdir.join()
		    	}
		    }

		    console.log(req);

		    $http(req).then(function(response){
		            callback(response, strain_name, pipeline_id);
		        },
		        function(response){
		            callback(response, strain_name, pipeline_id);
		    });

		},
		get_job_status: function(job_ids, procedure_names, sample_name, pipeline_id, process_positions, project_id, process_ids, callback){

		    req = {
		        url: 'api/v1.0/jobs/',
		        method:'GET',
		        params: {
		        	job_id: job_ids.join(),
		        	procedure_name:procedure_names.join(),
		        	sample_name:sample_name,
		        	pipeline_id:pipeline_id,
		        	process_position:process_positions.join(),
		        	project_id:project_id,
		        	process_id:process_ids,
		        	database_to_include: CURRENT_SPECIES_NAME,
		        	current_user_name: CURRENT_USER_NAME,
		        	current_user_id: CURRENT_USER_ID,
		        	from_process_controller: "false",
		        	homedir: HOME_DIR
		    	}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response, job_ids, pipeline_id);
		        },
		        function(response){
		            callback(response, job_ids, pipeline_id);
		    });

		},

		//////////////////////////////// GET FILES ////////////////////////////////////////
		get_user_files: function(callback){

			req = {
		        url: 'api/v1.0/files/',
		        method:'GET'
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},

		get_user_files: function(callback){

			req = {
		        url: 'api/v1.0/files/',
		        method:'GET'
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},

		set_user_parameters: function(parameters_object_string, callback){

			req = {
		        url: 'api/v1.0/user/',
		        method:'PUT',
		        params: {
		        	parameters_object: parameters_object_string
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},

		get_user_parameters: function(callback){

			req = {
		        url: 'api/v1.0/user/',
		        method:'GET'
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},

		download_file: function(path, callback){

			req = {
		        //url: CURRENT_JOBS_ROOT + '/api/v1.0/jobs/results/download/',
		        url: 'api/v1.0/jobs/results/download/',
		        method:'GET',
		        params: {
		        	file_path: encodeURI(path)
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    		//console.log(response)
		            //url = CURRENT_JOBS_ROOT + '/api/v1.0/jobs/results/download/click/?file_path=' + encodeURI(response.data);
		            url = 'api/v1.0/jobs/results/download/click/?file_path=' + encodeURI(response.data);
					//console.log(url);

					var link = document.createElement("a");
				    link.download = path.split('/').slice(-1)[0];
				    link.href = url;
				    link.click();
				    callback();
		        },
		        function(response){
		            callback(response);
		    });
			
		},

		download_template_strain_file: function(callback){

			url = 'api/v1.0/templates/batch_submission/'

			var link = document.createElement("a");
		    link.href = url;
		    link.click();
		    link.remove();
		    callback();
			
		},

		get_nextflow_log: function(filename, pipeline_id, project_id, submitter, callback){
			req = {
		        //url: CURRENT_JOBS_ROOT + '/api/v1.0/jobs/results/download/',
		        url: 'api/v1.0/jobs/logs/nextflow/',
		        method:'GET',
		        params: {
		        	filename: filename,
		        	pipeline_id:pipeline_id,
		        	project_id:project_id,
		        	submitter: submitter
		        }
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		    		//console.log(response)
				    callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},

		send_to_phyloviz: function(job_ids, global_additional_data, species_id, callback){
			

			req = {
		        url: 'api/v1.0/phyloviz/',
		        method:'POST',
		        data: {
		        	job_ids: job_ids.join(","),
		        	dataset_name: $('#modal_phyloviz_dataset_name').val(),
		        	dataset_description: $('#modal_phyloviz_dataset_description').val(),
		        	additional_data: JSON.stringify(global_additional_data),
		        	max_closest: $("#closest_number_of_strains").val(),
		        	database_to_include: $("#species_database option:selected").text(),
		        	species_id: species_id,
		        	missing_data: $('#missing_data_checkbox').is(":checked"),
		        	missing_char: $('#missing_data_character').val(),
					phyloviz_user: $('#phyloviz_user').val(),
					phyloviz_pass: $('#phyloviz_pass').val(),
					makePublic: $('#makePublic_checkbox').is(":checked")
		    	}
		    }

		    //console.log(req);
		    
		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		    
		},

		delete_tree: function(tree_name, callback){

			req = {
		        url: 'api/v1.0/phyloviz/trees/',
		        method:'DELETE',
		        params: {
		        	tree_name: tree_name
		    	}
		    }

		    //console.log(req);
		    
		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		        	//console.log(response);
		            callback(response);
		    });
		},

		fetch_job: function(redis_job_id, callback){

			req = {
		        url: 'api/v1.0/phyloviz/',
		        method:'GET',
		        params: {
		        	job_id: redis_job_id
		    	}
		    }

		    //console.log(req);

		    $http(req).then(function(response){
		            callback(response, redis_job_id);
		        },
		        function(response){
		            callback(response, redis_job_id);
		    });

		}
	}
}