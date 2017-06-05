function Projects_Table(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http){

	var projects = [], other_projects = [], species = [];
    var projects_headers = {};
    var currentSpecieID = 1;

	var objects_utils = new Objects_Utils();
    var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    var ngs_onto_requests = new ngs_onto_client(CURRENT_PROJECT_ID, $http);

    var returned_functions = {

    	get_species_names: function(callback){

    		pg_requests.get_species_names(function(response){
	        	if(response.status == 200){
		            callback({species:response.data, CURRENT_SPECIES_NAME:response.data[0].name, CURRENT_SPECIES_ID:response.data[0].id});
	        	}
	        	else console.log(response.statusText);
	        })
    	},
    	get_projects_from_species: function(species_id, is_others, callback){

    		pg_requests.get_species_projects(species_id, is_others, function(response){
	        	if(response.status == 200){
	        		if(is_others){
	        			other_projects = []
	        			response.data.map(function(d){
	        				if(d.is_removed == null) other_projects.push({name: d.name, description: d.description, date: d.timestamp.split(" ").slice(0, 4).join(' '), id: d.id});
				        });
				        callback(other_projects);
			        	objects_utils.loadDataTables('projects_table', projects);
	        		}
	        		else{
	        			projects = [];
			        	response.data.map(function(d){
				            if(d.is_removed == null) projects.push({name: d.name, description: d.description, date: d.timestamp.split(" ").slice(0, 4).join(' '), id: d.id});
				        });
				        callback(projects);
			        	objects_utils.loadDataTables('projects_table', projects);
			        }
		        }
		        else {
		        	if(!is_others) projects = [];
		        	else other_projects = [];
	        		console.log(response.statusText);
	        		callback([]);
	        	}
	        });
    	},
    	add_project: function(callback){
    		pg_requests.add_project_to_database(function(response){
    			if (response.status == 201){
	    			ngs_onto_requests.ngs_onto_request_add_project_to_database(response.data.id, function(response){
	    				//Do something if needed
	    			});
	    			projects.push({name: response.data.name, description: response.data.description, date: response.data.timestamp.split(" ").slice(0, 4).join(' '), id: response.data.id});
		            $('#newProjectModal').modal('hide');
		            objects_utils.show_message('projects_message_div', 'success', 'Project created.');
		            callback({projects: projects});
		        }
		        else objects_utils.show_message('new_project_message_div', 'warning', 'An error as occuried when creating the new project.');
    		})
    	},
    	delete_project: function(callback){

    		var project_indexes = $.map($('#projects_table').DataTable().rows('.selected').indexes(), function(index){
		        return index;
		    });

		    count_to_delete = 0;
		    total_to_delete = project_indexes.length;
		    
		    for(i in project_indexes){
		    	console.log(projects);
		        var project_id = projects[project_indexes[i]].id;
		        pg_requests.delete_project_from_database(project_id, function(response){
		        	count_to_delete+=1;
		        	if(response.status == 204){
		        		var new_projects = [];
			            projects.map(function(d){
			                if (d.id != project_id) new_projects.push(d);
			            })
			            projects = new_projects;
			            objects_utils.show_message('projects_message_div', 'success', 'Project deleted.');

		        	}
		        	else console.log(response.statusText);
		        	if(count_to_delete == total_to_delete) callback({projects: projects});

		        });
		    }
    	},
    	load_project: function(table_id, CURRENT_PROJECT_ID, pass, callback){

    		selected_indexes = [];
    		
    		if(table_id != ""){
    			var table = $('#' + table_id).DataTable();
    
			    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
			        return index;
			    });
    		}
		    
		    if (selected_indexes.length == 0 && pass != true){
		        objects_utils.show_message('projects_message_div', 'warning', 'Please select a project first.');
		    }
		    else{
		    	pg_requests.load_project(CURRENT_PROJECT_ID, function(response){
		    		if(response.status == 200){
		    			callback({project: response.data, template: 'static/html_components/manage_projects_view.html'});
		    		}
		    		else console.log(response.statusText);
		    	})
		    }
    	}


    }

    return returned_functions;


}