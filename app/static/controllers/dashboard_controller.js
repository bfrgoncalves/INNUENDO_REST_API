innuendoApp.controller("dashboardCtrl", ($scope, $rootScope, $http) => {

    let pg_requests = Requests("", "", http);

    const performChecks = () => {

        pg_requests.check_ldap((response) => {

            if (response.data !== true) {
                $("#ldap_status").css({color: "red"});
            }
            else {
                $("#ldap_status").css({color: "green"});
            }

            pg_requests.check_db_general((response) => {
                if (response.data !== true) {
                    $("#pg_general_status").css({color: "red"});
                }
                else {
                    $("#pg_general_status").css({color: "green"});
                }

                pg_requests.check_db_mlst((response) => {
                    if (response.data !== true) {
                        $("#pg_mlst_status").css({color: "red"});
                    }
                    else {
                        $("#pg_mlst_status").css({color: "green"});
                    }

                    pg_requests.check_allegro((response) => {

                        if (response.data !== true) {
                            $("#allegro_status").css({color: "red"});
                        }
                        else {
                            $("#allegro_status").css({color: "green"});
                        }

                        pg_requests.check_controller((response) => {

                            if (response.data !== true) {
                                $("#controller_status").css({color: "red"});
                            }
                            else {
                                $("#controller_status").css({color: "green"});
                            }

                            pg_requests.check_phyloviz((response) => {
                                if (response.status !== 200) {
                                    $("#phyloviz_status").css({color: "red"});
                                }
                                else {
                                    $("#phyloviz_status").css({color: "green"});
                                }

                                pg_requests.check_state((response) => {
                                    if (response.data === "true") {
                                        $("#lockText").text("Lock Platform");
                                    }
                                    else {
                                        $("#lockText").text("Unlock Platform");
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });

    };

    $scope.loadDashboard = () => {
        performChecks();
    };

    $scope.performChecks = () => {
        performChecks();
    };

    $scope.changeState = () => {
        pg_requests.change_state((response) => {

            if (response.data === "true") {
                $("#lockButton").html('<i class="fa fa-lock" aria-hidden="true" > Lock Platform</i>');
            }
            else {
                $("#lockButton").html('<i class="fa fa-unlock" aria-hidden="true" > Unlock Platform</i>');
            }
        });
    };
});