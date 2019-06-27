
/*
Defines more global variables
*/
let get_sp;
let sh;
let pcol;
let global_strains, project_col_defs;
let single_p;
let scope;
/*
*
*/


/*
Project Controller - A controller that controls all the actions from a Single Project instance
	- showProject
	- getWorkflows
	- applyWorkfow
	- runPipelines
	- get_strain_pipeline
	- add_strain
	- add_Database_Strains
	- add_New_Strain
	- getStrains
	- getProjectStrains
	- addStrainToProject
	- removeStrainsFromProject
	- showCombinedReports
	- getProcessesOutputs
	- getProcessesLog
	- removeAnalysis
	- checkPipelineFromFile
	- newPipelineFromFile

Uses:
	- Object_Utils object
	- Metadata object
	- Single_Project object
*/

/**
 * Function to set the headers of tables in the single project controller.
 * Mainly for the strains table.
 * @param table_id
 * @param global_strains
 * @returns {[null,null]}
 */
const set_headers_single_project = (table_id, global_strains) => {

    const  metadata = Metadata();
    let matching_fields = metadata.get_dict_fields_reverse();
    let minimal_fields = metadata.get_default_headers();
    let headers_order = metadata.get_minimal_fields();
    let dict_fields = metadata.get_dict_fields();
    let strains_headers = [];
    let p_col_defs = [];

    if(global_strains.length === 0){

        if (table_id === 'public_strains_table'){
            p_col_defs = [
                {
                    "className":      'select-checkbox',
                    "orderable":      false,
                    "data":           null,
                    "defaultContent": ''
                },
                {
                    "data": "strainID",
                    "className": 'strain_cell',

                },
                { "data": "SampleReceivedDate" },
                { "data": "source_Source" },
                { "data": "AdditionalInformation", "visible":false },
                { "data": "File_1", "visible":false },
                { "data": "Primary" , "visible":false},
                { "data": "SamplingDate" },
                { "data": "Owner", "visible":true },
                { "data": "Food-Bug", "visible":false },
                { "data": "Submitter", "visible":false },
                { "data": "File_2", "visible":false },
                { "data": "Location" ,"visible":false},
                { "data": "Accession" },
                { "data": "timestamp" }

            ];
        }
        else {

            p_col_defs = [
                {
                    "className":      'select-checkbox',
                    "orderable":      false,
                    "data":           null,
                    "defaultContent": ''
                },
                {
                    "data": "strainID",
                    "className": 'strain_cell',

                },
                { "data": "SampleReceivedDate" },
                { "data": "source_Source" },
                { "data": "AdditionalInformation", "visible":false },
                { "data": "File_1", "visible":false },
                { "data": "Primary" , "visible":false},
                { "data": "SamplingDate" },
                { "data": "Owner","visible":true },
                { "data": "Food-Bug", "visible":false },
                { "data": "Submitter", "visible":false },
                { "data": "File_2", "visible":false },
                { "data": "Location", "visible":false},
                { "data": "Accession" },
                { "data": "timestamp" },
                { "data": "Strain_State" },
                {
                    "className":      'details-control',
                    "orderable":      false,
                    "data":           null,
                    "defaultContent": '<div><button class="details-control' +
                    ' btn-default"><i class="fa fa-lg fa-info"' +
                    ' data-toggle="tooltip" data-placement="top" title="More' +
                    ' information"></i></button>' +
                    '<button' +
                    ' class="analysis-control btn-warning"><i class="fa' +
                    ' fa-lg fa-tasks" data-toggle="tooltip"' +
                    ' data-placement="top" title="Analytical' +
                    ' procedures"></i></button></div>'
                }

            ];
        }
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

        for(const p in headers_order){
            for(const x in global_strains[0]){
                if(x === dict_fields[headers_order[p]]){
                    if (x !== "Analysis" && x !== "id" && x !== "species_id" && x !== "lab_protocols" && x !== "FilesLocation"){
                        if($.inArray(matching_fields[x], minimal_fields) > -1){
                            if(x === "strainID") {
                                p_col_defs.push({"data":x, "className": 'strain_cell'});
                            }
                            else {
                                if(x==="Location")
                                    p_col_defs.push({"data":x, "visible":false});
                                else{
                                    p_col_defs.push({"data":x, "visible":true});
                                }
                                
                            }
                        }
                        else{
                            p_col_defs.push({"data":x, "visible":false});
                        }
                        strains_headers.push(matching_fields[x]);
                    }
                }
            }
        }

        if (table_id !== 'public_strains_table'){

            let info_button = "";

            if(SHOW_INFO_BUTTON) {
                info_button = '<button class="info-control btn-default"><i' +
                    ' class="fa fa-lg fa-info" data-toggle="tooltip"' +
                    ' data-placement="top" title="More information"></i></button>';
            }

            /*const inspect_button = '<button class="inspect-control' +
                ' btn-default"><i' +
                    ' class="fa fa-lg fa-bug" data-toggle="tooltip"' +
                    ' data-placement="top" title="Inspect"></i></button>';*/


            const analysis_cell = {
                "className":      'details-control',
                "orderable":      false,
                "data":           null,
                "defaultContent": '<div>'+info_button+'<button' +
                ' class="analysis-control btn-warning"><i class="fa fa-lg' +
                ' fa-tasks" data-toggle="tooltip" data-placement="top"' +
                ' title="Analytical procedures"></i></button></div>'
            };

            p_col_defs.push(analysis_cell);
        }

    }

    return [p_col_defs, strains_headers]
};


//Initialize the Single Project Controller and enclosure all its functions
/**
 * Controller for the single project page. Interacts with the
 * single_project.js to add strains, delete, and run jobs.
 */
innuendoApp.controller("projectCtrl", ($scope, $rootScope, $http, $timeout) => {

    current_scope_template = $scope.selectedTemplate.path;

    const backButtonEl = $("#backbutton");


    if(PREVIOUS_PAGE_ARRAY.length > 0) {
        backButtonEl.css({"display":"block"});
    }
    else {
        backButtonEl.css({"display":"none"});
    }

    $("#innuendofooter").css({"display":"none"});

    backButtonEl.off("click").on("click", function(){
        $scope.$apply(function(){
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

    for (const interval in intervals_running){
        if (intervals_running.hasOwnProperty(interval)){
            clearInterval(intervals_running[interval]);
        }
    }

    //RESET ROW SELECTION
    CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};
    CURRENT_TABLE_ROWS_SELECTED = {};

    //RESET REPORT SELECTOR
	TO_LOAD_STRAINS = "";
	TO_LOAD_PROJECTS = "";

    $("#overlayProjects").css({"display":"block"});
    $("#overlayWorking").css({"display":"block"});
    $("#single_project_controller_div").css({"display":"none"});
    $("#submission_status").empty();

    //if(SHOW_INFO_BUTTON){
    $("#button_remove_all_workflows").css({"display":"block"});
    //}

    $scope.project = {};
    $scope.pipelines, $scope.fileType = [];
    $scope.specie_name, $scope.species_id = "";
    $scope.current_user_name = CURRENT_USER_NAME;

    const single_project = Single_Project(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http, $rootScope);

    single_p = single_project;
    scope = $scope;

    $scope.getAppliedPipelines = single_project.get_applied_pipelines;
    $scope.createPipeline = single_project.create_pipeline;
    $scope.getIdsFromProjects = single_project.get_ids_from_processes;

    const objects_utils = Objects_Utils(single_project, $scope);
    const metadata = Metadata();

    metadata.add_owner(CURRENT_USER_NAME);

    $scope.metadata_fields = metadata.get_fields();

    let strains_headers = metadata.get_minimal_fields();

    $scope.strains_headers = strains_headers;

    sh = strains_headers;

    //Used to check if the strain added come from file or app form.
    let trigger_from_file_load = false,

        project_col_defs = [
            {
                "className":      'select-checkbox',
                "orderable":      false,
                "data":           null,
                "defaultContent": ''
            },
            {
                "data": "strainID",
                "className": 'strain_cell',
            },
            { "data": "species_id" },
            { "data": "source_Source" },
            { "data": "Location" },
            { "data": "SampleReceivedDate" },
            { "data": "SamplingDate" },
            {
                "className":      'details-control',
                "orderable":      false,
                "data":           null,
                "defaultContent": '<div><button class="details-control btn-default">' +
                '<i class="fa fa-lg fa-info" data-toggle="tooltip"' +
                ' data-placement="top"  title="More information"></i></button>' +
                '<button class="analysis-control btn-warning"><i class="fa' +
                ' fa-lg fa-tasks"  data-toggle="tooltip" data-placement="top"' +
                ' title="Analytical procedures"></i></button></div>'
            }

        ];

    pcol = project_col_defs;

    global_strains = [];
    let global_public_strains = [];


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

            setTimeout( () => {
                return callback();
            }, 400);
        });

        $('#modalAlert').modal("show");

    };

    /*
    jQuery buttons click region
    */
    $("#description_tab").on("click", () => {
        $("#div_description").css({"display":"block"});
        $("#div_project").css({"display":"none"});
        $("#description_tab").addClass("active");
        $("#project_tab").removeClass("active");
        $("#submission_status").empty();

        $("#overlayProjects").css({"display":"block"});
        $("#overlayWorking").css({"display":"block"});
        $("#single_project_controller_div").css({"display":"none"});

        $("#overlayProjects").css({"display":"block"});
        $("#overlayWorking").css({"display":"block"});
        $("#single_project_controller_div").css({"display":"none"});

        if(CURRENT_JOB_MINE === true) {
            //Get quota when clicking on description tab
            single_project.get_quota((t_quota) => {
                $("#div-text-description").css({"display": "block"});

                loadGoogleChart(t_quota);
                console.log(t_quota.t_quota - (t_quota.p_space + t_quota.u_space));
                $scope.t_quota = humanFileSize(t_quota.t_quota, true);
                $scope.f_quota = humanFileSize(t_quota.f_quota, true);
                $scope.p_space = humanFileSize(t_quota.p_space, true);
                $scope.u_space = humanFileSize(t_quota.f_quota - t_quota.p_space, true);
                $scope.u_quota = humanFileSize(t_quota.t_quota - t_quota.f_quota, true);

                $("#overlayProjects").css({"display":"none"});
                $("#overlayWorking").css({"display":"none"});
                $("#single_project_controller_div").css({"display":"block"});

            });
        }
        else {
            $("#overlayProjects").css({"display":"none"});
            $("#overlayWorking").css({"display":"none"});
            $("#single_project_controller_div").css({"display":"block"});
        }
    });

    $("#project_tab").on("click", () => {
        $("#div_description").css({"display":"none"});
        $("#div_project").css({"display":"block"});
        $("#project_tab").addClass("active");
        $("#description_tab").removeClass("active");
        $("#div-text-description").css({"display": "none"});
        $.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
    });

    $("#an_proc").on("click", () => {
        $("#procedures_div").css({"display":"block"});
        $("#protocols_div").css({"display":"none"});
        $("#an_proc").addClass("active");
        $("#lab_prot").removeClass("active");
    });

    $("#lab_prot").on("click", () => {
        $("#procedures_div").css({"display":"none"});
        $("#protocols_div").css({"display":"block"});
        $("#lab_prot").addClass("active");
        $("#an_proc").removeClass("active");
    });

    $("#reset_strain").on("click", () => {
        $scope.$apply( () => {
            $scope.selectedTemplate.path = 'static/html_components/overview.html';
        })
    });

    /*
    ###############################################################################
    */


    $scope.rep_string = (st) => {
        return st.replace(/[A-Z]/g, (x) => {
            return " " + x;
        });
    };

    $scope.checkFiles = () => {

        //Get the files available on the user folder on the server side
        single_project.get_user_files( (response) => {
            let t_use_f1 = "<option>None</option>";
            let t_use_f2 = "<option>None</option>";

            for(const r in response.data.files){
                if(response.data.files[r].includes("_R1_") || response.data.files[r].includes("_1.fastq.gz")){
                    t_use_f1 += '<option value="'+response.data.files[r]+'">' + response.data.files[r] + '</option>';
                }
                else if(response.data.files[r].includes("_R2_") || response.data.files[r].includes("_2.fastq.gz")){
                    t_use_f2 += '<option value="'+response.data.files[r]+'">' + response.data.files[r] + '</option>';
                }
            }

            $('#File_1').empty().append(t_use_f1);
            $('#File_2').empty().append(t_use_f2);

            $(".selectpicker").selectpicker("refresh");

        });
    };

    /*
    Loads a complete project. Gets the workflows, the strains and the applied pipelines for those strains
    */
    $scope.showProject = () => {
        $timeout( () => {



            //Only show run and delete strain button if the project is from the current user

            const buttonRunStrainEl = $("#button_run_strain");
            const buttonRemoveStrainEl = $("#button_remove_strain");
            const buttonAddStrainEl = $("#button_add_strain");
            const buttonProceduresEl = $("#buttons_procedures");
            const proceduresDivEl = $("#procedures_div");
            const buttonremoveWorkflows = $("#button_remove_all_workflows");

            if(CURRENT_JOB_MINE === false || PROJECT_STATUS === "lock"){
                buttonRunStrainEl.css({display:"none"});
                buttonRemoveStrainEl.css({display:"none"});
                buttonAddStrainEl.css({display:"none"});
                buttonremoveWorkflows.css({display:"none"});

                buttonProceduresEl.css({display:"none"});
                $("#protocols_div").css({display:"none"});
                proceduresDivEl.css({display:"none"});
            }
            else{
                buttonRunStrainEl.css({display:"block"});
                buttonRemoveStrainEl.css({display:"block"});
                buttonAddStrainEl.css({display:"block"});
                buttonremoveWorkflows.css({display:"block"});

                $("#group_buttons_strain").css({display:"block"});
                buttonProceduresEl.css({display:"block"});
                proceduresDivEl.css({display:"block"});
            }

            //Get all the available workflows (ex: INNUca, chewBBACA, PathoTyping)

            $("#submission_status").html("Getting Available Workflows...");

            

            $scope.getWorkflows( () => {
                //Get all the public strains that can be added to a project
                $("#submission_status").html("Getting Database Strains...");
                $scope.getStrains( () => {
                    $("#submission_status").html("Getting Project Strains...");
                    //Get the strains already added to the project
                    $scope.getProjectStrains( () => {
                        $("#submission_status").html("Getting Applied" +
                            " Pipelines...");
                        //Get the pipelines applied to those strains
                        $scope.getAppliedPipelines(null, (strains_results) => {

                            console.log(strains_results);
                            objects_utils.destroyTable('strains_table');

                            $scope.strains_in_use = global_strains.length;

                            if(strains_results.strains === "no_pipelines"){
                                let headers_defs = set_headers_single_project('strains_table', global_strains);

                                if(headers_defs[1].length !== 0){
                                    strains_headers = headers_defs[1];
                                    sh = headers_defs[1];
                                }

                                objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                                    objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);

                                    $("#overlayProjects").css({"display":"none"});
                                    $("#overlayWorking").css({"display":"none"});
                                    $("#single_project_controller_div").css({"display":"block"});
                                    $("#submission_status").empty();

                                    $.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
                                });
                            }
                            else{

                                global_strains = strains_results.strains;

                                let headers_defs = set_headers_single_project('strains_table', global_strains);

                                strains_headers = headers_defs[1];
                                sh = headers_defs[1];

                                objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                                    objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);

                                    $("#submission_status").html("Getting" +
                                        " Procedures Status...");

                                    $scope.getIdsFromProjects( (strains_results) => {
                                        objects_utils.destroyTable('strains_table');
                                        global_strains = strains_results.strains;
                                        objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                                        $("#overlayProjects").css({"display":"none"});
                                        $("#overlayWorking").css({"display":"none"});
                                        $("#single_project_controller_div").css({"display":"block"});
                                        $("#submission_status").empty();
                                         
                                        $.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
                                    });
                                });

                             }  

                            
                        });

                        /*
                        Set the jQuery button click for metadata file upload
                        */
                        $('#fromfileSubmit').on('click', (e) => {
                            const input_element = document.getElementById('fromfile_file');
                            $("#overlayProjects").css({"display":"block"});
                            $("#overlayWorking").css({"display":"block"});
                            $("#single_project_controller_div").css({"display":"none"});
                            $("#submission_status").empty();
                            single_project.load_strains_from_file(input_element, '\t', (results) => {
                            });
                        });

                        $('#file_selector').on("change", (e) => {
                            const currentValue = $(e.target).val();
                            console.log($(e.target).val());
                            if (currentValue === "reads"){
                                $("#div_file1").css({"display":"block"});
                                $("#div_file2").css({"display":"block"});
                                $("#div_accession").css({"display":"none"});
                            }
                            else if(currentValue === "accession"){
                                $("#div_file1").css({"display":"none"});
                                $("#div_file2").css({"display":"none"});
                                $("#div_accession").css({"display":"block"});
                            }
                        });

                        $('#fromdbbutton').on("click", () => {
                            setTimeout(() => {
                                $.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
                            }, 200);

                        });

                        $('#fromfile_file').on("change", (e) => {
                            $("#file_text").val(e.target.files[0].name);
                        });

                        $('#get_template_file').on('click', (e) => {
                            single_project.get_template_strain_file();
                        });

                        /*
                        Set the jQuery button click for adding an already available pipeline for a given strain
                        */
                        $('#add_pip_from_fileSubmit').on("click", () => {
                            let strains_without_pip = single_project.get_no_pip_strains();
                            let keys_no_pip = Object.keys(strains_without_pip);
                            let counter = 0;

                            if(keys_no_pip.length !== 0){
                                for(const z in strains_without_pip){
                                    single_project.add_strain_to_project(strains_without_pip[z][1], (strains_results, strain_name) => {
                                        counter += 1;
                                        const fileColSelEl = $('#file_col_'+strain_name.replace(/ /g,"_"));

                                        fileColSelEl.empty();
                                        fileColSelEl.append('<p>New Pipeline applied!</p><p><i class="fa fa-check fa-4x" aria-hidden="true"></i></p>');

                                        if(counter === keys_no_pip.length){
                                            objects_utils.destroyTable('strains_table');
                                            global_strains = strains_results.strains;
                                            let headers_defs = set_headers_single_project('strains_table', global_strains);

                                            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                                                objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                                            });
                                        }
                                    });
                                }
                            }
                            else {
                                modalAlert("All (chosen) strains have a" +
                                    " pipeline attached (to them).", "Information", () => {});
                            }
                        });

                        $('#add_new_pip_from_fileSubmit').on("click", () => {
                            let strains_new_without_pip = single_project.get_added_by_file_strains();
                            let keys_no_pip = Object.keys(strains_new_without_pip);
                            let counter = 0;

                            if(keys_no_pip.length !== 0){
                                for(const z in strains_new_without_pip){
                                    single_project.add_strain_to_project(strains_new_without_pip[z][1], (strains_results, strain_name) => {
                                        counter += 1;
                                        let message = "";

                                        if(strains_results.message !== undefined) {
                                            message = '<p>'+strains_results.message+'</p>';
                                        }
                                        else {
                                            message = '<p>New Pipeline' +
                                                ' applied!</p><p> <i' +
                                                ' class="fa fa-check fa-4x"' +
                                                ' aria-hidden="true"></i> </p>';
                                        }

                                        const fileColSelEl = $('#file_col_'+strain_name.replace(/ /g,"_"));

                                        fileColSelEl.empty('<p>'+message+'</p>');
                                        fileColSelEl.append(message);

                                        if(strains_results.message === undefined && counter === keys_no_pip.length){
                                            objects_utils.destroyTable('strains_table');
                                            global_strains = strains_results.strains;
                                            let headers_defs = set_headers_single_project('strains_table', global_strains);

                                            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                                                objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                                            });
                                        }
                                    });
                                }
                            }
                            else {
                                modalAlert("There are no strains available" +
                                    " to add pipelines.", "No Strains" +
                                    " Available", () => {});
                            }
                        })

                    });
                });
            });

            $scope.specie_name = SPECIES_CORRESPONDENCE[CURRENT_SPECIES_NAME];
            $scope.species_id = CURRENT_SPECIES_ID;

        }, 100);
    };

    /*
    Get all the available workflows that can be used on the project
    Procedure - Something that can be run
    Classifier - Something used for classification (ex: lab protocol)
    */
    $scope.getWorkflows = (callback) => {

        $scope.project = CURRENT_PROJECT;

        CURRENT_PROJECT_NAME_ID = CURRENT_PROJECT_ID;

        single_project.get_workflows("Procedure", CURRENT_SPECIES_NAME, (pipelines) => {
            $scope.pipelines = pipelines;

            single_project.get_workflows("Classifier", CURRENT_SPECIES_NAME, (pipelines) => {
                $scope.pipelines_classifiers = pipelines;
                $(".selectpicker").selectpicker({});
                $('.datetimepicker').datetimepicker({
                    format: 'DD/MM/YYYY'
                });

                callback();
            });
        });

    };

    /*
    Apply workflow to a strain or a group of strain.
    */
    $scope.applyWorkflow = (type_protocol) => {

        single_project.apply_workflow('new', type_protocol, (strain_results) => {

            for(const i in strain_results.selected_indexes){
                global_strains[i] = strain_results.strains[i];
            }

            objects_utils.destroyTable('strains_table');
            let headers_defs = set_headers_single_project('strains_table', global_strains);

            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
            });
        });
    };

    /*
    Run all the applied workflows that are able to run for each strain
    */
    $scope.runPipelines = () => {


        const table = $('#strains_table').DataTable();

        const strains_DeleteTimeStamps = $.map(table.rows('.selected').data(), (item) => {
            return item['delete_timestamp'];
        });

        const strains_names = $.map(table.rows('.selected').data(), (item) => {
            return item['strainID'];
        });

       

        let strain_names="";
        for(let i = 0; i< strains_DeleteTimeStamps.length; i++)
        {
            if(strains_DeleteTimeStamps[i] != undefined && strains_DeleteTimeStamps[i] != null)
            {
                if(strain_names!=="")
                {
                    strain_names+= ", " + strains_names[i]
                }else{
                    strain_names+= strains_names[i]
                }
            }
        }

        const message_deleteStrains = "the strain/strains: " +  strain_names + " were removed "
        +"from the system by their creator.";

        let alert_message="";

        

        if(strain_names !== "")
        {
            alert_message = "By choosing this option, all selected" +
            " pipelines will be saved and unsubmitted jobs will be sent" +
            " to the server. And " + message_deleteStrains + " Do you want to proceed?";                  
        }else
        {
            alert_message = "By choosing this option, all selected" +
            " pipelines will be saved and unsubmitted jobs will be sent" +
            " to the server. Do you want to proceed?";
        }

        modalAlert(alert_message, "Run Pipelines", () => {

            $('#button_run_strain').fadeTo("slow", 0.5).css('pointer-events','none');

            $("#overlayProjects").css({"display":"block"});
            $("#overlayWorking").css({"display":"block"});
            $("#single_project_controller_div").css({"display":"none"});
            $("#submission_status").empty();

            // Check if controller is available before submitting jobs
            single_project.check_controller( (response) => {

                console.log(response);

                const subStatusEl = $("#submission_status");
		        subStatusEl.html("Connecting to job controller ...");

		        if (response.status === 200 && response.data === true) {
		            //Check if there are jobs pending or already running. If so, the jobs can't be run again
                    single_project.check_if_pending( (haspending) => {

                        const buttonRunStrainEl = $('#button_run_strain');
                        const overlayProjects = $("#overlayProjects");
                        const overlayWorking = $("#overlayWorking");
                        const singleProjEl = $("#single_project_controller_div");

                        if(haspending === true){
                            modalAlert('One or more of the selected strains have jobs' +
                                ' already submitted. Please wait until they finish' +
                                ' before submit new jobs for those strains.', "Jobs" +
                                " Still Running", () => {});
                            buttonRunStrainEl.fadeTo("slow", 1).css('pointer-events','auto');
                            overlayProjects.css({"display":"none"});
                            overlayWorking.css({"display":"none"});
                            singleProjEl.css({"display":"block"});
                        }
                        else if(haspending === "no_selected"){
                            modalAlert('Please select at least one strain to run' +
                                ' analysis.', "Select Strains", () => {});
                            buttonRunStrainEl.fadeTo("slow", 1).css('pointer-events','auto');
                            overlayProjects.css({"display":"none"});
                            overlayWorking.css({"display":"none"});
                            singleProjEl.css({"display":"block"});
                        }
                        else{
                            //Save the pipelines on the database if required
                            single_project.save_pipelines((run) => {
                                //Run the pipelines
                                if(run === true) {

                                    single_project.run_pipelines();
                                    
                            
                            
                                }
                                else if(run !== "no_select") {
                                    modalAlert('All processes for the selected strains' +
                                        ' have been run.', "All Processes Submitted", () => {});
                                    buttonRunStrainEl.fadeTo("slow", 1).css('pointer-events','auto');
                                    overlayProjects.css({"display":"none"});
                                    overlayWorking.css({"display":"none"});
                                    singleProjEl.css({"display":"block"});
                                }
                            });
                        }
                    })
                }
                else {
		            modalAlert('Could not connect to the Job controller' +
                        ' application. Check your internet connection. If' +
                        ' the error persists, please contact the system' +
                        ' administrator.', "Warning", () => {});

		            $('#button_run_strain').fadeTo("slow", 1).css('pointer-events','auto');
                    $("#overlayProjects").css({"display":"none"});
                    $("#overlayWorking").css({"display":"none"});
                    $("#single_project_controller_div").css({"display":"block"});
                }

            });

        })

    };

    $scope.myReplace = (string) => {
        return string.replace(/ /g, "_");
    };

    /*
    Get all the pipelines already applied in other projects to a given strain.
    */
    const get_strain_pipeline = (strain_ids, callback) => {
        single_project.get_public_strain_applied_pipelines(strain_ids, (applied_workflows, strain_ids, pipelines_ids, strains_dict) => {

            $scope.available_strain_pipelines = applied_workflows;
            $scope.available_pipelines_ids = pipelines_ids;

            $('#choosePipelineModal').modal('show');

            setTimeout( () => {

                $(".pipeline_strain_button").off("click").on("click", (e) => {
                    let pipeline_id = $(e.target).attr("pipeline");
                    let strain_id = $(e.target).attr("strain_id");
                    let project = $(e.target).attr("ownerproject");

                    $('.modal').modal('hide');

                    setTimeout(() => {
                        loadReport([strain_id], parseInt(project), $scope);
                    }, 1000);

                });

                //Set the jQuery click on the new pipeline button
                $(".new_pipeline_button").off('click').on('click', (e) => {
                    let s_id = $(e.target).attr("strain_id");

                    //Add the strain. The new pipeline will only be created at run time
                    add_strain([strains_dict[$(e.target).attr("strain_id")]], (results) => {

                        const pipelineGroupEl = $('#pipeline_group_'+s_id.replace(/ /g, "_"));

                        if(results.message !== undefined){
                            pipelineGroupEl.empty();
                            pipelineGroupEl.append('<p><b>Strain already on project.</b></p>');

                            objects_utils.destroyTable('strains_table');
                            let headers_defs = set_headers_single_project('strains_table', global_strains);

                            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                                objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                            });
                        }
                        else if(results.prevent){
                            objects_utils.destroyTable('strains_table');
                            let headers_defs = set_headers_single_project('strains_table', global_strains);

                            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                                objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                            });
                        }
                        else{
                            pipelineGroupEl.empty();
                            pipelineGroupEl.append('<p><b>New Pipeline applied!</b><i class="fa fa-check fa-2x" aria-hidden="true"></i></p>');
                            modalAlert("Strains were added to the project.", "Strains Added", () => {});
                        }

                    });
                });

            }, 200);
        })
    };

    get_sp = get_strain_pipeline;

    /*
    Function to add a strain from the database
    */
    const add_strain = (strain_ids, callback) => {

        single_project.add_database_strains(strain_ids, (strains_results) => {

            if(strains_results.message !== undefined) {
                return callback(strains_results);
            }
            objects_utils.destroyTable('strains_table');
            global_strains = strains_results.strains;

            let headers_defs = set_headers_single_project('strains_table', global_strains);
            CURRENT_TABLE_ROWS_SELECTED['strains_table'] = [];
            CURRENT_TABLE_ROW_ANALYSIS_SELECTED['strains_table'] = [];

            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                callback(strains_results);
            });
        });
    };

    /*
    Shows all the avaibale pipelines for a group of selected strains from the database
    */
    $scope.add_Database_Strains = () => {

        const strainids = $.map($('#public_strains_table').DataTable().rows('.selected').data(), (item) => {
            return item['strainID'];
        });

        get_strain_pipeline(strainids, () => {});
    };

    /*
    Add a new strain to the project. The pipeline is only created at run time
    */
    $scope.add_New_Strain = () => {

        single_project.add_new_strain(trigger_from_file_load, (strains_results, is_from_file) => {

            if(strains_results.already_there) {
                return;
            }

            if(is_from_file !== true) {
                modalAlert('Strain added to the' +
                    ' project.', "Strains Added", () => {});
            }

            objects_utils.destroyTable('strains_table');
            global_strains = strains_results.strains;
            let headers_defs = set_headers_single_project('strains_table', global_strains);

            CURRENT_TABLE_ROWS_SELECTED['strains_table'] = [];
            CURRENT_TABLE_ROW_ANALYSIS_SELECTED['strains_table'] = [];

            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
            });

            setTimeout( () => {
                $("#change_type_to_form").trigger("click");
            }, 300);
        });
    };

    $scope.change_type_to_form = () => {
        trigger_from_file_load = false;
    };

    $scope.change_type_to_file = () => {
        trigger_from_file_load = true;
    };

    $scope.refreshStatus = () => {

        const overlayProjects = $("#overlayProjects");
        const overlayWorking = $("#overlayWorking");
        const singleProjContEl = $("#single_project_controller_div");
        const subStatusEl = $("#submission_status");

        overlayProjects.css({"display":"block"});
        overlayWorking.css({"display":"block"});
        singleProjContEl.css({"display":"none"});
        subStatusEl.empty();

        let count_strains = 0;

        let pipelineDict = {};

        // Parse ids by strain to get the ststua by strain and not by job
        // submission.
        for(const id in intervals_running){
            let idPip = id.split("process")[0];

            if (!pipelineDict.hasOwnProperty(idPip)) {
                pipelineDict[idPip] = [id];

            }
            else {
                pipelineDict[idPip].push(id);
            }
        }

        const keys = Object.keys(pipelineDict);

        const update_s = () => {

            let key_to_use = keys.shift();

            try{
                // Get all status for the jobs associated with a single strain
                for (const intervalId of pipelineDict[key_to_use]){
                    try {
                        intervals_running[intervalId]();
                    }
                    catch(e){
                        console.log("Error loading status for key " + String(intervalId));
                    }
                }
            }
            catch(e){
                console.log("Error loading status for strain " + String(key_to_use));
            }

            count_strains += 1;
            subStatusEl.empty();
            subStatusEl.html("Updating " + String(count_strains) + " out of " +
                Object.keys(pipelineDict).length + " strain submission status ...");

            if(keys.length > 0) {
                setTimeout( () => {
                    update_s()
                }, 200);
            }
            else{
                overlayProjects.css({"display":"none"});
                overlayWorking.css({"display":"none"});
                singleProjContEl.css({"display":"block"});
                subStatusEl.empty();
            }
        };

        update_s();

    };

    $scope.removeAllWorkflows = () => {

        modalAlert("By accepting this option you are removing " +
                    " all workflows applied to the strains. This will only" +
            " be saved if you resubmit jobs using some of the strains. Do you" +
            " really want proceed?", "Warning", () => {
            single_project.deleteAllWorkflows((strain_results) => {

                objects_utils.destroyTable('strains_table');
                let headers_defs = set_headers_single_project('strains_table', global_strains);

                objects_utils.restore_table_headers('strains_table', sh, true, () => {
                    objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], sh);
                });

            });
        });

    };

    /*
    Get the public strains stored in the database
    */
    $scope.getStrains = (callback) => {

        single_project.get_strains(false, (strains_results) => {
            objects_utils.destroyTable('public_strains_table');
            global_public_strains = strains_results.public_strains;

            let headers_defs = set_headers_single_project('public_strains_table', global_public_strains);

            objects_utils.restore_table_headers('public_strains_table', strains_headers, true, () => {
                objects_utils.loadDataTables('public_strains_table', global_public_strains, headers_defs[0], strains_headers);
                $.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();
                //callback();
            });

        
        });

        callback();
    };

    /*
    Get strains already attached to the project
    */
    $scope.getProjectStrains = (callback) => {

        single_project.get_project_strains( (strains_results) => {
            global_strains = strains_results.strains;
           
            let headers_defs = set_headers_single_project('strains_table', global_strains);

            $('#AlertProjectStrains').css({"display":"none"});
            for(let i = 0; i< global_strains.length; i++)
            {
                if(global_strains.delete_timestamp!== null || global_strains.delete_timestamp!==undefined)
                {
                    $('#AlertProjectStrains').css({"display":"block"});
                    break;
                }
            }


            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                callback();
            });

        });
    };

    /*
    Add strain to project.
    DEPRECATED?
    */
    $scope.addStrainToProject = (strain_name) => {

        single_project.add_strain_to_project(strain_name, (strains_results) => {
            objects_utils.destroyTable('strains_table');
            global_strains = strains_results.strains;
            let headers_defs = set_headers_single_project('strains_table', global_strains);

            objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                //objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                modalAlert("Strains were added to the project.", "Strains" +
                    " Added", () => {});
            });
        });

    };

    /*
    Remove strains from the project
    */
    $scope.removeStrainsFromProject = () => {

        single_project.remove_strains_from_project(global_strains, (strains_results) => {
            if (strains_results === "no_select") {
                modalAlert("Please select a" +
                    " strain to remove.", "Select Strains", () => {});
            }
            else{
                objects_utils.destroyTable('strains_table');
                global_strains = strains_results.strains;
                $('#AlertProjectStrains').css({"display":"none"});
                for(let i = 0; i< global_strains.length; i++)
                {
                    if(global_strains.delete_timestamp!= null || global_strains.delete_timestamp!=undefined)
                    {
                        $('#AlertProjectStrains').css({"display":"block"});
                        break;
                    }
                }

                let headers_defs = set_headers_single_project('strains_table', global_strains);

                objects_utils.restore_table_headers('strains_table', strains_headers, true, () => {
                    CURRENT_TABLE_ROWS_SELECTED['strains_table'] = [];
                    CURRENT_TABLE_ROW_ANALYSIS_SELECTED['strains_table'] = [];
                    objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], strains_headers);
                });
            }
        });
    };

});


/*
DEPRECATED?
*/
const showCombinedReports = (li) => {
    single_p.show_combined_reports(li.className);
};

/*
Get the results file from a workflow
*/
const getProcessesOutputs = (li) => {
    single_p.get_processes_outputs(li.className, (response) => {
        //Download only the result file from all the outputs
        single_p.download_result(response, (response) => {
        })
    });
};

/*
Get the run log from a workflow
*/
const getProcessesLog = (li) => {
    single_p.get_processes_outputs(li.className, (response) => {
        //Download only the log file from all the outputs
        single_p.download_log(response, (response) => {
        })
    });
};

/*
Remove a workflow from a pipeline
*/
const removeAnalysis = (li) => {
    const  objects_utils = Objects_Utils(single_p, scope);

    single_p.remove_analysis(li, (strain_results) => {
        for(const i in strain_results.selected_indexes){
            global_strains[i] = strain_results.strains[i];
        }

        objects_utils.destroyTable('strains_table');
        let headers_defs = set_headers_single_project('strains_table', global_strains);
        objects_utils.restore_table_headers('strains_table', sh, true, () => {
            objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], sh);
        });
    });
};

/*
Check available pipelines if a strain loaded trough a file already exists
*/
const checkPipelineFromFile = (element) => {
    get_sp([$(element).attr("strain_name")], (results) => {
        $('#choosePipelineModal').modal('hide');

        const fileColEl = $('#file_col_'+$(element).attr("strain_name").replace(/ /g,"_"));

        fileColEl.empty();

        if(results.message !== undefined) {
            fileColEl.append('<p>'+results.message+'</p><p><i class="fa fa-close fa-4x" aria-hidden="true"></i></p>');
        }
        else {
            fileColEl.append('<p>Pipeline applied!</p><p><i class="fa' +
                ' fa-check fa-4x" aria-hidden="true"></i></p>');
        }
    });
};

/*
Add a new pipeline if a strain loaded through a file already exists
*/
const newPipelineFromFile = (element) => {
    const objects_utils = Objects_Utils();

    single_p.add_strain_to_project($(element).attr("strain_name"), (strains_results, strain_name) => {
        objects_utils.destroyTable('strains_table');
        global_strains = strains_results.strains;
        $('#AlertProjectStrains').css({"display":"none"});
        for(let i = 0; i< global_strains.length; i++)
        {
            if(global_strains.delete_timestamp!= null || global_strains.delete_timestamp!=undefined)
            {
                $('#AlertProjectStrains').css({"display":"block"});
                break;
            }
        }
        let headers_defs = set_headers_single_project('strains_table', global_strains);

        objects_utils.restore_table_headers('strains_table', sh, true, () => {

            const fileColEl = $('#file_col_'+strain_name.replace(/ /g,"_"));
            objects_utils.loadDataTables('strains_table', global_strains, headers_defs[0], sh);
            fileColEl.empty();
            fileColEl.append('<p>New Pipeline applied!</p><p><i class="fa fa-check fa-4x" aria-hidden="true"></i></p>');

            modalAlert('Strain added to the project.', "Strains Added", () => {});
        });
    });
};