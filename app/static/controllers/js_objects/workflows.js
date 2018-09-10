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
const Workflows = ($http) => {

	let protocolTypeObject = {}, protocols = {}, added_protocols = [];
	intervals_running = {};
	pipeline_status = {};
	jobs_to_parameters = {};

	const pg_requests = Requests(0, null, $http);
    const ngs_onto_requests = ngs_onto_client(0, $http);
    //const objects_utils = Objects_Utils();

	const returned_functions = {

		/*
		Set all the available protocol types
		*/
		set_protocol_types_object: (protocolTObject) => {
			protocolTypeObject = protocolTObject;
			return true;
		},

		/*
		Set the protocols of a given type
		*/
		set_protocols_of_type: (protocols_of_type) => {
			protocols = protocols_of_type;
			return true;
		},

		get_all_workflows: (callback) => {

			pg_requests.get_all_workflows( (response) => {

				for(const x in response.data){
					if(response.data[x].availability === null){
						response.data[x].availability = true;
					}
				}
				callback(response);
			});
		},

		/*
		Add a protocol to a workflow
		*/
		add_protocol_to_workflow: (protocol_name, callback) => {
			/*Uncomment if only one protocol by workflow is to be used

			if(Object.keys(added_protocols).length > 0) return callback({more_than_one:true, added_protocols:added_protocols});

			*/
			let hasProtocol = false;

			for (const protocol of added_protocols) {
				if (String(protocol.id) === protocol_name) {
					hasProtocol = true;
					break;
				}
			}

			if (!hasProtocol) {
				added_protocols.push(protocols[protocol_name]);
			}

			if(added_protocols.length > 0){
				$('#workflow_form_block').css({display:'block'});
			}
			else $('#workflow_form_block').css({display:'none'});
			
			setTimeout( () => {
				sortable('.sortable');
			}, 100);

			callback({added_protocols:added_protocols});
		},

		change_workflow_state: (callback) => {


			$("#modalChangeState").modal("show");

			$(".selectpicker").selectpicker();

			$("#buttonSubState").off("click").on("click", () => {
				const selected_data = $.map($("#workflows_table").DataTable().rows('.selected').data(), (data) => {

					let availability = $("#stateOption").val();

					return [data.id, availability];
				});

				pg_requests.change_workflow_state(selected_data, (response) => {
					callback(response);
					$("#messageState").text("Workflow state changed");

				});
			});

		},

		/*
		Remove a protocol from a workflow
		*/
		remove_protocol_from_workflow: (protocol_name, callback) => {

			let hasProtocol = false;
			let new_protocols = [];

			for (const protocol of added_protocols) {
				if (String(protocol.id) !== protocol_name) {
					new_protocols.push(protocol);
				}
			}

			added_protocols = new_protocols;

			if(Object.keys(added_protocols).length > 0){
				$('#workflow_form_block').css({display:'block'});
			}
			else $('#workflow_form_block').css({display:'none'});
			
			setTimeout( () => {
				sortable('.sortable');
			}, 100);

			callback({added_protocols: added_protocols});
		},

		/*
		Save a workflow
		*/
		save_workflow: (callback) => {

			const values = $('#sortable_list li').map( (i, el) => {
			    return el.value;
			});

			let list_values = values.get().join(',');
			
			pg_requests.add_workflow( (response) => {
				if(response.status === 201){
					ngs_onto_requests.ngs_onto_request_add_workflow(response.data.id, list_values, (response) => {
						callback(true, response);
					});
				}
				else{
					callback(false, response);
				}
			})
		},

		/*
		Test a workflow before saving
		 */
		test_workflow: (list_protocols, callback) => {
			pg_requests.test_workflow(list_protocols, (response) => {
				callback(response);
			})
		}
	};

	return returned_functions;

};