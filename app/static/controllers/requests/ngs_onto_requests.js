function ngs_onto_client(CURRENT_PROJECT_ID, $http){

	return {
		
		//////////////// Protocols Requests /////////////////////////////////////////
		ngs_onto_get_protocol_types: function(callback){

			req = {
		        url:'api/v1.0/ngsonto/protocols/types',
		        method:'GET'
		    }

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });
		},
		ngs_onto_load_protocol_properties: function(protocol_type, callback){

			req = {
		        url:'api/v1.0/ngsonto/protocols/properties',
		        method:'GET',
		        params: { uri: protocol_type }
		    }

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });
		},
		ngs_onto_request_create_protocol: function(protocolTypeObject, typeuri, protocol_id, callback){

			console.log(protocol_id);
			req = {
		        url:'api/v1.0/ngsonto/protocols/',
		        method:'POST',
		        headers: {'Content-Type': 'application/json'},
		        data: { type_uri: protocolTypeObject[typeuri], protocol_id: protocol_id}
		    }

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });
		},
		ngs_onto_get_protocol_fields: function(uri, callback){

			req = {
		        url:'api/v1.0/ngsonto/protocols/properties/fields',
		        method:'GET',
		        params: { uri: uri }
		    }

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });

		},
		//////////////// Workflows Requests /////////////////////////////////////////
		ngs_onto_request_add_workflow: function(workflow_id, protocol_ids, callback){

			console.log(workflow_id);
			console.log(protocol_ids);
	    	
	    	req = {
		        url:'api/v1.0/ngsonto/workflows/protocols',
		        method:'POST',
		        data: {
		        	workflow_id: workflow_id,
		        	protocol_ids: protocol_ids
		        }
		    }

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });
	    },
	    ngs_onto_request_get_workflow: function(workflow_id, strain_name, callback){
	    	console.log(workflow_id);
	    	
	    	req = {
		        url:'api/v1.0/ngsonto/workflows/protocols',
		        method:'GET',
		        params: { workflow_id: workflow_id }
		    }

		    $http(req).then(function(response){
		    	callback(response, strain_name);
		    }, function(response){
		    	callback(response, strain_name);
		    });
	    },
		//////////////// Projects Table Requests /////////////////////////////////////////
		ngs_onto_request_add_project_to_database: function(project_id, callback){
			
			req = {
	            url: 'api/v1.0/ngsonto/projects/',
	            method:'POST',
	            data: { study_id: project_id }
	        }

	        $http(req).then(function(response){
	            callback(response);
	        }, function(response){
	            callback(response);
	        }); 
		},
		//////////////// Single Project Requests /////////////////////////////////////////
		ngs_onto_request_applied_pipelines: function(pipeline_id, project_id, strain_id, callback){
			console.log(project_id, pipeline_id);
			req = {
		            url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/'+pipeline_id+'/workflows/',
		            method:'GET'
		        }

	        $http(req).then(function(response){
	        	callback(response, strain_id);
	        },
	        function(response){
	            callback(response, strain_id);
	        });

		},
		ngs_onto_request_add_strain_to_project: function(id,  callback){

			console.log(id);

	        req_ngs_onto = {
	            url: 'api/v1.0/ngsonto/strains/',
	            method:'POST',
	            data: { strain_id: id }
	        }

	        $http(req_ngs_onto).then(function(response){
	            callback(response);
	        }, function(response){
	            callback(response);
	        }); 

		},
		ngs_onto_request_create_pipeline: function(pipeline_id, strain_id, callback) {

	        req = {
	            url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
	            method:'POST',
	            data: {
	                pipeline_id: pipeline_id
	            }
	        }

	        $http(req).then(function(response){
	           callback(response, strain_id);
	        },
	        function(response){
	           callback(response, strain_id);
	        });
    	},
    	ngs_onto_request_remove_pipeline: function(pipeline_id, callback){

	    	req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
                method:'DELETE',
                params: {
	                pipeline_id: pipeline_id
	            }
            }

            $http(req).then(function(response){
               callback(response);
            },
            function(response){
               callback(response);
            });
	    },
    	ngs_onto_request_save_pipeline: function(pipeline_id, workflow_ids, pipeline_steps, callback){

    		console.log('SAVE PIPELINES', pipeline_id, workflow_ids, pipeline_steps);

	        req = {
	            url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/' + pipeline_id + '/workflows/',
	            method:'POST',
	            data: {
	                workflow_id: workflow_ids.join(),
	                step: pipeline_steps.join()
	            }
	        }

	        $http(req).then(function(response){
	           callback(response);
	        },
	        function(response){
	            callback(response);
	        });
	    },
	    ngs_onto_request_add_processes: function(pipeline_id, strain_id, strain_name, pip_ids_to_parents, last_process_ids, callback){
	    	
	    	console.log('ADDED PROCESSES', CURRENT_PROJECT_ID, pipeline_id, strain_id, pip_ids_to_parents);

	    	if(pip_ids_to_parents.length != 0){
	    		strain_id = 'null';
	    	}
	    	if(pip_ids_to_parents[0] == undefined) pip_ids_to_parents.push("null");
	    	if(pip_ids_to_parents[1] == undefined) pip_ids_to_parents.push("null");

	    	try{
	    		ppi = last_process_ids[2];
	    	}
	    	catch(e){
	    		ppi = "null";
	    	}

	    	if(pip_ids_to_parents[2] != undefined) ppi = pip_ids_to_parents[2];

	    	if(ppi == undefined) ppi = "null";
	    	
	    	console.log(strain_id, pip_ids_to_parents, ppi);
	    	
	    	req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/'+pipeline_id+'/processes/',
                method:'POST',
                data: {
                    strain_id: strain_id,
                    parent_project_id: pip_ids_to_parents[0],
                    parent_pipeline_id: pip_ids_to_parents[1],
                    parent_process_id: ppi,
                    real_pipeline_id: pipeline_id
                }
            }

            $http(req).then(function(response){
            	console.log(response, "##########################");
            	p_to_map = [];
            	for(x in response.data){
            		if(real_pipeline_id == pip_ids_to_parents[0] && ppi != "null" && int(ppi) < int(response.data[x])){
            			p_to_map.push(response.data[x])
            		}
            		console.log(response.data[x]);
            	}
               callback(response, strain_name, p_to_map);
            },
            function(response){
            	console.log(response);
               callback(response, strain_name, []);
            });
	    },
	    ngs_onto_request_get_processes: function(pipeline_id, project_id, callback){

	    	req = {
                url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/'+pipeline_id+'/processes/',
                method:'GET',
            }

            $http(req).then(function(response){
            	//console.log(response);
               callback(response);
            },
            function(response){
            	//console.log(response);
               callback(response);
            });
	    },
	    ngs_onto_request_get_processes_outputs: function(project_id, pipeline_id, process_id, callback){

	    	console.log(project_id, pipeline_id, process_id);
	    	req = {
                url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/'+pipeline_id+'/processes/' + process_id + '/outputs/',
                method:'GET',
            }

            $http(req).then(function(response){
            	console.log(response);
               callback(response);
            },
            function(response){
            	console.log(response);
               callback(response);
            });
	    },
	    ngs_onto_request_add_jobid_to_process: function(pipeline_id, processes_ids, task_ids, strain_name, callback){

	    	console.log('JOBID TO PROCESS', pipeline_id, processes_ids, task_ids);

	    	req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/'+pipeline_id+'/processes/jobid',
                method:'POST',
                data: {
                	processes_ids: processes_ids.join(),
                    task_ids: task_ids.join()
                }
            }

            $http(req).then(function(response){
            	console.log(response);
               callback(response, strain_name);
            },
            function(response){
            	console.log(response);
               callback(response, strain_name);
            });
	    },
	    ngs_onto_request_get_jobid_from_process: function(pipeline_id, processes_ids, project_id, strain_id, count, callback){

	    	req = {
                url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/'+pipeline_id+'/processes/jobid',
                method:'GET',
                params: {
                	processes_ids: processes_ids.join()
                }
            }

            $http(req).then(function(response){
            	//console.log(response);
               callback(response, processes_ids, strain_id, count, pipeline_id);
            },
            function(response){
            	console.log(response);
               callback(response, processes_ids, strain_id, count, pipeline_id);
            });
	    }
	}
}