/**
 * Function to set headers metadata
 * @param global_strains
 * @param procedure
 * @returns {[null,null]}
 */
const set_headers_metadata = (global_strains, procedure) => {
    const metadata = new Metadata();
    const matching_fields = metadata.get_dict_fields_reverse();
    //const minimal_fields = metadata.get_default_headers();

    let strains_headers = [], p_col_defs = [];


    if(global_strains.length === 0){

        p_col_defs = [
            {
                "className":      'select-checkbox',
                "orderable":      false,
                "data":           null,
                "defaultContent": ''
            },
            { "data": "Sample" },
            { "data": "job_id" }

        ];

        strains_headers = ["Sample","Run Identifier"]
    }
    else if(procedure !== null && procedure.indexOf("results_info_chewBBACA") > -1){

        p_col_defs = [
            {
                "className":      'select-checkbox',
                "orderable":      false,
                "data":           null,
                "defaultContent": ''
            },
            { "data": "Sample" },
            { "data": "job_id" },
            {
                "className":      'get_results',
                "orderable":      false,
                "data":           null,
                "defaultContent": '<div><button class="analysis-control' +
                ' btn-warning"' +
                ' onclick="download_profile(this)">Profile</button></div>'
            }

        ];

        strains_headers = ["Sample","Run Identifier", "Results"]
    }
    else{

        p_col_defs = [
            {
                "className":      'select-checkbox',
                "orderable":      false,
                "data":           null,
                "defaultContent": ''
            }
        ];

        for(const x in global_strains[0]){
            if (x !== "Analysis" && x !== "id" && x !== "species_id" && x !== "strain_id" && x !== "FilesLocation"){
                p_col_defs.push({"data":x, "visible":true});
                strains_headers.push(matching_fields[x] === undefined ? x:matching_fields[x]);
            }
        }
    }

    return [p_col_defs, strains_headers]
};


/**
 * Update strain metadata controller. Interacts with js_objects files to
 * update user metadata.
 */
innuendoApp.controller("modifyStrainsCtrl", ($scope, $rootScope, $http) => {

    current_scope_template = $scope.selectedTemplate.path;

    const backButtonEl = $("#backbutton");

    if(PREVIOUS_PAGE_ARRAY.length > 0) backButtonEl.css({"display":"block"});
    else backButtonEl.css({"display":"none"});

    $("#innuendofooter").css({"display":"none"});

    backButtonEl.off("click").on("click", () => {
        $scope.$apply( () => {
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

            $scope.selectedTemplate.path = session_array[0];
        })
    });

    for (const interval in intervals_running){
        if(intervals_running.hasOwnProperty(interval)){
            clearInterval(intervals_running[interval]);
        }
    }

    //RESET ROW SELECTION
    CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};
    CURRENT_TABLE_ROWS_SELECTED = {};

    $('#waiting_spinner').css({display:'block', position:'fixed', top:'40%', left:'50%'});

    const objects_utils = new Objects_Utils();
    const metadata = new Metadata();
    const single_project = new Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope);
    //const reports = new Report($http);

    metadata.add_owner(CURRENT_USER_NAME);

    //let jobs_to_reports = {};
    let strain_name_to_id = {};


    $scope.metadata_fields = metadata.get_fields();
    $scope.specie_name = CURRENT_SPECIES_NAME;

    let strains_headers = metadata.get_minimal_fields();

    $scope.strains_headers = strains_headers;

    $scope.species_id = CURRENT_SPECIES_ID;

    sh = strains_headers;

    /*let public_project_col_defs = [
        {
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "strainID" },
        { "data": "species_id" },
        { "data": "source_Source" },
        { "data": "Location" },
        { "data": "SampleReceivedDate" },
        { "data": "SamplingDate" },
        {
            "className":      'details-control',
            "orderable":      false,
            "data":           null,
            "defaultContent": '<div style="width:100%;text-align:center;">' +
            '<button class="details-control"><i class="fa fa-info"' +
            ' data-toggle="tooltip" data-placement="top" title="More' +
            ' info"></i></button></div>'
        }

    ];*/

    let global_public_strains = [];


    const modalAlert = (text, callback) => {

        const buttonSubEl = $('#buttonSub');
        const modalBodyEl = $('#modalAlert .modal-body');
        const modalAlertEl = $('#modalAlert');

        $('#buttonCancelAlert').off("click");

        modalBodyEl.empty();
        modalBodyEl.append("<p>"+text+"</p>");

        buttonSubEl.off("click").on("click", () => {
            modalAlertEl.modal("hide");

            setTimeout( () => {
                return callback();
            }, 400);
        });

        modalAlertEl.modal("show");

    };


    $("#reset_strain").on("click", () => {
        $scope.$apply( () => {
            $scope.selectedTemplate.path = 'static/html_components/overview.html';
        })
    });

    $scope.showUserStrains = () => {
        $scope.getStrains();
    };

    $scope.getStrains = () => {

        single_project.get_strains(true, (strains_results) => {
            objects_utils.destroyTable('modify_strains_table');

            global_public_strains = strains_results.public_strains;

            let headers_defs = set_headers_metadata(global_public_strains);


            if(headers_defs[1].length !== 0){
                strains_headers = headers_defs[1];
            }
            else{
                modalAlert("There are no strains associated with this" +
                    " species. Define a new strain inside a Project.");
            }

            objects_utils.restore_table_headers('modify_strains_table', strains_headers, false, () => {
                objects_utils.loadDataTables('modify_strains_table', global_public_strains, headers_defs[0], strains_headers);

                global_public_strains.map( (d) => {
                    strain_name_to_id[d.strainID] = d.id;
                });

                $('#waiting_spinner').css({display:'none'});
                $('#modify_strains_controller_div').css({display:'block'});

                setTimeout( () => {
                    $("#modify_strains_table").DataTable().draw();
                }, 200);
            });
        });

    };

    $scope.modifyStrains = () => {

        const strain_selected = $.map($('#modify_strains_table').DataTable().rows('.selected').data(), (item) => {
            return item;
        });

        if (strain_selected.length === 0){
            modalAlert("Please select a strain first.", () => {

            });
            return;
        }

        const strain_id_in_use = strain_selected[0].id;

        for(const key in strain_selected[0]){
            $('#'+key).val(strain_selected[0][key]);
        }

        $('#modifyStrainModal').modal("show");

        const updateMetadataEl = $('#update_metadata_button');

        updateMetadataEl.off("click").on("click", () => {
            updateMetadata(strain_id_in_use);
        });
    };

    const updateMetadata = (strain_id_in_use) => {
        single_project.update_metadata(strain_id_in_use, (response) => {

            single_project.get_strains(true, (strains_results) => {
                objects_utils.destroyTable('modify_strains_table');
                global_public_strains = strains_results.public_strains;
                let headers_defs = set_headers_metadata(global_public_strains);

                strains_headers = headers_defs[1];

                objects_utils.restore_table_headers('modify_strains_table', strains_headers, false, () => {
                    objects_utils.loadDataTables('modify_strains_table', global_public_strains, headers_defs[0], strains_headers);
                    modalAlert("Strain metadata was modified.", () => {
                    });
                });
            });
        });
    };

});