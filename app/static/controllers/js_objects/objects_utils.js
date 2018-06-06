/*
Object_Utils Object - An object with all functions used in the metadata management
 - format
 - format_analysis
 - format_lab_protocols
 - searchableTable
 - nestedTable
 - tableFromData
 - apply_pipeline_to_strain
 - show_message
 - destroyTable
 - updateTable
 - loadDataTables
 - loadTableFromArrayData
*/

/*
Launch a object_utils instance
*/

let protocols_on_table = {};
let url_for_pipeline = {}
let pid_to_pipeline = {};

const Objects_Utils = (single_project, $sc) => {


    const format_analysis = ( d, table_id ) => {
        // `d` is the original data object for the row

        $("#"+d.strainID+'_table').remove();

        let tr_string = '';

        tr_string += '<tr class="child_row">'+
            '<td colspan="6"><p class="cell_paragraph"><b>Analytical' +
            ' Procedures:</b> </p>'+d.Analysis+'</td>'+
            '</tr>';

        tr_string += '<tr class="child_row protocols_child" id="'+d.strainID+'_workflows" style="display:none;">'+
            '<td colspan="6" id="'+d.strainID+'_protocols"><p' +
            ' class="cell_paragraph"> </td>'+
            '</tr>';

        protocols_on_table[d.strainID] = d.protocols;

        return '<table border="0" id="'+d.strainID+'_table"' +
            ' style="width:100%;">'+tr_string+'</table>';
    };

    const searchableTable = (table_id, columnDefinitions, data, visible_headers) => {


        protocols_on_table = {};
        let page_length;
        let selection_style;
        let additionalButtons;

        $('#' + table_id + ' tfoot th').each( (i, e) => {
            const title = $('#' + table_id + ' thead th').eq( $(e).index() ).text();
            $(e).html( '<input type="text" placeholder="Search '+title+'" />' );
        } );

        if(table_id === "public_strains_table") {
            page_length = 10;
        }
        else {
            page_length = 50;
        }

        if(table_id === "strains_table"){
            additionalButtons = {
                extend: "collection",
                text: "Selection",
                autoClose: true,
                buttons: [{
                    text: "Show Reports",
                    action: (e, dt, node, config) => {

                        single_project.showReports(dt, $sc, () => {

                        });

                    },
                },
                    {
                    text: "Delete Fastq",
                    action: ( e, dt, node, config ) => {

                        single_project.deleteFastq(dt, $sc, (status) => {
                            if (status){
                                dt.rows(".selected").nodes().to$()
                                    .addClass("no_files_row");
                            }
                        });
                    },
                }]
            }
        }

        if(table_id === "modify_strains_table" || table_id === "reports_trees_table") {
            selection_style = "single";
        }
        else selection_style = "multi";

        let table = $('#' + table_id).DataTable({
            dom: 'Blfrtip',
            "scrollCollapse": true,
            "scrollX": true,
            paging:true,
            colReorder: {
                fixedColumnsLeft: 1
            },
            "pageLength": page_length,
            select: {
                style:    selection_style,
                selector: 'td:first-child'
            },
            buttons: [
                'selectAll',
                'selectNone',
                'csv',
                {
                    extend: 'colvis',
                    collectionLayout: 'fixed two-column'
                },
                additionalButtons
            ],
            columns: columnDefinitions,
            "data": data,
            "stateSave":true,
            "createdRow": ( row, data, dataIndex) => {
                $(row).removeClass("odd");
                $(row).removeClass("even");
                if( data.has_files === "false"){
                    $(row).addClass("no_files_row");
                }

                if( data.Accession !== "NA" && data.Accession !== "" && data.has_files === "false"){
                    $(row).addClass("accession_row");
                }
            },
            "initComplete": () => {

                let already_added = [];
                for(const r in CURRENT_TABLE_ROWS_SELECTED[table_id]){
                    already_added.push(CURRENT_TABLE_ROWS_SELECTED[table_id][r]);
                    $('#'+table_id).DataTable().rows(CURRENT_TABLE_ROWS_SELECTED[table_id][r]).select();
                }
                for(const j in CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id]){
                    if($.inArray(CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id][j], already_added) === -1){
                        $('#'+table_id+' tbody').find("tr:eq("+String(CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id][j])+") td button.analysis-control").addClass("button_table_to_trigger");
                    }
                }

                setTimeout( () => {
                    const tableBodyEl = $('#'+table_id+' tbody');
                    tableBodyEl.find("tr.selected td button.analysis-control").trigger("click");
                    tableBodyEl.find("tr td button.button_table_to_trigger").trigger("click");
                    $('.child_row').css({"background-color":"#eeffff"});
                }, 50);
            }
        });

        // Apply the search
        table.columns().every( function () {
            //const that = this;
            const table_to_search = table;

            $( 'input', this.footer() ).on( 'keyup change', (e) => {
                table_to_search
                    .column( $(e.target).parent().index()+':visible' )
                    .search( el.target.value )
                    .draw();
            });
        } );


        table.columns.adjust().draw();

        const tableBodyEl = $('#'+table_id+' tbody');
        const tableBodyTrEl = $('#'+table_id+' tbody tr');

        tableBodyEl.off('click', 'button.details-control');
        tableBodyEl.off('click', 'button.analysis-control');
        tableBodyEl.off('click', 'button.workflows_child');
        tableBodyEl.off('click', 'button.info-control');
        tableBodyEl.off('mouseenter', 'button.workflows_child');
        tableBodyEl.off('mouseenter', 'button.workflows_child');
        tableBodyEl.off('mouseleave', 'button.workflows_child');
        tableBodyEl.off('keyup', 'button.workflows_child');
        tableBodyEl.off('click', 'button.button_table_to_trigger');
        tableBodyEl.off('click', 'button.lab-protocols-control');
        tableBodyTrEl.off('click', 'td:first');

        tableBodyTrEl.on('click', 'td:first:not(.child_row)', (el) => {

            if(CURRENT_TABLE_ROWS_SELECTED[table_id] === undefined) CURRENT_TABLE_ROWS_SELECTED[table_id] = [];

            if(!$(el.target).parent().hasClass("selected") && $.inArray(table.row( el.target ).index(), CURRENT_TABLE_ROWS_SELECTED[table_id]) < 0){
                CURRENT_TABLE_ROWS_SELECTED[table_id].push(table.row( el.target ).index());
            }
            else{
                const index_to_remove = CURRENT_TABLE_ROWS_SELECTED[table_id].indexOf(table.row( el.target ).index());
                CURRENT_TABLE_ROWS_SELECTED[table_id].splice(index_to_remove, 1);
            }
        } );

        const clickedTimes = {};
        clickedTimes["details"] = 0;
        clickedTimes["analysis"] = 0;
        clickedTimes["protocols"] = 0;

        tableBodyEl.on('click', 'button.analysis-control', (e) => {
            if(table_id.indexOf('strains_table') > - 1){

                const tableIdEl = $('#'+table_id);

                const tr = $(e.target).closest('tr');
                const row = tableIdEl.DataTable().row( tr );
                let index_r = tableIdEl.DataTable().row( tr ).index();

                if(row.child.isShown()){
                    row.child.hide();
                    $(e.target).removeClass('shown');
                    tr.removeClass('shown');
                    index_r = CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id].indexOf(table.row( tr ).index());
                    CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id].splice(index_r, 1);
                }
                else {
                    // Open this row
                    row.child( format_analysis(row.data(), table_id), 'child_row').show();
                    $(e.target).addClass('shown');
                    tr.addClass('shown');

                    if(CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id] === undefined){
                        CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id] = [];
                    }
                    if($.inArray(index_r, CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id]) === -1){
                        CURRENT_TABLE_ROW_ANALYSIS_SELECTED[table_id].push(index_r);
                    }

                    for(const x in current_job_status_color){
                        $('#' + x.replace(/ /g, "_")).css({'background-color': current_job_status_color[x]});
                    }
                    $('.child_row').css({"background-color":"#eeffff"});

                }
            }
        } );

        tableBodyEl.on('click', 'button.info-control', (e) => {

            const closest_strain = $(e.target).closest("tr").find(".strain_cell");
            const nextflowLogEl = $(".nextflow_logs");

            $("#modalNextflowLogs").modal("show");

            nextflowLogEl.attr("pip", String(strainID_pipeline[strains_dict[closest_strain.html()]]));

            nextflowLogEl.off("click").on("click", (e) => {
                const href = $(e.target).attr("href");

                console.log($(e.target).attr("name"));
                if($(e.target).attr("name") === "nextflow_inspect"){
                    let pip_id = "";
                    let work_dir = CURRENT_PROJECT_ID + "-" + pip_id

                    console.log(url_for_pipeline[work_dir], "AQUI");
                    if(url_for_pipeline[work_dir] == undefined) {

                        single_project.triggerInspect($(e.target).parent().attr("pip"), CURRENT_PROJECT_ID, (response) => {

                            console.log(response);
                            let inspect_url = response.data.link.trim();
                            let pid = response.data.pid.trim();

                            let inspect_url_parts = inspect_url.split(":")
                            inspect_url = "http://localhost:" + inspect_url_parts[2]

                            url_for_pipeline[work_dir] = inspect_url;
                            pid_to_pipeline[work_dir] = pid.split(":")[1]

                            $("#nextflow_inspect_div").html(
                                "<iframe style='width:100%;height:100%;' src='" + inspect_url + "'><iframe>"
                            );

                        });
                    }
                }
                else{
                   single_project.getNextflowLog($(e.target).attr("name"), $(e.target).parent().attr("pip"), CURRENT_PROJECT_ID, (response) => {
                        $(href).html("<pre>"+response.data.content+"</pre>");
                    });
                }

            });

            $('#modalNextflowLogs').off('hide.bs.modal').on('hide.bs.modal', () => {

                pid_keys = Object.keys(pid_to_pipeline);

                for(const x in pid_keys){

                    single_project.killInspect(pid_to_pipeline[pid_keys[x]], (response) => {
                        delete pid_to_pipeline[pid_keys[x]]
                        delete url_for_pipeline[pid_keys[x]]
                    });
                }
            });

            $("#nextflow_log_li").trigger("click");

        } );

        let prevWorkflow = [null,null, null];
        let prevWorkflow_toggle = [null,null,null];

        let is_open = false;

        tableBodyEl.on('click', 'button.workflows_child', (e) => {
            if(table_id.indexOf('strains_table') > - 1){

                const workflow_name = $(e.target).attr('name');
                const strainID = $(e.target).attr('strainID');
                const shown = $(e.target).attr("shown_child");


                if (prevWorkflow[0] !== null && workflow_name !== prevWorkflow[1]){
                    $("#"+prevWorkflow[0]+"_workflows").css({"display":"none"});
                    $(prevWorkflow[2]).attr("shown_child", "false");
                }

                const event = e || window.event;

                let isShift = !!event.shiftKey;

                if(isShift){

                    if(prevWorkflow_toggle[0] === true && prevWorkflow_toggle[2] !== workflow_name){
                        $("#"+prevWorkflow_toggle[1]+"_"+prevWorkflow_toggle[2]).toggle();
                        is_open = false;
                    }
                    if(is_open === true) is_open = false;
                    else is_open = true;

                    $("#"+strainID+"_"+workflow_name).toggle();
                    e.stopPropagation();
                    e.preventDefault();

                    prevWorkflow_toggle = [is_open, strainID, workflow_name];

                }
                else{
                    if(shown === 'false'){
                        const strainProtocolEl = $("#"+strainID+"_protocols");
                        strainProtocolEl.empty();
                        strainProtocolEl.html('<p' +
                            ' class="cell_paragraph"><b>Protocols:</b></p>'+protocols_on_table[strainID][workflow_name]);

                        $("#"+strainID+"_workflows").css({"display":"block"});
                        $(e.target).attr("shown_child", "true");

                        for(const x in current_job_status_color){
                            $('#' + x.replace(/ /g, "_")).css({'background-color': current_job_status_color[x]});
                        }

                    }
                    else{
                        $("#"+strainID+"_workflows").css({"display":"none"});
                        $(e.target).attr("shown_child", "false");
                    }
                    prevWorkflow = [strainID, workflow_name, e.target];
                }
            }
        } );

    };

    const nestedTable = (table_id, columnDefinitions, data, visible_headers) => {

        if(table_id === "public_strains_table") {
            page_length = 10;
        }
        else {
            page_length = 50;
        }

        const table = $('#' + table_id).DataTable({
            dom: 'Blfrtip',
            "scrollCollapse": true,
            paging:false,
            colReorder: {
                fixedColumnsLeft: 1
            },
            "pageLength": page_length,
            select: {
                style:    'os',
                selector: 'td:first-child'
            },
            buttons: [
                'csv',
                {
                    extend: 'colvis',
                    collectionLayout: 'fixed two-column'
                }
            ],
            columns: columnDefinitions,
            "data": data,
            "stateSave":true
        });

        table.columns.adjust().draw();


    };

    const tableFromData = (table_id, table_headers, table_data) => {

        const table = $('#' + table_id).DataTable({
            dom: 'Bfrtip',
            "scrollY": "200px",
            "scrollCollapse": true,
            "scrollX": true,
            paging:false,
            buttons: [
                'csv'
            ],
            columns: table_headers,
            "data": table_data
        });

    };


    const create_table_headers = (array_of_headers, has_analysis, table_id) => {
        let headers_html = "<tr><th></th>";

        for(const x in array_of_headers){
            headers_html += "<th>" + array_of_headers[x] + "</th>";
        }

        if(has_analysis === true) headers_html += "<th>Analysis <button" +
            " onclick=show_all_analysis()><i class='fa fa-eye'" +
            " aria-hidden='true'></i></button><button" +
            " onclick=hide_all_analysis()><i class='fa fa-eye-slash'" +
            " aria-hidden='true'></i></button></th>";

        headers_html += "</tr>";
        return headers_html;
    };

    return {

        apply_pipeline_to_strain: (strain_table_id, strain_name, workflow_ids, pipelinesByID, pipelines_applied, pipelines_type_by_strain, workflowname_to_protocols, protocols_applied, protocols_applied_by_pipeline, strainNames_to_pipelinesNames, pipelinesAndDependency, applied_dependencies, callback) => {

            const table = $('#' + strain_table_id).DataTable();

            const selected_indexes = $.map(table.rows().indexes(), (index) => {
                return index;
            });

            const strain_data = $.map(table.rows().data(), (item) => {
                return item;
            });

            let count = 0;
            let strain_index = '';
            let workflow_names = [];
            let workflowids = [];

            const numberOfWorkflows = workflow_ids.length;
            let new_proc_count = 0;

            for(const w in workflow_ids){
                count+=1;
                const workflow_id = workflow_ids[w];

                for(const i in selected_indexes){
                    let toAdd = '';
                    let to_add_protocols = "";
                    let s_name = strain_data[i]['strainID'];

                    if(s_name === strain_name){
                        let buttonselectedPipeline = '<div class="dropdown"' +
                            ' style="float:left;">'+
                            '<button class="btn btn-sm btn-default dropdown-toggle workflows_child" shown_child="false" strainID="'+strain_name+'" name="'+pipelinesByID[workflow_id]+'" id="'+strain_name.replace(/ /g, '_')+"_workflow_"+String(count)+ '_' + CURRENT_PROJECT_ID+'"><i class="fa fa-arrow-down"></i>'+ pipelinesByID[workflow_id] + '</button>'+
                            '<ul class="dropdown-menu" id="'+strain_name+'_'+pipelinesByID[workflow_id]+'" style="position:relative;float:right;">'+
                            '<li class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_workflow_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesOutputs(this)" style="display:none;"><a>Get Results</a></li>'+
                            '<li class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_workflow_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesLog(this)" style="display:none;"><a>Get Run Log</a></li>';

                        if(count === numberOfWorkflows) buttonselectedPipeline += '<li style="display:block;" class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_workflow_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="removeAnalysis(this)"><a>Remove</a></li></ul></div>';
                        else buttonselectedPipeline += '<li style="display:none;" class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_workflow_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="removeAnalysis(this)"><a>Remove</a></li></ul></div>';

                        let just_button = '<button class="btn btn-sm' +
                            ' btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'">'+ pipelinesByID[workflow_id] + '</button>';

                        let protocol_buttons = "";

                        for(const pt in workflowname_to_protocols[pipelinesByID[workflow_id]]){
                            new_proc_count += 1;
                            protocol_buttons += '<div class="dropdown" style="float:left;">'+
                                '<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_name.replace(/ /g, '_')+"_protocol_"+String(new_proc_count)+ '_' + CURRENT_PROJECT_ID+'">'+ workflowname_to_protocols[pipelinesByID[workflow_id]][pt][2] + '</button>'+
                                '<ul class="dropdown-menu" id="'+strain_name+'_'+workflowname_to_protocols[pipelinesByID[workflow_id]][pt][2]+'" style="position:relative;float:right;">'+
                                '<li class="'+workflowname_to_protocols[pipelinesByID[workflow_id]][pt][2]+'&&'+strain_name.replace(/ /g, '_')+"_protocol_"+String(new_proc_count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesOutputs(this)" style="display:none;"><a>Get Results</a></li>'+
                                '<li class="'+workflowname_to_protocols[pipelinesByID[workflow_id]][pt][2]+'&&'+strain_name.replace(/ /g, '_')+"_protocol_"+String(new_proc_count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesLog(this)"><a>Get Run Log</a></li></ul></div>';
                        }

                        if(!strainNames_to_pipelinesNames.hasOwnProperty(s_name)){
                            strainNames_to_pipelinesNames[s_name] = [];
                            applied_dependencies[s_name] = [];
                        }

                        strainNames_to_pipelinesNames[s_name].push(pipelinesByID[workflow_id]);
                        applied_dependencies[s_name].push(pipelinesAndDependency[pipelinesByID[workflow_id]]);


                        if(!pipelines_applied.hasOwnProperty(strain_name)){
                            pipelines_type_by_strain[strain_name] = [[],[],[]];
                            pipelines_applied[strain_name] = [];
                            protocols_applied[strain_name] = [];
                            if(!protocols_applied_by_pipeline.hasOwnProperty(strain_name)){
                                protocols_applied_by_pipeline[strain_name] = {};
                            }
                            protocols_applied_by_pipeline[strain_name][pipelinesByID[workflow_id]] = [];
                        }


                        if(pipelines_applied[strain_name].indexOf(buttonselectedPipeline) < 0){
                            pipelines_applied[strain_name].push(buttonselectedPipeline);
                            protocols_applied[strain_name].push(protocol_buttons);
                            if(!protocols_applied_by_pipeline[strain_name].hasOwnProperty(pipelinesByID[workflow_id])){
                                protocols_applied_by_pipeline[strain_name][pipelinesByID[workflow_id]] = [];
                            }
                            protocols_applied_by_pipeline[strain_name][pipelinesByID[workflow_id]].push(protocol_buttons);
                        }

                        for(const j in pipelines_applied[strain_name]){
                            toAdd += pipelines_applied[strain_name][j];
                            to_add_protocols += protocols_applied[strain_name][j];
                        }
                        strain_data[i]['Analysis'] = toAdd;
                        strain_data[i]['protocols'] = to_add_protocols;
                        strain_index = i;
                        workflow_names.push(pipelinesByID[workflow_id]);
                        workflowids.push(strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID);
                        break;
                    }
                }
                if(count === workflow_ids.length) callback({strains:strain_data, strain_index:strain_index, workflow_names:workflow_names, workflow_ids: workflowids});
            }
            if(workflow_ids.length === 0) callback({strains:strain_data, strain_index:strain_index, workflow_names:workflow_names, workflow_ids: workflowids});
        },

        show_message: (element, type, message) => {

            $('.alert').remove();

            const El = $('#' + element);
            El.empty();
            El.append('<div class="alert alert-'+type+'"><a class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>'+type+'!</strong> '+message+'</div>')

            setTimeout(() => {
                $('.alert').remove();
            }, 2000);

        },
        destroyTable: (table_id) => {
            if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
                $('#' + table_id).DataTable().destroy();
                if(table_id === 'merged_results_table') $('#' + table_id).empty();
            }
        },
        updateTable: (table_id, data) => {
            table = $('#' + table_id).DataTable();
            table.clear();
            table.rows.add(data);
            table.draw();
        },

        loadDataTables: (table_id, table_values, columnDefinitions, visible_headers) => {

            if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
                return false;
            }
            if (table_id.indexOf('reports') > -1 || table_id.indexOf('strains_table') > -1) {
                searchableTable(table_id, columnDefinitions, table_values, visible_headers);
            }
            else {
                nestedTable(table_id, columnDefinitions, table_values, visible_headers);
            }

        },

        loadTableFromArrayData: (table_id, table_headers, table_data) => {

            if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
                return false;
            }

            tableFromData(table_id, table_headers, table_data);

        },

        restore_table_headers: (table_id, table_headers, has_analysis, callback) => {

            $('#'+table_id+' thead > tr').remove();
            $('#'+table_id+' tbody > tr').remove();

            if (table_id === "public_strains_table") {
                has_analysis = false;
            }

            $('#'+table_id+' thead').append(create_table_headers(table_headers, has_analysis, table_id));
            $('#'+table_id+' tfoot > tr').remove();
            $('#'+table_id+' tfoot').append(create_table_headers(table_headers, has_analysis, table_id));


            callback();
        }
    }
};

const show_all_analysis = () => {
    $("button.analysis-control:not(.shown)").trigger("click");
};

const hide_all_analysis = () => {
    $("button.analysis-control.shown").trigger("click");
};


