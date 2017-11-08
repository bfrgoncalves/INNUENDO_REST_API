/*
Workflows Object - An object with all functions used in the workflows controller
 - set_protocol_types_object
 - set_protocols_of_type
 - add_protocol_to_workflow
 - remove_protocol_from_workflow
 - save_workflow
*/

/*
Launch a workflow instance
*/
function Workflows($http){

	var protocolTypeObject = {}, protocols = {}, added_protocols = {};

	var pg_requests = new Requests(0, null, $http);
    var ngs_onto_requests = new ngs_onto_client(0, $http);
    var objects_utils = new Objects_Utils();

	var returned_functions = {

		/*
		Set all the available protocol types
		*/
		set_protocol_types_object: function(protocolTObject){
			protocolTypeObject = protocolTObject;
			return true;
		},

		/*
		Set the protocols of a given type
		*/
		set_protocols_of_type: function(protocols_of_type){
			protocols = protocols_of_type;
			return true;
		},

		get_all_workflows: function(callback){
			pg_requests.get_all_workflows(function(response){
				for( x in response.data){
					if(response.data[x].availability == null){
						response.data[x].availability = true;
					}
				}
				callback(response);
			});
		},

		/*
		Add a protocol to a workflow
		*/
		add_protocol_to_workflow: function(protocol_name, callback){
			/*Uncomment if only one protocol by workflow is to be used

			if(Object.keys(added_protocols).length > 0) return callback({more_than_one:true, added_protocols:added_protocols});

			*/
			if(!added_protocols.hasOwnProperty(protocol_name)){
				added_protocols[protocol_name] = protocols[protocol_name];
			}
			if(Object.keys(added_protocols).length > 0){
				$('#workflow_form_block').css({display:'block'});
			}
			else $('#workflow_form_block').css({display:'none'});
			
			setTimeout(function(){
				sortable('.sortable');
			}, 100);

			callback({added_protocols:added_protocols});
		},

		change_workflow_state: function(callback){
			var selected_data = $.map(table.rows('.selected').data(), function(data){
				
				if (String(data.availability) == "true"){
					availability = "false";
				}
				else availability = "true";
		        return [data.id, availability];
		    });
		    pg_requests.change_workflow_state(selected_data, function(response){
		    	callback(response);
		    });
		},

		/*
		Remove a protocol from a workflow
		*/
		remove_protocol_from_workflow: function(protocol_name, callback){

			if(added_protocols.hasOwnProperty(protocol_name)){
				delete added_protocols[protocol_name];
			}
			if(Object.keys(added_protocols).length > 0){
				$('#workflow_form_block').css({display:'block'});
			}
			else $('#workflow_form_block').css({display:'none'});
			
			setTimeout(function(){
				sortable('.sortable');
			}, 100);

			callback({added_protocols:added_protocols});
		},

		/*
		Save a workflow
		*/
		save_workflow: function(callback){
			var values = $('#sortable_list li').map(function() {
			    return this.value;
			});
			list_values = values.get().join(',');
			
			pg_requests.add_workflow(function(response){
				if(response.status == 201){
					ngs_onto_requests.ngs_onto_request_add_workflow(response.data.id, list_values, function(response){
						callback(true)
					});
				}
				else{
					callback(false)
				}
			})
		}
	}

	return returned_functions;

}