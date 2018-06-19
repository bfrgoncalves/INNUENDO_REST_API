

innuendoApp.controller("messagesCtrl", ($scope, $rootScope, $http) => {

    const pg_requests = Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);

    let templates = {};
    let t_use = [];
    let messageIncrement = 5;
    let retrievedMessages = 5;

    $scope.mstatus = {
        "unread": "unread",
        "read": ""
    };

    const modalAlert = (text, header, callback) => {

    	const buttonSub = $('#buttonSub');
    	const modalBodyEl = $('#modalAlert .modal-body');

    	$('#buttonCancelAlert').off("click");

    	$('#modalAlert .modal-title').empty();
    	$('#modalAlert .modal-title').append("<p>"+header+"</p>");

    	modalBodyEl.empty();
    	modalBodyEl.append("<p>"+text+"</p>");

    	buttonSub.off("click").on("click", () => {
    		$('#modalAlert').modal("hide");

    		setTimeout( () => {
    			return callback();
			}, 400);
    	});

    	$('#modalAlert').modal("show");

    };

    $scope.loadMessages = () => {

        // Get messages stored for the current user
        pg_requests.get_messages(5, (response) =>{
            console.log(response);
            $scope.messages = response.data[0];
            retrievedMessages = response.data[0].length;
            $scope.messagescount = response.data[1];
        });

        // Get all the usernames
        pg_requests.get_users((response) =>{
            let options = "";
            for (const r of response.data){
                options += "<option>" + r.username + "</option>";
            }

            $("#username_dropdown").empty().append(options);
            $(".selectpicker").selectpicker("refresh");
        });

        // Get the available message templates
        pg_requests.get_templates((response) =>{
            templates = response.data;

            let template_keys = Object.keys(templates);
            let options = "<option>None</option>";

            for (const r in template_keys) {
                options += "<option>"+template_keys[r]+"</option>";
            }

            $("#template_dropdown").empty().append(options);
            $(".selectpicker").selectpicker("refresh");
        });
    };

    $("#template_dropdown").off("changed.bs.select").on("changed.bs.select", (e) => {

        if (e.target.value === "None") {
            t_use = ["",""];
        }
        else {
            t_use = templates[e.target.value];
        }

        $("#form_lastname").val(t_use[0]);
        $("#form_message").val(t_use[1]);
    });

    $scope.sendMessage = () => {

        let tosend = {
            messageTo: $("#username_dropdown").val(),
            title: $("#form_lastname").val(),
            body: $("#form_message").val()
        };

        pg_requests.send_messages(tosend, (response) => {

            if (response.status === 201) {
                modalAlert("Message sent!", "Messages", () => {});
            }
            else {
                modalAlert("There was an error when sending the message.",
                    "Error", () => {});
            }



        });

    };

    $scope.loadMoreMessages = () => {

        if ($scope.messages.length === retrievedMessages) {

            retrievedMessages += messageIncrement;
            // Get messages stored for the current user
            pg_requests.get_messages(retrievedMessages, (response) =>{
                $scope.messages = response.data[0];
                retrievedMessages = response.data[0].length;
                $scope.messagescount = response.data[1];
            });
        }
    };

    $scope.deleteMessage = ($event) => {

        let messageid = $($event.currentTarget).attr("messageid");

        pg_requests.delete_messages(messageid, (response) => {
           if (response.status === 204) {
               modalAlert("Message deleted!", "Messages", () => {});
           }

           // Get messages stored for the current user
           pg_requests.get_messages(retrievedMessages, (response) =>{
               $scope.messages = response.data[0];
               retrievedMessages = response.data[0].length;
               $scope.messagescount = response.data[1];
           });
        });
    };

    $scope.answerMessage = ($event) => {

        let messageid = $($event.currentTarget).attr("messageid");

        for (const message of $scope.messages) {

            if (parseInt(messageid) === message.id) {
                $("#form_lastname").val("RE: " + message.title);
                $('#username_dropdown').selectpicker('val', message.messageFrom);
                $('.selectpicker').selectpicker('render');
            }
        }
    };

    $scope.markAsRead = ($event) => {
        console.log($event.currentTarget);
        let messageid = $($event.currentTarget).attr("messageid");

        pg_requests.mark_as_read(messageid, (response) => {
           console.log(response);
           if (response.status === 200) {
               console.log("status changed");
           }

           // Get messages stored for the current user
           pg_requests.get_messages(retrievedMessages, (response) =>{
               $scope.messages = response.data[0];
               $scope.messagescount = response.data[1];
           });
        });
    };

});