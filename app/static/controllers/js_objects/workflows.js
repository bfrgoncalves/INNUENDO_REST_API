function Workflows($http){

	var protocolTypeObject = {}, protocols = {}, added_protocols = {};

	var pg_requests = new Requests(0, null, $http);
    var ngs_onto_requests = new ngs_onto_client(0, $http);
    var objects_utils = new Objects_Utils();

	var returned_functions = {
		set_protocol_types_object: function(protocolTObject){
			protocolTypeObject = protocolTObject;
			return true;
		},
		set_protocols_of_type: function(protocols_of_type){
			protocols = protocols_of_type;
			return true;
		},
		add_protocol_to_workflow: function(protocol_name, callback){
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
		save_workflow: function(){
			var values = $('#sortable_list li').map(function() {
			    return this.value;
			});
			list_values = values.get().join(',');

			pg_requests.add_workflow(function(response){
				if(response.status == 201){
					ngs_onto_requests.ngs_onto_request_add_workflow(response.data.id, list_values, function(response){
						//do something
						objects_utils.show_message('workflows_message_div', 'success', 'Workflow saved.');
						console.log("workflow saved");
					});
				}
				else{
					objects_utils.show_message('workflows_message_div', 'warning', 'An error as occurried when saving the workflow.');
					console.log(response.statusText);
				}
			})
		}
	}

	return returned_functions;

}