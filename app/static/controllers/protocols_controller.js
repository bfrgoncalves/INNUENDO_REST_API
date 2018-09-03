/**
 * Controller of the protocols page. Interacts with the protocols.js file to
 * create new protocols
 */
innuendoApp.controller("protocolsCtrl", ($scope, $http) => {

    $scope.required = true;

    const backButtonEl = $("#backbutton");

    current_scope_template = $scope.selectedTemplate.path;

    if (PREVIOUS_PAGE_ARRAY.length > 0) backButtonEl.css({"display": "block"});
    else backButtonEl.css({"display": "none"});

    $("#innuendofooter").css({"display": "none"});


    /*
        Function to allow store state of previous pages
        Allows return to previous page by pop element from array
     */
    backButtonEl.off("click").on("click", () => {
        $scope.$apply(() => {
            session_array = PREVIOUS_PAGE_ARRAY.pop();

            CURRENT_PROJECT_ID = session_array[1];
            CURRENT_JOB_MINE = session_array[2];
            CURRENT_PROJECT = session_array[3];
            CURRENT_SPECIES_ID = session_array[4];
            CURRENT_SPECIES_NAME = session_array[5];
            CURRENT_USER_NAME = session_array[6];
            CURRENT_JOBS_ROOT = session_array[7];

            CURRENT_JOB_ID = session_array[8];
            CURRENT_PROJECT_NAME_ID = session_array[9];
            CURRENT_TABLE_ROWS_SELECTED = session_array[10];
            CURRENT_TABLE_ROW_ANALYSIS_SELECTED = session_array[11];
            PROJECT_STATUS = session_array[12];

            $scope.selectedTemplate.path = session_array[0];
        })
    });

    /*
        Set position of loading spinner
     */
    $('#waiting_spinner').css({
        display: 'block',
        position: 'fixed',
        top: '40%',
        left: '50%'
    });

    /*
        Define which options are available in the sidebar. They depend on
         the current page and the user permissions.
     */
    $("#projects_button_li").css({"display": "none"});
    $("#reports_button_li").css({"display": "none"});
    $("#uploads_button_li").css({"display": "none"});
    $("#tools_button_li").css({"display": "none"});
    $("#user_tools").css({"display": "none"});
    $("#workflows_button_li").css({"display": "block"});
    $("#protocols_button_li").css({"display": "block"});
    $("#species_drop_button_li").css({"display": "none"});
    $("#overview_li").css({"display": "block"});


    /*
        Trigger protocols tabs. The new protocol tab and the available
         protocols tab.
     */
    $("#new_protocol_tab").on("click", () => {
        $("#new_protocol_tab").addClass("active");
        $("#available_protocols_tab").removeClass("active");
        $("#div_available_protocols").css({"display": "none"});
        $("#div_new_protocol").css({"display": "block"});
    });

    $("#available_protocols_tab").on("click", () => {
        $("#available_protocols_tab").addClass("active");
        $("#new_protocol_tab").removeClass("active");
        $("#div_available_protocols").css({"display": "block"});
        $("#div_new_protocol").css({"display": "none"});
    });

    /*
        Clear get status interval when in the protocols page. The interval
         is only triggered when the user is on the sungle project page.
     */
    for (const interval in intervals_running) {
        if (intervals_running.hasOwnProperty(interval)) {
            clearInterval(intervals_running[interval]);
        }
    }

    // RESET ROW SELECTION
    CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};
    CURRENT_TABLE_ROWS_SELECTED = {};

    // RESET REPORT SELECTOR
    TO_LOAD_STRAINS = "";
    TO_LOAD_PROJECTS = "";

    // Protocol Params variable
    let paramsObject = {};

    $scope.protocol_type = {};
    $scope.protocols_of_type = [];
    $scope.protocolTypeParameters = {};

    // Load protocol object with all the available functions
    const protocols_list = Protocol_List($http);

    // First function that is triggered when the user enters in the scope of
    // the Protocol page.
    $scope.loadProtocols = () => {
        $scope.getProtocolTypes();
    };


    /*
        Function to get the available parameters for a given nextflow tag
         and set the default protocol parameters.
         Triggers a request to the REST API, which asks FlowCraft for the
          parameters.
     */
    const getParameters = (selected_text) => {

        // Get parameters for firsts elected Nextflow tag
        protocols_list.check_protocol_parameters(selected_text, (results) => {

            if (results.data === "False") {
                console.log("Error loading parameters");
            }
            else {
                try {
                    // Modifies string so that it can be parsed to JSON object
                    const newString = results.data.content.replace(/'/g, '"');
                    paramsObject = JSON.parse(results.data.content);

                    const parameterEl = $('#parameter_select');

                    let option = "";

                    // Set default values of a protocol
                    for (const x in paramsObject[selected_text]) {
                        const valueToUse = paramsObject[selected_text][x].value !== undefined ?
                            paramsObject[selected_text][x].value :
                            paramsObject[selected_text][x].default;

                        option += "<option>" + x + ":" + valueToUse + "</option>";
                    }

                    parameterEl.empty();
                    parameterEl.append(option);

                    $(".selectpicker").selectpicker("refresh");

                }
                catch (e) {
                    console.log(e);
                    console.log("Error loading protocol parameters");
                    return;
                }
            }

        });
    };

    /*
        Function to get the NGSOnto protocol types. used to classify then.
         Each type as a different set of input parameters.
     */
    $scope.getProtocolTypes = () => {

        protocols_list.get_protocol_types((results) => {

            $scope.protocol_types = results.protocol_types;
            let options = "";

            // Set the protocol type options
            for (const x in results.protocol_types) {
                options += "<option>" + results.protocol_types[x] + "</option>";
            }

            const protocolSelEl = $("#protocol_type_selector");
            const protocolSelLoadEl = $("#protocol_type_selector_load");

            protocolSelEl.empty();
            protocolSelLoadEl.empty();
            protocolSelEl.append(options);
            protocolSelLoadEl.append(options);

            // Trigger event on change on the dropdowns. Change the inputs
            protocolSelEl.on("change", () => {
                $scope.loadProtocolCreator(
                    $("#protocol_type_selector option:selected").text()
                );
            });
            protocolSelLoadEl.on("change", () => {
                $scope.loadProtocolType(
                    $("#protocol_type_selector_load option:selected").text()
                );
            });

            protocolSelEl.trigger("change");
            protocolSelLoadEl.trigger("change");

        });
    };

    /*
        Function to add a protocol to the database
     */
    $scope.addProtocol = () => {
        protocols_list.add_protocol((results) => {
        });

    };

    /*
        Function to load protocol inputs depending on a type. Loads a form
         with the options for nextflow tags if available for that type.
     */
    $scope.loadProtocolCreator = (selectedType) => {

        $("#new_protocol_form").css({"display": "none"});

        protocols_list.load_protocol_form(selectedType, (results) => {
            $(".to_empty").val("");
            $('.to_empty option').remove();

            $scope.protocol_parameters = results.protocol_parameters;
            $scope.protocol_type = results.protocol_type;
            $("#create_protocol_button").css({"display": "block"});

            setTimeout(() => {
                if ($.inArray("used Software", results.protocol_parameters)) {
                    let options = "";
                    let options_nextflow = "";

                    // Add nextflow tag options
                    for (const y in nextflow_tags) {
                        options_nextflow += "<option>" + nextflow_tags[y] + "</option>";
                    }

                    const selectPickerEl = $(".selectpicker");

                    $('#select_software').empty().append(options);
                    $('#nextflow_tag').empty().append(options_nextflow);

                    // Trigger change on parameters when the Nextflow tag
                    // changes
                    $("#nextflow_tag").off("change").on("change", () => {
                        getParameters($("#nextflow_tag").val());
                    });

                    $('#selectpickerparams').empty().append(options_nextflow);

                    selectPickerEl.selectpicker({});
                    selectPickerEl.selectpicker("refresh");

                    getParameters(nextflow_tags[0]);

                    $("#new_protocol_form").css({"display": "block"});

                    $('#waiting_spinner').css({display: 'none'});
                    $('#protocol_controller_div').css({display: 'block'});

                }
            }, 800);
        });
    };

    /*
        Load protocols available of a given type.
     */
    $scope.loadProtocolType = (selectedType) => {

        protocols_list.get_protocols_of_type(selectedType, (results) => {

            $scope.property_fields = results.property_fields;

            let options = "";

            for (const x in results.protocols_of_type) {
                let data_content = results.protocols_of_type[x]+'<span class="label label-info" style="margin-left: 1%;">' + results.protocol_version[x] + '</span>';

                options += "<option style='width:100%;' p_id='"+results.protocol_ids[x]+"' data-content='"+data_content+"'>"+results.protocols_of_type[x]+"</option>";
            }

            const protocolSelLoadEl = $("#protocol_selector_load");

            protocolSelLoadEl.empty();
            protocolSelLoadEl.append(options);

            // On change, loads the information regarding that protocol
            protocolSelLoadEl.on("change", () => {
                protocols_list.load_protocol($("#protocol_selector_load" +
                    " option:selected").attr("p_id"), (results) => {
                    $scope.$apply(() => {
                        $scope.selected_protocol = results.protocol;
                    })
                    $("#div_protocol_show").css({display: "block"});

                    $(".selectpicker").selectpicker("refresh");

                });
            });

            setTimeout(() => {
                $(".selectpicker").selectpicker("refresh");
                protocolSelLoadEl.trigger("change");
            }, 600);

        });
    };

    /*
        Function to load information regarding a given protocol.
     */
    $scope.loadProtocol = (selectedProtocol) => {

        const protocolEl = $("#div_protocol_show");

        protocolEl.css({display: "none"});

        protocols_list.load_protocol(selectedProtocol, (results) => {
            $scope.selected_protocol = results.protocol;
            protocolEl.css({display: "block"});
        });
    };

    $scope.getProtocolFields = (uri) => {

        protocols_list.get_protocol_fields(uri, (results) => {
            $scope.property_fields = results.property_fields.reverse();
        });
    };

    /*
        Function to load the modal with the available parameters for a given
         protocol.
     */
    $scope.checkProtocolParameters = () => {
        $scope.protocolParameters = paramsObject;
        $('#newProtocolModal').modal('show');
    };

    /*
        Function to allow editing parameters of a given protocol
     */
    $scope.EditParameters = () => {

        const parameterEl = $('#parameter_select');

        protocols_list.get_current_protocol_type((results) => {
            const parameterObject = $('#new_data_form').serializeArray();
            const selected_tag = $("#nextflow_tag").val();

            console.log(parameterObject);

            // Modify parameters object depending on the new parameter values
            for (const param of parameterObject) {
                console.log(paramsObject, selected_tag, param.name);
                for (const i in paramsObject[selected_tag]) {
                    if (i === param.name) {
                        paramsObject[selected_tag][i].value = param.value;
                    }
                }
            }

            let option = "";

            // Chnage the parameter values in the dropdown input.
            for (const param in paramsObject[selected_tag]) {
                option += "<option>" + param + ":" + paramsObject[selected_tag][param].value + "</option>";
            }

            parameterEl.empty();
            parameterEl.append(option);

            $(".selectpicker").selectpicker("refresh");

            $('#newProtocolModal').modal('hide');

            modalAlert("Protocol parameters updated!", "Information", () => {
            });

        });

    };

});