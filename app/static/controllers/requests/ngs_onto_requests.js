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
		ngs_onto_request_applied_pipelines: function(pipeline_id, strain_id, callback){

			req = {
		            url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/'+pipeline_id+'/workflows/',
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
    	ngs_onto_request_save_pipeline: function(pipeline_id, workflow_id, pipeline_step, callback){

	        req = {
	            url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/' + pipeline_id + '/workflows/',
	            method:'POST',
	            data: {
	                workflow_id: workflow_id,
	                step: pipeline_step + 1
	            }
	        }

	        $http(req).then(function(response){
	           callback(response);
	        },
	        function(response){
	            callback(response);
	        });
	    },
	    ngs_onto_request_add_processes: function(pipeline_id, strain_id, callback){

	    	req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/'+pipeline_id+'/processes/',
                method:'POST',
                data: {
                    strain_id: strain_id
                }
            }

            $http(req).then(function(response){
               callback(response);
            },
            function(response){
               callback(response);
            });
	    }
	}
}