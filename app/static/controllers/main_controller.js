/*
Main controller - Main controller of the application. Defines global variables and the innuendoApp global controller.
Global configuration of the app is also defined here.
	- Analysyis parameters for metadata
	- location of information and results for each program
*/

//Define global controller 
const innuendoApp = angular.module("innuendoApp", []);

/*
Define global variables that are modified in every controller
 */
let CURRENT_PROJECT_ID = "";
let CURRENT_JOB_MINE = "";
let CURRENT_PROJECT = {};
let CURRENT_SPECIES_ID = "";
let CURRENT_SPECIES_NAME = "";
let CURRENT_USER_NAME = current_user_name;
let CURRENT_USER_ID = current_user_id;
let CURRENT_JOBS_ROOT = jobs_root;
let HOME_DIR = homedir;
let PROJECT_STATUS = "";

let TO_LOAD_STRAINS = "";
let TO_LOAD_PROJECTS = "";

let SPECIES_CORRESPONDENCE = {
    "E.coli": "Escherichia coli",
    "Yersinia": "Yersinia enterocolitica",
    "Salmonella": "Salmonella enterica",
    "Campylobacter": "Campylobacter jejuni"
};

let GLOBAL_STATISTICS;

let CURRENT_JOB_ID = "";
let CURRENT_PROJECT_NAME_ID = "";
let CURRENT_TABLE_ROWS_SELECTED = {};
let CURRENT_TABLE_ROW_ANALYSIS_SELECTED = {};

let current_job_status_color = {};

let protocols = {};
let protocol_types = [];
let intervals_running = {};
let strainName_to_tids = {};
let pipeline_status = {};
let jobs_to_parameters = {};
let http = "";

const modalAlert = (text, header, callback) => {

    const buttonSub = $("#buttonSub");
    const modalBodyEl = $("#modalAlert .modal-body");

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

/*
DEFINE ANALYSIS PARAMETERS FOR METADATA
*/
/*let ANALYSYS_PARAMETERS = {"INNUca": {"#samples":false, "MLST_ST": true,
    "MLST_scheme": true, "Pilon_changes": false, "Pilon_contigs_changed": false,
    "SPAdes_filtered_bp": false, "SPAdes_filtered_contigs": false,
    "SPAdes_number_bp": false, "assembly_coverage_filtered": true,
    "assembly_coverage_initial": false, "final_assembly": false,
    "first_coverage": false, "mapped_reads_percentage": false,
    "mapping_filtered_bp": true, "mapping_filtered_contigs": true,
    "pear_assembled_reads": false, "pear_discarded_reads": false,
    "pear_unassembled_reads": false, "second_Coverage": false,
    "trueCoverage_absent_genes": false, "trueCoverage_multiple_alleles": false,
    "trueCoverage_sample_coverage": true},
    "chewBBACA": {"EXC": true, "INF": true, "LNF": true, "PLOT": true,
        "NIPH": true, "ALM": true, "ASM": true},
    "PathoTyping": {"result":true}
};

const INFO_OR_RESULTS = {"chewBBACA": 0, "PathoTyping": 1, "INNUca": 1}
*/

let PREVIOUS_PAGE_ARRAY = [];
let current_scope_template = "";

$('a').click((e) => {
    $(e.target).parent().addClass("active").siblings().removeClass("active");
});

const tclick = () => {
    $("#button_ham_navbar")[0].click();
};

const sendMail = () => {
    let pg_requests = Requests("", "", http);

    pg_requests.sendCustomMail(
        $("#recipients").val(),
        $("#email-title").val(),
        $("#email-body").val(),
        (response) => {
            if (response.data === true) {
                $("#email_res_text").text("Email successfully sent.")
            }
            else {
                $("#email_res_text").text("There was an error when sending" +
                    " the email.")
            }
        });
};

const getNavbarMessages = () => {

    if (CURRENT_USER_ID === 0)
        return;

    let pg_requests = Requests("", "", http);

    pg_requests.get_messages(3, (response) => {

        $("#newMessagesSpan").html(response.data[1] + " New");
        let lis = "";

        for (const message of response.data[0]) {

            lis += '<li class="notification"><div class="media">' +
                '<div class="media-left"></div><div class="media-body">' +
                '<strong class="notification-title"><a href="#">' +
                message.messageFrom + '</a> sent a message! </strong>' +
                '<p class="notification-desc">' + message.message +
                '</p>' +
                '<div class="notification-meta"><small class="timestamp">' +
                message.timestamp + "</small></div></div></div></li>";

        }

        $("#message_noti_panel").empty().append(lis);

        $("#nMessages").html("Messages (" + response.data[2] + ")");

    });
};

let intervalState;

const checkPlatformState = () => {

    let pg_requests = Requests("", "", http);

    pg_requests.check_state((response) => {

        if (response.data === "anonymous") {
            clearInterval(intervalState);
            return
        }
        else if (response.data === "false" && !SHOW_INFO_BUTTON) {
            clearInterval(intervalState);
            modalAlert("The INNUENDO Platform is locked for maintenance. You" +
                " will" +
                " be disconnected from the" +
                " servers in 10 seconds.", "Alert", () => {
            });
            setTimeout(() => {
                const href = $("#logout_user").attr('href');
                window.location.href = href;
            }, 10000);
        }
    });

};

const performChecks = () => {

    let pg_requests = Requests("", "", http);

    pg_requests.check_authentication((response) => {
        if (response.data !== true && response.data != "anonymous") {
            modalAlert("You have logged in with a different account on this" +
                " computer. You will be disconnected from the server for" +
                " security reasons in 10 seconds.", "Alert", () => {
            });
            setTimeout(() => {
                const href = $("#logout_user").attr('href');
                window.location.href = href;
            }, 10000);
            return
        }

        pg_requests.check_ldap((response) => {

            if (response.data !== true) {
                modalAlert("Could not connect to the authentication server." +
                    " Check your connection settings. If the error persists," +
                    " please contact the system administrator.", "Warning", () => {
                });

                return;
            }

            pg_requests.check_db_general((response) => {
                if (response.data !== true) {
                    modalAlert("Could not connect to the general database server." +
                        " Check your connection settings. If the error persists," +
                        " please contact the system administrator.", "Warning", () => {
                    });

                    return;
                }

                pg_requests.check_db_mlst((response) => {
                    if (response.data !== true) {
                        modalAlert("Could not connect to the wgMLST database server." +
                            " Check your connection settings. If the error persists," +
                            " please contact the system administrator.", "Warning", () => {
                        });

                        return;
                    }

                    pg_requests.check_allegro((response) => {
                        if (response.data !== true) {
                            modalAlert("Could not connect to the AllegroGraph server." +
                                " Check your connection settings. If the error persists," +
                                " please contact the system administrator.", "Warning", () => {
                            });

                            return;
                        }

                        pg_requests.check_controller((response) => {

                            if (response.data !== true) {
                                modalAlert("Could not connect to the jobs controller server." +
                                    " Check your connection settings. If the error persists," +
                                    " please contact the system administrator.", "Warning", () => {
                                });

                                return;
                            }

                            pg_requests.check_phyloviz((response) => {
                                if (response.status !== 200) {
                                    modalAlert("Could not connect to the PHYLOViZ Online" +
                                        " server." +
                                        " Check your connection settings. If the error persists," +
                                        " please contact the system administrator.", "Warning", () => {
                                    });

                                    return;
                                }
                            });
                        });
                    });
                });
            });
        });
    });

};

/**
 * Function to check if the current user matches with the logged user. This
 * may happen when there are multiple logins in the same computer
 */
const checkAuthentication = () => {
    let pg_requests = Requests("", "", http);

    pg_requests.check_authentication((response) => {
        if (response.data !== true && response.data != "anonymous") {
            modalAlert("You have logged in with a different account on this" +
                " computer. You will be disconnected from the server for" +
                " security reasons in 10 seconds.", "Alert", () => {
            });
            setTimeout(() => {
                const href = $("#logout_user").attr('href');
                window.location.href = href;
            }, 10000);
            return;
        }
    });
};

/**
 * Function to trigger some events on main controller start.
 * App starting function
 */

const startApp = () => {

    console.log("Starting app");

    const initIntervals = () => {

        setInterval(() => {
            getNavbarMessages();
        }, 5000);

        setInterval(() => {
            checkAuthentication();
        }, 15000);

        intervalState = setInterval(() => {
            checkPlatformState()
        }, 5000);

        setTimeout(() => {
            performChecks();
        }, 2000);

        // This event only runs once at the beginning
        document.removeEventListener("onOverview", initIntervals);
    };

    document.addEventListener("onOverview", initIntervals);

    setTimeout(() => {

        $('#overviewLink').trigger('click');

        $("#send_mail").off("click").on("click", () => {

            pg_requests.get_user_mails((response) => {

                let pg_requests = Requests("", "", http);

                if (response.data.length > 0) {
                    let options = "";
                    for (const x of response.data) {
                        options += "<option>" + x.username + ": " + x.email +
                            "</option>";
                    }
                    $("#recipients").empty().append(options);
                }

                $('.selectpicker').selectpicker('refresh');

            });

            $("#newMailModal").modal("show");


        });

        $("#viewAllMessages").off("click").on("click", () => {
            $("#messages_button").trigger("click");
            $("#button_ham_navbar").trigger("click");

        });

        $('#offcanvasleft').click(function () {
            $('.row-offcanvas-left').toggleClass('active');
        });

        $('.nav-a').click(function () {
            $('.row-offcanvas-left').toggleClass('active');
        });

        $(".dropdiv ul li").on("click", function () {
            PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID,
                CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID,
                CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT,
                CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID,
                CURRENT_TABLE_ROWS_SELECTED, CURRENT_TABLE_ROW_ANALYSIS_SELECTED,
                PROJECT_STATUS]);
            tclick();
        });

        $("#sidebar-wrapper ul li").not('.navbar ul .drop, .dropdiv ul li')
            .on("click", function () {
                PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID,
                    CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID,
                    CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT,
                    CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID,
                    CURRENT_TABLE_ROWS_SELECTED, CURRENT_TABLE_ROW_ANALYSIS_SELECTED,
                    PROJECT_STATUS]);
                tclick();
            });
        $(".nav-list li").not('.dropdiv ul li').on("click", function () {
            PREVIOUS_PAGE_ARRAY.push([current_scope_template, CURRENT_PROJECT_ID,
                CURRENT_JOB_MINE, CURRENT_PROJECT, CURRENT_SPECIES_ID,
                CURRENT_SPECIES_NAME, CURRENT_USER_NAME, CURRENT_JOBS_ROOT,
                CURRENT_JOB_ID, CURRENT_PROJECT_NAME_ID, CURRENT_TABLE_ROWS_SELECTED,
                CURRENT_TABLE_ROW_ANALYSIS_SELECTED, PROJECT_STATUS]);
            tclick();
        });

    }, 500);

};
