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

    	for(keys in d){
    		isThere = false;
    		for(header in visible_headers){
    			if (table_id.indexOf('reports') > -1 && table_id.indexOf('reports_metadata') < 0){
    				if(visible_headers[header] == keys){
		    			isThere = true;
		    			break;
		    		}
    			}
    			else{
    				if(convert_dict[visible_headers[header]] == keys){
    					console.log(keys);
		    			isThere = true;
		    			break;
		    		}
    			}
	    	}
	    	if(!isThere){
	    		if (table_id.indexOf('reports') > -1 && table_id.indexOf('reports_metadata') < 0) toUse.push([keys, d[keys]]);
	    		else {
	    			if(convert_dict_reverse[keys] == undefined) toUse.push([keys, d[keys]]);
	    			else toUse.push([convert_dict_reverse[keys], d[keys]]);
	    		}
	    	}
	    }
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
	        var title = $('#' + table_id + ' thead th').eq( $(this).index() ).text();
	        $(this).html( '<input type="text" placeholder="Search '+title+'" />' );
	    } );

	    if(table_id == "public_strains_table") page_length = 10;
	    else page_length = 50;

	    if(table_id == "modify_strains_table" || table_id == "reports_trees_table") selection_style = "single";
	    else selection_style = "multi";

	    table = $('#' + table_id).DataTable({
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
	            }
	        ],
	        columns: columnDefinitions,
	        "data": data,
	        "stateSave":true,
	        "initComplete": function() {
	        		for(r in CURRENT_TABLE_ROWS_SELECTED[table_id]){
				    	$('#'+table_id).DataTable().rows(CURRENT_TABLE_ROWS_SELECTED[table_id][r]).select();
				    }
                    $('#'+table_id+' tbody').find("tr.selected td button.analysis-control").trigger("click");
            }
	    });

	    // Apply the search
	    table.columns().every( function () {
	        var that = this;
	        var table_to_search = table;
	 
	        $( 'input', this.footer() ).on( 'keyup change', function () {
	        	table_to_search
            .column( $(this).parent().index()+':visible' )
            .search( this.value )
            .draw();
	        } );
	    } );
	    
	    table.columns.adjust().draw();

	    $('#'+table_id+' tbody').off('click', 'button.details-control');
	    $('#'+table_id+' tbody').off('click', 'button.analysis-control');
	    $('#'+table_id+' tbody').off('click', 'button.lab-protocols-control');
	    $('#'+table_id+' tbody').off('click', 'tr');

	    console.log(table_id);
	    $('#'+table_id+' tbody').on('click', 'tr td:first', function () {
	    	if(CURRENT_TABLE_ROWS_SELECTED[table_id] == undefined) CURRENT_TABLE_ROWS_SELECTED[table_id] = [];
	    	if($.inArray(table.row( this ).index(), CURRENT_TABLE_ROWS_SELECTED[table_id]) < 0){
	    		CURRENT_TABLE_ROWS_SELECTED[table_id].push(table.row( this ).index());
	    	}
	    	else{
	    		var index_to_remove = CURRENT_TABLE_ROWS_SELECTED[table_id].indexOf(table.row( this ).index());
	    		CURRENT_TABLE_ROWS_SELECTED[table_id].splice(index_to_remove, 1);
	    	}
	    	console.log(CURRENT_TABLE_ROWS_SELECTED);
	    } );

	    clickedTimes = {}
	    clickedTimes["details"] = 0;
	    clickedTimes["analysis"] = 0;
	    clickedTimes["protocols"] = 0;

	    /*$('#'+table_id+' tbody').on('click', 'button.details-control', function () {
	        if(table_id.indexOf('strains_table') > - 1 || table_id.indexOf('reports') > - 1){

	        	/*clickedTimes["details"] += 1;
	        	clickedTimes["analysis"] = 0;
	    		clickedTimes["protocols"] = 0;

	        	var tr = $(this).closest('tr');
		        var row = $('#'+table_id).DataTable().row( tr );
	        	if(row.child.isShown()){
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
	    } );*/

	   $('#'+table_id+' tbody').on('click', 'button.analysis-control', function () {
	        if(table_id.indexOf('strains_table') > - 1){

	        	/*clickedTimes["analysis"] += 1;
	        	clickedTimes["details"] = 0;
	    		clickedTimes["protocols"] = 0;*/


	        	var tr = $(this).closest('tr');
		        var row = $('#'+table_id).DataTable().row( tr );
	            if(row.child.isShown()){
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

	    /*$('#'+table_id+' tbody').on('click', 'button.lab-protocols-control', function () {

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
	    } );*/

	}

	function nestedTable(table_id, columnDefinitions, data, visible_headers){

		if(table_id == "public_strains_table") page_length = 10;
	    else page_length = 50;

	    table = $('#' + table_id).DataTable({
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

	function create_table_headers(array_of_headers, has_analysis){
		headers_html = "<tr><th></th>";

		for(x in array_of_headers){
			headers_html += "<th>" + array_of_headers[x] + "</th>";
		}

		if(has_analysis == true) headers_html += "<th></th>";

		headers_html += "</tr>";		
		return headers_html;
	}

	return {

		apply_pipeline_to_strain: function(strain_table_id, strain_name, workflow_ids, pipelinesByID, pipelines_applied, pipelines_type_by_strain, callback){

	        var table = $('#' + strain_table_id).DataTable();
	    
	        var selected_indexes = $.map(table.rows().indexes(), function(index){
	            return index;
	        });

	        var strain_data = $.map(table.rows().data(), function(item){
	            return item;
	        });
	        
	        var count = 0;
	        var strain_index = '';
	        var workflow_names = [];
	        var workflowids = [];

	        numberOfWorkflows = workflow_ids.length;
	        
	        for(w in workflow_ids){
	        	count+=1;
	            workflow_id = workflow_ids[w];

	            for(i in selected_indexes){
	                var toAdd = '';
	                var s_name = strain_data[i]['strainID'];

	                if(s_name == strain_name){
	                	buttonselectedPipeline = '<div class="dropdown" style="float:left;">'+
		        		'<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'">'+ pipelinesByID[workflow_id] + '</button>'+
  						'<ul class="dropdown-menu" style="position:relative;">'+
    					'<li class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesOutputs(this)"><a href="#">Get Results</a></li>'+
    					'<li class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="getProcessesLog(this)"><a href="#">Get Run Log</a></li>';
    					
    					if(count == numberOfWorkflows) buttonselectedPipeline += '<li style="display:block;" class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="removeAnalysis(this)"><a href="#">Remove</a></li></ul></div>';
			        	else buttonselectedPipeline += '<li style="display:none;" class="'+pipelinesByID[workflow_id]+'&&'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'&&&" onclick="removeAnalysis(this)"><a href="#">Remove</a></li></ul></div>';

			        	just_button = '<button class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" id="'+strain_name.replace(/ /g, '_')+"_"+String(count)+ '_' + CURRENT_PROJECT_ID+'">'+ pipelinesByID[workflow_id] + '</button>';
	                    
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
	                }
	            }
	            if(count == workflow_ids.length) callback({strains:strain_data, strain_index:strain_index, workflow_names:workflow_names, workflow_ids: workflowids});
	        }
	    },
	    show_message: function(element, type, message){

		    $('.alert').remove();
		    $('#' + element).empty();
		    $('#' + element).append('<div class="alert alert-'+type+'"><a class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>'+type+'!</strong> '+message+'</div>')

		    setTimeout(function(){$('.alert').remove();}, 2000);

		},
		destroyTable: function(table_id){
		    if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
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

		},

		restore_table_headers: function(table_id, table_headers, has_analysis, callback){

			$('#'+table_id+' thead > tr').remove();
			$('#'+table_id+' thead').append(create_table_headers(table_headers, has_analysis));
			$('#'+table_id+' tfoot > tr').remove();
			$('#'+table_id+' tfoot').append(create_table_headers(table_headers, has_analysis));

			callback();
		}
	}
}