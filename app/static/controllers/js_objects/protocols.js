/*
Protocol_List Object - An object with all functions used in the protocols controller
 - get_protocol_types
 - add_protocol
 - load_protocol_form
 - get_protocols_of_type
 - load_protocol
 - get_protocol_fields
 - get_current_protocol_type
*/

/*
Launch a protocol_list instance
*/
function Protocol_List($http){

	var file_formats = ["fastq", "gbk", "bam", "sam"];

	var protocolTypeObject = {}, protocols = {};
	var selectedProtocolType = '', selectedNewProtocolType = '', currentProtocolType = '';
	
	var protocol_type = {}, protocolTypeParameters = {};
	var protocols_of_type = [];

	var pg_requests = new Requests(0, null, $http);
    var ngs_onto_requests = new ngs_onto_client(0, $http);
    var objects_utils = new Objects_Utils();


    function processProtocolForm(property, uri){

    	console.log(property);

		if(property == 'used Parameter'){
			return ["button", "text", uri];
		}
		if(property == 'used Software'){
			return ["select", "text"];
		}
		if(property == 'name' || property == 'SLURM CPUs'){
			return ["input", "required"];
		}
		return ["input", "text"];

	}

	var returned_functions = {

		/*
		Get the types of protocols from the ngsonto
		*/
		get_protocol_types: function(callback){
			
			ngs_onto_requests.ngs_onto_get_protocol_types(function(response){
				protocol_types = response.data.map(function(d){
		    		pname = d.protocTypeLabel.split('"')[1].replace(/'/g, "")
		    		puri = d.protocType;
		    		protocolTypeObject[pname] = puri;
		            return pname;
		        });
		        callback({protocol_types: protocol_types, protocolTypeObject:protocolTypeObject});
			});
		},

		/*
		Add a protocol
		*/
		add_protocol: function(callback){
			
			form_serialized = $('#new_protocol_form').serializeArray();
			var protocol_object = {};

			//Parse the information to send to postgresql
			if ( $( "#parameter_select" ).length ) {
		 		var options = $('#parameter_select option');
		 		var values = {};
				$.map(options ,function(option) {
					parts = option.value.split(':');
				    values[parts[0]] = parts[1];
				});
				protocol_object['used Parameter'] = values;
			}
			protocol_object['protocol_type'] = currentProtocolType;

			for (i in form_serialized){
				protocol_object[form_serialized[i].name.split('_')[1]] = form_serialized[i].value;
			}

			//Send the protocol to the database
			/*
			pg_requests.create_protocol(protocol_object, function(response){
				if(response.status == 201){
					new_protocol_id = response.data.id;
					//Add the protocol to the ngsonto
					ngs_onto_requests.ngs_onto_request_create_protocol(protocolTypeObject, currentProtocolType, new_protocol_id, function(response){
						callback({message: "protocol added to ngs onto"});
						objects_utils.show_message('protocols_message_div', 'success', 'Protocol saved.');
					})
				}
				else{
					objects_utils.show_message('protocols_message_div', 'warning', 'An error as occurried when saving the protocol.');
				} 
			});
			*/
		},

		/*
		Load the form to construct a protocol
		*/
		load_protocol_form: function(selectedType, callback){

			selectedNewProtocolType = selectedType;
			currentProtocolType = selectedNewProtocolType;
			ngs_onto_requests.ngs_onto_load_protocol_properties(protocolTypeObject[selectedNewProtocolType], function(response){
				protocol_type = {};
		    	protocol_parameters = [];
		    	for(i in response.data){
		    		protocolProperty = response.data[i].plabel.split('"')[1]
		    		protocolUri = response.data[i].rangeClass
		    		protocol_type[protocolProperty] = processProtocolForm(protocolProperty, protocolUri);
		    	}
		    	protocol_type["SLURM CPUs"] = ["input", "required"];
		    	callback({protocol_type:protocol_type, protocol_parameters:protocol_parameters});
			});
		},

		/*
		Get the available protocols of a given type
		*/
		get_protocols_of_type: function(selectedType, callback){
			pg_requests.get_protocols_of_type(selectedType, function(response){
				if(response.status == 200){
					property_fields = [];
			    	protocols_of_type = [];
			    	for(i in response.data){
			    		protocols_of_type.push(response.data[i].name);
			    		if (!protocols.hasOwnProperty(response.data[i].name)){
			    			protocols[response.data[i].name] = {};
			    		}
			    		ps = $.parseJSON(response.data[i].steps.replace(/'/g, '"'));
			    		for (j in ps){
			    			protocols[response.data[i].name][j] = ps[j];
			    		}
			    		protocols[response.data[i].name].id = response.data[i].id;

			    	}
			    	callback({property_fields:property_fields, protocols_of_type:protocols_of_type, protocols:protocols});
				}
				else{
					protocols_of_type = [];
					property_fields = [];
					callback({protocols_of_type:protocols_of_type, property_fields:property_fields, protocols:protocols});
				}
			})
		},

		/*
		Load a protocol to show its fields
		*/
		load_protocol: function(selectedProtocol, callback){

			callback({protocol:protocols[selectedProtocol]});

		},

		/*
		Get the fields to create a new protocol
		*/
		get_protocol_fields: function(uri, callback){
			ngs_onto_requests.ngs_onto_get_protocol_fields(uri, function(response){
		        property_fields = [];
		    	for(i in response.data){
		    		if(property_fields.indexOf(response.data[i].plabel.split('"')[1]) < 0) property_fields.push(response.data[i].plabel.split('"')[1])
		    	}
		        property_fields = property_fields.reverse();
		        property_fields = property_fields;
		        $('#newProtocolModal').modal('show');
		        callback({property_fields:property_fields});
			});
		},

		/*
		Get the type of the current protocol
		*/
		get_current_protocol_type: function(callback){
			callback({currentProtocolType: currentProtocolType});
		}


	}

	return returned_functions;
}