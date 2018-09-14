/**
 * Reports controller. If interacts with the reports application through an
 * iframe.
 */
innuendoApp.controller("reportsCtrl", ($scope, $rootScope, $http) => {

    $('#reportsIframe').attr('src', REPORTS_URL);

    const backButtonEl = $("#backbutton");

    current_scope_template = $scope.selectedTemplate.path;

    if (PREVIOUS_PAGE_ARRAY.length > 0) {
        backButtonEl.css({"display": "block"});
    }
    else {
        backButtonEl.css({"display": "none"});
    }

    backButtonEl.off("click");
    backButtonEl.on("click", () => {
        $scope.$apply(() => {
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

    for (const interval in intervals_running) {
        if (intervals_running.hasOwnProperty(interval)) {
            clearInterval(intervals_running[interval]);
        }
    }

    //RESET ROW SELECTION
    CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};
    CURRENT_TABLE_ROWS_SELECTED = {};

    $('#waiting_spinner').css({
        display: 'block',
        position: 'fixed',
        top: '40%',
        left: '50%'
    });

    $scope.sendMessage = () => {
        sendMessage();
    };


    $scope.showReports = () => {

        $('#reports_results_table thead').css({'visibility': 'hidden'});
        $('#reports_results_table tfoot').css({'visibility': 'hidden'});
        $('#reports_metadata_table thead').css({'visibility': 'hidden'});
        $('#reports_metadata_table tfoot').css({'visibility': 'hidden'});


        let current_job_ids = [];

        //For new version
        const navbarPlatformEl = $("#navbar_platform");
        const platformMenuEl = $("#divPlatformMenu");
        const buttonHamEl = $("#button_ham_navbar");
        const showPlatMenu = $("#show_platform_menu");

        $('#waiting_spinner').css({display: 'none'});
        $('#reports_controller_div').css({display: 'block'});

        navbarPlatformEl.css({"display": "none"});
        platformMenuEl.css({"display": "block"});
        buttonHamEl.css({"display": "none"});

        $("body").css({"padding-top": "0px"});
        showPlatMenu.css({"padding-top": "5px", "padding-right": "5px"});

        let to_hide = false;

        showPlatMenu.off("click").on("click", () => {
            if (to_hide) {
                to_hide = false;
                navbarPlatformEl.css({"display": "none"});
                platformMenuEl.css({"display": "block"});
                buttonHamEl.css({"display": "none"});
                $("body").css({"padding-top": "0px"});
                showPlatMenu.css({
                    "padding-top": "5px",
                    "padding-right": "5px"
                });
            }
            else {
                to_hide = true;
                navbarPlatformEl.css({"display": "block"});
                platformMenuEl.css({"display": "block"});
                buttonHamEl.css({"display": "block"});
                $("body").css({"padding-top": "40px"});
                showPlatMenu.css({
                    "padding-top": "45px",
                    "padding-right": "5px"
                });
            }
        });


        $('#button_back_project').on("click", () => {
            $('#projects_button').trigger("click");

            projects_table.load_project("", CURRENT_PROJECT_ID, true, (results) => {
                CURRENT_PROJECT = results.project;
                $scope.selectedTemplate.path = results.template;
            });
        });

    };

});


