/**
 * Function that returns all the requests that can be made to NGSOnto
 * @param CURRENT_PROJECT_ID
 * @param $http
 * @returns {{ngs_onto_get_protocol_types: ngs_onto_get_protocol_types, ngs_onto_load_protocol_properties: ngs_onto_load_protocol_properties, ngs_onto_request_create_protocol: ngs_onto_request_create_protocol, ngs_onto_get_protocol_fields: ngs_onto_get_protocol_fields, ngs_onto_request_add_workflow: ngs_onto_request_add_workflow, ngs_onto_request_get_workflow: ngs_onto_request_get_workflow, ngs_onto_request_add_project_to_database: ngs_onto_request_add_project_to_database, ngs_onto_request_applied_pipelines: ngs_onto_request_applied_pipelines, ngs_onto_request_applied_pipelines_with_parent: ngs_onto_request_applied_pipelines_with_parent, ngs_onto_request_add_strain_to_project: ngs_onto_request_add_strain_to_project, ngs_onto_request_create_pipeline: ngs_onto_request_create_pipeline, ngs_onto_request_remove_pipeline: ngs_onto_request_remove_pipeline, ngs_onto_request_save_pipeline: ngs_onto_request_save_pipeline, ngs_onto_request_add_processes: ngs_onto_request_add_processes, ngs_onto_request_get_processes: ngs_onto_request_get_processes, ngs_onto_request_get_processes_outputs: ngs_onto_request_get_processes_outputs, ngs_onto_request_add_jobid_to_process: ngs_onto_request_add_jobid_to_process, ngs_onto_request_get_jobid_from_process: ngs_onto_request_get_jobid_from_process}}
 */
const ngs_onto_client = (CURRENT_PROJECT_ID, $http) => {

    return {

        //////////////// Protocols Requests /////////////////////////////////////////
        ngs_onto_get_protocol_types: (callback) => {

            const req = {
                url:'api/v1.0/ngsonto/protocols/types',
                method:'GET'
            };

            $http(req).then( (response) => {
                callback(response);
            }, (response) => {
                callback(response);
            });
        },
        ngs_onto_load_protocol_properties: (protocol_type, callback) => {

            const req = {
                url:'api/v1.0/ngsonto/protocols/properties',
                method:'GET',
                params: { uri: protocol_type }
            };

            $http(req).then((response) => {
                callback(response);
            }, (response) => {
                callback(response);
            });
        },
        ngs_onto_request_create_protocol: (protocolTypeObject, typeuri, protocol_id, callback) => {

            const req = {
                url:'api/v1.0/ngsonto/protocols/',
                method:'POST',
                headers: {'Content-Type': 'application/json'},
                data: { type_uri: protocolTypeObject[typeuri], protocol_id: protocol_id}
            };

            $http(req).then( (response) => {
                callback(response);
            }, (response) => {
                callback(response);
            });
        },
        ngs_onto_get_protocol_fields: (uri, callback) => {

            const req = {
                url:'api/v1.0/ngsonto/protocols/properties/fields',
                method:'GET',
                params: { uri: uri }
            };

            $http(req).then( (response) => {
                callback(response);
            }, (response) => {
                callback(response);
            });

        },


        //////////////// Workflows Requests /////////////////////////////////////////
        ngs_onto_request_add_workflow: (workflow_id, protocol_ids, callback) => {

            const req = {
                url:'api/v1.0/ngsonto/workflows/protocols',
                method:'POST',
                data: {
                    workflow_id: workflow_id,
                    protocol_ids: protocol_ids
                }
            };

            $http(req).then( (response) => {
                callback(response);
            }, (response) => {
                callback(response);
            });
        },
        ngs_onto_request_get_workflow: (workflow_id, strain_name, workflow_name, callback) => {

            const req = {
                url:'api/v1.0/ngsonto/workflows/protocols',
                method:'GET',
                params: { workflow_id: workflow_id }
            };

            $http(req).then( (response) => {
                callback(response, strain_name, workflow_name);
            }, (response) => {
                callback(response, strain_name, workflow_name);
            });
        },
        //////////////// Projects Table Requests /////////////////////////////////////////
        ngs_onto_request_add_project_to_database: (project_id, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/',
                method:'POST',
                data: { study_id: project_id }
            };

            $http(req).then( (response) => {
                callback(response);
            }, (response) => {
                callback(response);
            });
        },
        //////////////// Single Project Requests /////////////////////////////////////////
        ngs_onto_request_applied_pipelines: (pipeline_id, project_id, strain_id, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/'+pipeline_id+'/workflows/',
                method:'GET'
            };

            $http(req).then( (response) => {
                    callback(response, strain_id,pipeline_id, project_id);
                },
                (response) => {
                    callback(response, strain_id,pipeline_id, project_id);
            });

        },
        ngs_onto_request_applied_pipelines_with_parent: (parent_pip, parent_project_id, strain_id, pipeline_id, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+parent_project_id+'/pipelines/'+pipeline_id+'/workflows/',
                method:'GET'
            };

            $http(req).then( (response) => {
                    callback(response, parent_pip, parent_project_id, strain_id, pipeline_id);
                },
                (response) => {
                    callback(response, parent_pip, parent_project_id, strain_id, pipeline_id);
                });

        },
        ngs_onto_request_add_strain_to_project: (id,  callback) => {

            const req_ngs_onto = {
                url: 'api/v1.0/ngsonto/strains/',
                method:'POST',
                data: { strain_id: id }
            };

            $http(req_ngs_onto).then( (response) => {
                callback(response);
            }, (response) => {
                callback(response);
            });

        },
        ngs_onto_request_create_pipeline: (pipeline_id, strain_id, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
                method:'POST',
                data: {
                    pipeline_id: pipeline_id
                }
            };

            $http(req).then( (response) => {
                    callback(response, strain_id);
                },
                (response) => {
                    callback(response, strain_id);
                });
        },
        ngs_onto_request_remove_pipeline: (pipeline_id, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
                method:'DELETE',
                params: {
                    pipeline_id: pipeline_id
                }
            };

            $http(req).then( (response) => {
                    callback(response);
                },
                (response) => {
                    callback(response);
                });
        },
        ngs_onto_request_save_pipeline: (pipeline_id, workflow_ids, pipeline_steps, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/' + pipeline_id + '/workflows/',
                method:'POST',
                data: {
                    workflow_id: workflow_ids.join(),
                    step: pipeline_steps.join()
                }
            };

            $http(req).then( (response) => {
                    callback(response);
                },
                (response) => {
                    callback(response);
                });
        },
        ngs_onto_request_add_processes: (pipeline_id, strain_id, strain_name, pip_ids_to_parents, last_process_ids, callback) => {

            //console.log('ADDED PROCESSES', CURRENT_PROJECT_ID,
            // pipeline_id, strain_id, pip_ids_to_parents);

            if(pip_ids_to_parents.length !== 0){
                strain_id = 'null';
            }
            if(pip_ids_to_parents[0] === undefined) pip_ids_to_parents.push("null");
            if(pip_ids_to_parents[1] === undefined) pip_ids_to_parents.push("null");

            let ppi = "";

            try{
                ppi = last_process_ids[2];
            }
            catch(e){
                ppi = "null";
            }

            if(pip_ids_to_parents[2] !== undefined) ppi = pip_ids_to_parents[2];

            if(ppi === undefined) ppi = "null";

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/'+pipeline_id+'/processes/',
                method:'POST',
                data: {
                    strain_id: strain_id,
                    parent_project_id: pip_ids_to_parents[0],
                    parent_pipeline_id: pip_ids_to_parents[1],
                    parent_process_id: ppi,
                    real_pipeline_id: pipeline_id
                }
            };

            console.log(req);

            $http(req).then(function(response){
                    console.log(response);
                    callback(response, strain_name);
                },
                function(response){
                    console.log(response);
                    callback(response, strain_name);
            });
        },
        ngs_onto_request_get_processes: (pipeline_id, project_id, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/'+pipeline_id+'/processes/',
                method:'GET',
            };

            $http(req).then( (response) => {
                    callback(response);
                },
                (response) => {
                    callback(response);
                });
        },
        ngs_onto_request_get_processes_outputs: (project_id, pipeline_id, process_id, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/'+pipeline_id+'/processes/' + process_id + '/outputs/',
                method:'GET',
            };

            $http(req).then( (response) => {
                    callback(response);
                },
                (response) => {
                    callback(response);
            });
        },
        ngs_onto_request_add_jobid_to_process: (pipeline_id, processes_ids, task_ids, strain_name, callback) => {

            console.log('JOBID TO PROCESS', pipeline_id, processes_ids, task_ids);

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+CURRENT_PROJECT_ID+'/pipelines/'+pipeline_id+'/processes/jobid',
                method:'POST',
                data: {
                    processes_ids: processes_ids.join(),
                    task_ids: task_ids.join()
                }
            };

            console.log(req);

            $http(req).then( (response) => {
                    callback(response, strain_name, processes_ids);
                },
                (response) => {
                    callback(response, strain_name, processes_ids);
            });
        },
        ngs_onto_request_get_jobid_from_process: (pipeline_id, processes_ids, project_id, strain_id, count, strain_processes, t_ids, proc_ids, processed_proc, callback) => {

            const req = {
                url: 'api/v1.0/ngsonto/projects/'+project_id+'/pipelines/'+pipeline_id+'/processes/jobid',
                method:'GET',
                params: {
                    processes_ids: processes_ids.join()
                }
            };

            console.log(req);

            $http(req).then( (response) => {
                    callback(response, processes_ids, strain_id, count, pipeline_id, project_id, strain_processes, t_ids, proc_ids, processed_proc);
                },
                (response) => {
                    callback(response, processes_ids, strain_id, count, pipeline_id, project_id, strain_processes, t_ids, proc_ids, processed_proc);
            });
        }
    }
};