/*
Overview controller - Controller of the first page of the application.
Uses:
	- project_table object
	- pg_requests object
*/

innuendoApp.controller("overviewCtrl", ($scope, $rootScope, $http) => {

    current_scope_template = $scope.selectedTemplate.path;

    const backButtonEl = $("#backbutton");

    if(PREVIOUS_PAGE_ARRAY.length > 0) backButtonEl.css({"display":"block"});
    else backButtonEl.css({"display":"none"});

    backButtonEl.off("click");

    backButtonEl.on("click", () => {
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

            if(PREVIOUS_PAGE_ARRAY.length > 0) backButtonEl.css({"display":"block"});
            else backButtonEl.css({"display":"none"});
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

    $scope.showSpeciesDrop = () => {

        $("#projects_button_li").css({"display":"none"});
        $("#reports_button_li").css({"display":"none"});
        $("#uploads_button_li").css({"display":"none"});
        $("#tools_button_li").css({"display":"none"});
        $("#workflows_button_li").css({"display":"block"});
        $("#protocols_button_li").css({"display":"block"});
        $("#species_drop_button_li").css({"display":"none"});
        $("#overview_li").css({"display":"block"});

        const projects_table = new Projects_Table(0, null, $http);
        const pg_requests = new Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);

        if(CURRENT_USER_NAME === ""){
            $("#load_species_row").css({"display":"none"});
        }
        else{
            //Get available species and add then to the dropdown menu
            projects_table.get_species_names( (results) => {
                $scope.species = results.species;
                CURRENT_SPECIES_NAME = results.CURRENT_SPECIES_NAME;
                CURRENT_SPECIES_ID = results.CURRENT_SPECIES_ID;

                let t_use = "";

                for(const r in results.species){
                    //Select only for Ecoli
                    if (results.species[r].name === "E.coli"){
                        t_use += '<option species_id="'+results.species[r].id+'">' + results.species[r].name + '</option>';
                    }
                }

                $('#species_select_drop').append(t_use);

                $('.selectpicker').selectpicker({});

                setTimeout( () => {
                    $("#innuendofooter").css({"display":"block"});
                }, 300);

            });
        }
        //Get metadata parameters available on reports defined by the user for each program
        pg_requests.get_user_parameters(function(response){
            if(response.data.analysis_parameters_object !== undefined) {
                ANALYSYS_PARAMETERS = JSON.parse(response.data.analysis_parameters_object);
            }
        });

    };

    $scope.load_species = function(){
        //Get species name and ID. Launch the Projects view for that species

        const optionSelectedEl = $('#species_select_drop option:selected');
        CURRENT_SPECIES_NAME = optionSelectedEl.text();
        CURRENT_SPECIES_ID = optionSelectedEl.attr("species_id");
        PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID, CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID, CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT, CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID]);
        $scope.selectedTemplate.path = 'static/html_components/projects_view.html';
    }

});