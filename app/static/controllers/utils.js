function get_userid(){
	//get user identifier
	return current_user_id;
}

function destroyTable(table_id){
    if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
      $('#' + table_id).DataTable().destroy();
    }
}

function loadDataTables(table_id, table_values){

    setTimeout(function(){

        if ( $.fn.DataTable.isDataTable( '#' + table_id ) ) {
          return false;
        }
        console.log('AQUI');

        if (table_values.length == 0) return false;

        var arrayOfHeaders = Object.keys(table_values[0]);

        if (arrayOfHeaders.length == 0) return false;

        if (table_id == 'strains_table' || table_id == 'public_strains_table'){
            nestedTable(table_id);
        }
        else normalTable(table_id);

    }, 150);


}

function normalTable(table_id){

    $('#' + table_id).DataTable( {
        responsive: true,
        colReorder: true,
        dom: 'Bfrtip',
        stateSave: true,
        buttons: [
            'colvis'
        ],
        deferRender:    true,
        scrollY:        200,
        scrollCollapse: true,
        columnDefs: [
            //{"className": "dt-center", "targets": "_all"},
            {
                orderable: false,
                className: 'select-checkbox',
                targets:   0
            }
          ],
        paging: false,
        select: {
            style:    'os',
            selector: 'td:first-child'
        },
        order: [[ 1, 'asc' ]]
    } );

}

function nestedTable(table_id){

    $('#' + table_id).DataTable( {
        responsive: true,
        colReorder: true,
        dom: 'Bfrtip',
        stateSave: true,
        buttons: [
            'colvis'
        ],
        deferRender:    true,
        scrollY:        200,
        scrollCollapse: true,
        columnDefs: [
            //{"className": "dt-center", "targets": "_all"},
            {
                orderable: false,
                className: 'select-checkbox',
                targets:   0
            }
          ],
        paging: false,
        select: {
            style:    'multi',
            selector: 'td:first-child'
        },
        order: [[ 1, 'asc' ]]
    } );

}