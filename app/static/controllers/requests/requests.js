const Requests = (CURRENT_PROJECT_ID, CURRENT_PROJECT, $http) => {

	return {

		//////////////// Protocols Requests /////////////////////////////////////////
		download_accession: (username, accession_numbers, callback) => {

			const req = {
		        url:'api/v1.0/downloads/',
		        method:'POST',
		        data: { accession_numbers: accession_numbers }
		    };

		    $http(req).then( (response) => {
		    	callback(response, accession_numbers);
		    }, (response) => {
		    	callback(response, accession_numbers);
		    });
		},

		get_user_mails: (callback) => {
			const req = {
		        url:'api/v1.0/users/email/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},

		get_statistics: (callback) => {
			const req = {
		        url:'api/v1.0/strains/statistics/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},

		get_messages: (numberofmessages, callback) => {
			const req = {
		        url:'api/v1.0/user/messages/',
		        method:'GET',
				params: {
		        	numberofmessages: numberofmessages
				}
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},

		send_messages: (data, callback) => {
			const req = {
		        url:'api/v1.0/user/messages/',
		        method:'POST',
				data: data
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},

		delete_messages: (messageid, callback) => {
			const req = {
		        url:'api/v1.0/user/messages/',
		        method:'DELETE',
				params: {
		        	messageid: messageid
				}
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},

		mark_as_read: (messageid, callback) => {
			const req = {
		        url:'api/v1.0/user/messages/',
		        method:'PUT',
				params: {
		        	messageid: messageid,
					status: "read"
				}
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},

		get_templates: (callback) => {
			const req = {
		        url:'api/v1.0/user/messages/templates/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},

		get_users: (callback) => {

			const req = {
		        url:'api/v1.0/users/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });

		},


		check_download_accession_status: (file_name, accession_numbers, callback) => {

			const req = {
		        url:'api/v1.0/downloads/',
		        method:'GET',
		        params: { accession_numbers: file_name }
		    };

		    $http(req).then( (response) => {
		    	callback(response, accession_numbers);
		    }, (response) => {
		    	callback(response, accession_numbers);
		    });
		},
		create_protocol: (protocol_object, callback) => {

			const req = {
		        url:'api/v1.0/protocols/',
		        method:'POST',
		        headers: {'Content-Type': 'application/json'},
		        data: { steps: protocol_object, name: protocol_object.name}
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},
		get_protocols_of_type: (selectedType, callback) => {

			const req = {
		        url:'api/v1.0/protocols/',
		        method:'GET',
		        params: { type: selectedType }
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		},
		get_protocols_by_ids: (ids, workflow_entry, callback) => {

			const req = {
		        url:'api/v1.0/protocols/ids',
		        method:'GET',
		        params: { protocol_ids: ids }
		    };

		    $http(req).then( (response) => {
		    	callback(response, workflow_entry);
		    }, (response) => {
		    	callback(response, workflow_entry);
		    });
		},


		//////////////// Workflows Requests /////////////////////////////////////////
		add_workflow: (callback) => {

			const selClassEl = $( "#select_classifier option:selected" );
			const workflowSpecieEl = $( "#workflow_species option:selected" );
			const selectDependency = $( "#select_dependency option:selected" );

			const req = {
		        url:'api/v1.0/workflows/',
		        method:'POST',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        data: $('#new_workflow_form').serialize() + "&classifier=" + selClassEl.text() + "&species=" + workflowSpecieEl.text() + "&dependency=" + selectDependency.text()
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		    	callback(response);
		    });
		    
		},
		//////////////// Projects Table Requests /////////////////////////////////////////
		get_species_names: (callback) => {

			const req = {
	            url:'api/v1.0/species/',
	            method:'GET'
	        };

	        $http(req).then((response) => {
	            callback(response);
	        }, (response) => {
	        	callback(response);
	        });
		},

		get_all_workflows: (callback) => {

			const req = {
	            url:'api/v1.0/workflows/all/',
	            method:'GET'
	        };

	        $http(req).then( (response) => {
	            callback(response);
	        }, (response) => {
	        	callback(response);
	        });
		},

		change_workflow_state: (selected_data, callback) => {

			const req = {
	            url:'api/v1.0/workflows/availability/',
	            method:'PUT',
	            params:
		        {
		        	identifier: String(selected_data[0]),
		        	to_change: String(selected_data[1])
		        }
	        };

	        $http(req).then( (response) => {
	            callback(response);
	        }, (response) => {
	        	callback(response);
	        });
		},

		get_species_projects: (species_id, is_others, callback) => {

			//Get user projects for specie 1
			let req = {};

			if(is_others){
				req = {
	                url:'api/v1.0/projects/species/' + species_id,
	                method:'GET',
	                params: { get_others: true }
	            }
			}
			else{
				req = {
	                url:'api/v1.0/projects/species/' + species_id,
	                method:'GET'
	            }
			}

	        $http(req).then( (response) => {
	        	callback(response);
	        }, (response) => {
	        	callback(response);
	        });
		},
		add_project_to_database: (callback) => {

			const req = {
		        url:'api/v1.0/projects/',
		        method:'POST',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        data: $('#new_project_form').serialize()
		    };

		    $http(req).then( (response) => {
		    	callback(response);
		    }, (response) => {
		        callback(response);
		    });	
		},
		delete_project_from_database: (project_id, callback) => {

			const req = {
	            url:'api/v1.0/projects/' + project_id,
	            method:'DELETE'
	        };

	        $http(req).then( (response) => {
	            callback(response);
	        }, (response) => {
	        	callback(response);
	        });
		},
		load_project: (project_id, callback) => {

			const req = {
	            url:'api/v1.0/projects/' + project_id,
	            method:'GET'
	        };

	        $http(req).then( (response) => {
	            callback(response);
	        }, (response) => {
	        	callback(response);
	        });
		},


		//////////////// Reports Requests /////////////////////////////////////////
		get_user_reports: (callback) => {

		    const req = {
		        url: 'api/v1.0/reports/', //Defined at utils.js
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		    	callback(response);
	        }, (response) => {
	            callback(response);
		    });

		},
		get_project_reports: (project_id, pipelines_to_check, callback) => {

		    const req = {
		        url: 'api/v1.0/reports/project', //Defined at utils.js
		        method:'GET',
		        params:{'project_id': project_id, 'pipelines_to_check':pipelines_to_check}
		    };

		    $http(req).then( (response) => {
		    	callback(response);
	        }, (response) => {
	            callback(response);
		    });

		},
		get_reports_by_strain: (strain_id_to_search, callback) => {

		    const req = {
		        url: 'api/v1.0/reports/strain', //Defined at utils.js
		        method:'GET',
		        params:{'strain_id': strain_id_to_search}
		    };

		    $http(req).then( (response) => {
		    	callback(response);
	        }, (response) => {
	            callback(response);
		    });

		},
		get_multiple_user_reports: (job_ids, callback) => {

			const req = {
		        url: 'api/v1.0/reports/', //Defined at utils.js
		        method:'GET',
		        params: {
		        	job_ids:job_ids.toString()
		        }
		    };

		    $http(req).then( (response) => {
		    	callback(response);
	        }, (response) => {
	            callback(response);
		    });

		},
		save_reports: (job_ids, strain_names, CURRENT_SPECIES_ID, callback) => {

		    const req = {
		        url: 'api/v1.0/reports/combined', //Defined at utils.js
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'POST',
		        data: $('#save_report_form').serialize() + '&job_ids=' + job_ids + '&strain_ids=' + strain_names +'&species_id='+ CURRENT_SPECIES_ID
		    };

		    $http(req).then( (response) => {
		    	callback(response);
	        },function(response){
	            callback(response);
		    });

		},
		get_saved_user_reports: (CURRENT_SPECIES_ID, callback) => {

		    const req = {
		        url: 'api/v1.0/reports/combined', //Defined at utils.js
		        method:'GET',
		        params:{"species_id": CURRENT_SPECIES_ID}
		    };

		    $http(req).then( (response) => {
		    	//console.log(response);
		    	callback(response);
	        }, (response) => {
	        	//console.log(response);
	            callback(response);
		    });

		},
		get_user_trees: (CURRENT_SPECIES_ID, callback) => {

		    const req = {
		        url: 'api/v1.0/phyloviz/trees', //Defined at utils.js
		        method:'GET',
		        params:{"species_id": CURRENT_SPECIES_ID}
		    };

		    $http(req).then( (response) => {
		    	callback(response);
	        }, (response) => {
	            callback(response);
		    });

		},
		delete_combined_report: (report_name, callback) => {

		    const req = {
		        url: 'api/v1.0/reports/combined', //Defined at utils.js
		        method:'DELETE',
		        params: {
		        	"report_name": report_name
		        }
		    };

		    $http(req).then( (response) => {
		    	callback(response);
	        }, (response) => {
	            callback(response);
		    });

		},

		get_saved_report: (callback) => {

		    const req = {
		        url: 'api/v1.0/reports/combined/show', //Defined at utils.js
		        method:'GET',
		    };


		    $http(req).then( (response) => {
		    	callback(response);
	        }, (response) => {
	            callback(response);
		    });

		},

		//////////////// Single Project Requests /////////////////////////////////////////
		get_workflows: (classifier, species, callback) => {

		    const req = {
		        url: 'api/v1.0/workflows/', //Defined at utils.js
		        method:'GET',
		        params:{"classifier": classifier, "species":species}
		    };

		    $http(req).then( (response) => {
		    	callback(response);
	        }, (response) => {
	            callback(response);
		    });

		},
		add_pipeline: (pipelineformID, callback) => {

		    const req = {
		        url: CURRENT_PROJECT.pipelines,
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'POST',
		        data:$('#' + pipelineformID).serialize()
		    };

		    $http(req).then( (response) => {
		      		callback(response);
		        },
		        (response) => {
		            callback(response);
		    });	

		},
		get_strains: (CURRENT_SPECIES_ID, from_user, callback) => {

		    const req = {
		        url: 'api/v1.0/strains/',
		        method:'GET',
		        params:
		        {
		        	speciesID: CURRENT_SPECIES_ID,
		        	from_user: from_user
		        }
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });

		},
		update_strain: (strain_id, key, value, callback) => {

			const req = {
		        url: 'api/v1.0/strains/',
		        method:'PUT',
		        params:
		        {
		        	strain_id: strain_id,
		        	key: key,
		        	value: value
		        }
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });

		},
		get_strain_by_name: (strain_name, callback) => {

		    const req = {
		        url: 'api/v1.0/strains/' + strain_name,
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });

		},
		get_applied_pipelines: (strain_id, project_id, callback) => {

			let req = {};

			if (strain_id === null){
				req = {
			        url: 'api/v1.0/projects/'+project_id+'/pipelines/',
			        method:'GET'
			    }
			}
			else{
				req = {
			        url: 'api/v1.0/projects/'+project_id+'/pipelines/',
			        method:'GET',
			        params:{ strain_id_all:strain_id}
			    }
			}

		    $http(req).then( (response) => {
		        callback(response, strain_id);
	        },
	        (response) => {
	            callback(response, strain_id);
		    });
		},
		get_public_strains_applied_pipelines: (callback) => {

		    const req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
		        method:'GET',
		        params:{all:true}
		    };

		    $http(req).then( (response) => {
		        callback(response);
	        },
	        (response) => {
	            callback(response);
		    });
		},
		remove_pipeline_from_project: (strain_id, tag_remove, callback) => {

		    const req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
		        method:'DELETE',
		        params: {
		        	"strain_id": strain_id,
		        	tag_remove: tag_remove
		        }
		    };

		    $http(req).then( (response) => {
		        callback(response);
	        },
	        (response) => {
	            callback(response);
		    });
		},
		change_pipeline_from_project: (strain_id, tag_remove, pipeline_to_use, callback) => {

		    const req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
		        method:'PUT',
		        params: {
		        	"strain_id": strain_id,
		        	tag_remove: tag_remove
		        }
		    };

		    $http(req).then( (response) => {
		        callback(response, strain_id, pipeline_to_use);
	        },
	        (response) => {
	            callback(response, strain_id, pipeline_to_use);
		    });
		},
		get_quota: (callback) => {

			const req = {
	            url: 'api/v1.0/user/quota/',
	            method:'GET',
				params: {
	                project_id: CURRENT_PROJECT_ID
	            }
	        };

	        $http(req).then( (response) => {
	               callback(response);
	            },
	            (response) => {
	               callback(response);
	        });

		},
		lock_project: (project_id, callback) => {

			const req = {
	            url: 'api/v1.0/projects/' + project_id,
	            method:'PUT',
				params: {
	                lock: "lock",
					project_id: project_id
	            }
	        };

	        $http(req).then( (response) => {
	               callback(response);
	            },
	            (response) => {
	               callback(response);
	        });

		},
		delete_fastq: (selectedNames, callback) => {
			const req = {
	            url: 'api/v1.0/strains/fastq/',
	            method:'DELETE',
				params: {
	                strain_names: selectedNames.join(","),
					speciesID: CURRENT_SPECIES_ID
	            }
	        };

	        $http(req).then( (response) => {
	               callback(response, true);
	            },
	            (response) => {
	               callback(response, false);
	        });
		},
        sendCustomMail: (recipients, title, body, callback) => {
		    const req = {
	            url: 'api/v1.0/mail/',
	            method:'POST',
	            data: {
	                recipients: recipients.join(","),
	                title:title,
	                body:body
	            }
	        };

	        $http(req).then( (response) => {
	               callback(response);
	            },
	            (response) => {
	               callback(response);
	        });
        },
        sendMail: (recipients, template, info) => {
		    const req = {
	            url: 'api/v1.0/mail/',
	            method:'POST',
	            data: {
	                recipients: recipients,
	                template: template,
                    info: info
	            }
	        };

	        $http(req).then( (response) => {
	            console.log(response);
	               callback(response);
	            },
	            (response) => {
	                console.log(response);
	               callback(response);
	        });
        },
		get_uploaded_files: (callback) => {

		    const req = {
		        url: 'api/v1.0/uploads/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},
		get_project_strains: (callback) => {

			const req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},
		get_project_strains_2: (strain_id, is_there, callback) => {

			const req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		            callback(response, strain_id, is_there);
		        },
		        (response) => {
		            callback(response, strain_id, is_there);
		    });
		},
		add_strain_to_project: (strain_name, callback) => {

		    const req = {
		        url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
		        method:'PUT',
		        data: {
		            "strainID": strain_name.trim()
		        }
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},
		add_new_strain: (callback) => {

			/*if ($("#Accession").val() !== ""){
				$("#File_1").selectpicker('val', 'None');
            	$("#File_2").selectpicker('val', 'None');
			}*/

		    const req = {
		        url: 'api/v1.0/strains/',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'POST',
		        data: $('#new_strain_form').find("select, input, textarea").serialize()
		    };

		    $http(req).then((response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });

		},

		update_metadata: (strain_id, callback) => {
		    
		    const req = {
		        url: 'api/v1.0/strains/',
		        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		        method:'PUT',
		        data: $('#modify_strain_form').find("select, input, textarea").serialize() + "&strain_id=" + strain_id
		    };

		    $http(req).then((response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });

		},

		remove_strain_from_project: (strain_name, callback) => {

			const req = {
	            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/strains/',
	            method:'DELETE',
	            params: {
	                "strainID": strain_name
	            }
	        }

	        $http(req).then( (response) => {
	                callback(response);
	            },
	            (response) => {
	                callback(response);
	        });
		},
		check_if_pipeline_exists: (strain_id, strainID, callback) => {

		    const req = {
	            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
	            method:'GET',
	            params: {
	                strain_id_all: strain_id,
	                parent_project_id: CURRENT_PROJECT_ID
	            }
	        };

		    console.log(req);

	        $http(req).then( (response) => {
	               callback(response, strain_id, strainID);
	            },
	            (response) => {
	               callback(response, strain_id, strainID);
	        });
		},
		add_pipeline: (strain_id, parent_pipeline_id, parent_project_id, callback) => {

	        const req = {
	            url: 'api/v1.0/projects/'+CURRENT_PROJECT_ID+'/pipelines/',
	            method:'POST',
	            data: {
	                strain_id: strain_id,
	                parent_pipeline_id:parent_pipeline_id,
	                parent_project_id:parent_project_id
	            }
	        };

	        $http(req).then( (response) => {
	               callback(response);
	            },
	            (response) => {
	               callback(response);
	        });
		},
		run_job: (strain_id, protocol_ids, pipeline_id, process_id, strain_name, strain_submitter, current_specie, strainName, to_run, process_to_wrkdir, callback) => {

			const processes_wrkdir = [];

			for(const x in process_id){
				if (process_to_wrkdir[String(pipeline_id) + "-" + String(process_id[x])] !== undefined){
					processes_wrkdir.push(process_to_wrkdir[String(pipeline_id) + "-" + String(process_id[x])])
				}
				else{
					processes_wrkdir.push("false")
				}
			}

		    const req = {
		        url: 'api/v1.0/jobs/',
		        method:'POST',
		        data: {
		        	strain_id: strain_id,
		        	protocol_ids: protocol_ids,
		        	project_id: CURRENT_PROJECT_ID,
		        	pipeline_id: pipeline_id,
		        	process_id: process_id.join(),
		        	strain_submitter: strain_submitter,
		        	current_specie: current_specie,
		        	sampleName: strainName,
		        	processes_to_run: to_run.join(),
		        	processes_wrkdir: processes_wrkdir.join()
		    	}
		    };

		    $http(req).then( (response) => {
		            callback(response, strain_name, pipeline_id);
		        },
		        (response) => {
		            callback(response, strain_name, pipeline_id);
		    });

		},
		get_job_status: (job_ids, procedure_names, sample_name, pipeline_id, process_positions, project_id, process_ids, callback) => {

		    const req = {
		        url: 'api/v1.0/jobs/',
		        method:'GET',
		        params: {
		        	job_id: job_ids.join(),
		        	procedure_name:procedure_names.join(),
		        	sample_name:sample_name,
		        	pipeline_id:pipeline_id,
		        	process_position:process_positions.join(),
		        	project_id:project_id,
		        	process_id:process_ids,
		        	database_to_include: CURRENT_SPECIES_NAME,
		        	current_user_name: CURRENT_USER_NAME,
		        	current_user_id: CURRENT_USER_ID,
		        	from_process_controller: "false",
		        	homedir: HOME_DIR
		    	}
		    };

		    $http(req).then( (response) => {
		            callback(response, job_ids, pipeline_id);
		        },
		        (response) => {
		            callback(response, job_ids, pipeline_id);
		    });

		},

		//////////////////////////////// GET FILES ////////////////////////////////////////
		get_user_files: (callback) => {

			const req = {
		        url: 'api/v1.0/files/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},

		get_user_files: (callback) => {

			const req = {
		        url: 'api/v1.0/files/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},

		set_user_parameters: (parameters_object_string, callback) => {

			const req = {
		        url: 'api/v1.0/user/',
		        method:'PUT',
		        params: {
		        	parameters_object: parameters_object_string
		        }
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},

		get_user_parameters: (callback) => {

			const req = {
		        url: 'api/v1.0/user/',
		        method:'GET'
		    };

		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},

		download_file: (path, callback) => {

			const req = {
		        //url: CURRENT_JOBS_ROOT + '/api/v1.0/jobs/results/download/',
		        url: 'api/v1.0/jobs/results/download/',
		        method:'GET',
		        params: {
		        	file_path: encodeURI(path)
		        }
		    };

		    $http(req).then( (response) => {

		            const url = 'api/v1.0/jobs/results/download/click/?file_path=' + encodeURI(response.data);

					let link = document.createElement("a");
				    link.download = path.split('/').slice(-1)[0];
				    link.href = url;
				    link.click();
				    callback();
		        },
		        (response) => {
		            callback(response);
		    });
			
		},

		download_template_strain_file: (callback) => {

			const url = 'api/v1.0/templates/batch_submission/';

			let link = document.createElement("a");
		    link.href = url;
		    link.click();
		    link.remove();
		    callback();
			
		},

		get_nextflow_log: (filename, pipeline_id, project_id, callback) => {

		    const req = {
		        url: 'api/v1.0/jobs/logs/nextflow/',
		        method:'GET',
		        params: {
		        	filename: filename,
		        	pipeline_id:pipeline_id,
		        	project_id:project_id
		        }
		    };

		    $http(req).then( (response) => {
				    callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},

		trigger_inspect: (pipeline_id, project_id, callback) => {

			const req = {
		        url: 'api/v1.0/jobs/inspect/',
		        method:'GET',
		        params: {
		        	pipeline_id:pipeline_id,
		        	project_id:project_id
		        }
		    };

		    $http(req).then( (response) => {
				    callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},

		kill_inspect: (pid, callback) => {

			const req = {
		        url: 'api/v1.0/jobs/inspect/',
		        method:'PUT',
		        params: {
		        	pid:pid
		        }
		    };

		    $http(req).then( (response) => {
				    callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},

		send_to_phyloviz: (job_ids, global_additional_data, species_id, callback) => {
			

			const req = {
		        url: 'api/v1.0/phyloviz/',
		        method:'POST',
		        data: {
		        	job_ids: job_ids.join(","),
		        	dataset_name: $('#modal_phyloviz_dataset_name').val(),
		        	dataset_description: $('#modal_phyloviz_dataset_description').val(),
		        	additional_data: JSON.stringify(global_additional_data),
		        	max_closest: $("#closest_number_of_strains").val(),
		        	database_to_include: $("#species_database option:selected").text(),
		        	species_id: species_id,
		        	missing_data: $('#missing_data_checkbox').is(":checked"),
		        	missing_char: $('#missing_data_character').val(),
					phyloviz_user: $('#phyloviz_user').val(),
					phyloviz_pass: $('#phyloviz_pass').val(),
					makePublic: $('#makePublic_checkbox').is(":checked")
		    	}
		    };
		    
		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		    
		},

		delete_tree: (tree_name, callback) => {

			const req = {
		        url: 'api/v1.0/phyloviz/trees/',
		        method:'DELETE',
		        params: {
		        	tree_name: tree_name
		    	}
		    };
		    
		    $http(req).then( (response) => {
		            callback(response);
		        },
		        (response) => {
		            callback(response);
		    });
		},

		fetch_job: (redis_job_id, callback) => {

			const req = {
		        url: 'api/v1.0/phyloviz/',
		        method:'GET',
		        params: {
		        	job_id: redis_job_id
		    	}
		    };

		    $http(req).then( (response) => {
		            callback(response, redis_job_id);
		        },
		        (response) => {
		            callback(response, redis_job_id);
		    });
		}
	}
};