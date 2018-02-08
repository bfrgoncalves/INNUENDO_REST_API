/*
Projects controller - Controller of the projects page. 
Uses:
	- projects_table object
	- object_utis object
*/

/**
 * Controller of the global projects pahe. Interacts with the
 * projects_table.js file to create, get and delete projects from the user
 * and others.
 */
innuendoApp.controller("projectsCtrl", ($scope, $http) => {

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

    $("#projects_button_li").css({"display":"block"});
    $("#reports_button_li").css({"display":"block"});
    $("#uploads_button_li").css({"display":"block"});
    $("#tools_button_li").css({"display":"block"});
    $("#species_drop_button_li").css({"display":"block"});
    $("#protocols_button_li").css({"display":"none"});
    $("#workflows_button_li").css({"display":"none"});
    $("#overview_li").css({"display":"none"});

    //Reset application to overview page. Allows to select a diferent species
    $("#reset_strain").on("click", () => {
        $scope.$apply(function(){
            $scope.selectedTemplate.path = 'static/html_components/overview.html';
        })
    });

    const resetHomeOpts = () => {

        const optsDiv = $("#optsContainer");
        for (const el of optsDiv.children()) {
            $(el).css({"display": "none"});
        }
    };


    /**
     * Provides the toggle behaviour of the project
     * selection/loading in the Innuendo home page.
     * The behavior is bound to the "click" event of the
     * main toggle buttons and is responsible for showing the
     * corresponding div element.
     */
    const initHomeButtonsToggle = () => {

        const homeButtons = [
            "#btProjectSelect",
            "#btProjectLoad"
        ];

        for (const bt of homeButtons) {

            const btDiv = $(bt);
            const targetDiv = $("#" + btDiv.data("target"));

            btDiv.on("click", () => {
                resetHomeOpts();
                targetDiv.css({"display": "inline-block"})

            });
        }
    };

    initHomeButtonsToggle();

    const modalAlert = (text, callback) => {

        const buttonSubEl = $('#buttonSub');
        const modalBodyEl = $('#modalAlert .modal-body');

        buttonSubEl.off("click");
        $('#buttonCancelAlert').off("click");

        modalBodyEl.empty();
        modalBodyEl.append("<p>"+text+"</p>");

        buttonSubEl.on("click", () => {
            $('#modalAlert').modal("hide");

            setTimeout( () => {
                return callback();
            }, 400);
        });

        $('#modalAlert').modal("show");

    };

    let projects = [];

    let project_col_defs = [
        {
            "className":      'select-checkbox',
            "orderable":      false,
            "data":           null,
            "defaultContent": ''
        },
        { "data": "name" },
        { "data": "description" },
        { "data": "date" }
    ];

    $scope.projects_headers = ['Name', 'Description', "Date"];

    let other_projects = [];

    $scope.species = [];
    $scope.currentSpecieID = CURRENT_SPECIES_ID;
    $scope.species_in_use = CURRENT_SPECIES_NAME;

    $("#current_species_nav").text(CURRENT_SPECIES_NAME);

    const projects_table = Projects_Table(0, null, $http);
    const objects_utils = Objects_Utils();

    if (get_userid() !== 0){

        //Get available projects for the selected species of the current user
        projects_table.get_projects_from_species(CURRENT_SPECIES_ID, false, (results) => {
            projects = results;

            objects_utils.loadDataTables('projects_table', projects, project_col_defs);

            //Get available projects for the selected species of the other users
            projects_table.get_projects_from_species(CURRENT_SPECIES_ID, true, (results) => {
                other_projects = results;

                objects_utils.loadDataTables('other_projects_table', other_projects, project_col_defs);
                $('#waiting_spinner').css({display:'none'});
                $('#project_controller_div').css({display:'block'});
                $.fn.dataTable.tables( { visible: true, api: true } ).columns.adjust();

                //Sets the CURRENT_PROJECT_ID to be loaded later
                $('#projects_table').off("click").on('click', 'tr', () => {
                    console.log(this);
                    CURRENT_PROJECT_ID = $('#projects_table').DataTable().row( this ).data().id;
                });

                $('#other_projects_table').off("click").on('click', 'tr', () => {
                    CURRENT_PROJECT_ID = $('#other_projects_table').DataTable().row( this ).data().id;
                });

            });
        });
    }

    /*
    Add a new project of the current species
    */
    $scope.addRow = () => {

        projects_table.add_project( (results) => {
            objects_utils.destroyTable('projects_table');
            projects = results.projects;
            objects_utils.loadDataTables('projects_table', projects, project_col_defs, []);
            $('#projects_table').DataTable().draw();
        });

    };

    /*
    Delete a project of the current species
    */
    $scope.deleteRow = () => {

        projects_table.delete_project( (results) => {
            objects_utils.destroyTable('projects_table');
            projects = results.projects;
            objects_utils.loadDataTables('projects_table', projects, project_col_defs, []);
            $('#projects_table').DataTable().draw();
        })

    };

    /*
    Sets the CURRENT_PROJECT_ID selected
    */
    $scope.highlightProject = ($event, project_id) => {
        CURRENT_PROJECT_ID = project_id;
    };

    /*
    Loads the selected project.
    */
    $scope.loadProject = (table_id) => {
        if(table_id === "other_projects_table"){
            CURRENT_JOB_MINE = false;
        }
        else {
            CURRENT_JOB_MINE = true;
        }
        projects_table.load_project(table_id, CURRENT_PROJECT_ID, false, (results) => {
            CURRENT_PROJECT = results.project;
            PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID, CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID, CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT, CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID, CURRENT_TABLE_ROWS_SELECTED, CURRENT_TABLE_ROW_ANALYSIS_SELECTED]);
            $scope.selectedTemplate.path = results.template;
        });

    };

});