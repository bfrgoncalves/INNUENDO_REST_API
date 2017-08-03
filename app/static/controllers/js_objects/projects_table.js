/*
Object with functions to deal with the Projects controller
	- get_species_names
	- get_projects_from_species
	- add_project
	- delete_project
	- load_project
*/

function Projects_Table(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http){

	var projects = [], other_projects = [], species = [];
    var projects_headers = {};
    var currentSpecieID = 1;

	var objects_utils = new Objects_Utils();
    var pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    var ngs_onto_requests = new ngs_onto_client(CURRENT_PROJECT_ID, $http);

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

    var returned_functions = {

    	/*
    	Get all the available species names
    	*/
    	get_species_names: function(callback){
    		pg_requests.get_species_names(function(response){
	        	if(response.status == 200){
		            callback({species:response.data, CURRENT_SPECIES_NAME:response.data[0].name, CURRENT_SPECIES_ID:response.data[0].id});
	        	}
	        	else console.log(response.statusText);
	        })
    	},

    	/*
    	Get all projects available from the current species.
    	Can be from other users or only for the current user
    	*/
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
	        		callback([]);
	        	}
	        });
    	},

    	/*
    	Add a new project to the database.
    	It adds to the postgresql and to the ngsonto
    	*/
    	add_project: function(callback){
    		pg_requests.add_project_to_database(function(response){
    			if (response.status == 201){
	    			ngs_onto_requests.ngs_onto_request_add_project_to_database(response.data.id, function(response){
	    				//Do something if needed
	    			});
	    			projects.push({name: response.data.name, description: response.data.description, date: response.data.timestamp.split(" ").slice(0, 4).join(' '), id: response.data.id});
		            $('#newProjectModal').modal('hide');
		            modalAlert('Project created.', function(){});
		            callback({projects: projects});
		        }
		        else if(response.status == 409){
		        	console.log(response);
		        	modalAlert('An error as occuried when creating the new project.', function(){});
		        }
		        else modalAlert('An error as occuried when creating the new project.', function(){});
    		})
    	},

    	/*
    	Deletes a project from the database.
    	It adds a tag to the project on the database. Dont really removes it.
    	*/
    	delete_project: function(callback){

    		var project_indexes = $.map($('#projects_table').DataTable().rows('.selected').indexes(), function(index){
		        return index;
		    });

		    count_to_delete = 0;
		    total_to_delete = project_indexes.length;

		    if(project_indexes.length > 0){

		    	modalAlert("By accepting this option you are removing the project/projects from the application. Do you really want proceed?", function(){

		    		for(i in project_indexes){
				        var project_id = projects[project_indexes[i]].id;
				        pg_requests.delete_project_from_database(project_id, function(response){
				        	count_to_delete+=1;
				        	if(response.status == 204){
				        		var new_projects = [];
					            projects.map(function(d){
					                if (d.id != project_id) new_projects.push(d);
					            })
					            projects = new_projects;
				        	}
				        	if(count_to_delete == total_to_delete) callback({projects: projects});
				        });
				    }
		    	});

		    }
    	},

    	/*
    	Loads a Project from the database
    	*/
    	load_project: function(table_id, CURRENT_PROJECT_ID, pass, callback){

    		selected_indexes = [];
    		
    		if(table_id != ""){
    			var table = $('#' + table_id).DataTable();
    
			    var selected_indexes = $.map(table.rows('.selected').indexes(), function(index){
			        return index;
			    });
    		}
		    
		    if (selected_indexes.length == 0 && pass != true){
		    	modalAlert('Please select a project first.', function(){});
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