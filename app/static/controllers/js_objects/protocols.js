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
const Protocol_List = ($http) => {

    let protocolTypeObject = {}, protocols = {}, protocol_version = [];
    let selectedNewProtocolType = '',
        currentProtocolType = '';

    let protocol_type = {};
    let protocols_of_type = [];

    const pg_requests = Requests(0, null, $http);
    const ngs_onto_requests = ngs_onto_client(0, $http);

    const processProtocolForm = (property, uri) => {


        if (property === 'used Parameter') {
            return ["button", "text", uri];
        }
        if (property === 'used Software') {
            return ["select", "text"];
        }
        if (property === 'name' || property === 'CPUs' || property === 'Memory') {
            return ["input", "required"];
        }
        return ["input", "text"];

    };

    const modalAlert = (text, header, callback) => {

        const modalBodyEl = $("#modalAlert .modal-body");
        const buttonSub = $("#buttonSub");

        $("#buttonCancelAlert").off("click");

        $("#modalAlert .modal-title").empty();
        $("#modalAlert .modal-title").append("<p>" + header + "</p>");

        modalBodyEl.empty();
        modalBodyEl.append("<p>" + text + "</p>");

        buttonSub.off("click").on("click", () => {
            $("#modalAlert").modal("hide");

            setTimeout(() => {
                return callback();
            }, 400);
        });

        $("#modalAlert").modal("show");

    };

    const returned_functions = {

        /*
        Get the types of protocols from the ngsonto
        */
        get_protocol_types: (callback) => {

            ngs_onto_requests.ngs_onto_get_protocol_types((response) => {

                protocol_types = response.data.map((d) => {

                    let pname = d.protocTypeLabel.split('"')[1].replace(/'/g, "");
                    let puri = d.protocType;
                    protocolTypeObject[pname] = puri;
                    return pname;
                });

                callback({
                    protocol_types: protocol_types,
                    protocolTypeObject: protocolTypeObject
                });
            });
        },

        /*
        Add a protocol
        */
        add_protocol: (callback) => {

            const form_serialized = $('#new_protocol_form').serializeArray();
            let protocol_object = {};

            //Parse the information to send to postgresql
            if ($("#parameter_select").length) {
                let options = $('#parameter_select option');
                let values = {};

                $.map(options, (option) => {
                    let parts = option.value.split(':');
                    let key = parts.shift();
                    values[key] = parts.join(":");
                });

                protocol_object['used Parameter'] = values;
            }
            protocol_object['protocol_type'] = currentProtocolType;

            for (const i in form_serialized) {
                protocol_object[form_serialized[i].name.split('_')[1]] = form_serialized[i].value;
            }

            //Send the protocol to the database
            pg_requests.create_protocol(protocol_object, (response) => {
                if (response.status === 201) {

                    let new_protocol_id = response.data.id;

                    //Add the protocol to the ngsonto
                    ngs_onto_requests.ngs_onto_request_create_protocol(protocolTypeObject, currentProtocolType, new_protocol_id, (response) => {
                        callback({message: "protocol added to ngs onto"});
                        modalAlert('Protocol saved!', "Info", () => {
                        });
                    });
                }
                else {
                    modalAlert('An error as occurried when saving the protocol.', "Error", () => {
                    });
                }
            });


        },

        /*
        Load the form to construct a protocol
        */
        load_protocol_form: (selectedType, callback) => {

            selectedNewProtocolType = selectedType;
            currentProtocolType = selectedNewProtocolType;
            ngs_onto_requests.ngs_onto_load_protocol_properties(protocolTypeObject[selectedNewProtocolType], (response) => {
                protocol_type = {};

                let protocol_parameters = [];

                for (const i in response.data) {
                    let protocolProperty = response.data[i].plabel.split('"')[1];
                    let protocolUri = response.data[i].rangeClass;

                    if (protocolProperty === "used Software") {
                        protocol_type["Nextflow Tag"] = ["select", "nextflow"];
                        protocol_type["Image"] = ["input", "text"];
                        protocol_type["Version"] = ["input", "required"];
                        // CPU and Memory are now specified as a parameter. If not,
                        // they use the default.
                        protocol_type["CPUs"] = ["number", "required"];
                        protocol_type["Memory"] = ["number", "required"];
                    }
                    else {
                        protocol_type[protocolProperty] = processProtocolForm(protocolProperty, protocolUri);
                    }

                }

                callback({
                    protocol_type: protocol_type,
                    protocol_parameters: protocol_parameters
                });
            });
        },

        /*
        Get the available protocols of a given type
        */
        get_protocols_of_type: (selectedType, callback) => {

            pg_requests.get_protocols_of_type(selectedType, (response) => {
                if (response.status === 200) {
                    let property_fields = [];
                    protocols_of_type = [];
                    protocol_version = [];
                    let protocol_ids = [];

                    for (const i in response.data) {
                        protocols_of_type.push(response.data[i].name);
                        protocol_ids.push(response.data[i].id);

                        if (!protocols.hasOwnProperty(response.data[i].id)) {
                            protocols[response.data[i].id] = {};
                        }

                        let ps = $.parseJSON(response.data[i].steps.replace(/'/g, '"'));
                        protocol_version.push(ps.Version);

                        for (const j in ps) {
                            protocols[response.data[i].id][j] = ps[j];
                        }

                        protocols[response.data[i].id].id = response.data[i].id;

                    }
                    callback({
                        property_fields: property_fields,
                        protocols_of_type: protocols_of_type,
                        protocols: protocols,
                        protocol_version: protocol_version,
                        protocol_ids: protocol_ids
                    });
                }
                else {
                    protocols_of_type = [];
                    let property_fields = [];
                    let protocol_version = [];
                    let protocol_ids = [];
                    callback({
                        protocols_of_type: protocols_of_type,
                        property_fields: property_fields,
                        protocols: protocols,
                        protocol_version: protocol_version,
                        protocol_ids: protocol_ids
                    });
                }
            })
        },

        /*
        Load a protocol to show its fields
        */
        load_protocol: (selectedProtocol, callback) => {

            callback({protocol: protocols[selectedProtocol]});

        },

        /*
        Get the fields to create a new protocol
        */
        get_protocol_fields: (uri, callback) => {
            ngs_onto_requests.ngs_onto_get_protocol_fields(uri, (response) => {
                let property_fields = [];

                for (const i in response.data) {
                    if (property_fields.indexOf(response.data[i].plabel.split('"')[1]) < 0) property_fields.push(response.data[i].plabel.split('"')[1])
                }

                property_fields = property_fields.reverse();
                //property_fields = property_fields;

                $('#newProtocolModal').modal('show');

                callback({property_fields: property_fields});
            });
        },

        /*
        Get the type of the current protocol
        */
        get_current_protocol_type: (callback) => {
            callback({currentProtocolType: currentProtocolType});
        },

        /*
        Get protocols parameters provided by FlowCraft
         */
        check_protocol_parameters: (selected_tag, callback) => {
            pg_requests.check_protocol_parameters(selected_tag, (response) => {
                callback(response);
            });
        }


    };

    return returned_functions;
};