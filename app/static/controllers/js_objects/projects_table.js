/*
Object with functions to deal with the Projects controller
	- get_species_names
	- get_projects_from_species
	- add_project
	- delete_project
	- load_project
*/

const Projects_Table = (CURRENT_PROJECT_ID, CURRENT_PROJECT, $http) => {

    let projects = [], other_projects = [], species = [];
    //let projects_headers = {};
    //var currentSpecieID = 1;
    intervals_running = {};
    pipeline_status = {};
    jobs_to_parameters = {};

    const objects_utils = Objects_Utils();
    const pg_requests = Requests(CURRENT_PROJECT_ID, CURRENT_PROJECT, $http);
    const ngs_onto_requests = ngs_onto_client(CURRENT_PROJECT_ID, $http);

    const modalAlert = (text, callback) => {

        const modalBodyEl = $('#modalAlert .modal-body');
        const buttonSub = $('#buttonSub');

        $('#buttonCancelAlert').off("click");

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

    const returned_functions = {

        /*
        Get all the available species names
        */
        get_species_names: (callback) => {
            pg_requests.get_species_names( (response) => {
                if(response.status === 200){
                    callback({species:response.data, CURRENT_SPECIES_NAME:response.data[0].name, CURRENT_SPECIES_ID:response.data[0].id});
                }
                else console.log(response.statusText);
            })
        },

        /*
        Get all projects available from the current species.
        Can be from other users or only for the current user
        */
        get_projects_from_species: (species_id, is_others, callback) => {

            pg_requests.get_species_projects(species_id, is_others, (response) => {

                if(response.status === 200){
                    if(is_others){
                        other_projects = [];
                        response.data.map( (d) => {
                            if(d.is_removed === null) {

                                let lockStatus = "";

                                if(d.is_removed === 'lock'){
                                    lockStatus = '<div' +
                                        ' style="width:100%;text-align:' +
                                        ' center;<i' +
                                        ' class="fa' +
                                        ' fa-lock"></i></div>';
                                }
                                else{
                                    lockStatus = '<div' +
                                        ' style="width:100%;text-align:' +
                                        ' center;"<i' +
                                        ' class="fa' +
                                        ' fa-unlock"></i></div>';
                                }

                                other_projects.push({name: d.name, description: d.description, date: d.timestamp.split(" ").slice(0, 4).join(' '), id: d.id, username: d.username, lockStatus:lockStatus});
                            }
                        });
                        callback(other_projects);
                        objects_utils.loadDataTables('projects_table', projects);
                    }
                    else{
                        projects = [];
                        response.data.map( (d) => {
                            if(d.is_removed === null) {

                                let lockStatus = "";

                                if(d.is_removed === 'lock'){
                                    lockStatus = '<div' +
                                        ' style="width:100%;text-align:' +
                                        ' center;<i' +
                                        ' class="fa' +
                                        ' fa-lock"></i></div>';
                                }
                                else{
                                    lockStatus = '<div' +
                                        ' style="width:100%;text-align:' +
                                        ' center;"<i' +
                                        ' class="fa' +
                                        ' fa-unlock"></i></div>';
                                }

                                projects.push({name: d.name, description: d.description, date: d.timestamp.split(" ").slice(0, 4).join(' '), id: d.id, username: d.username, lockStatus:lockStatus});
                            }
                        });
                        callback(projects);

                        objects_utils.loadDataTables('projects_table', projects);
                    }
                }
                else {
                    if(!is_others) projects = [];
                    else other_projects = [];
                    callback([]);
                }
            });
        },

        /*
        Add a new project to the database.
        It adds to the postgresql and to the ngsonto
        */
        add_project: (callback) => {
            pg_requests.add_project_to_database( (response) => {
                if (response.status === 201){
                    ngs_onto_requests.ngs_onto_request_add_project_to_database(response.data.id, (response) => {
                        //Do something if needed
                    });
                    projects.push({name: response.data.name, description: response.data.description, date: response.data.timestamp.split(" ").slice(0, 4).join(' '), id: response.data.id});
                    $('#newProjectModal').modal('hide');
                    modalAlert('Project created.', () => {});
                    callback({projects: projects});
                }
                else if(response.status === 409){
                    modalAlert('An error as occuried when creating the new' +
                        ' project.' + response.data.message, () => {});
                }
                else modalAlert('An error as occuried when creating the new' +
                        ' project.', () => {});
            })
        },

        /*
        Deletes a project from the database.
        It adds a tag to the project on the database. Dont really removes it.
        */
        delete_project: (callback) => {

            const project_indexes = $.map($('#projects_table').DataTable().rows('.selected').indexes(), (index) => {
                return index;
            });

            let count_to_delete = 0;
            let total_to_delete = project_indexes.length;

            if(project_indexes.length > 0){

                modalAlert("By accepting this option you are removing the" +
                    " project/projects from the application. Do you really" +
                    " want proceed?", () => {

                    for(const i in project_indexes){
                        const project_id = projects[project_indexes[i]].id;
                        pg_requests.delete_project_from_database(project_id, (response) => {
                            count_to_delete+=1;
                            if(response.status === 204){
                                const new_projects = [];
                                projects.map( (d) => {
                                    if (d.id !== project_id) new_projects.push(d);
                                });
                                projects = new_projects;
                            }
                            if(count_to_delete === total_to_delete) callback({projects: projects});
                        });
                    }
                });

            }
        },

        /*
        Loads a Project from the database
        */
        load_project: (table_id, CURRENT_PROJECT_ID, pass, callback) => {

            let selected_indexes = [];

            if(table_id !== ""){
                const table = $('#' + table_id).DataTable();

                selected_indexes = $.map(table.rows('.selected').indexes(), (index) => {
                    return index;
                });
            }

            if (selected_indexes.length === 0 && pass !== true){
                modalAlert('Please select a project first.', () => {});
            }
            else{
                pg_requests.load_project(CURRENT_PROJECT_ID, (response) => {
                    if(response.status === 200){
                        callback({project: response.data, template: 'static/html_components/manage_projects_view.html'});
                    }
                    else console.log(response.statusText);
                })
            }
        },

        lock_project: (project_id, callback) => {

            const table = $('#projects_table').DataTable();

            let selectedData = $.map(table.rows('.selected').indexes(), (index) => {
                return index;
            });

            console.log(project_id);
            if(selectedData.length > 0){
                modalAlert('By choosing this option, you are Locking the' +
                    ' selected Project. This means that all the analysis' +
                    ' results for this Project will still be visible in the' +
                    ' reports and in the Project page. However, you will not be' +
                    ' able to run more analysis on this Project. This option is' +
                    ' useful to release space from the Storage. Do you really' +
                    ' want to proceed?', (

                ) => {
                    pg_requests.lock_project(project_id, () => {
                        callback();
                    });
                });
            }
            else{
                modalAlert('Please select a Project first.', (

                ) => {
                    callback();
                });
            }

        }


    };

    return returned_functions;


}