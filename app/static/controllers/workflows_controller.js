/**
 * Angular controller for the workflows
 * It comunicates with the workflows.js file to create workflows based on
 * protocols
 */
innuendoApp.controller("workflowsCtrl", ($scope, $http) => {

    const backButtonEl = $("#backbutton");
    current_scope_template = $scope.selectedTemplate.path;

    if(PREVIOUS_PAGE_ARRAY.length > 0) {
        backButtonEl.css({"display":"block"});
    }
    else {
        backButtonEl.css({"display":"none"});
    }

    $("#innuendofooter").css({"display":"none"});

    backButtonEl.off("click").on("click", () => {
        $scope.$apply( () => {
            let session_array = PREVIOUS_PAGE_ARRAY.pop();

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
        });
    });

    $("#new_workflow_tab").on("click", () => {
        $("#new_workflow_tab").addClass("active");
        $("#available_workflows_tab").removeClass("active");
        $("#div_available_workflows").css({"display":"none"});
        $("#div_new_workflow").css({"display":"block"});
    });

    $("#available_workflows_tab").on("click", () => {
        $("#available_workflows_tab").addClass("active");
        $("#new_workflow_tab").removeClass("active");
        $("#div_available_workflows").css({"display":"block"});
        $("#div_new_workflow").css({"display":"none"});
    });

    $('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});

    $("#projects_button_li").css({"display":"none"});
    $("#reports_button_li").css({"display":"none"});
    $("#uploads_button_li").css({"display":"none"});
    $("#tools_button_li").css({"display":"none"});
    $("#user_tools").css({"display":"none"});
    $("#workflows_button_li").css({"display":"block"});
    $("#protocols_button_li").css({"display":"block"});
    $("#species_drop_button_li").css({"display":"none"});
    $("#overview_li").css({"display":"block"});

    //RESET ROW SELECTION
    CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};
    CURRENT_TABLE_ROWS_SELECTED = {};

    //RESET REPORT SELECTOR
	TO_LOAD_STRAINS = "";
	TO_LOAD_PROJECTS = "";

    $scope.added_protocols = {};
    $scope.class_options = ["Classifier", "Procedure"];

    let options = "";

    for(const x in $scope.class_options){
        if ($scope.class_options.hasOwnProperty(x)){
            options +="<option>"+$scope.class_options[x]+"</option>";
        }
    }

    const selectClassEl = $("#select_classifier");
    const selectPickerEl = $(".selectpicker");

    selectClassEl.empty();
    selectClassEl.append(options);

    selectPickerEl.selectpicker({});
    selectPickerEl.selectpicker("refresh");

    const protocols = Protocol_List($http);
    const workflows = Workflows($http);
    const projects_table = Projects_Table(0, null, $http);
    const objects_utils = Objects_Utils();


    let workflows_col_defs = [
        {
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "id" },
        { "data": "name" },
        { "data": "version" },
        { "data": "classifier" },
        { "data": "species" },
        { "data": "availability" },
        { "data": "dependency" },
        { "data": "timestamp" }
    ];

    $scope.workflows_headers = ['ID', 'Name', 'Version','Type', 'Species', 'Available', "Dependency", "Timestamp"];

    const modalAlert = (text, header, callback) => {

        const buttonSubEl = $('#buttonSub');
        const modalBodyEl = $('#modalAlert .modal-body');

        $('#buttonCancelAlert').off("click");

        $('#modalAlert .modal-title').empty();
    	$('#modalAlert .modal-title').append("<p>"+header+"</p>");

        modalBodyEl.empty();
        modalBodyEl.append("<p>"+text+"</p>");

        buttonSubEl.off("click").on("click", () => {

            $('#modalAlert').modal("hide");
            console.log("Alert");

            setTimeout( () => {
                return callback();
            }, 400);
        });

        $('#modalAlert').modal("show");

    };

    $scope.launch_sortable = () => {

        sortable('.sortable');
        $scope.getProtocolTypes();
        $scope.getSpecies();

        workflows.get_all_workflows( (results) => {

            $scope.workflows_names = [];
            let options = "";

            options += "<optgroup label='Start Input'>" +
                "<option>Fastq</option>+" +
                "<option>Accession</option>" +
                "</optgroup>";

            options += "<optgroup label='Procedures'>";

            for (const x in results.data){
                let data_content = '<b>' + results.data[x].name+'</b> ('+results.data[x].species+')<span' +
                    ' class="label' +
                    ' label-info" style="margin-left: 1%;">' + results.data[x].version + '</span>';
                options +="<option data-content='"+data_content+"'>"+results.data[x].name+"</option>";
            }

            options += "</optgroup>";

            const selectDependencyEl = $("#select_dependency");

            selectDependencyEl.empty();
            selectDependencyEl.append(options);

            objects_utils.loadDataTables('workflows_table', results.data, workflows_col_defs);
        });
    };

    $scope.changeWorkflowState = () => {
        workflows.change_workflow_state( () => {
            workflows.get_all_workflows( (results) => {
                objects_utils.destroyTable('workflows_table');
                objects_utils.loadDataTables('workflows_table', results.data, workflows_col_defs);
            });
        });
    };

    const updateWorkflows = () => {
        workflows.get_all_workflows( (results) => {

            let options = "";

            options += "<optgroup label='Start Input'>" +
                "<option>Fastq</option>+" +
                "<option>Accession</option>" +
                "</optgroup>";

            options += "<optgroup label='Procedures'>";

            for (const x in results.data){
                let data_content = '<b>' + results.data[x].name+'</b> ('+results.data[x].species+')<span' +
                    ' class="label' +
                    ' label-info" style="margin-left: 1%;">' + results.data[x].version + '</span>';
                options +="<option data-content='"+data_content+"'>"+results.data[x].name+"</option>";
            }

            options += "</optgroup>";

            const selectDependencyEl = $("#select_dependency");

            selectDependencyEl.empty();
            selectDependencyEl.append(options);

            const selectPickerEl = $(".selectpicker");
            selectPickerEl.selectpicker("refresh");

            objects_utils.destroyTable('workflows_table');
            objects_utils.loadDataTables('workflows_table', results.data, workflows_col_defs);
        });
    };

    $scope.getProtocolTypes = () => {

        protocols.get_protocol_types( (results) => {
            $scope.protocol_types = results.protocol_types;

            let options = "";

            for(const x in results.protocol_types){
                options +="<option>"+results.protocol_types[x]+"</option>";
            }

            const protocolTypeSelEl = $("#protocol_type_selector_load");
            const selectPickerEl = $(".selectpicker");

            protocolTypeSelEl.empty();
            protocolTypeSelEl.append(options);
            selectPickerEl.selectpicker({});
            selectPickerEl.selectpicker("refresh");

            protocolTypeSelEl.on("change", () => {
                $scope.loadProtocolType($("#protocol_type_selector_load option:selected").text());
            });

            protocolTypeSelEl.trigger("change");

            workflows.set_protocol_types_object(results.protocolTypeObject);

            $('#waiting_spinner').css({display:'none'});
            $('#workflow_controller_div').css({display:'block'});
        });

    };

    $scope.getSpecies = () => {

        projects_table.get_species_names( (results) => {
            let options = "";
            results.species.map( (d) => {
                options += "<option>"+d.name+"</option>";
            });

            const workflowSpeciesEl = $("#workflow_species");
            const selectPicker = $(".selectpicker");

            workflowSpeciesEl.empty();
            workflowSpeciesEl.append(options);
            selectPicker.selectpicker({});
            selectPicker.selectpicker("refresh");

        });

    };

    $scope.loadProtocolType = (selectedType) => {

        $("#div_button_addto_workflow").css({display:"none"});

        protocols.get_protocols_of_type(selectedType, (results) => {
            workflows.set_protocols_of_type(results.protocols);
            $scope.property_fields = results.property_fields;

            let options = "";

            for(const x in results.protocols_of_type){
                let data_content = results.protocols_of_type[x]+'<span class="label label-info" style="margin-left: 1%;">' + results.protocol_version[x] + '</span>';

                options += "<option style='width:100%;' p_id='"+results.protocol_ids[x]+"' data-content='"+data_content+"'>"+results.protocols_of_type[x]+"</option>";

                //options +="<option>"+results.protocols_of_type[x]+"</option>";
            }

            const protocolSelEl = $("#protocol_selector_load");

            protocolSelEl.empty();
            protocolSelEl.append(options);
            $(".selectpicker").selectpicker("refresh");

            protocolSelEl.on("change", () => {
                $("#div_button_addto_workflow").css({display:"block"});
            });

            if(results.protocols.length !== 0) {
                protocolSelEl.trigger("change");
            }
        });
    };


    $scope.addToPipeline = () => {

        workflows.add_protocol_to_workflow($("#protocol_selector_load" +
            " option:selected").attr("p_id"), (results) => {

            if(results.more_than_one === true){
                modalAlert("At the moment, only one protocol can be applied" +
                    " to the workflow. We will improve this option in the" +
                    " near future.", "Protocols", () => {
                    $scope.added_protocols = results.added_protocols;
                });
            }
            else {
                $scope.added_protocols = results.added_protocols;
            }

            $("#prot_default").css({display: "none"});
            $("#div_workflow_test").css({display: "block"});

            setTimeout( () => {
                $(".current_workflow_close").on("click", (e) => {
                    $scope.removeFromPipeline($(e.target).closest("li").attr("protocol_name"))
                });
            }, 800);
        });
    };

    $scope.testWorkflow = () => {

        const values = $('#sortable_list li').map( (i, el) => {
            return el.value;
        });

        let list_values = values.get().join(',');

        workflows.test_workflow(list_values, (results) => {
            let message = "";

            if (results.data.content.indexOf("DONE!") > -1) {
                message += "<div class='alert" +
                    " alert-success'><strong>Success!</strong> Workflow" +
                    " was build without errors.</div>";
            }
            else {
                message += "<div class='alert" +
                    " alert-danger'><strong>Error!</strong> There was some" +
                    " problems when building the workflow.</div>";
            }
            modalAlert("<pre>"+results.data.content+"</pre>" + message, "Result", () => {});
        });

    }

    $scope.removeFromPipeline = (protocol_name) => {

        workflows.remove_protocol_from_workflow(protocol_name, (results) => {
            $scope.$apply( () => {
                $scope.added_protocols = results.added_protocols;
            });
            
            if (Object.keys(results.added_protocols).length === 0) {
                $("#prot_default").css({display: "block"});
                $("#div_workflow_test").css({display: "none"});
            }
            modalAlert("The protocol was removed from the workflow.", "Protocol Removed", () => {
            });
        });

    };

    $scope.add_New_Workflow = () => {

        workflows.save_workflow( (status, response) => {

            updateWorkflows();

            if(status === true){
                modalAlert("Workflow saved.", "Workflows", () => {
                });
            }
            else{
                modalAlert("An error as occurried when saving the" +
                    " workflow.\n" + response.data.message, "Error", () => {
                });
            }
        });

    };


});