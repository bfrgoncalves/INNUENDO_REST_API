function Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http) {

	return {

		//////////////// Protocols Requests /////////////////////////////////////////
		create_protocol: function(protocol_object, callback){
			req = {
		        url:'api/v1.0/protocols/',
		        method:'POST',
		        headers: {'Content-Type': 'application/json'},
		        data: { steps: protocol_object, name: protocol_object.name}
		    }

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

		    $http(req).then(function(response){
		    	callback(response);
		    }, function(response){
		    	callback(response);
		    });
		},
		//////////////// Workflows Requests /////////////////////////////////////////
		add_workflow: function(callback){
			req = {
		        url:'api/v1.0/workflows/',
		        method:'POST',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        data: $('#new_workflow_form').serialize()
		    }

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

	        $http(req).then(function(response){
	            callback(response);
	        }, function(response){
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

	        $http(req).then(function(response){
	            callback(response);
	        }, function(response){
	        	callback(response);
	        });
		},
		//////////////// Single Project Requests /////////////////////////////////////////
		get_workflows: function(callback){

		    req = {
		        url: 'api/v1.0/workflows/', //Defined at utils.js
		        method:'GET'
		    }

		    $http(req).then(function(response){
		    	callback(response);
	        },function(response){
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

		    $http(req).then(function(response){
		      		callback(response);
		        },
		        function(response){
		            callback(response);
		    });	

		},
		get_strains: function(callback){


		    req = {
		        url: 'api/v1.0/strains/',
		        method:'GET'
		    }

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });

		},
		get_applied_pipelines: function(callback){

		    req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
		        method:'GET'
		    }

		    $http(req).then(function(response){
		        callback(response);
	        },
	        function(response){
	            callback(response);
		    });
		},
		get_uploaded_files: function(callback){

		    req = {
		        url: 'api/v1.0/uploads/',
		        method:'GET'
		    }

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

		    $http(req).then(function(response){
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},
		add_strain_to_project: function(strain_name, callback){

		    req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
		        method:'PUT',
		        data: {
		            "strainID": strain_name
		        }
		    }

		    $http(req).then(function(response){            
		            callback(response);
		        },
		        function(response){
		            callback(response);
		    });
		},
		add_new_strain: function(callback){

		    req = {
		        url: 'api/v1.0/strains/',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'POST',
		        data: $('#new_strain_form').find("select, input").serialize()
		    }

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

	        $http(req).then(function(response){
	                callback(response);
	            },
	            function(response){
	                callback(response);
	        });
		},
		check_if_pipeline_exists: function(strain_id, callback){

			req = {
	            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
	            method:'GET',
	            params: {
	                strain_id: strain_id
	            }
	        }
	        $http(req).then(function(response){
	               callback(response);
	            },
	            function(response){
	               callback(response);
	        });
		},
		add_pipeline: function(strain_id, callback){

	        req = {
	            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
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