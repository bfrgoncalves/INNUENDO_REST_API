function Objects_Utils(){

	var metadata = new Metadata();

	function format ( d, visible_headers, table_id ) {
	    // `d` is the original data object for the row
	    tr_string='<tbody><tr>';
	    tr_headers = '<thead><tr>';

	    var convert_dict = metadata.get_dict_fields();
	    var convert_dict_reverse = metadata.get_dict_fields_reverse();

	    toUse = [];
	    isThere = true;
	    //console.log(visible_headers);

    	for(keys in d){
    		isThere = false;
    		for(header in visible_headers){
    			//console.log(convert_dict[visible_headers[header]], keys, table_id.indexOf('reports_metadata') <0, table_id);
    			if (table_id.indexOf('reports') > -1 && table_id.indexOf('reports_metadata') < 0){
    				if(visible_headers[header] == keys){
		    			isThere = true;
		    			break;
		    		}
    			}
    			else{
    				if(convert_dict[visible_headers[header]] == keys){
		    			isThere = true;
		    			break;
		    		}
    			}
	    	}
	    	if(!isThere){
	    		if (table_id.indexOf('reports') > -1 && table_id.indexOf('reports_metadata') < 0) toUse.push([keys, d[keys]]);
	    		else toUse.push([convert_dict_reverse[keys], d[keys]]);
	    	}
	    }
	    //console.log("TOUSE", toUse);
	    for(x in toUse){
	    	if(toUse[x][0] == 'job_id' || toUse[x][0] == undefined || toUse[x][0] == 'Analysis')continue;
	    	tr_headers += '<td><b>'+toUse[x][0]+'</b></td>';

	    	tr_string += '<td>'+toUse[x][1]+'</td>';
	    }

	    tr_headers += '</tr></thead>';
	    tr_string += '</tr></tbody>';

	    return '<div class="inside_table"><table cellpadding="5" cellspacing="0" border="0">'+tr_headers+tr_string+'</table></div>';
	}

	function format_analysis ( d, table_id ) {
	    // `d` is the original data object for the row
	    tr_string='';

    	tr_string += '<tr>'+
	            '<td><b>Analysis</b></td>'+
	            '<td colspan="6">'+d.Analysis+'</td>'+
	        '</tr>';

	    return '<table cellpadding="5" cellspacing="0" border="0">'+tr_string+'</table>';
	}

	function format_lab_protocols ( d, table_id ) {
	    // `d` is the original data object for the row
	    tr_string='';

    	tr_string += '<tr>'+
	            '<td><b>Lab Protocols</b></td>'+
	            '<td colspan="6">'+d.lab_protocols+'</td>'+
	        '</tr>';

	    return '<table cellpadding="5" cellspacing="0" border="0">'+tr_string+'</table>';
	}

	function searchableTable(table_id, columnDefinitions, data, visible_headers){

		$('#' + table_id + ' tfoot th').each( function () {
	        var title = $(this).text();
	        $(this).html( '<input type="text" placeholder="Search '+title+'" />' );
	    } );

	    table = $('#' + table_id).DataTable({
	    	dom: 'Blfrtip',
	    	//"scrollY": "200px",
  			"scrollCollapse": true,
	    	"scrollX": true,
	        paging:true,
	        select: {
	            style:    'multi',
	            selector: 'td:first-child'
	        },
	        buttons: [
	        	'selectAll',
	            'csv'
	        ],
	        columns: columnDefinitions,
	        "data": data
	    });

	    // Apply the search
	    table.columns().every( function () {
	        var that = this;
	 
	        $( 'input', this.footer() ).on( 'keyup change', function () {
	            if ( that.search() !== this.value ) {
	                that
	                    .search( this.value )
	                    .draw();
	            }
	        } );
	    } );
	    
	    table.columns.adjust().draw();

	    $('#'+table_id+' tbody').off('click', 'button.details-control');
	    $('#'+table_id+' tbody').off('click', 'button.analysis-control');
	    $('#'+table_id+' tbody').off('click', 'button.lab-protocols-control');

	    clickedTimes = {}
	    clickedTimes["details"] = 0;
	    clickedTimes["analysis"] = 0;
	    clickedTimes["protocols"] = 0;

	    $('#'+table_id+' tbody').on('click', 'button.details-control', function () {
	        if(table_id.indexOf('strains_table') > - 1 || table_id.indexOf('reports') > - 1){

	        	clickedTimes["details"] += 1;
	        	clickedTimes["analysis"] = 0;
	    		clickedTimes["protocols"] = 0;

	        	var tr = $(this).closest('tr');
		        var row = $('#'+table_id).DataTable().row( tr );
	        	if(clickedTimes["details"] == 2 && row.child.isShown()){
	        		clickedTimes["details"] = 0;
	        		// This row is already open - close it
		            row.child.hide();
		            tr.removeClass('shown');
	            }
		        else {
		            // Open this row
		            row.child( format(row.data(), visible_headers, table_id) ).show();
		            tr.addClass('shown');

		            for(x in current_job_status_color){
		            	$('#' + x.replace(/ /g, "_")).css({'background-color': current_job_status_color[x]});
		            }
		        }
	        }
	    } );

	    $('#'+table_id+' tbody').on('click', 'button.analysis-control', function () {
	        if(table_id.indexOf('strains_table') > - 1){

	        	clickedTimes["analysis"] += 1;
	        	clickedTimes["details"] = 0;
	    		clickedTimes["protocols"] = 0;


	        	var tr = $(this).closest('tr');
		        var row = $('#'+table_id).DataTable().row( tr );
	            if(clickedTimes["analysis"] == 2 && row.child.isShown()){
	            	clickedTimes["analysis"] = 0;
	            	// This row is already open - close it
		            row.child.hide();
		            tr.removeClass('shown');
	            }
		        else {
		            // Open this row
		            row.child( format_analysis(row.data(), table_id) ).show();
		            tr.addClass('shown');

		            for(x in current_job_status_color){
		            	$('#' + x.replace(/ /g, "_")).css({'background-color': current_job_status_color[x]});
		            }
		        }
	        }
	    } );

	    $('#'+table_id+' tbody').on('click', 'button.lab-protocols-control', function () {

	        if(table_id.indexOf('strains_table') > - 1){

	        	clickedTimes["protocols"] += 1;
	        	clickedTimes["analysis"] = 0;
	        	clickedTimes["details"] = 0;

	        	var tr = $(this).closest('tr');
		        var row = $('#'+table_id).DataTable().row( tr );
	            
	            if(clickedTimes["protocols"] == 2 && row.child.isShown()){
	            	clickedTimes["protocols"] = 0;
	            	// This row is already open - close it
		            row.child.hide();
		            tr.removeClass('shown');
	            }
		        else {
		            // Open this row
		            row.child( format_lab_protocols(row.data(), table_id) ).show();
		            tr.addClass('shown');
		        }
	        }
	    } );

	}

	function nestedTable(table_id, columnDefinitions, data, visible_headers){

	    table = $('#' + table_id).DataTable({
	    	dom: 'Blfrtip',
	    	//"scrollY": "200px",
  			"scrollCollapse": true,
	    	"scrollX": true,
	        paging:false,
	        select: {
	            style:    'os',
	            selector: 'td:first-child'
	        },
	        buttons: [
	            'csv'
	        ],
	        columns: columnDefinitions,
	        "data": data
	    });

	    table.columns.adjust().draw();


	}

	function tableFromData(table_id, table_headers, table_data){

	    table = $('#' + table_id).DataTable({
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

	}

	return {

		apply_pipeline_to_strain: function(strain_table_id, strain_name, workflow_ids, pipelinesByID, pipelines_applied, pipelines_type_by_strain, callback){

	        var table = $('#' + strain_table_id).DataTable();
	    
	        var selected_indexes = $.map(table.rows().indexes(), function(index){
	            return index;
	        });
	        //console.log(selected_indexes);

	        var strain_data = $.map(table.rows().data(), function(item){
	            return item;
	        });
	        
	        var count = 0;
	        var strain_index = '';
	        var workflow_names = [];
	        var workflowids = [];
	        
	        for(w in workflow_ids){
	        	count+=1;
	            workflow_id = workflow_ids[w];

	            for(i in selected_indexes){
	                var toAdd = '';
	                var s_name = strain_data[i]['strainID'];

	                if(s_name == strain_name){
	                	//onclick="showCombinedReports(this)"
	                	buttonselectedPipeline = '<div class="dropdown" style="float:left;">'+
		        		'<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'">'+ pipelinesByID[workflow_id] + '</button>'+
  						'<ul class="dropdown-menu" style="position:relative;">'+
    					'<li class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="showCombinedReports(this)"><a href="#">Add to Active Report</a></li>'+
    					'<li class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesOutputs(this)"><a href="#">Get Results</a></li>'+
    					'<li class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesLog(this)"><a href="#">Get Run Log</a></li>'+
    					'<li class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="removeAnalysis(this)"><a href="#">Remove</a></li></ul></div>';
			        	
			        	just_button = '<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'">'+ pipelinesByID[workflow_id] + '</button>';
	                	
	                	//buttonselectedPipeline = '<button class="btn btn-sm btn-default" onclick="showCombinedReports(this)" id="'+strain_name.replace(/ /g, '_')+"_"+String(count)+'">'+ pipelinesByID[workflow_id] + '</button>';
	                    
	                    if(!pipelines_applied.hasOwnProperty(strain_name)){
	                    	pipelines_type_by_strain[strain_name] = [[],[]];
	                        pipelines_applied[strain_name] = [];
	                    }
	                    if(pipelines_applied[strain_name].indexOf(buttonselectedPipeline) < 0) pipelines_applied[strain_name].push(buttonselectedPipeline);
	                    
	                    for(j in pipelines_applied[strain_name]){
	                        toAdd += pipelines_applied[strain_name][j];
	                    }
	                    strain_data[i]['Analysis'] = toAdd;
	                    strain_index = i;
	                    workflow_names.push(pipelinesByID[workflow_id]);
	                    workflowids.push(strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID);
	                    break;

	                    //table.cell(selected_indexes[i], -1).data(toAdd);
	                }
	            
	            }
	            if(count == workflow_ids.length) callback({strains:strain_data, strain_index:strain_index, workflow_names:workflow_names, workflow_ids: workflowids});
	        }

	        //table.draw();
	    },
	    show_message: function(element, type, message){

		    $('.alert').remove();
		    $('#' + element).empty();
		    $('#' + element).append('<div class="alert alert-'+type+'"><a class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>'+type+'!</strong> '+message+'</div>')

		    setTimeout(function(){$('.alert').remove();}, 2000);

		},
		destroyTable: function(table_id){
		    if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
		      //$('#' + table_id).DataTable().clear();
		      $('#' + table_id).DataTable().destroy();
		      
		      if(table_id == 'merged_results_table') $('#' + table_id).empty();
		    }
		},
		updateTable: function(table_id, data){
			table = $('#' + table_id).DataTable();
			table.clear();
			table.rows.add(data);
			table.draw();
		},

		loadDataTables: function(table_id, table_values, columnDefinitions, visible_headers){

	        if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
	          return false;
	        }

	        if (table_id.indexOf('reports') > -1 || table_id.indexOf('strains_table') > -1) searchableTable(table_id, columnDefinitions, table_values, visible_headers);
			else nestedTable(table_id, columnDefinitions, table_values, visible_headers);

		},

		loadTableFromArrayData: function(table_id, table_headers, table_data){

	        if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
	          return false;
	        }

	       	tableFromData(table_id, table_headers, table_data);

		}
	}
}